import * as THREE from 'three';

export class NetworkManager {
  constructor(scene, world, player) {
    this.scene = scene;
    this.world = world;
    this.player = player;

    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.isConnected = false;
    
    this.role = ''; // 'host' or 'client'
    this.playerName = ''; // 'manon' or 'margot'
    this.sisterName = ''; // the other player

    // Remote avatar meshes
    this.remoteAvatar = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.head = null;
    this.remotePosition = new THREE.Vector3();
    this.remoteTargetPosition = new THREE.Vector3();
    this.remoteRotationY = 0;
    this.remoteTargetRotationY = 0;

    // Movement tracking for animation
    this.lastRemotePosition = new THREE.Vector3();
    this.isMoving = false;

    // Throttle player updates (30 packets/sec)
    this.lastUpdateSent = 0;
    this.updateInterval = 1000 / 30; 
  }

  /**
   * Initialize PeerJS connection
   */
  init(role, playerName) {
    this.role = role;
    this.playerName = playerName;
    this.sisterName = playerName === 'manon' ? 'margot' : 'manon';
    this.isHost = role === 'host';

    const statusEl = document.getElementById('multiplayer-status');
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = `Initializing Multiplayer...`;

    // 1. Generate unique peer IDs
    // Host has a well-known clash-free ID, client gets auto-generated ID to prevent peer collisions
    const hostPeerId = `manon-margot-craft-${this.playerName}-lobby`;
    
    if (this.isHost) {
      statusEl.innerHTML = `Hosting Co-op on Wifi...<br><span style="font-size:0.65em;color:#ffd700;">Waiting for your sister to join...</span>`;
      this.peer = new Peer(hostPeerId);

      this.peer.on('open', (id) => {
        console.log(`Lobby successfully registered with PeerJS ID: ${id}`);
      });

      this.peer.on('connection', (connection) => {
        if (this.isConnected) {
          // Already have a sister connected! Reject extra peers.
          connection.on('open', () => {
            connection.send({ type: 'reject', reason: 'Lobby full' });
            setTimeout(() => connection.close(), 500);
          });
          return;
        }

        this.conn = connection;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Host Error:', err);
        statusEl.innerHTML = `<span style="color:#ff4d4d;">LOBBY ERROR: ${err.type}</span>`;
        if (err.type === 'unavailable-id') {
          statusEl.innerHTML = `<span style="color:#ffd700;">Lobby already running! Reconnecting...</span>`;
          setTimeout(() => window.location.reload(), 2000);
        }
      });

    } else {
      // Client mode
      statusEl.innerHTML = `Searching for your sister's game...`;
      this.peer = new Peer(); // Random ID for client

      this.peer.on('open', () => {
        const targetHostId = `manon-margot-craft-${this.sisterName}-lobby`;
        console.log(`Connecting to Host: ${targetHostId}`);
        
        const connection = this.peer.connect(targetHostId, {
          reliable: true
        });

        this.conn = connection;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS Client Error:', err);
        statusEl.innerHTML = `<span style="color:#ff4d4d;">CONNECTION ERROR</span>`;
        setTimeout(() => {
          statusEl.classList.add('hidden');
          const portal = document.getElementById('launcher-portal');
          if (portal) portal.classList.remove('hidden');
          alert(`Could not find ${this.sisterName === 'manon' ? 'Manon' : 'Margot'}'s game. Make sure she has hosted a Co-op game first!`);
        }, 1500);
      });
    }
  }

  /**
   * Bind events to the established data connection
   */
  setupConnection() {
    const statusEl = document.getElementById('multiplayer-status');

    this.conn.on('open', () => {
      this.isConnected = true;
      console.log('WebRTC P2P Data Channel Opened successfully!');

      if (this.isHost) {
        statusEl.innerHTML = `<span style="color:#8be3db;">Sister Connected! Syncing world...</span>`;
        // Send world seed, modified block dataStore, and current game mode to client
        this.conn.send({
          type: 'sync',
          seed: this.world.params.seed,
          blockData: this.world.dataStore.data,
          hostName: this.playerName,
          gameMode: this.player.gameMode
        });

        this.spawnRemoteAvatar(this.sisterName);
        setTimeout(() => {
          statusEl.innerHTML = `Playing Co-op with ${this.sisterName.toUpperCase()}`;
        }, 2000);
      } else {
        // Client sends immediate handshake to host
        this.conn.send({
          type: 'hello',
          clientName: this.playerName
        });
      }
    });

    this.conn.on('data', (data) => {
      this.handlePacket(data);
    });

    this.conn.on('close', () => {
      console.warn('Co-op connection closed.');
      this.disconnect();
    });

    this.conn.on('error', (err) => {
      console.error('Connection Data Error:', err);
      this.disconnect();
    });
  }

  /**
   * Process incoming WebRTC data packets
   */
  handlePacket(data) {
    const statusEl = document.getElementById('multiplayer-status');

    switch (data.type) {
      case 'reject':
        alert(`Failed to join: ${data.reason}`);
        this.disconnect();
        break;

      case 'sync':
        // Client receives world state from host
        console.log(`Sync packet received! Seed: ${data.seed}`);
        this.world.params.seed = data.seed;
        this.world.dataStore.data = data.blockData || {};
        this.player.gameMode = data.gameMode || 'creative'; // Apply host's game mode to client
        
        // Match the background, fog, and instructions theme of the host
        this.applyHostTheme(data.hostName);

        // Regenerate the client's world meshes using host's parameters
        this.world.generate(true);
        
        // Spawn host's avatar
        this.spawnRemoteAvatar(data.hostName);

        statusEl.innerHTML = `Playing Co-op with ${data.hostName.toUpperCase()}`;
        
        // Hide launcher and lock pointer controls
        const portal = document.getElementById('launcher-portal');
        if (portal) portal.classList.add('hidden');
        break;

      case 'hello':
        // Host receives client's introduction
        console.log(`Client introduced as: ${data.clientName}`);
        this.spawnRemoteAvatar(data.clientName);
        statusEl.innerHTML = `Playing Co-op with ${data.clientName.toUpperCase()}`;
        break;

      case 'playerMove':
        // Update interpolation targets
        if (this.remoteAvatar) {
          this.remoteTargetPosition.copy(data.position);
          this.remoteTargetRotationY = data.rotation;
        }
        break;

      case 'blockChange':
        // Apply block updates in real-time
        console.log(`Block synced: ${data.action} at ${data.x}, ${data.y}, ${data.z}`);
        if (data.action === 'add') {
          this.world.addBlock(data.x, data.y, data.z, data.blockId);
        } else if (data.action === 'remove') {
          this.world.removeBlock(data.x, data.y, data.z);
        }
        break;
    }
  }

  /**
   * Apply hosted world visuals to joining client
   */
  applyHostTheme(hostName) {
    const title = document.querySelector('#instructions h1');
    const renderer = this.scene.parent || window.renderer; // Get renderer reference

    if (hostName === 'manon') {
      document.body.style.background = '#ffccd5';
      if (title) {
        title.innerText = 'MANONCRAFT CO-OP';
        title.style.color = '#ff4d94';
        title.style.textShadow = '3px 3px 0px #800040';
      }
    } else {
      document.body.style.background = '#8be3db';
      if (title) {
        title.innerText = 'MARGOTCRAFT CO-OP';
        title.style.color = '#00cccc';
        title.style.textShadow = '3px 3px 0px #004d40';
      }
    }
  }

  /**
   * Gracefully handle disconnections
   */
  disconnect() {
    this.isConnected = false;
    const statusEl = document.getElementById('multiplayer-status');
    statusEl.innerHTML = `<span style="color:#ff4d4d;">Co-op Connection Lost!</span>`;
    
    // Remove remote avatar from scene
    if (this.remoteAvatar) {
      this.scene.remove(this.remoteAvatar);
      this.remoteAvatar = null;
    }

    setTimeout(() => {
      statusEl.classList.add('hidden');
      if (this.peer) {
        this.peer.destroy();
      }
      // Unlock pointer and show portal
      this.player.controls.unlock();
      const portal = document.getElementById('launcher-portal');
      if (portal) portal.classList.remove('hidden');
    }, 2000);
  }

  /**
   * Send local player position and rotation to sister
   */
  sendPlayerPosition() {
    if (!this.isConnected || !this.conn || !this.conn.open) return;

    const now = performance.now();
    if (now - this.lastUpdateSent > this.updateInterval) {
      this.conn.send({
        type: 'playerMove',
        position: {
          x: this.player.position.x,
          y: this.player.position.y,
          z: this.player.position.z
        },
        rotation: this.player.camera.rotation.y
      });
      this.lastUpdateSent = now;
    }
  }

  /**
   * Broadcast block change events to sister
   */
  sendBlockChange(action, x, y, z, blockId = 0) {
    if (!this.isConnected || !this.conn || !this.conn.open) return;

    this.conn.send({
      type: 'blockChange',
      action,
      x,
      y,
      z,
      blockId
    });
  }

  /**
   * Build a custom-textured pixel-art 3D player avatar for the sister
   */
  spawnRemoteAvatar(sisterName) {
    if (this.remoteAvatar) {
      this.scene.remove(this.remoteAvatar);
    }

    console.log(`Spawning 3D avatar for: ${sisterName}`);
    this.remoteAvatar = new THREE.Group();

    // Color definitions
    const hairColor = sisterName === 'manon' ? '#5c3a21' : '#fce181'; // Brown vs Blonde
    const shirtColor = sisterName === 'manon' ? '#ff66b2' : '#00cccc'; // Pink vs Teal
    const skinColor = '#ffdbac';
    const pantsColor = '#3a4e93';
    const shoeColor = '#241a0f';

    // Helper to create pixelated canvas texture
    const createPixelMaterial = (colorHex, faceType = '') => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = colorHex;
      ctx.fillRect(0, 0, 32, 32);

      if (faceType === 'front') {
        // Draw pixelated face
        // 1. Two blue/brown eyes
        ctx.fillStyle = '#1e3c72';
        ctx.fillRect(8, 12, 4, 4);
        ctx.fillRect(20, 12, 4, 4);
        // 2. Rosy cheeks
        ctx.fillStyle = '#ff99aa';
        ctx.fillRect(4, 18, 4, 3);
        ctx.fillRect(24, 18, 4, 3);
        // 3. Smiley mouth
        ctx.fillStyle = '#d35252';
        ctx.fillRect(12, 22, 8, 3);
      } else if (faceType === 'top') {
        // Add hair outline
        ctx.fillStyle = hairColor;
        ctx.fillRect(0, 0, 32, 32);
      } else if (faceType === 'sides') {
        // Hair wraps on the sides
        ctx.fillStyle = hairColor;
        ctx.fillRect(0, 0, 32, 14);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
    };

    // 1. HEAD construction
    // Standard materials order: +X, -X, +Y, -Y, +Z, -Z
    const headMaterials = [
      createPixelMaterial(skinColor, 'sides'), // Right
      createPixelMaterial(skinColor, 'sides'), // Left
      createPixelMaterial(hairColor, 'top'),   // Top
      createPixelMaterial(skinColor),          // Bottom
      createPixelMaterial(skinColor, 'front'), // Front Face
      createPixelMaterial(hairColor)           // Back
    ];
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), headMaterials);
    this.head.position.y = 0.64;
    this.head.castShadow = true;
    this.remoteAvatar.add(this.head);

    // 2. BODY construction
    const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.24), bodyMat);
    body.position.y = 0.06;
    body.castShadow = true;
    body.receiveShadow = true;
    this.remoteAvatar.add(body);

    // 3. ARMS construction
    const armGeo = new THREE.BoxGeometry(0.14, 0.72, 0.14);
    const armMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
    
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.33, 0.06, 0);
    this.leftArm.castShadow = true;
    this.remoteAvatar.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.33, 0.06, 0);
    this.rightArm.castShadow = true;
    this.remoteAvatar.add(this.rightArm);

    // 4. LEGS construction
    const legGeo = new THREE.BoxGeometry(0.18, 0.72, 0.18);
    const legMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
    
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.11, -0.66, 0);
    this.leftLeg.castShadow = true;
    this.remoteAvatar.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.11, -0.66, 0);
    this.rightLeg.castShadow = true;
    this.remoteAvatar.add(this.rightLeg);

    // 5. NAME TAG creation
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 160;
    tagCanvas.height = 40;
    const tagCtx = tagCanvas.getContext('2d');
    
    // Transparent pill background
    tagCtx.fillStyle = 'rgba(16, 24, 40, 0.75)';
    tagCtx.beginPath();
    tagCtx.roundRect(4, 4, 152, 32, 12);
    tagCtx.fill();

    // Border
    tagCtx.lineWidth = 2;
    tagCtx.strokeStyle = shirtColor;
    tagCtx.stroke();

    // White retro text
    tagCtx.fillStyle = '#ffffff';
    tagCtx.font = 'bold 16px Courier New, sans-serif';
    tagCtx.textAlign = 'center';
    tagCtx.textBaseline = 'middle';
    tagCtx.fillText(sisterName.toUpperCase(), 80, 20);

    const tagTex = new THREE.CanvasTexture(tagCanvas);
    tagTex.magFilter = THREE.NearestFilter;
    const tagMat = new THREE.SpriteMaterial({ map: tagTex, transparent: true });
    
    const nameTag = new THREE.Sprite(tagMat);
    nameTag.position.set(0, 1.1, 0); // Hover above avatar head
    nameTag.scale.set(1.4, 0.35, 1);
    this.remoteAvatar.add(nameTag);

    // Setup initial coordinates
    this.remoteAvatar.position.set(32, 32, 32);
    this.remotePosition.set(32, 32, 32);
    this.remoteTargetPosition.set(32, 32, 32);

    this.scene.add(this.remoteAvatar);
  }

  /**
   * Sync and animate remote player states in the render loop
   */
  update(dt) {
    if (!this.isConnected || !this.remoteAvatar) return;

    // Smoothly interpolate positions (linear interpolation)
    this.remotePosition.lerp(this.remoteTargetPosition, 0.15);
    this.remoteAvatar.position.copy(this.remotePosition);

    // Smoothly interpolate heading angle
    this.remoteRotationY += (this.remoteTargetRotationY - this.remoteRotationY) * 0.15;
    this.remoteAvatar.rotation.y = this.remoteRotationY;

    // Detect movement to trigger the cute limb walk animation
    const velocity = this.remotePosition.distanceTo(this.lastRemotePosition) / (dt || 0.016);
    this.isMoving = velocity > 0.05;

    if (this.isMoving) {
      // Swing limbs back and forth using a sine wave based on time
      const speedFactor = 15;
      const angle = 0.6 * Math.sin(performance.now() * 0.01 * speedFactor);
      
      this.leftLeg.rotation.x = angle;
      this.rightLeg.rotation.x = -angle;
      this.leftArm.rotation.x = -angle;
      this.rightArm.rotation.x = angle;
    } else {
      // Lerp limbs smoothly back to standard resting positions when idle
      const restSpeed = 0.15;
      this.leftLeg.rotation.x += (0 - this.leftLeg.rotation.x) * restSpeed;
      this.rightLeg.rotation.x += (0 - this.rightLeg.rotation.x) * restSpeed;
      this.leftArm.rotation.x += (0 - this.leftArm.rotation.x) * restSpeed;
      this.rightArm.rotation.x += (0 - this.rightArm.rotation.x) * restSpeed;
    }

    this.lastRemotePosition.copy(this.remotePosition);
  }
}
