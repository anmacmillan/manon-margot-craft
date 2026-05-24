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

  // Trackpad-driven look: rotate camera based on raw mousemove deltas.
  // Cursor stays visible (we can't hide it without pointer lock), but moving
  // the trackpad anywhere on the game viewport will turn the camera.
  let lastX = null, lastY = null;
  const sensitivity = 0.0035;

  const isUiTarget = (el) => el && (
    el.closest('#toolbar-container') ||
    el.closest('#magic-spawner-container') ||
    el.closest('#teleport-btn') ||
    el.closest('#multiplayer-status') ||
    el.closest('#mouse-unlock-hint') ||
    el.closest('#launcher-portal') ||
    el.closest('#avatar-editor-drawer')
  );

  document.addEventListener('mousemove', (e) => {
    if (!window.gameStarted) return;
    if (isUiTarget(e.target)) {
      lastX = null;
      lastY = null;
      return;
    }
    if (lastX !== null && lastY !== null) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const obj = player.controls.getObject();
      obj.rotation.y -= dx * sensitivity;
      player.camera.rotation.x -= dy * sensitivity;
      // Clamp pitch
      const halfPi = Math.PI / 2 - 0.01;
      if (player.camera.rotation.x > halfPi)  player.camera.rotation.x = halfPi;
      if (player.camera.rotation.x < -halfPi) player.camera.rotation.x = -halfPi;
    }
    lastX = e.clientX;
    lastY = e.clientY;
  }, { passive: true });

  console.log('[iPad] Pointer-lock bypass installed — trackpad look enabled');
}
