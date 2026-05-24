import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world';
import { blocks } from './blocks';
import { buildAvatar, updateAvatarAnimations } from './avatar.js';

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  height = 1.75;
  radius = 0.5;
  maxSpeed = 5;

  jumpSpeed = 10;
  sprinting = false;
  onGround = false;

  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  cameraHelper = new THREE.CameraHelper(this.camera);
  controls = new PointerLockControls(this.camera, document.body);
  debugCamera = false;

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
  selectedCoords = null;
  activeBlockId = blocks.empty.id;

  tool = {
    // Group that will contain the tool mesh
    container: new THREE.Group(),
    // Whether or not the tool is currently animating
    animate: false,
    // The time the animation was started
    animationStart: 0,
    // The rotation speed of the tool
    animationSpeed: 0.025,
    // Reference to the current animation
    animation: null
  }

  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.gameMode = 'creative'; // Default to creative mode (God Mode)
    this.activeSpawner = null;  // Magic Spawner selection tracker
    this.keysPressed = {};      // Key state tracker for smooth flight and noclip movement
    this.position.set(32, 32, 32);
    this.cameraHelper.visible = false;
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    // Hide/show instructions based on pointer controls locking/unlocking
    this.controls.addEventListener('lock', this.onCameraLock.bind(this));
    this.controls.addEventListener('unlock', this.onCameraUnlock.bind(this));

    // The tool is parented to the camera
    this.camera.add(this.tool.container);

    // Add a subtle camera headlight so held tools and nearby blocks are illuminated perfectly
    const headlight = new THREE.PointLight(0xfff8e7, 0.4, 4);
    headlight.position.set(0, 0, 0);
    this.camera.add(headlight);

    // Set raycaster to use layer 0 so it doesn't interact with water mesh on layer 1
    this.raycaster.layers.set(0);
    this.camera.layers.enable(1);

    // Wireframe mesh visualizing the player's bounding cylinder
    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    this.boundsHelper.visible = false;
    scene.add(this.boundsHelper);

    // Helper used to highlight the currently active block
    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa
    });
    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);

    // Add event listeners for keyboard/mouse events
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    // Reset key presses on window blur to prevent stuck key issues (like infinite flying)
    window.addEventListener('blur', () => {
      this.keysPressed = {};
    });

    // Wire up on-screen clicking of the toolbar icons for child accessibility
    const toolbar = document.getElementById('toolbar');
    if (toolbar) {
      toolbar.addEventListener('click', (event) => {
        const icon = event.target.closest('.toolbar-icon');
        if (icon) {
          const idStr = icon.id.replace('toolbar-', '');
          const id = parseInt(idStr, 10);
          if (!isNaN(id)) {
            this.selectSlot(id);
          }
        }
      });
    }

    // Wire up teleport button click
    const teleportBtn = document.getElementById('teleport-btn');
    if (teleportBtn) {
      teleportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.teleportToRemote();
      });
    }
  }

  /**
   * Updates the selected slot and tool visibility
   */
  selectSlot(digit) {
    if (digit < 0 || digit > 8) return;
    document.getElementById(`toolbar-${this.activeBlockId}`)?.classList.remove('selected');
    document.getElementById(`toolbar-${digit}`)?.classList.add('selected');
    this.activeBlockId = digit;
    this.tool.container.visible = (this.activeBlockId === 0);
  }

  /**
   * Teleports player directly to sister's coordinate with vertical safety offset
   */
  teleportToRemote() {
    if (window.network && window.network.isConnected) {
      const targetPos = window.network.remoteTargetPosition || window.network.remotePosition;
      if (targetPos) {
        this.position.copy(targetPos);
        this.position.y += 1.5;
        this.velocity.set(0, 0, 0);
        console.log("Teleported to sister at", this.position);
      }
    }
  }

  onCameraLock() {
    this.hasLockedOnce = true;
    document.getElementById('overlay').style.visibility = 'hidden';
    this.hideMouseUnlockHint();
  }

  onCameraUnlock() {
    if (!this.debugCamera) {
      if (!this.hasLockedOnce) {
        document.getElementById('overlay').style.visibility = 'visible';
      } else {
        this.showMouseUnlockHint();
      }
    }
    // Automatically clear active spawner selection when pointer unlocks!
    this.activeSpawner = null;
    document.querySelectorAll('.spawner-btn').forEach(btn => btn.classList.remove('active'));
  }

  showMouseUnlockHint() {
    const hint = document.getElementById('mouse-unlock-hint');
    if (hint) {
      hint.classList.add('visible');
    }
  }

  hideMouseUnlockHint() {
    const hint = document.getElementById('mouse-unlock-hint');
    if (hint) {
      hint.classList.remove('visible');
    }
  }

  /**
   * Updates the state of the player
   * @param {World} world 
   */
  update(world) {
    this.updateBoundsHelper();
    this.updateRaycaster(world);

    if (this.tool.animate) {
      this.updateToolAnimation();
    }

    // Sync and animate local 3D avatar if initialized
    if (this.avatarGroup) {
      // Sync coordinates: localAvatar center.y = feet position + 1.02 = (player.position.y - player.height) + 1.02
      this.avatarGroup.position.copy(this.position);
      this.avatarGroup.position.y = (this.position.y - this.height) + 1.02;

      // Sync orientation: we can match the camera's Y rotation
      this.avatarGroup.rotation.y = this.camera.rotation.y;

      // Toggle visibility: only show when controls are unlocked (Orbit View)
      this.avatarGroup.visible = !this.controls.isLocked;

      // Is the player moving? Check if movement keys are pressed
      const isMoving = this.keysPressed['KeyW'] || this.keysPressed['w'] || this.keysPressed['z'] || this.keysPressed['ArrowUp'] ||
                       this.keysPressed['KeyS'] || this.keysPressed['s'] || this.keysPressed['ArrowDown'] ||
                       this.keysPressed['KeyA'] || this.keysPressed['a'] || this.keysPressed['q'] || this.keysPressed['ArrowLeft'] ||
                       this.keysPressed['KeyD'] || this.keysPressed['d'] || this.keysPressed['ArrowRight'];

      // Update limbs and accessories
      updateAvatarAnimations(this.avatarData, performance.now(), isMoving);
    }
  }

  /**
   * Set up local player 3D avatar
   */
  initAvatar(name, skin) {
    if (this.avatarGroup) {
      this.scene.remove(this.avatarGroup);
    }
    this.avatarName = name;
    this.avatarSkin = skin;

    // Use our modular builder
    const avatarData = buildAvatar(name, skin);
    this.avatarGroup = avatarData.group;
    this.avatarData = avatarData;

    // Default to invisible in locked first person
    this.avatarGroup.visible = false;
    this.scene.add(this.avatarGroup);
    console.log(`[Player] Initialized local 3D avatar for ${name} with skin ${skin}`);
  }

  /**
   * Updates the raycaster used for block selection
   * @param {World} world 
   */
  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];

      // Get the chunk associated with the selected block
      const chunk = intersection.object.parent;

      // Get the transformation matrix for the selected block
      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      // Set the selected coordinates to the origin of the chunk,
      // then apply the transformation matrix of the block to get
      // the block coordinates
      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      if (this.activeBlockId !== blocks.empty.id) {
        // If we are adding a block, move it 1 block over in the direction
        // of where the ray intersected the cube
        this.selectedCoords.add(intersection.normal);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  /**
   * Updates the state of the player based on the current user inputs
   * @param {Number} dt 
   */
  applyInputs(dt) {
    // Calculate movement inputs dynamically from physical keys, characters, or arrow keys
    const moveForward = this.keysPressed['KeyW'] || this.keysPressed['w'] || this.keysPressed['z'] || this.keysPressed['ArrowUp'];
    const moveBackward = this.keysPressed['KeyS'] || this.keysPressed['s'] || this.keysPressed['ArrowDown'];
    const moveLeft = this.keysPressed['KeyA'] || this.keysPressed['a'] || this.keysPressed['q'] || this.keysPressed['ArrowLeft'];
    const moveRight = this.keysPressed['KeyD'] || this.keysPressed['d'] || this.keysPressed['ArrowRight'];

    this.input.z = 0;
    if (moveForward) this.input.z = this.maxSpeed;
    if (moveBackward) this.input.z = -this.maxSpeed;

    this.input.x = 0;
    if (moveLeft) this.input.x = -this.maxSpeed;
    if (moveRight) this.input.x = this.maxSpeed;

    this.velocity.x = this.input.x * (this.sprinting ? 1.5 : 1);
    this.velocity.z = this.input.z * (this.sprinting ? 1.5 : 1);
    this.controls.moveRight(this.velocity.x * dt);
    this.controls.moveForward(this.velocity.z * dt);

    // Handle continuous Creative Flight
    if (this.gameMode === 'creative') {
      let flySpeed = this.maxSpeed * (this.sprinting ? 2.0 : 1.0);
      this.velocity.y = 0; // Standard creative behavior: hover still unless input is held
      if (this.keysPressed['Space']) {
        this.velocity.y = flySpeed;
      } else if (
        (!this.suppressShiftDescent && 
         (this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight']) && 
         (performance.now() - (this.shiftPressedTime || 0) > 300)) ||
        this.keysPressed['ControlLeft'] || this.keysPressed['ControlRight'] ||
        this.keysPressed['KeyC'] || this.keysPressed['c']
      ) {
        this.velocity.y = -flySpeed;
      }
    }

    this.position.y += this.velocity.y * dt;

    if (this.position.y < 0) {
      this.position.y = 0;
      this.velocity.y = 0;
    }

    document.getElementById('info-player-position').innerHTML = this.toString();
  }

  /**
   * Updates the position of the player's bounding cylinder helper
   */
  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.camera.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  /**
   * Set the tool object the player is holding
   * @param {THREE.Mesh} tool 
   */
  setTool(tool) {
    this.tool.container.clear();

    // Auto-scale and auto-center the tool mesh if it's from the external GLB loader
    const box = new THREE.Box3().setFromObject(tool);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    console.log("[Player] Loaded tool bounding box size:", size, "center:", center);

    if (tool.name !== "fallback_pickaxe") {
      // Shift tool position so its horizontal center is at 0 and its bottom sits at 0 in pivot space
      tool.position.set(-center.x, -box.min.y, -center.z);

      // Auto-scale so maximum dimension is normalized to 0.45 units in camera space
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scaleFactor = 0.45 / maxDim;
        tool.scale.set(scaleFactor, scaleFactor, scaleFactor);
        console.log(`[Player] Auto-scaled GLB tool by factor of ${scaleFactor} (original max dimension was ${maxDim})`);
      }
    } else {
      // Fallback pickaxe is already perfectly centered and scaled
      tool.position.set(0, 0, 0);
      tool.scale.set(1, 1, 1);
    }

    // Traverse the mesh hierarchy to enforce casting/receiving shadows and double-sided materials
    tool.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;

          // Adjust PBR properties on standard materials to make them render brightly and catch shadows
          if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
            child.material.roughness = 0.4;
            child.material.metalness = 0.6;
          }
          child.material.needsUpdate = true;
        }
      }
    });

    this.tool.container.add(tool);
    this.tool.container.receiveShadow = true;
    this.tool.container.castShadow = true;

    // Set container position in bottom-right view of first-person camera space (more centralised to avoid Chrome edge-clipping)
    this.tool.container.position.set(0.28, -0.22, -0.42);
    this.tool.container.scale.set(1, 1, 1);

    // Natural pickaxe holding angles
    this.tool.container.rotation.set(0, 0, 0);
    this.tool.container.rotation.x = -Math.PI / 4;   // Tilt forward
    this.tool.container.rotation.y = -Math.PI / 3;   // Rotate inward
    this.tool.container.rotation.z = Math.PI / 6;    // Angle slightly down

    // Synchronize container visibility to hotbar slot active state on boot/load
    this.tool.container.visible = (this.activeBlockId === 0);

    console.log(`[Player] Set tool finished. Container visibility:`, this.tool.container.visible);
  }

  /**
   * Animates the tool rotation
   */
  updateToolAnimation() {
    const duration = 250; // Snappy pickaxe swing duration (250ms)
    const elapsed = performance.now() - this.tool.animationStart;

    if (elapsed >= duration) {
      this.tool.animate = false;
      // Reset precisely to standard holding pose
      this.tool.container.position.set(0.28, -0.22, -0.42);
      this.tool.container.rotation.set(-Math.PI / 4, -Math.PI / 3, Math.PI / 6);
      return;
    }

    const progress = elapsed / duration;
    // Elegant sine-wave swing shape
    const swing = Math.sin(progress * Math.PI);

    // Apply rotation transformations for a natural 3D slashing arc
    this.tool.container.rotation.x = -Math.PI / 4 - swing * 0.6;
    this.tool.container.rotation.y = -Math.PI / 3 + swing * 0.4;
    this.tool.container.rotation.z = Math.PI / 6 - swing * 0.3;

    // Apply position offsets for forward physical thrust
    this.tool.container.position.x = 0.28 - swing * 0.08;
    this.tool.container.position.y = -0.22 - swing * 0.08;
    this.tool.container.position.z = -0.42 + swing * 0.12;
  }

  /**
   * Returns the current world position of the player
   * @returns {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  /**
   * Returns the velocity of the player in world coordinates
   * @returns {THREE.Vector3}
   */
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    return this.#worldVelocity;
  }

  /**
   * Applies a change in velocity 'dv' that is specified in the world frame
   * @param {THREE.Vector3} dv 
   */
  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event 
   */
  onKeyDown(event) {
    if (!window.gameStarted) return;

    this.keysPressed[event.code] = true;
    this.keysPressed[event.key.toLowerCase()] = true;

    // Track physical shift-down timing to support reverting accidental creative-flight plummeting
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      this.shiftPressedTime = performance.now();
      this.positionYOnShift = this.position.y;
    }

    const keyLower = event.key.toLowerCase();

    // Unshifted AZERTY top-row mappings for seamless slots 1-8 navigation
    const azertyRow = {
      '&': 1,
      'é': 2,
      '"': 3,
      '\'': 4,
      '(': 5,
      '-': 6,
      '§': 6, // Belgian AZERTY key 6
      'è': 7,
      '_': 8,
      '!': 8  // Belgian AZERTY key 8
    };

    // Set transient suppression of flight descent if any slot digits (0-8) are pressed under Shift
    if (event.shiftKey && (
      (event.code && event.code.startsWith('Digit')) ||
      (event.key && event.key >= '0' && event.key <= '9') ||
      azertyRow[event.key] !== undefined ||
      keyLower === 'à'
    )) {
      this.suppressShiftDescent = true;
      // Revert accidental descent if they tapped Shift + digit (AZERTY number row chord) within 1000ms
      if (this.shiftPressedTime && performance.now() - this.shiftPressedTime < 1000 && this.positionYOnShift !== undefined) {
        this.position.y = this.positionYOnShift;
        this.velocity.y = 0;
      }
    }

    // Direct mapping to toggle mouse lock/unlock on AZERTY / QWERTY
    if (keyLower === 'm') {
      if (this.controls.isLocked) {
        this.controls.unlock();
      } else {
        this.controls.lock();
      }
      return;
    }

    // Direct mappings to select hotbar slot 0 (pickaxe) on AZERTY / QWERTY
    if (
      keyLower === 'p' || 
      keyLower === 'x' || 
      event.key === '²' || 
      event.key === '`' || 
      event.key === 'à' || 
      event.code === 'Backquote'
    ) {
      this.selectSlot(0);
      return;
    }

    if (azertyRow[event.key] !== undefined) {
      this.selectSlot(azertyRow[event.key]);
      return;
    }

    switch (event.code) {
      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Numpad0':
      case 'Numpad1':
      case 'Numpad2':
      case 'Numpad3':
      case 'Numpad4':
      case 'Numpad5':
      case 'Numpad6':
      case 'Numpad7':
      case 'Numpad8': {
        const digit = Number(event.code.slice(-1));
        this.selectSlot(digit);
        break;
      }
      case 'KeyR':
        if (this.repeat) break;
        this.position.y = 32;
        this.velocity.set(0, 0, 0);
        break;
      case 'KeyT':
        this.teleportToRemote();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.sprinting = true;
        break;
      case 'Space':
        // Only jump in Survival mode; Creative handles continuous vertical movement in applyInputs
        if (this.gameMode !== 'creative' && this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
        break;
      case 'F10':
        this.debugCamera = true;
        this.controls.unlock();
        break;
    }
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event 
   */
  onKeyUp(event) {
    this.keysPressed[event.code] = false;
    this.keysPressed[event.key.toLowerCase()] = false;

    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        this.sprinting = false;
        this.suppressShiftDescent = false; // Reset the suppression flag when Shift is released
        break;
    }
  }

  /**
   * Event handler for 'mousedown'' event
   * @param {MouseEvent} event 
   */
  onMouseDown(event) {
    if (!window.gameStarted) return;

    if (!this.controls.isLocked) {
      // Only request lock when explicitly clicking the 3D canvas or the instruction overlay
      const isOverlayClick = event.target.closest('#overlay') !== null;
      const isCanvasClick = event.target === window.renderer?.domElement;
      if (isOverlayClick || isCanvasClick) {
        this.controls.lock();
      }
      return;
    }

    if (this.controls.isLocked) {
      // Trigger swing animation on EVERY click while locked, even in mid-air (no selection required)
      if (!this.tool.animate) {
        this.tool.animate = true;
        this.tool.animationStart = performance.now();

        // Clear existing timeout
        clearTimeout(this.tool.animation);

        // Safety backup to turn off animation after 250ms
        this.tool.animation = setTimeout(() => {
          this.tool.animate = false;
          this.tool.container.position.set(0.28, -0.22, -0.42);
          this.tool.container.rotation.set(-Math.PI / 4, -Math.PI / 3, Math.PI / 6);
        }, 250);
      }

      // Is a block selected?
      if (this.selectedCoords) {
        // Intercept block placement if a magic spawner is active!
        if (this.activeSpawner) {
          this.world.spawnStructure(
            this.activeSpawner,
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z
          );
          
          // Reset active spawner state
          this.activeSpawner = null;
          document.querySelectorAll('.spawner-btn').forEach(btn => btn.classList.remove('active'));
          return;
        }

        // If active block is an empty block, then we are in delete mode
        if (this.activeBlockId === blocks.empty.id) {
          this.world.removeBlock(
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z
          );
          // Send block removal packet to sister
          window.network?.sendBlockChange('remove', this.selectedCoords.x, this.selectedCoords.y, this.selectedCoords.z);
        } else {
          this.world.addBlock(
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z,
            this.activeBlockId
          );
          // Send block placement packet to sister
          window.network?.sendBlockChange('add', this.selectedCoords.x, this.selectedCoords.y, this.selectedCoords.z, this.activeBlockId);
        }
      }
    }
  }

  /**
   * Event handler for mouse wheel or trackpad scroll to cycle hotbar block slots
   * @param {WheelEvent} event
   */
  onWheel(event) {
    if (!this.controls.isLocked) return;

    // Prevent default browser behavior (like zoom or scrolling the page)
    event.preventDefault();

    // Determine scroll direction: deltaY > 0 is scroll down, deltaY < 0 is scroll up
    const delta = Math.sign(event.deltaY);

    // Calculate the new hotbar block slot (wrapping between 0 and 8)
    let newBlockId = this.activeBlockId + delta;
    if (newBlockId < 0) newBlockId = 8;
    if (newBlockId > 8) newBlockId = 0;

    this.selectSlot(newBlockId);
  }

  /**
   * Returns player position in a readable string form
   * @returns {string}
   */
  toString() {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}