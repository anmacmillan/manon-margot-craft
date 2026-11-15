// Two-player link through the family's Firebase Realtime Database (the one Wizard Chess uses), in place of the
// peer-to-peer service, which needed both iPads to reach each other directly and often could not.
// It looks like the PeerJS connection the game was written for: on('open' | 'data' | 'close' | 'error'), send(), close(), .open
// Where each player stands is one small record, overwritten about eight times a second; everything else (the world, each block
// placed or broken) is a message in the other player's inbox, read as it arrives and then deleted.
const DB = 'https://wizard-chess-manon-default-rtdb.europe-west1.firebasedatabase.app/owlq/ARCADE2026/mc';
const call = (path, method = 'GET', body) => fetch(`${DB}/${path}.json`, { method, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' }).then(r => r.json());

export class FirebaseLink {
  constructor(me) { this.me = me; this.id = Math.random().toString(36).slice(2); this.handlers = {}; this.streams = []; this.open = false; this.isHost = false; this.peerName = null; this.lastMove = 0; this.pendingMove = null; }
  on(event, fn) { (this.handlers[event] ||= []).push(fn); return this; }
  emit(event, data) { (this.handlers[event] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); }

  // Decide who hosts: whoever finds no live host. Resolves to true for the host.
  async start() {
    const host = await call('host'), fresh = host && host.t && Date.now() - host.t < 15000 && host.name !== this.me;
    if (!fresh) {
      await Promise.all([call('toHost', 'DELETE'), call('toClient', 'DELETE'), call('pos', 'DELETE')]);
      await call('host', 'PUT', { name: this.me, id: this.id, t: Date.now() });
      await new Promise(r => setTimeout(r, 500));
      const now = await call('host');                                   // if both pressed at once, the later write wins and the other joins her
      if (now && now.id === this.id) { this.isHost = true; this.beat = setInterval(() => call('host/t', 'PUT', Date.now()).catch(() => {}), 5000); this.listen('toHost'); return true; }
      return this.join(now);
    }
    return this.join(host);
  }
  async join(host) {
    this.peerName = host.name; await call('toClient', 'DELETE'); this.listen('toClient'); this.watch(host.name);
    await this.post({ type: '__join', name: this.me });
    setTimeout(() => { this.open = true; this.emit('open'); }, 400);
    return false;
  }
  listen(box) {
    const es = new EventSource(`${DB}/${box}.json`), seen = new Set();
    const take = (key, m) => {
      if (!m || seen.has(key)) return; seen.add(key); call(`${box}/${key}`, 'DELETE').catch(() => {});
      if (m.type === '__join') { this.peerName = m.name; this.watch(m.name); this.open = true; this.emit('open'); } else this.emit('data', m);
    };
    es.addEventListener('put', e => {
      const { path, data } = JSON.parse(e.data); if (data == null) return; const parts = path.split('/').filter(Boolean);
      if (!parts.length) Object.keys(data).sort().forEach(k => take(k, data[k])); else if (parts.length === 1) take(parts[0], data);
    });
    this.streams.push(es);
  }
  watch(name) {
    if (this.watching === name) return; this.watching = name; const es = new EventSource(`${DB}/pos/${name}.json`); let last = 0;
    es.addEventListener('put', e => { const { data } = JSON.parse(e.data); if (data && data.position) { last = Date.now(); this.emit('data', data); } });
    this.streams.push(es);
  }
  post(m) { return call(this.isHost ? 'toClient' : 'toHost', 'POST', m); }
  send(m) {
    if (m.type === 'playerMove') {
      this.pendingMove = m; const now = Date.now(); if (now - this.lastMove < 120) return; this.lastMove = now;
      call(`pos/${this.me}`, 'PUT', JSON.parse(JSON.stringify(m))).catch(() => {}); return;
    }
    this.post(JSON.parse(JSON.stringify(m))).catch(err => this.emit('error', err));
  }
  close() { this.open = false; clearInterval(this.beat); this.streams.forEach(s => s.close()); this.streams = []; if (this.isHost) call('host', 'DELETE').catch(() => {}); }
}
