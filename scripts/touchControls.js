/**
 * Touch-first iPad controls.
 *
 * Goal: feel much closer to Minecraft Bedrock than to a desktop fallback.
 * - left thumb: virtual joystick for movement
 * - right thumb: drag to look
 * - jump button
 * - break / place buttons using the same left/right action semantics as desktop
 */

export function isIpadLike() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 2) return true;
  return false;
}

function clampCamera(player) {
  const obj = player.controls.getObject();
  obj.rotation.z = 0;
  player.camera.rotation.z = 0;
  const halfPi = Math.PI / 2 - 0.01;
  if (player.camera.rotation.x > halfPi) player.camera.rotation.x = halfPi;
  if (player.camera.rotation.x < -halfPi) player.camera.rotation.x = -halfPi;
}

export function installIpadControls(player) {
  if (!isIpadLike()) {
    console.log('[TouchControls] Desktop detected — leaving pointer lock intact');
    return;
  }

  Object.defineProperty(player.controls, 'isLocked', {
    configurable: true,
    get: () => !!window.gameStarted
  });
  player.controls.lock = () => {
    player.controls.dispatchEvent({ type: 'lock' });
  };
  player.controls.unlock = () => {};

  const overlay = document.getElementById('overlay');
  if (overlay) overlay.style.display = 'none';

  const hud = document.createElement('div');
  hud.id = 'touch-hud';
  hud.innerHTML = `
    <div id="touch-left-zone" class="touch-zone">
      <div id="touch-joystick-base">
        <div id="touch-joystick-stick"></div>
      </div>
      <div class="touch-zone-label">MOVE</div>
    </div>

    <div id="touch-right-zone" class="touch-zone">
      <div class="touch-zone-label right">LOOK</div>
    </div>

    <div id="touch-actions">
      <button id="touch-jump" class="action-btn">JUMP</button>
      <button id="touch-break" class="action-btn red">⛏ BREAK</button>
      <button id="touch-place" class="action-btn green">PLACE</button>
    </div>
  `;
  document.body.appendChild(hud);

  const leftZone = document.getElementById('touch-left-zone');
  const rightZone = document.getElementById('touch-right-zone');
  const stick = document.getElementById('touch-joystick-stick');
  const joystickBase = document.getElementById('touch-joystick-base');

  let movePointerId = null;
  let lookPointerId = null;
  let moveOriginX = 0;
  let moveOriginY = 0;
  let lastLookX = 0;
  let lastLookY = 0;
  const joystickRadius = 34;
  const lookSensitivity = 0.0035;

  const clearMoveKeys = () => {
    delete player.keysPressed['KeyW'];
    delete player.keysPressed['KeyA'];
    delete player.keysPressed['KeyS'];
    delete player.keysPressed['KeyD'];
  };

  const updateStick = (dx, dy) => {
    const dist = Math.hypot(dx, dy);
    const scale = dist > joystickRadius ? joystickRadius / dist : 1;
    const clampedX = dx * scale;
    const clampedY = dy * scale;

    if (stick) {
      stick.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    }

    clearMoveKeys();
    const deadZone = 10;
    if (clampedY < -deadZone) player.keysPressed['KeyW'] = true;
    if (clampedY > deadZone) player.keysPressed['KeyS'] = true;
    if (clampedX < -deadZone) player.keysPressed['KeyA'] = true;
    if (clampedX > deadZone) player.keysPressed['KeyD'] = true;
  };

  const resetStick = () => {
    clearMoveKeys();
    if (stick) stick.style.transform = 'translate(0px, 0px)';
  };

  leftZone?.addEventListener('pointerdown', (e) => {
    if (!window.gameStarted) return;
    movePointerId = e.pointerId;
    moveOriginX = e.clientX;
    moveOriginY = e.clientY;
    leftZone.setPointerCapture?.(e.pointerId);
    joystickBase?.classList.add('active');
    updateStick(0, 0);
    e.preventDefault();
  });

  leftZone?.addEventListener('pointermove', (e) => {
    if (movePointerId !== e.pointerId) return;
    updateStick(e.clientX - moveOriginX, e.clientY - moveOriginY);
    e.preventDefault();
  });

  const endMove = (e) => {
    if (movePointerId !== e.pointerId) return;
    movePointerId = null;
    joystickBase?.classList.remove('active');
    resetStick();
    e.preventDefault();
  };
  leftZone?.addEventListener('pointerup', endMove);
  leftZone?.addEventListener('pointercancel', endMove);

  rightZone?.addEventListener('pointerdown', (e) => {
    if (!window.gameStarted) return;
    lookPointerId = e.pointerId;
    lastLookX = e.clientX;
    lastLookY = e.clientY;
    rightZone.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });

  rightZone?.addEventListener('pointermove', (e) => {
    if (lookPointerId !== e.pointerId || !window.gameStarted) return;

    const dx = e.clientX - lastLookX;
    const dy = e.clientY - lastLookY;
    lastLookX = e.clientX;
    lastLookY = e.clientY;

    const obj = player.controls.getObject();
    obj.rotation.y -= dx * lookSensitivity;
    player.camera.rotation.x -= dy * lookSensitivity;
    clampCamera(player);
    e.preventDefault();
  });

  const endLook = (e) => {
    if (lookPointerId !== e.pointerId) return;
    lookPointerId = null;
    e.preventDefault();
  };
  rightZone?.addEventListener('pointerup', endLook);
  rightZone?.addEventListener('pointercancel', endLook);

  const bindHold = (id, onPress, onRelease = onPress) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const press = (e) => {
      e.preventDefault();
      onPress();
    };
    const release = (e) => {
      e.preventDefault();
      onRelease();
    };

    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
  };

  bindHold('touch-jump',
    () => { player.keysPressed['Space'] = true; },
    () => { delete player.keysPressed['Space']; }
  );
  bindHold('touch-break',
    () => player.startAction(0),
    () => player.stopAction(0)
  );
  bindHold('touch-place',
    () => player.startAction(2),
    () => player.stopAction(2)
  );

  window.addEventListener('orientationchange', () => {
    setTimeout(() => clampCamera(player), 50);
  });

  setInterval(() => {
    if (!window.gameStarted) return;
    clampCamera(player);
  }, 250);

  console.log('[iPad] Touch-first controls installed');
}
