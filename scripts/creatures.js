/**
 * Creature manager — ambient animals, friendly villagers, and follower iron golems.
 *
 * Each creature is a voxel mesh that wanders or follows the player. Lightweight
 * AI: random walk for animals, structure-bound roaming for villagers, distance-
 * keeping follower for golems.
 *
 * Multiplayer note: creatures are spawned locally per device (not synced over
 * WebRTC) so each girl sees the same world but may see slightly different
 * creature positions. Block edits and avatars stay perfectly in sync.
 */

import * as THREE from 'three';
import { buildAvatar } from './avatar.js';

// ---------------- Mesh builders ----------------

function buildSheep() {
  const g = new THREE.Group();
  g.name = 'sheep';
  const wool = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.95 });
  const skin = new THREE.MeshStandardMaterial({ color: '#f5c8b5', roughness: 0.8 });
  const black = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.4), wool);
  body.position.y = 0.45; g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), skin);
  head.position.set(0.45, 0.55, 0); g.add(head);
  [-0.1, 0.1].forEach((z) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.06), black);
    ear.position.set(0.5, 0.74, z); g.add(ear);
  });
  // 4 legs
  [[-0.25, 0.15], [0.25, 0.15], [-0.25, -0.15], [0.25, -0.15]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), black);
    leg.position.set(x, 0.18, z); g.add(leg);
  });
  return g;
}

function buildPig() {
  const g = new THREE.Group();
  g.name = 'pig';
  const pink = new THREE.MeshStandardMaterial({ color: '#f4a4b0', roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: '#a05a64', roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.42), pink);
  body.position.y = 0.4; g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.36), pink);
  head.position.set(0.45, 0.45, 0); g.add(head);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.18), dark);
  snout.position.set(0.62, 0.4, 0); g.add(snout);
  [[-0.22, 0.15], [0.22, 0.15], [-0.22, -0.15], [0.22, -0.15]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), dark);
    leg.position.set(x, 0.15, z); g.add(leg);
  });
  return g;
}

function buildChicken() {
  const g = new THREE.Group();
  g.name = 'chicken';
  const white = new THREE.MeshStandardMaterial({ color: '#fafafa', roughness: 0.9 });
  const orange = new THREE.MeshStandardMaterial({ color: '#ff9930', roughness: 0.6 });
  const red = new THREE.MeshStandardMaterial({ color: '#cc1f1f', roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.28), white);
  body.position.y = 0.35; g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), white);
  head.position.set(0.05, 0.6, 0); g.add(head);
  const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.06), red);
  wattle.position.set(0.1, 0.52, 0); g.add(wattle);
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.08), orange);
  beak.position.set(0.18, 0.6, 0); g.add(beak);
  [[-0.06, 0.06], [-0.06, -0.06]].forEach(([z1, z2], i) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.05), orange);
    leg.position.set(-0.05, 0.1, i === 0 ? 0.06 : -0.06); g.add(leg);
  });
  return g;
}

function buildIronGolem() {
  const g = new THREE.Group();
  g.name = 'golem';
  const iron = new THREE.MeshStandardMaterial({ color: '#cfcfcf', roughness: 0.5, metalness: 0.6 });
  const ivy = new THREE.MeshStandardMaterial({ color: '#4a7a3a', roughness: 0.9 });
  const eye = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4 });
  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.4), iron);
  head.position.set(0, 1.55, 0); g.add(head);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eye);
  eyeL.position.set(-0.12, 1.6, 0.21); g.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eye);
  eyeR.position.set(0.12, 1.6, 0.21); g.add(eyeR);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.06), iron);
  nose.position.set(0, 1.5, 0.22); g.add(nose);
  // Body
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.55), iron);
  torso.position.set(0, 0.9, 0); g.add(torso);
  const ivyPatch = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.02), ivy);
  ivyPatch.position.set(-0.15, 0.9, 0.28); g.add(ivyPatch);
  // Arms (long)
  const armGeo = new THREE.BoxGeometry(0.28, 1.3, 0.3);
  const lArm = new THREE.Mesh(armGeo, iron);
  lArm.position.set(-0.6, 0.8, 0); g.add(lArm);
  const rArm = new THREE.Mesh(armGeo, iron);
  rArm.position.set(0.6, 0.8, 0); g.add(rArm);
  // Legs (short, stubby)
  const legGeo = new THREE.BoxGeometry(0.3, 0.5, 0.32);
  const lLeg = new THREE.Mesh(legGeo, iron);
  lLeg.position.set(-0.2, 0.25, 0); g.add(lLeg);
  const rLeg = new THREE.Mesh(legGeo, iron);
  rLeg.position.set(0.2, 0.25, 0); g.add(rLeg);
  g.userData.parts = { head, lArm, rArm, lLeg, rLeg };
  return g;
}

function buildVillager(theme) {
  // Reuse the avatar builder with theme-appropriate colours
  const themes = {
    monk:     { hairColor: '#3a2a1a', shirtColor: '#5a3a1a', skinColor: '#e8c8a0', pantsColor: '#3a2a1a', shoeColor: '#1a0a00', accessory: 'none', eyes: 'standard', hairStyle: 'short', outfit: 'witch-robes' },
    princess: { hairColor: '#fce181', shirtColor: '#ff80b3', skinColor: '#ffe6ea', pantsColor: '#ffb3c8', shoeColor: '#ffd700', accessory: 'crown', eyes: 'princess', hairStyle: 'long', outfit: 'princess-gown' },
    galaxy:   { hairColor: '#d3a4ff', shirtColor: '#1d0c42', skinColor: '#e3d8f8', pantsColor: '#0b0424', shoeColor: '#ffb3ff', accessory: 'hat', eyes: 'galaxy', hairStyle: 'long', outfit: 'default' },
    merchant: { hairColor: '#5c3a21', shirtColor: '#a06030', skinColor: '#e8c8a0', pantsColor: '#3a2a1a', shoeColor: '#1a0a00', accessory: 'none', eyes: 'standard', hairStyle: 'short', outfit: 'default' },
    fairy:    { hairColor: '#fce181', shirtColor: '#ff80b3', skinColor: '#ffe6ea', pantsColor: '#ffb3c8', shoeColor: '#ffd700', accessory: 'fairy-wings', eyes: 'princess', hairStyle: 'ponytail', outfit: 'fairy-dress' }
  };
  const settings = themes[theme] || themes.merchant;
  // buildAvatar returns { group, ... } — use the group
  const built = buildAvatar('manon', settings);
  built.group.name = 'villager-' + theme;
  return { group: built.group, parts: built };
}

// ---------------- Manager ----------------

export class CreatureManager {
  constructor(scene, world, player) {
    this.scene = scene;
    this.world = world;
    this.player = player;

    this.group = new THREE.Group();
    this.group.name = 'creatures';
    scene.add(this.group);

    // Each creature: { type, mesh, target, lastDecisionTime, wanderRadius, anchor }
    this.creatures = [];

    this.lastUpdate = 0;
    this._groundCache = new Map();
    this._tickAccumulator = 0;
  }

  /**
   * Find a grassy / sand-y Y at world (x,z) by scanning down from the build height.
   * Cached per integer grid cell to avoid per-frame raycast storms (this was crashing
   * iPad Safari with 24+ creatures).
   */
  groundY(x, z) {
    const key = `${Math.round(x)}|${Math.round(z)}`;
    if (this._groundCache.has(key)) return this._groundCache.get(key);
    for (let y = 40; y > 0; y--) {
      const b = this.world.getBlock(Math.round(x), y, Math.round(z));
      if (b && b.id && b.id !== 0) {
        const ground = y + 1;
        this._groundCache.set(key, ground);
        return ground;
      }
    }
    this._groundCache.set(key, null);
    return null;
  }

  /** Invalidate cached ground heights when blocks change (called from world block events) */
  invalidateGroundCache() {
    this._groundCache.clear();
  }

  /**
   * Initial population: scatter ambient animals and spawn one golem per player.
   * Counts kept small for iPad Safari memory budget (~256MB on older iPads).
   */
  populateInitial() {
    const isIpadLike =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Heavy desktop default vs lean iPad budget (Manon's iPad is older — keep it tight)
    const counts = isIpadLike
      ? { sheep: 2, pig: 1, chicken: 2 }
      : { sheep: 8, pig: 6, chicken: 10 };

    const scatter = (n, builder, type) => {
      for (let i = 0; i < n; i++) {
        const x = -40 + Math.random() * 80;
        const z = -40 + Math.random() * 80;
        const y = this.groundY(x, z);
        if (y === null) continue;
        this.spawnCreature(type, builder(), new THREE.Vector3(x, y, z), { wanderRadius: 12 });
      }
    };
    scatter(counts.sheep, buildSheep, 'sheep');
    scatter(counts.pig, buildPig, 'pig');
    scatter(counts.chicken, buildChicken, 'chicken');

    // One follower golem (skip on iPad — heavy 9-mesh model close to camera)
    if (!isIpadLike) {
      const px = this.player.position.x;
      const pz = this.player.position.z;
      const gy = this.groundY(px, pz) ?? 32;
      this.spawnCreature('golem', buildIronGolem(), new THREE.Vector3(px + 3, gy, pz + 3), { follower: true });
    }
  }

  /**
   * Spawn villagers around a structure that was just built.
   */
  spawnVillagersAt(structureType, x, y, z) {
    const themeByStructure = {
      'gothic-castle':     ['princess', 'merchant'],
      'crystal-palace':    ['princess', 'princess', 'fairy'],
      'cosmic-galaxy':     ['galaxy', 'galaxy'],
      'gothic-cathedral':  ['monk', 'monk', 'monk'],
      'pegasus-stables':   ['fairy', 'princess'],
      'rainbow-bridge':    ['fairy', 'fairy'],
      'greek-temple':      ['monk', 'merchant', 'princess']
    };
    const themes = themeByStructure[structureType] || ['merchant'];
    themes.forEach((theme, i) => {
      const ang = (i / themes.length) * Math.PI * 2;
      const sx = x + Math.cos(ang) * 3;
      const sz = z + Math.sin(ang) * 3;
      const sy = this.groundY(sx, sz) ?? y + 1;
      const v = buildVillager(theme);
      this.spawnCreature('villager-' + theme, v.group, new THREE.Vector3(sx, sy, sz),
        { wanderRadius: 5, anchor: new THREE.Vector3(x, sy, z), villagerParts: v.parts });
    });
  }

  spawnCreature(type, mesh, position, opts = {}) {
    mesh.position.copy(position);
    this.group.add(mesh);
    this.creatures.push({
      type,
      mesh,
      target: position.clone(),
      lastDecisionTime: performance.now() + Math.random() * 3000,
      wanderRadius: opts.wanderRadius ?? 8,
      anchor: opts.anchor || position.clone(),
      follower: opts.follower || false,
      villagerParts: opts.villagerParts || null,
      lastPos: position.clone()
    });
  }

  /**
   * Per-frame update — simple AI: wander or follow.
   * Throttled to ~15 Hz to keep iPad CPU + GC pressure low.
   */
  update(dt) {
    this._tickAccumulator += dt;
    if (this._tickAccumulator < 0.066) return; // 15 Hz
    const stepDt = this._tickAccumulator;
    this._tickAccumulator = 0;

    const now = performance.now();
    for (const c of this.creatures) {
      if (c.follower) {
        // Follow player at a respectful distance
        const ppos = this.player.position;
        const dx = ppos.x - c.mesh.position.x;
        const dz = ppos.z - c.mesh.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 5) {
          const step = 1.5 * stepDt;
          c.mesh.position.x += (dx / dist) * step;
          c.mesh.position.z += (dz / dist) * step;
          // Snap to ground
          const gy = this.groundY(c.mesh.position.x, c.mesh.position.z);
          if (gy !== null) c.mesh.position.y += (gy - c.mesh.position.y) * 0.2;
          c.mesh.rotation.y = Math.atan2(dx, dz);
          // Animate golem arms swinging when walking
          if (c.mesh.userData.parts) {
            const t = now * 0.004;
            c.mesh.userData.parts.lArm.rotation.x = 0.3 * Math.sin(t);
            c.mesh.userData.parts.rArm.rotation.x = -0.3 * Math.sin(t);
            c.mesh.userData.parts.lLeg.rotation.x = -0.2 * Math.sin(t);
            c.mesh.userData.parts.rLeg.rotation.x = 0.2 * Math.sin(t);
          }
        }
        continue;
      }

      // Wandering creatures: pick a new target every 3-6 seconds
      if (now - c.lastDecisionTime > 3000 + Math.random() * 3000) {
        const ang = Math.random() * Math.PI * 2;
        const r = Math.random() * c.wanderRadius;
        c.target.set(
          c.anchor.x + Math.cos(ang) * r,
          c.mesh.position.y,
          c.anchor.z + Math.sin(ang) * r
        );
        c.lastDecisionTime = now;
      }

      const dx = c.target.x - c.mesh.position.x;
      const dz = c.target.z - c.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.3) {
        const speed = c.type.startsWith('villager') ? 0.8 : 1.2;
        const step = speed * stepDt;
        c.mesh.position.x += (dx / dist) * step;
        c.mesh.position.z += (dz / dist) * step;
        const gy = this.groundY(c.mesh.position.x, c.mesh.position.z);
        if (gy !== null) c.mesh.position.y += (gy - c.mesh.position.y) * 0.2;
        c.mesh.rotation.y = Math.atan2(dx, dz);

        // Animal bob/wiggle while walking
        if (c.type === 'chicken' || c.type === 'pig' || c.type === 'sheep') {
          c.mesh.position.y += Math.sin(now * 0.01) * 0.005;
        }
        // Villager limb swing
        if (c.villagerParts) {
          const t = now * 0.005;
          if (c.villagerParts.leftLeg) c.villagerParts.leftLeg.rotation.x = 0.5 * Math.sin(t);
          if (c.villagerParts.rightLeg) c.villagerParts.rightLeg.rotation.x = -0.5 * Math.sin(t);
          if (c.villagerParts.leftArm) c.villagerParts.leftArm.rotation.x = -0.4 * Math.sin(t);
          if (c.villagerParts.rightArm) c.villagerParts.rightArm.rotation.x = 0.4 * Math.sin(t);
        }
      }
    }
  }
}
