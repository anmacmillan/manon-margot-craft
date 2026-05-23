import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';
import { Player } from './player';
import { Physics } from './physics';
import { setupUI } from './ui';
import { ModelLoader } from './modelLoader';
import { NetworkManager } from './network';

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

// Initialize Peer-to-Peer Network Manager
const network = new NetworkManager(scene, world, player);
window.network = network; // Expose globally for player block placement hook

// Initialize Launcher Card Listeners
function initLauncher() {
  const launchGame = (playerType, playMode = 'solo') => {
    window.playerName = playerType;
    window.gameStarted = true;

    // Play retro chime sound
    playStartSound();

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
        title.innerText = 'MANONCRAFT';
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
        title.innerText = 'MARGOTCRAFT';
        title.style.color = '#00cccc';
        title.style.textShadow = '3px 3px 0px #004d40';
      }
    }

    // Network Mode Setup
    if (playMode === 'host') {
      world.generate(true); // Host clears cache & rebuilds fresh starting world
      network.init('host', playerType);
      
      // Hide launcher portal and lock camera
      const portal = document.getElementById('launcher-portal');
      if (portal) portal.classList.add('hidden');
      setTimeout(() => player.controls.lock(), 800);

    } else if (playMode === 'client') {
      // Client DOES NOT generate local world yet.
      // We wait for the 'sync' packet from the host, which will configure the seed and trigger generation.
      network.init('client', playerType);

    } else {
      // Solo Mode
      world.generate(true); // Clear cache & rebuild
      
      // Hide launcher portal and lock camera
      const portal = document.getElementById('launcher-portal');
      if (portal) portal.classList.add('hidden');
      setTimeout(() => player.controls.lock(), 800);
    }
  };

  // Bind Buttons: Manon
  document.getElementById('launch-manon-solo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('manon', 'solo');
  });
  document.getElementById('launch-manon-host')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('manon', 'host');
  });
  document.getElementById('launch-manon-join')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('manon', 'client');
  });

  // Bind Buttons: Margot
  document.getElementById('launch-margot-solo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('margot', 'solo');
  });
  document.getElementById('launch-margot-host')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('margot', 'host');
  });
  document.getElementById('launch-margot-join')?.addEventListener('click', (e) => {
    e.stopPropagation();
    launchGame('margot', 'client');
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

  // Only update physics when player controls are locked
  if (player.controls.isLocked) {
    physics.update(dt, player, world);
    player.update(world);
    world.update(player);

    // Position the sun relative to the player. Need to adjust both the
    // position and target of the sun to keep the same sun angle
    sun.position.copy(player.camera.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.camera.position);

    // Update positon of the orbit camera to track player 
    orbitCamera.position.copy(player.position).add(new THREE.Vector3(16, 16, 16));
    controls.target.copy(player.position);

    // Send our real-time coordinates to our sister
    network.sendPlayerPosition();
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