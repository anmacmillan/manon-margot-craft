import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { DataStore } from './dataStore';

// Polyfill for requestIdleCallback to support Safari and older browsers
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  window.requestIdleCallback = function (cb) {
    const start = performance.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (performance.now() - start))
      });
    }, 1);
  };
  window.cancelIdleCallback = function (id) {
    clearTimeout(id);
  };
}

export class World extends THREE.Group {

  /**
   * Whether or not we want to load the chunks asynchronously
   */
  asyncLoading = true;

  /**
  * The number of chunks to render around the player.
  * When this is set to 0, the chunk the player is on
  * is the only one that is rendered. If it is set to 1,
  * the adjacent chunks are rendered; if set to 2, the
  * chunks adjacent to those are rendered, and so on.
  */
  drawDistance = 3;

  chunkSize = {
    width: 32,
    height: 32
  };

  params = {
    seed: 0,
    terrain: {
      scale: 100,
      magnitude: 8,
      offset: 6,
      waterOffset: 4
    },
    biomes: {
      scale: 500,
      variation: {
        amplitude: 0.2,
        scale: 50
      },
      tundraToTemperate: 0.25,
      temperateToJungle: 0.5,
      jungleToDesert: 0.75
    },
    trees: {
      trunk: {
        minHeight: 4,
        maxHeight: 7
      },
      canopy: {
        minRadius: 3,
        maxRadius: 3,
        density: 0.7 // Vary between 0.0 and 1.0
      },
      frequency: 0.005
    },
    clouds: {
      scale: 30,
      density: 0.3
    }
  };

  dataStore = new DataStore();

  constructor(seed = 0) {
    super();
    this.seed = seed;

    document.addEventListener('keydown', (ev) => {
      switch (ev.code) {
        case 'F1':
          this.save();
          break;
        case 'F2':
          this.load();
          break;
      }
    });
  }

  /**
   * Saves the world data to local storage
   */
  save() {
    // Crucial Safety: visiting clients in multiplayer must not overwrite their own local sandboxes
    if (window.network && window.network.role === 'client') return;

    const playerSuffix = window.playerName || 'default';
    try {
      localStorage.setItem(`minecraft_params_${playerSuffix}`, JSON.stringify(this.params));
      localStorage.setItem(`minecraft_data_${playerSuffix}`, JSON.stringify(this.dataStore.data));
      console.log(`Auto-Saved world state for: ${playerSuffix}`);
    } catch (err) {
      console.warn('LocalStorage save failed (e.g. storage full or private browsing):', err);
    }
  }

  /**
   * Loads the game from disk
   * @returns {boolean} Whether loading succeeded
   */
  load() {
    const playerSuffix = window.playerName || 'default';
    try {
      const savedParams = localStorage.getItem(`minecraft_params_${playerSuffix}`);
      const savedData = localStorage.getItem(`minecraft_data_${playerSuffix}`);
      if (savedParams && savedData) {
        this.params = JSON.parse(savedParams);
        this.dataStore.data = JSON.parse(savedData);
        document.getElementById('status').innerHTML = 'GAME LOADED';
        setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
        this.generate();
        return true;
      }
    } catch (err) {
      console.error('Error loading save game:', err);
      document.getElementById('status').innerHTML = 'LOAD ERROR';
      setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
      return false;
    }
    console.log(`No save game found for player: ${playerSuffix}`);
    return false;
  }

  /**
   * Regenerate the world data model and the meshes
   */
  generate(clearCache = false) {
    if (clearCache) {
      this.dataStore.clear();
    }

    this.disposeChunks();

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        this.generateChunk(x, z);
      }
    }
  }

  /**
   * Updates the visible portions of the world based on the
   * current player position
   * @param {Player} player 
   */
  update(player) {
    // Process block-by-block construction animation
    this.updateBlockQueue();

    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);

    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * Returns an array containing the coordinates of the chunks that 
   * are currently visible to the player
   * @param {Player} player 
   * @returns {{ x: number, z: number}[]}
   */
  getVisibleChunks(player) {
    const visibleChunks = [];

    const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z
    );

    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for (let x = chunkX - this.drawDistance; x <= chunkX + this.drawDistance; x++) {
      for (let z = chunkZ - this.drawDistance; z <= chunkZ + this.drawDistance; z++) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * Returns an array containing the coordinates of the chunks that 
   * are not yet loaded and need to be added to the scene
   * @param {{ x: number, z: number}[]} visibleChunks 
   * @returns {{ x: number, z: number}[]}
   */
  getChunksToAdd(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => (
          chunk.x === x && chunk.z === z
        ));

      return !chunkExists;
    })
  }

  /**
   * Removes current loaded chunks that are no longer visible to the player
   * @param {{ x: number, z: number}[]} visibleChunks 
   */
  removeUnusedChunks(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    const chunksToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      const chunkExists = visibleChunks
        .find((visibleChunk) => (
          visibleChunk.x === x && visibleChunk.z === z
        ));

      return !chunkExists;
    });

    for (const chunk of chunksToRemove) {
      chunk.disposeInstances();
      this.remove(chunk);
      console.log(`Removing chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`);
    }
  }

  /**
   * Generates the chunk at the (x, z) coordinates
   * @param {number} x 
   * @param {number} z
   */
  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
    chunk.position.set(
      x * this.chunkSize.width,
      0,
      z * this.chunkSize.width);
    chunk.userData = { x, z };

    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }

    this.add(chunk);
    console.log(`Adding chunk at X: ${x} Z: ${z}`);
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{id: number, instanceId: number} | null}
   */
  getBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.loaded) {
      return chunk.getBlock(
        coords.block.x,
        coords.block.y,
        coords.block.z
      );
    } else {
      return null;
    }
  }

  /**
   * Returns the coordinates of the block at world (x,y,z)
   *  - `chunk` is the coordinates of the chunk containing the block
   *  - `block` is the coordinates of the block relative to the chunk
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{
   *  chunk: { x: number, z: number},
   *  block: { x: number, y: number, z: number}
   * }}
   */
  worldToChunkCoords(x, y, z) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);

    const chunkCoords = {
      x: Math.floor(rx / this.chunkSize.width),
      z: Math.floor(rz / this.chunkSize.width)
    };

    const blockCoords = {
      x: rx - this.chunkSize.width * chunkCoords.x,
      y: ry,
      z: rz - this.chunkSize.width * chunkCoords.z
    };

    return {
      chunk: chunkCoords,
      block: blockCoords
    }
  }

  /**
   * Returns the WorldChunk object at the specified coordinates
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */
  getChunk(chunkX, chunkZ) {
    return this.children.find((chunk) => (
      chunk.userData.x === chunkX &&
      chunk.userData.z === chunkZ
    ));
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) {
        chunk.disposeInstances();
      }
    });
    this.clear();
  }

  /**
   * Adds a new block at (x,y,z) of type `blockId`
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} blockId 
   */
  addBlock(x, y, z, blockId) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlock(
        coords.block.x,
        coords.block.y,
        coords.block.z,
        blockId
      );

      // Hide neighboring blocks if they are completely obscured
      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);

      // Trigger automatic background save
      this.save();
    }
  }

  /**
   * Removes the block at (x, y, z) and sets it to empty
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  removeBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    // Don't allow removing the first layer of blocks
    if (coords.block.y === 0) return;

    if (chunk) {
      chunk.removeBlock(
        coords.block.x,
        coords.block.y,
        coords.block.z
      );

      // Reveal adjacent neighbors if they are hidden
      this.revealBlock(x - 1, y, z);
      this.revealBlock(x + 1, y, z);
      this.revealBlock(x, y - 1, z);
      this.revealBlock(x, y + 1, z);
      this.revealBlock(x, y, z - 1);
      this.revealBlock(x, y, z + 1);

      // Trigger automatic background save
      this.save();
    }
  }

  /**
   * Reveals the block at (x,y,z) by adding a new mesh instance
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  revealBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlockInstance(
        coords.block.x,
        coords.block.y,
        coords.block.z
      )
    }
  }

  /**
   * Hides the block at (x,y,z) by removing the mesh instance
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  hideBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)) {
      chunk.deleteBlockInstance(
        coords.block.x,
        coords.block.y,
        coords.block.z
      )
    }
  }

  // --- MAGIC STRUCTURE SPAWNER ENGINE ---
  blockQueue = [];

  /**
   * Process procedural building queue step-by-step
   */
  updateBlockQueue() {
    if (this.blockQueue.length === 0) return;

    // Build 25 blocks per frame with retro sound chirps
    const blocksToPlace = Math.min(this.blockQueue.length, 25);
    let chirped = false;

    for (let i = 0; i < blocksToPlace; i++) {
      const b = this.blockQueue.shift();
      if (!b) continue;

      if (b.action === 'add') {
        this.addBlock(b.x, b.y, b.z, b.blockId);
        window.network?.sendBlockChange('add', b.x, b.y, b.z, b.blockId);
      } else if (b.action === 'remove') {
        this.removeBlock(b.x, b.y, b.z);
        window.network?.sendBlockChange('remove', b.x, b.y, b.z);
      }

      // Play a retro NES pop sound on block spawn (throttled to once per frame)
      if (!chirped && i === 0) {
        this.playPopSound();
        chirped = true;
      }
    }
  }

  /**
   * Play simple Web Audio chiptune synth pop on block place
   */
  playPopSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + Math.random() * 200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  }

  /**
   * Procedural structure spawner definitions
   */
  spawnStructure(type, originX, originY, originZ) {
    console.log(`[World] Queuing structure spawner: ${type} at (${originX}, ${originY}, ${originZ})`);
    const tempQueue = [];

    if (type === 'gothic-castle') {
      const radius = 4;
      const height = 10;
      for (let dy = 0; dy <= height; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            const dist = Math.sqrt(dx*dx + dz*dz);
            // Draw circular shell
            if (dist > radius - 0.7 && dist < radius + 0.3) {
              // Entryway gap on front (z = radius)
              if (dy >= 1 && dy <= 3 && dz > 2 && Math.abs(dx) <= 1) {
                continue;
              }
              
              // Top battlements
              if (dy === height) {
                if ((Math.floor(Math.atan2(dz, dx) * 4) % 2) === 0) {
                  tempQueue.push({ action: 'add', x: originX + dx, y: originY + dy, z: originZ + dz, blockId: 4 }); // Coal Ore (Obsidian)
                }
              } else {
                const blockId = (dy % 4 === 0) ? 4 : 3; // Banding pattern
                tempQueue.push({ action: 'add', x: originX + dx, y: originY + dy, z: originZ + dz, blockId: blockId });
              }
            }
          }
        }
      }
      
      // Iron grate portcullis above gate
      tempQueue.push({ action: 'add', x: originX, y: originY + 4, z: originZ + 4, blockId: 5 });
      tempQueue.push({ action: 'add', x: originX - 1, y: originY + 4, z: originZ + 4, blockId: 5 });
      tempQueue.push({ action: 'add', x: originX + 1, y: originY + 4, z: originZ + 4, blockId: 5 });

    } else if (type === 'crystal-palace') {
      const size = 4; // 9x9 pavilion
      const pillarHeight = 6;

      // 1. Foundation Platform
      for (let dx = -size; dx <= size; dx++) {
        for (let dz = -size; dz <= size; dz++) {
          tempQueue.push({ action: 'add', x: originX + dx, y: originY, z: originZ + dz, blockId: 10 }); // Snow (White Marble)
        }
      }

      // 2. Corner Pillars
      const corners = [-size, size];
      for (const cx of corners) {
        for (const cz of corners) {
          for (let dy = 1; dy <= pillarHeight; dy++) {
            tempQueue.push({ action: 'add', x: originX + cx, y: originY + dy, z: originZ + cz, blockId: 8 }); // Sand (Gold)
          }
        }
      }

      // 3. Flat Ceiling & Floating Dome
      for (let dx = -size; dx <= size; dx++) {
        for (let dz = -size; dz <= size; dz++) {
          if (Math.abs(dx) === size || Math.abs(dz) === size) {
            tempQueue.push({ action: 'add', x: originX + dx, y: originY + pillarHeight, z: originZ + dz, blockId: 8 });
          } else {
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist <= 3) {
              const domeY = pillarHeight + Math.floor(4 - dist);
              tempQueue.push({ action: 'add', x: originX + dx, y: originY + domeY, z: originZ + dz, blockId: 7 }); // Leaves (Pink Princess Canopy)
            }
          }
        }
      }

      // 4. Central Fountain
      for (let dy = 1; dy <= 4; dy++) {
        tempQueue.push({ action: 'add', x: originX, y: originY + dy, z: originZ, blockId: 10 });
      }
      tempQueue.push({ action: 'add', x: originX, y: originY + 5, z: originZ, blockId: 9 }); // Cloud spout head
      tempQueue.push({ action: 'add', x: originX + 1, y: originY + 3, z: originZ, blockId: 9 });
      tempQueue.push({ action: 'add', x: originX - 1, y: originY + 3, z: originZ, blockId: 9 });
      tempQueue.push({ action: 'add', x: originX, y: originY + 3, z: originZ + 1, blockId: 9 });
      tempQueue.push({ action: 'add', x: originX, y: originY + 3, z: originZ - 1, blockId: 9 });

    } else if (type === 'cosmic-galaxy') {
      const numParticles = 120;
      for (let i = 0; i < numParticles; i++) {
        const t = (i / numParticles) * Math.PI * 4; // 2 rotations
        const r = (i / numParticles) * 12;          // radius grows to 12
        
        // Arm 1
        const x1 = Math.round(r * Math.cos(t));
        const z1 = Math.round(r * Math.sin(t));
        // Arm 2 (180 deg offset)
        const x2 = Math.round(r * Math.cos(t + Math.PI));
        const z2 = Math.round(r * Math.sin(t + Math.PI));

        // Stellar block cycling: Cloud -> Gold -> Iron -> Obsidian
        const blockId = (i % 4 === 0) ? 9 : (i % 4 === 1) ? 8 : (i % 4 === 2) ? 5 : 4;

        tempQueue.push({ action: 'add', x: originX + x1, y: originY, z: originZ + z1, blockId });
        if (i % 5 === 0) {
          tempQueue.push({ action: 'add', x: originX + x1, y: originY + 1, z: originZ + z1, blockId: 9 });
        }

        tempQueue.push({ action: 'add', x: originX + x2, y: originY, z: originZ + z2, blockId });
        if (i % 5 === 0) {
          tempQueue.push({ action: 'add', x: originX + x2, y: originY + 1, z: originZ + z2, blockId: 9 });
        }
      }

      // Center bright star core
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          tempQueue.push({ action: 'add', x: originX + dx, y: originY, z: originZ + dz, blockId: 9 });
          tempQueue.push({ action: 'add', x: originX + dx, y: originY + 1, z: originZ + dz, blockId: 8 });
        }
      }
    } else if (type === 'gothic-cathedral') {
      //⛪ Gothic Cathedral (Spire + Altar + Nave)
      const width = 6;
      const length = 12;
      const wallHeight = 5;

      // 1. Stone Foundation
      for (let dx = -width; dx <= width; dx++) {
        for (let dz = -length; dz <= length; dz++) {
          tempQueue.push({ action: 'add', x: originX + dx, y: originY, z: originZ + dz, blockId: 3 }); // Stone Floor
        }
      }

      // 2. Pillars and Stained-Glass Walls (Iron Ore/Glass pattern)
      for (let dz = -length; dz <= length; dz++) {
        // Left and Right walls
        for (const dx of [-width, width]) {
          // Columns every 3 blocks
          const isColumn = (dz % 3 === 0);
          for (let dy = 1; dy <= wallHeight; dy++) {
            if (isColumn) {
              tempQueue.push({ action: 'add', x: originX + dx, y: originY + dy, z: originZ + dz, blockId: 4 }); // Coal (Black Pillars)
            } else if (dy === 2 || dy === 3) {
              tempQueue.push({ action: 'add', x: originX + dx, y: originY + dy, z: originZ + dz, blockId: 5 }); // Iron Ore (Glowing Red glass)
            } else {
              tempQueue.push({ action: 'add', x: originX + dx, y: originY + dy, z: originZ + dz, blockId: 3 }); // Stone wall
            }
          }
        }
      }

      // 3. Arched Ceiling (Ribbed Vaults)
      for (let dz = -length; dz <= length; dz++) {
        for (let dx = -width; dx <= width; dx++) {
          const dist = Math.abs(dx);
          const archY = wallHeight + Math.round((width - dist) * 0.6);
          // Only build arch ceiling
          const blockId = (dz % 3 === 0) ? 4 : 3; // Ribbed patterns in vault
          tempQueue.push({ action: 'add', x: originX + dx, y: originY + archY, z: originZ + dz, blockId });
        }
      }

      // 4. Central Tower / Cathedral Spire at the back (z = -length)
      const spireBaseY = wallHeight + width;
      const spireHeight = 12;
      for (let dy = 1; dy <= spireHeight; dy++) {
        const radius = Math.max(1, Math.round(3 - dy * 0.25));
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            const boundary = (Math.abs(dx) === radius || Math.abs(dz) === radius);
            if (boundary) {
              tempQueue.push({ action: 'add', x: originX + dx, y: originY + spireBaseY + dy, z: originZ - length + dz, blockId: 4 }); // Coal Ore Spire shell
            }
          }
        }
      }
      
      // Golden Cross at the top of Spire
      tempQueue.push({ action: 'add', x: originX, y: originY + spireBaseY + spireHeight + 1, z: originZ - length, blockId: 8 }); // Sand (Gold) Cross
      tempQueue.push({ action: 'add', x: originX, y: originY + spireBaseY + spireHeight + 2, z: originZ - length, blockId: 8 });
      tempQueue.push({ action: 'add', x: originX, y: originY + spireBaseY + spireHeight + 3, z: originZ - length, blockId: 8 });
      tempQueue.push({ action: 'add', x: originX - 1, y: originY + spireBaseY + spireHeight + 2, z: originZ - length, blockId: 8 });
      tempQueue.push({ action: 'add', x: originX + 1, y: originY + spireBaseY + spireHeight + 2, z: originZ - length, blockId: 8 });

      // 5. Altar inside (at the back)
      for (let dx = -2; dx <= 2; dx++) {
        tempQueue.push({ action: 'add', x: originX + dx, y: originY + 1, z: originZ - length + 3, blockId: 10 }); // Snow Altar table
      }

    } else if (type === 'pegasus-stables') {
      //🦄 Magical Pegasus Barn & Ponies Stables
      const size = 5; // 11x11 stables
      const height = 4;

      // 1. Gold Dust Floor (Sand)
      for (let dx = -size; dx <= size; dx++) {
        for (let dz = -size; dz <= size; dz++) {
          tempQueue.push({ action: 'add', x: originX + dx, y: originY, z: originZ + dz, blockId: 8 }); // Sand
        }
      }

      // 2. Corner Wood Posts & Stable Walls (Oak wood + Fences)
      for (const cx of [-size, size]) {
        for (const cz of [-size, size]) {
          for (let dy = 1; dy <= height; dy++) {
            tempQueue.push({ action: 'add', x: originX + cx, y: originY + dy, z: originZ + cz, blockId: 6 }); // Tree Log pillars
          }
        }
      }

      // Side stable partitions
      for (let dz = -size + 1; dz <= size - 1; dz++) {
        if (dz !== 0) {
          tempQueue.push({ action: 'add', x: originX - size, y: originY + 1, z: originZ + dz, blockId: 3 }); // stone fence
          tempQueue.push({ action: 'add', x: originX + size, y: originY + 1, z: originZ + dz, blockId: 3 });
        }
      }

      // 3. Cozy Cloud Beds / Fluffy partitions
      for (let dx = -size + 2; dx <= size - 2; dx += 4) {
        for (let dz = -size + 1; dz <= size - 1; dz++) {
          if (Math.abs(dz) === 2) {
            tempQueue.push({ action: 'add', x: originX + dx, y: originY + 1, z: originZ + dz, blockId: 9 }); // Fluffy Cloud block beds
            tempQueue.push({ action: 'add', x: originX + dx, y: originY + 1, z: originZ + dz + 1, blockId: 9 });
          }
        }
      }

      // 4. Grand Canopy Roof (Pink Flowery Leaves)
      for (let dy = 0; dy <= 3; dy++) {
        const roofSize = size - dy;
        for (let dx = -roofSize; dx <= roofSize; dx++) {
          for (let dz = -roofSize; dz <= roofSize; dz++) {
            const isBorder = (Math.abs(dx) === roofSize || Math.abs(dz) === roofSize);
            if (isBorder || dy === 3) {
              tempQueue.push({ action: 'add', x: originX + dx, y: originY + height + dy, z: originZ + dz, blockId: 7 }); // Pink Leaves
            }
          }
        }
      }

    } else if (type === 'rainbow-bridge') {
      //🌈 Parabolic Curved Rainbow Bridge
      const halfLength = 10;
      const width = 3;

      for (let dx = -halfLength; dx <= halfLength; dx++) {
        // Calculate parabolic height: peak is at dx = 0 with height 5
        const archY = Math.max(0, Math.round(6 - (dx * dx) / 18));
        
        // Base cloud footings at the two ends of the bridge
        if (Math.abs(dx) === halfLength) {
          for (let dy = 1; dy <= 2; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              tempQueue.push({ action: 'add', x: originX + dx, y: originY + dy, z: originZ + dz, blockId: 9 }); // Cloud pillars
            }
          }
        }

        // Rainbow Lanes: Left = Leaves (Pink), Middle = Sand (Gold), Right = Iron (Red)
        for (let dz = -1; dz <= 1; dz++) {
          let blockId;
          if (dz === -1) {
            blockId = 7; // Pink Leaves
          } else if (dz === 0) {
            blockId = 8; // Gold Sand
          } else {
            blockId = 5; // Glowing Iron Ore
          }

          tempQueue.push({ action: 'add', x: originX + dx, y: originY + archY, z: originZ + dz, blockId });
          
          // Add sparkling cloud accents underneath the arch center
          if (Math.abs(dx) <= 3 && archY > 0) {
            tempQueue.push({ action: 'add', x: originX + dx, y: originY + archY - 1, z: originZ + dz, blockId: 9 }); // Cloud underlay
          }
        }
      }
    } else if (type === 'greek-temple') {
      // 🏛 Greek Temple (Snow/Quartz marble columns + stepped pediment roof + golden altar)
      const w = 5; // Width radius (11 blocks wide)
      const l = 7; // Length radius (15 blocks long)
      const pillarH = 5; // Column height

      // 1. Double-stepped Stone/Quartz platform
      for (let dx = -w - 1; dx <= w + 1; dx++) {
        for (let dz = -l - 1; dz <= l + 1; dz++) {
          tempQueue.push({ action: 'add', x: originX + dx, y: originY, z: originZ + dz, blockId: 10 }); // Snow (Lower step)
        }
      }
      for (let dx = -w; dx <= w; dx++) {
        for (let dz = -l; dz <= l; dz++) {
          tempQueue.push({ action: 'add', x: originX + dx, y: originY + 1, z: originZ + dz, blockId: 10 }); // Snow (Upper floor)
        }
      }

      // 2. Classical Column Pillars (Pillars placed every 2 blocks along the border)
      // Left and Right borders
      for (const dx of [-w, w]) {
        for (let dz = -l; dz <= l; dz += 2) {
          for (let dy = 2; dy <= 2 + pillarH - 1; dy++) {
            tempQueue.push({ action: 'add', x: originX + dx, y: originY + dy, z: originZ + dz, blockId: 10 }); // Marble Columns
          }
        }
      }
      // Front and Back borders
      for (const dz of [-l, l]) {
        for (let dx = -w + 2; dx <= w - 2; dx += 2) {
          for (let dy = 2; dy <= 2 + pillarH - 1; dy++) {
            tempQueue.push({ action: 'add', x: originX + dx, y: originY + dy, z: originZ + dz, blockId: 10 }); // Marble Columns
          }
        }
      }

      // 3. Flat Architrave / Ceiling Beam
      const ceilY = 2 + pillarH;
      for (let dx = -w; dx <= w; dx++) {
        for (let dz = -l; dz <= l; dz++) {
          if (Math.abs(dx) === w || Math.abs(dz) === l) {
            tempQueue.push({ action: 'add', x: originX + dx, y: originY + ceilY, z: originZ + dz, blockId: 10 }); // Architrave
          }
        }
      }

      // 4. Stepped Pitched Roof (Pediment)
      // dy goes from 0 to 5 blocks higher than the ceiling
      for (let dy = 0; dy <= w; dy++) {
        const span = w - dy;
        for (let dx = -span; dx <= span; dx++) {
          for (let dz = -l; dz <= l; dz++) {
            tempQueue.push({ action: 'add', x: originX + dx, y: originY + ceilY + 1 + dy, z: originZ + dz, blockId: 10 });
          }
        }
      }

      // 5. Golden Statue / Shrine in Center-Back
      tempQueue.push({ action: 'add', x: originX, y: originY + 2, z: originZ - l + 3, blockId: 9 }); // Cloud
      tempQueue.push({ action: 'add', x: originX - 1, y: originY + 2, z: originZ - l + 3, blockId: 10 }); // Side marble
      tempQueue.push({ action: 'add', x: originX + 1, y: originY + 2, z: originZ - l + 3, blockId: 10 }); // Side marble
      tempQueue.push({ action: 'add', x: originX, y: originY + 3, z: originZ - l + 3, blockId: 8 }); // Golden sand block
    }

    // Append to existing building queue
    this.blockQueue.push(...tempQueue);
  }
}