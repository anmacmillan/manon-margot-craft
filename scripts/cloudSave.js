// A copy of each girl's world in the family Firebase database, so her buildings outlive the iPad's own storage
// (Safari may clear a site's storage after a week unused) and follow her to another device.
// The iPad's copy stays the working one: this only fills it in when it is missing, or when the cloud copy is newer.
const DB = 'https://wizard-chess-manon-default-rtdb.europe-west1.firebasedatabase.app/owlq/ARCADE2026/worlds';
const K = { params: n => `minecraft_params_${n}`, data: n => `minecraft_data_${n}`, time: n => `minecraft_time_${n}` };
let timer = null;
const sent = {};      // the save time last uploaded for each name
const put = (name, t) => { const params = localStorage.getItem(K.params(name)), data = localStorage.getItem(K.data(name)); if (!params || !data) return Promise.resolve();
  return fetch(`${DB}/${name}.json`, { method: 'PUT', body: JSON.stringify({ t, params, data }) }).then(r => { if (r.ok) { sent[name] = t; console.log(`World backed up for ${name}`); } }); };

// called after every local save; the upload waits a few seconds so a burst of building is one upload
export function backup(name, now = false) {
  const t = Date.now(); try { localStorage.setItem(K.time(name), String(t)); } catch (e) { return; }
  clearTimeout(timer); if (now) { put(name, t).catch(() => {}); return; } timer = setTimeout(() => put(name, t).catch(() => {}), 4000);
}
// called once when the page opens, before a game is chosen
export async function restore(names) {
  for (const name of names) {
    try {
      const cloudT = await (await fetch(`${DB}/${name}/t.json`, { cache: 'no-store' })).json(), has = !!localStorage.getItem(K.data(name)), localT = Number(localStorage.getItem(K.time(name)) || 0);
      if (cloudT && (!has || (localT && cloudT > localT))) {
        const w = await (await fetch(`${DB}/${name}.json`, { cache: 'no-store' })).json(); if (!w || !w.data || !w.params) continue;
        if (has) { try { localStorage.setItem(K.data(name) + '_prev', localStorage.getItem(K.data(name))); } catch (e) { /* no room for the spare copy */ } }      // never lose what was here
        localStorage.setItem(K.params(name), w.params); localStorage.setItem(K.data(name), w.data); localStorage.setItem(K.time(name), String(w.t)); console.log(`World restored from the cloud for ${name}`);
      } else if (has && (!cloudT || localT > cloudT)) { await put(name, localT || Date.now()); if (!localT) localStorage.setItem(K.time(name), String(Date.now())); }
    } catch (e) { /* offline: the iPad's own copy is used */ }
  }
}

// A safety net on a timer: every minute, anything saved on the iPad that has not reached the cloud is sent again
// (an upload can be lost when the wifi drops or the iPad is closed mid-save).
export function keepBackedUp(getName, everyMs = 60000) {
  setInterval(() => { const name = getName(); if (!name || name === 'default') return; const t = Number(localStorage.getItem(K.time(name)) || 0); if (t && sent[name] !== t) put(name, t).catch(() => {}); }, everyMs);
}
