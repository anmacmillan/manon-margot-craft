import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';
import { Player } from './player';
import { Physics } from './physics';
import { setupUI } from './ui';
import { ModelLoader } from './modelLoader';
import { NetworkManager } from './network';
import { AvatarEditor } from './avatarEditor.js';
import { installIpadControls, isIpadLike } from './touchControls.js';
import { CreatureManager } from './creatures.js';
import { getAmbientAudio } from './ambientAudio.js';


window.gameStarted = false;
window.playerName = '';

// Web Audio synthesizer for a premium retro NES-style chime on launch
function playStartSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (frequency, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, startTime);
      
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    // C4 -> E4 -> G4 -> C5 retro arpeggio
    const now = audioCtx.currentTime;
    playTone(261.63, now, 0.15);
    playTone(329.63, now + 0.08, 0.15);
    playTone(392.00, now + 0.16, 0.15);
    playTone(523.25, now + 0.24, 0.35);
  } catch (e) {
    console.warn("Web Audio blocked or unsupported:", e);
  }
}

// UI Setup
const stats = new Stats();
document.body.appendChild(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
window.renderer = renderer; // Expose globally for multiplayer color updates

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x80a0e0, 50, 75);

const world = new World();
world.generate();
scene.add(world);

const player = new Player(scene, world);
const physics = new Physics(scene);

// iPad Safari has no Pointer Lock API — install the trackpad-look fallback if we're on iPad
installIpadControls(player);

// Wandering animals, villagers, follower golem
const creatures = new CreatureManager(scene, world, player);
window.creatures = creatures;

// Initialize Peer-to-Peer Network Manager
const network = new NetworkManager(scene, world, player);
window.network = network; // Expose globally for player block placement hook

// Initialize Launcher Card Listeners
function initLauncher() {
  const launchGame = (playerType, playMode = 'solo') => {
    window.playerName = playerType;
    window.gameStarted = true;

    // Ensure any open avatar editor drawer is destroyed cleanly and instantly
    if (window.currentAvatarEditor) {
      window.currentAvatarEditor.close(true);
      window.currentAvatarEditor = null;
    }

    // Play retro chime sound
    playStartSound();

    // Configure selected Outfit / Skin customization
    let selectedSkin = 'standard';
    const savedSkin = localStorage.getItem(`minecraft_avatar_${playerType}`);
    if (savedSkin) {
      try {
        selectedSkin = JSON.parse(savedSkin);
      } catch (e) {
        selectedSkin = 'standard';
      }
    }
    player.avatarSkin = selectedSkin;
    console.log(`Initializing local avatar for ${playerType} with skin`, selectedSkin);
    player.initAvatar(playerType, selectedSkin);

    // Reveal floating magic structures spawner panel
    document.getElementById('magic-spawner-container')?.classList.remove('hidden');

    // Configure selected Game Mode (Creative vs Survival)
    const selectedMode = document.getElementById(`mode-${playerType}`)?.value || 'creative';
    player.gameMode = selectedMode;
    console.log(`Launching ${playerType.toUpperCase()} in ${selectedMode.toUpperCase()} mode.`);

    if (playerType === 'manon') {
      world.params.seed = 12345;
      
      // Warm, cozy pinkish sunset sky
      renderer.setClearColor(0xffccd5);
      scene.fog.color.setHex(0xffccd5);
      scene.fog.near = 40;
      scene.fog.far = 70;
      if (sun) {
        sun.color.setHex(0xffebeb);
        sun.intensity = 1.6;
      }

      // Customize instructions overlay
      const title = document.querySelector('#instructions h1');
      if (title) {
        title.innerText = selectedMode === 'creative' ? 'MANONCRAFT (CREATIVE)' : 'MANONCRAFT (SURVIVAL)';
        title.style.color = '#ff4d94';
        title.style.textShadow = '3px 3px 0px #800040';
      }
    } else if (playerType === 'margot') {
      world.params.seed = 67890;

      // Magical teal sea sky
      renderer.setClearColor(0x8be3db);
      scene.fog.color.setHex(0x8be3db);
      scene.fog.near = 45;
      scene.fog.far = 80;
      if (sun) {
        sun.color.setHex(0xe0f7fa);
        sun.intensity = 1.5;
      }

      // Customize instructions overlay
      const title = document.querySelector('#instructions h1');
      if (title) {
        title.innerText = selectedMode === 'creative' ? 'MARGOTCRAFT (CREATIVE)' : 'MARGOTCRAFT (SURVIVAL)';
        title.style.color = '#00cccc';
        title.style.textShadow = '3px 3px 0px #004d40';
      }
    }

    // Set dynamic instructions list based on selected game mode
    const instructionsList = document.getElementById('instructions-list');
    if (instructionsList) {
      const isTouchDevice = isIpadLike();
      if (isTouchDevice) {
        instructionsList.innerHTML = `
          LEFT THUMB PAD - Move<br>
          RIGHT SIDE DRAG - Look Around<br>
          ⛏ BREAK - Break Block<br>
          PLACE - Place Selected Block<br>
          JUMP - Jump / Fly Up<br>
          TAP HOTBAR - Choose Block<br><br>
        `;
      } else if (selectedMode === 'creative') {
        instructionsList.innerHTML = `
          WASD / ZQSD / ARROWS - Move<br>
          MOUSE - Look Around<br>
          LEFT CLICK - Break<br>
          RIGHT CLICK - Place<br>
          SPACE - Fly Up<br>
          SHIFT / C / CTRL - Fly Down<br>
          WHEEL / 1-8 - Change Block<br>
          0 / à / ² / P / X - Pickaxe<br>
          M / ESC - Free Mouse<br><br>
        `;
      } else {
        instructionsList.innerHTML = `
          WASD / ZQSD / ARROWS - Move<br>
          MOUSE - Look Around<br>
          LEFT CLICK - Break<br>
          RIGHT CLICK - Place<br>
          SHIFT - Sprint<br>
          SPACE - Jump<br>
          WHEEL / 1-8 - Change Block<br>
          0 / à / ² / P / X - Pickaxe<br>
          M / ESC - Free Mouse<br><br>
        `;
      }
    }

    // Network Mode Setup
    if (playMode === 'coop') {
      // Auto-coop: first sister to click becomes host (claims shared lobby ID),
      // second sister detects the unavailable-id error and joins as client.
      // The host pre-generates the world so the client has something to sync against.
      const loaded = world.load();
      if (!loaded) {
        world.generate(true);
      }
      network.init('auto', playerType);

      // Hide launcher portal — the status banner takes over until connect resolves
      const portal = document.getElementById('launcher-portal');
      if (portal) portal.classList.add('hidden');

    } else if (playMode === 'host') {
      // Auto-load host's previous world, generate fresh terrain only if no save file exists
      const loaded = world.load();
      if (!loaded) {
        world.generate(true);
      }
      network.init('host', playerType);

      // Hide launcher portal (revealing the 3D canvas and instructions overlay)
      const portal = document.getElementById('launcher-portal');
      if (portal) portal.classList.add('hidden');

    } else if (playMode === 'client') {
      // Client DOES NOT generate local world yet.
      // We wait for the 'sync' packet from the host, which will configure the seed and trigger generation.
      network.init('client', playerType);

    } else {
      // Solo Mode - Auto-load previous world, generate fresh terrain only if no save file exists
      const loaded = world.load();
      if (!loaded) {
        world.generate(true);
      }

      // Hide launcher portal (revealing the 3D canvas and instructions overlay)
      const portal = document.getElementById('launcher-portal');
      if (portal) portal.classList.add('hidden');
    }

    // Spawn the player on real ground rather than y=32 (the hard-coded default
    // dropped them in the sky on Margot's iPad — she'd freefall and the camera
    // could roll unpredictably while falling).
    if (playMode !== 'client') {
      const findGround = (x, z) => {
        const SKY_BLOCKS = new Set([9, 17]);
        for (let y = 40; y > 0; y--) {
          const b = world.getBlock(Math.round(x), y, Math.round(z));
          if (b && b.id && b.id !== 0 && !SKY_BLOCKS.has(b.id)) return y + 1;
        }
        return null;
      };
      const sx = player.position.x;
      const sz = player.position.z;
      const sy = findGround(sx, sz);
      if (sy !== null) {
        player.position.y = sy + 2.5; // 2.5 above ground so they land softly, not inside it
      }
    }

    // Populate ambient animals + follower golem after world is ready (skip for clients — host's creatures are local-only).
    // Deferred + try/catch'd because creature meshes used to overload iPad Safari at launch.
    if (playMode !== 'client') {
      setTimeout(() => {
        try {
          creatures.populateInitial();
        } catch (err) {
          console.warn('[Creatures] populateInitial failed:', err);
        }
      }, 1500);
    }

    // Start ambient music on first user gesture — but skip auto-start on iPad
    // (Web Audio + creatures + WebRTC was overwhelming older iPads; Manon can tap 🔊 to enable)
    const isIpad = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIpad) {
      try { getAmbientAudio().resume(); } catch (err) { console.warn('[Audio] resume failed', err); }
    }

    // Elegant auto-pointerlock transition on game launch!
    player.controls.lock();
  };

  // Bind Edit Avatar Buttons
  document.getElementById('custom-manon-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.currentAvatarEditor = new AvatarEditor('manon', (settings) => {
      console.log('Manon customized avatar settings saved:', settings);
      launchGame('manon', 'solo');
    });
  });

  document.getElementById('custom-margot-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.currentAvatarEditor = new AvatarEditor('margot', (settings) => {
      console.log('Margot customized avatar settings saved:', settings);
      launchGame('margot', 'solo');
    });
  });

  // Bind Buttons: Manon
  document.getElementById('launch-manon-solo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('manon', 'solo');
  });
  document.getElementById('launch-manon-coop')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('manon', 'coop');
  });

  // Bind Buttons: Margot
  document.getElementById('launch-margot-solo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('margot', 'solo');
  });
  document.getElementById('launch-margot-coop')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('margot', 'coop');
  });

  // Bind Floating Magic Spawner Sidebar buttons.
  // One-click spawn-at-feet: the structure pops up right next to the player,
  // no aiming. Much friendlier for the girls than the old aim-and-click flow.
  const bindSpawnerBtn = (id, type) => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.stopPropagation();

      // Find a sensible ground position 4 blocks in front of the player
      const yaw = player.controls.getObject().rotation.y;
      const fx = Math.round(player.position.x - Math.sin(yaw) * 4);
      const fz = Math.round(player.position.z - Math.cos(yaw) * 4);

      // Scan down to find solid ground (skipping clouds/glass)
      const SKY_BLOCKS = new Set([9, 17]);
      let fy = null;
      for (let y = 40; y > 0; y--) {
        const b = world.getBlock(fx, y, fz);
        if (b && b.id && b.id !== 0 && !SKY_BLOCKS.has(b.id)) { fy = y + 1; break; }
      }
      if (fy === null) fy = Math.round(player.position.y);

      world.spawnStructure(type, fx, fy, fz);

      // Quick visual flash so it's obvious something happened
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 800);
      }

      // Status banner confirmation
      const status = document.getElementById('status');
      if (status) {
        status.innerHTML = `✨ Spawned ${type.replace(/-/g, ' ')}!`;
        setTimeout(() => status.innerHTML = '', 2500);
      }
    });
  };

  bindSpawnerBtn('spawn-gothic-castle', 'gothic-castle');
  bindSpawnerBtn('spawn-crystal-palace', 'crystal-palace');
  bindSpawnerBtn('spawn-cosmic-galaxy', 'cosmic-galaxy');
  bindSpawnerBtn('spawn-gothic-cathedral', 'gothic-cathedral');
  bindSpawnerBtn('spawn-pegasus-stables', 'pegasus-stables');
  bindSpawnerBtn('spawn-rainbow-bridge', 'rainbow-bridge');
  bindSpawnerBtn('spawn-greek-temple', 'greek-temple');
  bindSpawnerBtn('spawn-hogwarts-tower', 'hogwarts-tower');
  bindSpawnerBtn('spawn-treehouse-village', 'treehouse-village');
  bindSpawnerBtn('spawn-dragon-lair', 'dragon-lair');
  bindSpawnerBtn('spawn-ice-castle', 'ice-castle');
  bindSpawnerBtn('spawn-mushroom-kingdom', 'mushroom-kingdom');

  // ESC always clears any active magic spawner — fallback when the user clicks
  // empty sky and the placement code can't fire its own clear path.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      player.activeSpawner = null;
      document.querySelectorAll('.spawner-btn').forEach(btn => btn.classList.remove('active'));
    }
  });

  // Mute toggle (button + 'N' key)
  const muteBtn = document.getElementById('mute-btn');
  const audio = getAmbientAudio();
  const updateMuteUi = (muted) => { if (muteBtn) muteBtn.textContent = muted ? '🔇' : '🔊'; };
  muteBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.resume();
    updateMuteUi(audio.toggleMute());
  });
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'n') {
      audio.resume();
      updateMuteUi(audio.toggleMute());
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLauncher);
} else {
  initLauncher();
}

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
orbitCamera.position.set(24, 24, 24);
orbitCamera.layers.enable(1);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.update();

const modelLoader = new ModelLoader((models) => {
  player.setTool(models.pickaxe);
})

let sun;
function setupLights() {
  sun = new THREE.DirectionalLight();
  sun.intensity = 1.5;
  sun.position.set(50, 50, 50);
  sun.castShadow = true;

  // Set the size of the sun's shadow box
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0001;
  sun.shadow.mapSize = new THREE.Vector2(2048, 2048);
  scene.add(sun);
  scene.add(sun.target);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.2;
  scene.add(ambient);
}

// Render loop
let previousTime = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const dt = (currentTime - previousTime) / 1000;

  // Update physics and state when game is active (regardless of pointer lock)
  if (window.gameStarted) {
    physics.update(dt, player, world);
    player.update(world);
    world.update(player);

    // Hard-clamp camera roll every frame — Margot's view was tilting sideways
    // and there are several code paths that could set z; killing it here is bullet-proof.
    if (player.camera.rotation.z !== 0) player.camera.rotation.z = 0;
    const _yawObj = player.controls.getObject?.();
    if (_yawObj && _yawObj.rotation.z !== 0) _yawObj.rotation.z = 0;

    try { creatures.update(dt); } catch (err) { /* never let creature AI crash the game */ }

    // Position the sun relative to the player to maintain the shadow angle
    sun.position.copy(player.camera.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.camera.position);

    // Update orbit camera position to track player
    orbitCamera.position.copy(player.position).add(new THREE.Vector3(16, 16, 16));
    controls.target.copy(player.position);

    // Send our real-time coordinates in multiplayer
    network.sendPlayerPosition();
  }

  // Update OrbitControls when unlocked to ensure smooth camera orbiting
  if (!player.controls.isLocked) {
    controls.update();
  }

  // Animate and interpolate remote sister's avatar
  network.update(dt);

  renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
  stats.update();

  previousTime = currentTime;
}

window.addEventListener('resize', () => {
  // Resize camera aspect ratio and renderer size to the new window size
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupUI(world, player, physics, scene);
setupLights();
animate();