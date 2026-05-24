/**
 * iPad fallback controls.
 *
 * iPad Safari does NOT implement the Pointer Lock API. PointerLockControls
 * silently fails so `controls.lock()` does nothing — the player gets stuck
 * on the "click anywhere to play" overlay.
 *
 * The girls play on iPads with external Magic-Keyboard-style keyboards and
 * integrated trackpads, so we still have full keyboard + mouse-style input.
 * We just need to:
 *   1. Treat the camera as permanently "locked" once the game starts.
 *   2. Hide the desktop click-to-play overlay.
 *   3. Translate raw trackpad mousemove deltas into camera rotation
 *      (no actual pointer lock).
 */

export function isIpadLike() {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports the desktop Mac user agent, so also check touch points.
  return /iPad|iPhone|iPod/.test(ua) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function installIpadControls(player) {
  if (!isIpadLike()) return;

  // Make controls.isLocked always read as true once the game has started.
  // The base PointerLockControls.isLocked is a getter that reads document.pointerLockElement;
  // we shadow it on the instance.
  Object.defineProperty(player.controls, 'isLocked', {
    configurable: true,
    get: () => !!window.gameStarted
  });

  // No-op the lock/unlock calls and fire the lock event so existing handlers hide the overlay.
  player.controls.lock = () => {
    player.controls.dispatchEvent({ type: 'lock' });
  };
  player.controls.unlock = () => {};

  // Hide the desktop "click to play" overlay permanently.
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.style.display = 'none';

  // ---------------- On-screen D-pad + action buttons ----------------
  // Margot doesn't love walking with the keyboard either — tap controls.
  const hud = document.createElement('div');
  hud.id = 'touch-hud';
  hud.innerHTML = `
    <div id="touch-dpad">
      <button id="touch-up"    class="dpad-btn">▲</button>
      <button id="touch-left"  class="dpad-btn">◀</button>
      <button id="touch-down"  class="dpad-btn">▼</button>
      <button id="touch-right" class="dpad-btn">▶</button>
    </div>
    <div id="touch-actions">
      <button id="touch-jump"  class="action-btn">JUMP</button>
      <button id="touch-mine"  class="action-btn red">MINE</button>
      <button id="touch-place" class="action-btn green">BUILD</button>
    </div>
  `;
  document.body.appendChild(hud);

  const bindHold = (id, code) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const press = (e) => { e.preventDefault(); player.keysPressed[code] = true; };
    const release = (e) => { e.preventDefault(); delete player.keysPressed[code]; };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  };
  bindHold('touch-up',    'KeyW');
  bindHold('touch-down',  'KeyS');
  bindHold('touch-left',  'KeyA');
  bindHold('touch-right', 'KeyD');
  bindHold('touch-jump',  'Space');

  // Mine / Build = synthetic mousedown on canvas with respective button
  const fireSyntheticMouse = (button) => {
    const canvas = window.renderer?.domElement || document.querySelector('canvas');
    const ev = new MouseEvent('mousedown', { bubbles: true, button, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    Object.defineProperty(ev, 'target', { value: canvas });
    document.dispatchEvent(ev);
  };
  document.getElementById('touch-mine')?.addEventListener('touchstart', (e) => {
    e.preventDefault(); fireSyntheticMouse(0);
  }, { passive: false });
  document.getElementById('touch-place')?.addEventListener('touchstart', (e) => {
    e.preventDefault(); fireSyntheticMouse(2);
  }, { passive: false });
  document.getElementById('touch-mine')?.addEventListener('mousedown', (e) => {
    e.preventDefault(); fireSyntheticMouse(0);
  });
  document.getElementById('touch-place')?.addEventListener('mousedown', (e) => {
    e.preventDefault(); fireSyntheticMouse(2);
  });

  // Drag-to-look: only rotate camera while the trackpad button (or finger) is
  // held down. Previously the camera moved with every cursor twitch, which
  // Margot found confusing while just trying to walk with WASD.
  let dragging = false;
  let lastX = 0, lastY = 0;
  const sensitivity = 0.0035;

  const isUiTarget = (el) => el && (
    el.closest('#toolbar-container') ||
    el.closest('#magic-spawner-container') ||
    el.closest('#teleport-btn') ||
    el.closest('#multiplayer-status') ||
    el.closest('#mouse-unlock-hint') ||
    el.closest('#launcher-portal') ||
    el.closest('#avatar-editor-drawer') ||
    el.closest('#mute-btn') ||
    el.closest('#touch-hud')
  );

  document.addEventListener('mousedown', (e) => {
    if (!window.gameStarted) return;
    if (isUiTarget(e.target)) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    document.body.style.cursor = 'grabbing';
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
    document.body.style.cursor = '';
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging || !window.gameStarted) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    const obj = player.controls.getObject();
    obj.rotation.y -= dx * sensitivity;
    obj.rotation.z = 0; // never tilt sideways
    player.camera.rotation.x -= dy * sensitivity;
    player.camera.rotation.z = 0; // hard-clamp roll so the view can never roll sideways
    const halfPi = Math.PI / 2 - 0.01;
    if (player.camera.rotation.x > halfPi)  player.camera.rotation.x = halfPi;
    if (player.camera.rotation.x < -halfPi) player.camera.rotation.x = -halfPi;
  }, { passive: true });

  // Belt-and-braces: even when not dragging, kill any accumulated roll each frame
  setInterval(() => {
    if (!window.gameStarted) return;
    if (player.camera.rotation.z !== 0) player.camera.rotation.z = 0;
    const obj = player.controls.getObject();
    if (obj.rotation.z !== 0) obj.rotation.z = 0;
  }, 250);

  console.log('[iPad] Pointer-lock bypass installed — drag-to-look enabled');
}
