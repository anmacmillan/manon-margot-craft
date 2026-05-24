import * as THREE from 'three';
import { buildAvatar } from './avatar.js';

// Default Customization Settings
const defaultSkins = {
  manon: {
    hairColor: '#d3a4ff', // Lavender/purple
    shirtColor: '#121212', // Goth velvet black
    skinColor: '#f5f5f7',  // Porcelain pale
    pantsColor: '#222222', // Charcoal
    shoeColor: '#000000',
    accessory: 'wings',    // Bat wings
    eyes: 'gothic',        // Goth dark shadow makeup
    hairStyle: 'long',
    outfit: 'default'
  },
  margot: {
    hairColor: '#ff80b3', // Strawberry pink
    shirtColor: '#ff3385', // Princess pink
    skinColor: '#ffe6ea',  // Rosy blush skin
    pantsColor: '#ff99c8', // Light pink skirt
    shoeColor: '#ffd700',  // Golden shoes
    accessory: 'crown',    // Princess crown
    eyes: 'princess',      // Sweet blue princess eyes
    hairStyle: 'long',
    outfit: 'princess-gown'
  }
};

// One-click themed presets — bundle full setting objects
const themedPresets = [
  {
    id: 'wednesday', label: '🖤 Wednesday', tooltip: 'Wednesday Addams',
    settings: {
      hairColor: '#0a0a0a', shirtColor: '#0a0a0a', skinColor: '#f5f5f7',
      pantsColor: '#000000', shoeColor: '#000000',
      accessory: 'none', eyes: 'gothic', hairStyle: 'braids', outfit: 'wednesday-dress'
    }
  },
  {
    id: 'eleven', label: '🧪 Eleven', tooltip: 'Stranger Things — Eleven',
    settings: {
      hairColor: '#5c3a21', shirtColor: '#ffb3c8', skinColor: '#ffe0cc',
      pantsColor: '#ffb3c8', shoeColor: '#ffffff',
      accessory: 'none', eyes: 'standard', hairStyle: 'short', outfit: 'eleven-pink'
    }
  },
  {
    id: 'sally', label: '🧵 Sally', tooltip: 'Nightmare Before Christmas — Sally',
    settings: {
      hairColor: '#b8001f', shirtColor: '#5a8c4a', skinColor: '#c5d8e8',
      pantsColor: '#3a4f8a', shoeColor: '#1a1a1a',
      accessory: 'none', eyes: 'gothic', hairStyle: 'sally', outfit: 'sally-patchwork'
    }
  },
  {
    id: 'jack', label: '💀 Jack', tooltip: 'Nightmare Before Christmas — Jack Skellington',
    settings: {
      hairColor: '#000000', shirtColor: '#0a0a0a', skinColor: '#fafafa',
      pantsColor: '#0a0a0a', shoeColor: '#000000',
      accessory: 'none', eyes: 'gothic', hairStyle: 'default', outfit: 'jack-pinstripe'
    }
  },
  {
    id: 'elsa', label: '❄️ Elsa', tooltip: 'Frozen — Elsa, Snow Queen',
    settings: {
      hairColor: '#f5e6b3', shirtColor: '#a8d8e8', skinColor: '#fff0e6',
      pantsColor: '#c0dfe8', shoeColor: '#e0f0f8',
      accessory: 'fairy-wings', eyes: 'princess', hairStyle: 'fringe-long', outfit: 'princess-gown'
    }
  },
  {
    id: 'anna', label: '🌹 Anna', tooltip: 'Frozen — Anna of Arendelle',
    settings: {
      hairColor: '#cc4a1a', shirtColor: '#3d5a3d', skinColor: '#ffdfb8',
      pantsColor: '#7a2a4a', shoeColor: '#3a1a1a',
      accessory: 'none', eyes: 'princess', hairStyle: 'braids', outfit: 'princess-gown'
    }
  },
  {
    id: 'gothic-princess', label: '🦇 Goth Princess', tooltip: 'Bat wings + gothic gown',
    settings: {
      hairColor: '#1a0d2e', shirtColor: '#121212', skinColor: '#f5f5f7',
      pantsColor: '#222222', shoeColor: '#000000',
      accessory: 'wings', eyes: 'gothic', hairStyle: 'long', outfit: 'default'
    }
  },
  {
    id: 'pink-princess', label: '👑 Princess', tooltip: 'Pink crown princess',
    settings: {
      hairColor: '#ff80b3', shirtColor: '#ff3385', skinColor: '#ffe6ea',
      pantsColor: '#ff99c8', shoeColor: '#ffd700',
      accessory: 'crown', eyes: 'princess', hairStyle: 'long', outfit: 'princess-gown'
    }
  },
  {
    id: 'mermaid-queen', label: '🧜‍♀️ Mermaid', tooltip: 'Sparkling sea queen',
    settings: {
      hairColor: '#40e0d0', shirtColor: '#008080', skinColor: '#ffe0cc',
      pantsColor: '#20b2aa', shoeColor: '#ffa500',
      accessory: 'starfish', eyes: 'mermaid', hairStyle: 'long', outfit: 'mermaid-tail'
    }
  },
  {
    id: 'galaxy-mage', label: '🌌 Galaxy', tooltip: 'Cosmic wizard',
    settings: {
      hairColor: '#d3a4ff', shirtColor: '#1d0c42', skinColor: '#e3d8f8',
      pantsColor: '#0b0424', shoeColor: '#ffb3ff',
      accessory: 'hat', eyes: 'galaxy', hairStyle: 'long', outfit: 'default'
    }
  },
  {
    id: 'fairy', label: '🧚‍♀️ Fairy', tooltip: 'Translucent wings + petal dress',
    settings: {
      hairColor: '#fce181', shirtColor: '#ff80b3', skinColor: '#ffe6ea',
      pantsColor: '#ffb3c8', shoeColor: '#ffd700',
      accessory: 'fairy-wings', eyes: 'princess', hairStyle: 'ponytail', outfit: 'fairy-dress'
    }
  },
  {
    id: 'witch', label: '🧙‍♀️ Witch', tooltip: 'Witch robes + hat',
    settings: {
      hairColor: '#1a0d2e', shirtColor: '#0a0014', skinColor: '#f5f5f7',
      pantsColor: '#0a0014', shoeColor: '#000000',
      accessory: 'hat', eyes: 'gothic', hairStyle: 'long', outfit: 'witch-robes'
    }
  },
  {
    id: 'angel', label: '😇 Angel', tooltip: 'White feathered wings',
    settings: {
      hairColor: '#fce181', shirtColor: '#ffffff', skinColor: '#ffe6ea',
      pantsColor: '#f0f0f0', shoeColor: '#ffd700',
      accessory: 'angel-wings', eyes: 'princess', hairStyle: 'long', outfit: 'default'
    }
  },
  {
    id: 'dragon', label: '🐉 Dragon Rider', tooltip: 'Red dragon wings',
    settings: {
      hairColor: '#a8001a', shirtColor: '#400008', skinColor: '#ffe0cc',
      pantsColor: '#1a0000', shoeColor: '#400008',
      accessory: 'dragon-wings', eyes: 'gothic', hairStyle: 'ponytail', outfit: 'default'
    }
  }
];

export class AvatarEditor {
  constructor(playerType, onSaveCallback) {
    this.playerType = playerType;
    this.onSaveCallback = onSaveCallback;
    
    // Load from localStorage or fallback to defaults
    const saved = localStorage.getItem(`minecraft_avatar_${playerType}`);
    let loadedSettings = null;
    if (saved) {
      try {
        loadedSettings = JSON.parse(saved);
      } catch (e) {}
    }
    if (loadedSettings && typeof loadedSettings === 'object') {
      this.settings = { ...defaultSkins[playerType], ...loadedSettings };
    } else {
      this.settings = { ...defaultSkins[playerType] };
    }

    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.avatarData = null;
    this.animationFrameId = null;
    
    this.createUI();
    this.initThree();
  }

  /**
   * Inject Glassmorphic Drawer UI into DOM
   */
  createUI() {
    // Remove existing drawer if it exists
    const existing = document.getElementById('avatar-editor-drawer');
    if (existing) {
      existing.remove();
    }

    const drawer = document.createElement('div');
    drawer.id = 'avatar-editor-drawer';
    drawer.className = 'glass-drawer ' + (this.playerType === 'manon' ? 'manon-theme' : 'margot-theme');

    // Build the visual options panels depending on player
    const isManon = this.playerType === 'manon';
    const accentColor = isManon ? '#ff4d94' : '#00cccc';
    const accentText = isManon ? 'Manon' : 'Margot';
    const defaultAcc = isManon ? 'wings' : 'crown';

    // Curated color swatches
    const hairColors = [
      { name: 'Pink Rose', color: '#ff80b3' },
      { name: 'Goth Black', color: '#1a0d2e' },
      { name: 'Golden Blonde', color: '#fce181' },
      { name: 'Lavender Star', color: '#d3a4ff' },
      { name: 'Seafoam Emerald', color: '#40e0d0' },
      { name: 'Chestnut Brown', color: '#5c3a21' }
    ];

    const fabricColors = [
      { name: 'Goth Black', color: '#121212' },
      { name: 'Hot Pink', color: '#ff3385' },
      { name: 'Sea Teal', color: '#008080' },
      { name: 'Galaxy Indigo', color: '#1d0c42' },
      { name: 'Sky Blue', color: '#00cccc' },
      { name: 'Snow White', color: '#ffffff' }
    ];

    const skinTones = [
      { name: 'Porcelain', color: '#f5f5f7' },
      { name: 'Peach', color: '#ffdbac' },
      { name: 'Rosy Blush', color: '#ffe6ea' },
      { name: 'Sun-kissed', color: '#ffe0cc' }
    ];

    const eyeStyles = [
      { id: 'standard', name: 'Standard' },
      { id: 'gothic', name: '🖤 Gothic' },
      { id: 'princess', name: '👑 Princess' },
      { id: 'galaxy', name: '🌌 Starry' },
      { id: 'mermaid', name: '🧜‍♀️ Ocean' },
      { id: 'wizard', name: '⚡️ Wizard' }
    ];

    const accessories = [
      { id: 'none', name: 'None' },
      { id: 'wings', name: '🦇 Bat Wings' },
      { id: 'fairy-wings', name: '🧚 Fairy Wings' },
      { id: 'angel-wings', name: '😇 Angel Wings' },
      { id: 'dragon-wings', name: '🐉 Dragon Wings' },
      { id: 'crown', name: '👑 Gold Crown' },
      { id: 'hat', name: '🧙‍♀️ Wizard Hat' },
      { id: 'starfish', name: '🌟 Starfish' },
      { id: 'wand', name: '🪄 Glowing Wand' }
    ];

    const hairStyles = [
      { id: 'default', name: 'Default' },
      { id: 'long', name: '💁‍♀️ Long' },
      { id: 'short', name: '✂️ Short' },
      { id: 'ponytail', name: '🎀 Ponytail' },
      { id: 'pigtails', name: '👧 Pigtails' },
      { id: 'braids', name: '🖤 Braids' },
      { id: 'bun', name: '🎯 Bun' },
      { id: 'fringe-long', name: '💇 Long + Fringe' },
      { id: 'fringe-bob', name: '💇‍♀️ Bob + Fringe' },
      { id: 'side-fringe', name: '🌬 Side Fringe' },
      { id: 'sally', name: '🧵 Sally (Long Red)' }
    ];

    const outfits = [
      { id: 'default', name: 'Default' },
      { id: 'princess-gown', name: '👗 Princess Gown' },
      { id: 'mermaid-tail', name: '🧜‍♀️ Mermaid Tail' },
      { id: 'witch-robes', name: '🧙‍♀️ Witch Robes' },
      { id: 'wednesday-dress', name: '🖤 Wednesday Dress' },
      { id: 'eleven-pink', name: '🌸 Pink Frilly' },
      { id: 'fairy-dress', name: '🌷 Fairy Petals' },
      { id: 'sally-patchwork', name: '🧵 Sally Patchwork' },
      { id: 'jack-pinstripe', name: '💀 Jack Pinstripe' }
    ];

    drawer.innerHTML = `
      <div class="drawer-header" style="border-bottom: 3px solid ${accentColor};">
        <span class="drawer-title" style="color: ${accentColor}; text-shadow: 2px 2px 0 #000;">🎨 Edit ${accentText}'s Avatar</span>
        <button class="drawer-close" id="editor-close-btn">&times;</button>
      </div>
      <div class="drawer-content">
        <div class="drawer-left">
          <div class="preview-container">
            <canvas id="editor-preview-canvas"></canvas>
            <div class="preview-pedestal"></div>
          </div>
          <div class="preview-tip">Avatar rotates slowly to show wings/crown!</div>
        </div>
        <div class="drawer-right">
          <!-- One-click Presets -->
          <div class="option-group">
            <h3>⚡ Quick Presets</h3>
            <div class="grid-buttons" id="group-preset">
              ${themedPresets.map(p => `
                <button class="grid-btn preset-btn" data-value="${p.id}" title="${p.tooltip}">${p.label}</button>
              `).join('')}
            </div>
          </div>

          <!-- Skin Tone -->
          <div class="option-group">
            <h3>🌸 Skin Tone</h3>
            <div class="swatch-row" id="group-skin">
              ${skinTones.map(t => `
                <div class="swatch-circle ${this.settings.skinColor === t.color ? 'active' : ''}" 
                     style="background-color: ${t.color};" 
                     data-value="${t.color}" 
                     title="${t.name}"></div>
              `).join('')}
            </div>
          </div>

          <!-- Hair Color -->
          <div class="option-group">
            <h3>💇‍♀️ Hair Color</h3>
            <div class="swatch-row" id="group-hair">
              ${hairColors.map(c => `
                <div class="swatch-circle ${this.settings.hairColor === c.color ? 'active' : ''}"
                     style="background-color: ${c.color};"
                     data-value="${c.color}"
                     title="${c.name}"></div>
              `).join('')}
            </div>
          </div>

          <!-- Hairstyle -->
          <div class="option-group">
            <h3>✂️ Hairstyle</h3>
            <div class="grid-buttons" id="group-hairstyle">
              ${hairStyles.map(h => `
                <button class="grid-btn ${this.settings.hairStyle === h.id ? 'active' : ''}"
                        data-value="${h.id}">${h.name}</button>
              `).join('')}
            </div>
          </div>

          <!-- Outfit / Gown -->
          <div class="option-group">
            <h3>👗 Gown / Outfit</h3>
            <div class="grid-buttons" id="group-outfit">
              ${outfits.map(o => `
                <button class="grid-btn ${this.settings.outfit === o.id ? 'active' : ''}"
                        data-value="${o.id}">${o.name}</button>
              `).join('')}
            </div>
          </div>

          <!-- Outfit / Dress Fabric -->
          <div class="option-group">
            <h3>👗 Gown / Shirt Fabric</h3>
            <div class="swatch-row" id="group-fabric">
              ${fabricColors.map(f => `
                <div class="swatch-circle ${this.settings.shirtColor === f.color ? 'active' : ''}" 
                     style="background-color: ${f.color};" 
                     data-value="${f.color}" 
                     title="${f.name}"></div>
              `).join('')}
            </div>
          </div>

          <!-- Eyes & Face Makeup -->
          <div class="option-group">
            <h3>💄 Eyes & Face Style</h3>
            <div class="grid-buttons" id="group-eyes">
              ${eyeStyles.map(e => `
                <button class="grid-btn ${this.settings.eyes === e.id ? 'active' : ''}" 
                        data-value="${e.id}">${e.name}</button>
              `).join('')}
            </div>
          </div>

          <!-- Accessories -->
          <div class="option-group">
            <h3>✨ 3D Attachment / Accessory</h3>
            <div class="grid-buttons" id="group-accessory">
              ${accessories.map(a => `
                <button class="grid-btn ${this.settings.accessory === a.id ? 'active' : ''}" 
                        data-value="${a.id}">${a.name}</button>
              `).join('')}
            </div>
          </div>

          <button class="pixel-btn" id="editor-save-btn" style="background-color: ${accentColor}; margin-top: 25px; border-color: #fff;">
            ✨ Save Outfit & Play!
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);

    // Fade in drawer
    setTimeout(() => {
      drawer.classList.add('visible');
    }, 10);

    // Event Bindings for Close/Save
    document.getElementById('editor-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('editor-save-btn')?.addEventListener('click', () => this.save());

    // Swatch row triggers
    this.bindSwatchGroup('group-skin', 'skinColor');
    this.bindSwatchGroup('group-hair', 'hairColor');
    this.bindSwatchGroup('group-fabric', 'shirtColor');
    this.bindGridBtnGroup('group-eyes', 'eyes');
    this.bindGridBtnGroup('group-accessory', 'accessory');
    this.bindGridBtnGroup('group-hairstyle', 'hairStyle');
    this.bindGridBtnGroup('group-outfit', 'outfit');
    this.bindPresetGroup('group-preset');
  }

  /**
   * One-click preset application — overwrites all settings then refreshes selection highlights
   */
  bindPresetGroup(groupId) {
    const container = document.getElementById(groupId);
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.grid-btn');
      if (!btn) return;

      const presetId = btn.getAttribute('data-value');
      const preset = themedPresets.find(p => p.id === presetId);
      if (!preset) return;

      // Apply full preset settings bundle
      Object.assign(this.settings, preset.settings);

      // Refresh active highlights across all swatches and grid buttons
      this.refreshActiveStates();
      this.updatePreviewAvatar();
    });
  }

  /**
   * Refresh visual active-state classes after a preset is applied
   */
  refreshActiveStates() {
    const setActive = (groupId, key, attr = 'data-value') => {
      const container = document.getElementById(groupId);
      if (!container) return;
      container.querySelectorAll('.swatch-circle, .grid-btn').forEach(el => {
        if (el.classList.contains('preset-btn')) return;
        if (el.getAttribute(attr) === this.settings[key]) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    };
    setActive('group-skin', 'skinColor');
    setActive('group-hair', 'hairColor');
    setActive('group-fabric', 'shirtColor');
    setActive('group-eyes', 'eyes');
    setActive('group-accessory', 'accessory');
    setActive('group-hairstyle', 'hairStyle');
    setActive('group-outfit', 'outfit');
  }

  /**
   * Bind color swatches
   */
  bindSwatchGroup(groupId, settingsKey) {
    const row = document.getElementById(groupId);
    if (!row) return;

    row.addEventListener('click', (e) => {
      const swatch = e.target.closest('.swatch-circle');
      if (!swatch) return;

      // Reset actives
      row.querySelectorAll('.swatch-circle').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');

      const colorVal = swatch.getAttribute('data-value');
      this.settings[settingsKey] = colorVal;

      // Handle matching pants for aesthetics
      if (settingsKey === 'shirtColor') {
        // Darken the clothing color slightly for pants
        const colObj = new THREE.Color(colorVal);
        colObj.multiplyScalar(0.7);
        this.settings.pantsColor = '#' + colObj.getHexString();
      }

      this.updatePreviewAvatar();
    });
  }

  /**
   * Bind option grids
   */
  bindGridBtnGroup(groupId, settingsKey) {
    const container = document.getElementById(groupId);
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.grid-btn');
      if (!btn) return;

      container.querySelectorAll('.grid-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const val = btn.getAttribute('data-value');
      this.settings[settingsKey] = val;

      this.updatePreviewAvatar();
    });
  }

  /**
   * Setup miniature Three.js inside customizer drawer with premium high-DPI rendering and dual-point studio lighting
   */
  initThree() {
    const canvas = document.getElementById('editor-preview-canvas');
    if (!canvas) return;

    this.scene = new THREE.Scene();
    // Keep scene background transparent for premium glassmorphism integration
    this.scene.background = null;

    // Camera centered on avatar chest/head
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
    this.camera.position.set(0, 0.2, 2.2);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(220, 220, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Professional multi-source studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambientLight);

    // Warm, golden key light from the front-right to define form and shadows
    const keyLight = new THREE.DirectionalLight(0xffebd2, 0.95);
    keyLight.position.set(1.5, 2.5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 10;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // Dynamic, neon-colored rim light from behind-left to trace the silhouettes of wings/crowns
    const isManon = this.playerType === 'manon';
    const rimColor = isManon ? 0xff3385 : 0x00ffff;
    const rimLight = new THREE.DirectionalLight(rimColor, 1.4);
    rimLight.position.set(-2, 1.2, -3);
    this.scene.add(rimLight);

    // Floor pedestal
    const pedGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.08, 32);
    const pedMat = new THREE.MeshStandardMaterial({ 
      color: isManon ? '#ff3385' : '#00ffff', 
      roughness: 0.2,
      metalness: 0.8,
      emissive: isManon ? '#33001a' : '#003333'
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = -0.7;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Initial avatar placement
    this.updatePreviewAvatar();

    // Start miniature render loop
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.avatarData && this.avatarData.group) {
        // Slowly self-rotate avatar
        this.avatarData.group.rotation.y += 0.015;
        
        // Idle breathing and wings flap
        const time = performance.now();
        if (this.avatarData.wings && this.avatarData.wings.userData) {
          const flapSpeed = 4.5;
          const flapAngle = 0.25 * Math.sin(time * 0.001 * flapSpeed);
          this.avatarData.wings.userData.leftWing.rotation.y = flapAngle - 0.2;
          this.avatarData.wings.userData.rightWing.rotation.y = -flapAngle + 0.2;
        }
        
        if (this.avatarData.crown) {
          this.avatarData.crown.position.y = 0.26 + 0.008 * Math.sin(time * 0.001 * 2);
          this.avatarData.crown.rotation.y = 0.04 * Math.sin(time * 0.001 * 0.8);
        }

        if (this.avatarData.hat) {
          this.avatarData.hat.position.y = 0.24 + 0.01 * Math.sin(time * 0.001 * 2);
          this.avatarData.hat.rotation.z = 0.02 * Math.sin(time * 0.001 * 1);
        }

        if (this.avatarData.starfish) {
          this.avatarData.starfish.rotation.z = -Math.PI / 6 + 0.04 * Math.sin(time * 0.001 * 1.5);
        }
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  /**
   * Redraw the avatar mesh dynamically
   */
  updatePreviewAvatar() {
    if (!this.scene) return;

    // Remove old avatar group
    if (this.avatarData && this.avatarData.group) {
      this.scene.remove(this.avatarData.group);
      
      // Dispose materials/geometries recursively
      this.avatarData.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Build fresh customized avatar!
    this.avatarData = buildAvatar(this.playerType, this.settings);
    
    // Shift slightly so feet stand directly on top of the pedestal
    this.avatarData.group.position.set(0, 0.1, 0);
    this.scene.add(this.avatarData.group);
  }

  /**
   * Save settings and notify parent game state
   */
  save() {
    // Write configuration to local storage
    localStorage.setItem(`minecraft_avatar_${this.playerType}`, JSON.stringify(this.settings));
    console.log(`[Editor] Custom Outfit Saved for ${this.playerType}:`, this.settings);

    // Close instantly when saving to prevent race conditions on game launch
    this.close(true);
    if (this.onSaveCallback) {
      this.onSaveCallback(this.settings);
    }
  }

  /**
   * Dismiss drawer and clean up Three.js preview context
   * @param {boolean} instant - Whether to bypass the 400ms CSS slide transition
   */
  close(instant = false) {
    const drawer = document.getElementById('avatar-editor-drawer');
    if (drawer) {
      if (instant) {
        // Hide instantly so it disappears from view, but DO NOT remove from DOM synchronously.
        // This preserves the browser's trusted user gesture click target context for pointer lock!
        drawer.style.display = 'none';
        setTimeout(() => {
          if (drawer.parentNode) {
            drawer.remove();
          }
        }, 500);
      } else {
        drawer.classList.remove('visible');
        setTimeout(() => {
          if (drawer.parentNode) {
            drawer.remove();
          }
        }, 400); // Wait for slide transition to finish
      }
    }

    // Cancel miniature loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose preview renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
