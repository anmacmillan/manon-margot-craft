import * as THREE from 'three';

/**
 * Procedural Pixel-Art Avatar Builder for ManonCraft and MargotCraft
 */
export function buildAvatar(name, skin) {
  const avatarGroup = new THREE.Group();
  avatarGroup.name = `${name}-avatar`;

  // --- 1. CONFIGURING SKIN COLORS & ART ---
  let hairColor = '#5c3a21';
  let shirtColor = '#ff66b2';
  let skinColor = '#ffdbac';
  let pantsColor = '#3a4e93';
  let shoeColor = '#241a0f';
  let accessoryType = 'none';
  let faceStyle = 'standard';
  let hairStyle = 'default';
  let outfitStyle = 'default';

  // Handle stringified JSON skin objects
  let skinObj = skin;
  if (typeof skin === 'string' && skin.trim().startsWith('{')) {
    try {
      skinObj = JSON.parse(skin);
    } catch (e) {
      console.error("Error parsing skin JSON in buildAvatar:", e);
    }
  }

  if (skinObj && typeof skinObj === 'object') {
    // Custom Avatar Settings!
    hairColor = skinObj.hairColor || hairColor;
    shirtColor = skinObj.shirtColor || shirtColor;
    skinColor = skinObj.skinColor || skinColor;
    pantsColor = skinObj.pantsColor || pantsColor;
    shoeColor = skinObj.shoeColor || shoeColor;
    accessoryType = skinObj.accessory || 'none';
    faceStyle = skinObj.eyes || 'standard';
    hairStyle = skinObj.hairStyle || 'default';
    outfitStyle = skinObj.outfit || 'default';
  } else {
    // Presets
    if (name === 'manon') {
      if (skinObj === 'gothic') {
        hairColor = '#1a0d2e';  // Deep black purple
        shirtColor = '#121212';  // Gothic black gown
        skinColor = '#f5f5f7';   // Porcelain pale
        pantsColor = '#222222';  // Dark charcoal
        shoeColor = '#000000';
        accessoryType = 'wings';
        faceStyle = 'gothic';
      } else if (skinObj === 'galaxy') {
        hairColor = '#d3a4ff';  // Celestial lavender-indigo
        shirtColor = '#1d0c42';  // Deep nebula purple
        skinColor = '#e3d8f8';   // Cosmic pale
        pantsColor = '#0b0424';  // Starry abyss dark blue
        shoeColor = '#ffb3ff';   // Starry pink
        accessoryType = 'hat';
        faceStyle = 'galaxy';
      } else {
        // Standard Manon
        hairColor = '#5c3a21';
        shirtColor = '#ff66b2';
        skinColor = '#ffdbac';
        pantsColor = '#3a4e93';
        shoeColor = '#241a0f';
        accessoryType = 'none';
        faceStyle = 'standard';
      }
    } else {
      // Margot
      if (skinObj === 'princess') {
        hairColor = '#ff80b3';  // Strawberry pink
        shirtColor = '#ff3385';  // Vibrant princess pink
        skinColor = '#ffe6ea';   // Rosy blush skin
        pantsColor = '#ff99c8';  // Light pastel pink skirt
        shoeColor = '#ffd700';   // Golden shoes
        accessoryType = 'crown';
        faceStyle = 'princess';
      } else if (skinObj === 'mermaid') {
        hairColor = '#40e0d0';  // Aquamarine sea-foam
        shirtColor = '#008080';  // Sparkling teal mermaid tail/top
        skinColor = '#ffe0cc';   // Sun-kissed fair skin
        pantsColor = '#20b2aa';  // Ocean scales light-teal
        shoeColor = '#ffa500';   // Starfish orange shoes
        accessoryType = 'starfish';
        faceStyle = 'mermaid';
      } else {
        // Standard Margot
        hairColor = '#fce181';  // Blonde
        shirtColor = '#00cccc';  // Teal
        skinColor = '#ffdbac';
        pantsColor = '#3a4e93';
        shoeColor = '#241a0f';
        accessoryType = 'none';
        faceStyle = 'standard';
      }
    }
  }

  // --- 2. PIXELATED CANVAS TEXTURE GENERATOR WITH HSL SHADING NOISE ---
  const createPixelMaterial = (baseColor, options = {}) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Helper to draw shaded noise block of a given hex color
    const fillNoiseBlock = (xStart, yStart, width, height, hexColor) => {
      const blockCol = new THREE.Color(hexColor);
      const blockHsl = { h: 0, s: 0, l: 0 };
      blockCol.getHSL(blockHsl);
      
      for (let x = xStart; x < xStart + width; x += 4) {
        for (let y = yStart; y < yStart + height; y += 4) {
          const lNoise = (Math.random() - 0.5) * 0.12; // +/- 6% Lightness variation
          const finalL = Math.max(0.02, Math.min(0.98, blockHsl.l + lNoise));
          const pixelCol = new THREE.Color().setHSL(blockHsl.h, blockHsl.s, finalL);
          ctx.fillStyle = '#' + pixelCol.getHexString();
          ctx.fillRect(x, y, 4, 4);
        }
      }
    };

    // Draw base shaded noise background
    fillNoiseBlock(0, 0, 32, 32, baseColor);

    const { type, side } = options;

    if (type === 'head') {
      if (side === 'front') {
        // Draw eyes
        if (skinObj === 'gothic' || faceStyle === 'gothic') {
          // Dark purple goth makeup eyes
          ctx.fillStyle = '#4a0e4e';
          ctx.fillRect(6, 10, 8, 8); // eye area shadow left
          ctx.fillRect(18, 10, 8, 8); // eye area shadow right
          ctx.fillStyle = '#1e3c72'; // Iris
          ctx.fillRect(8, 12, 4, 4);
          ctx.fillRect(20, 12, 4, 4);
          ctx.fillStyle = '#ffffff'; // White glare
          ctx.fillRect(8, 12, 2, 2);
          ctx.fillRect(20, 12, 2, 2);

          // Dark goth lipstick
          ctx.fillStyle = '#2d0033';
          ctx.fillRect(12, 22, 8, 3);
          
          // Choker around neck
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 28, 32, 4);
        } else if (skinObj === 'galaxy' || faceStyle === 'galaxy') {
          // Galaxy eyes (neon yellow/gold glowing star eyes)
          ctx.fillStyle = '#ff00ff'; // neon magenta shadow
          ctx.fillRect(6, 11, 8, 6);
          ctx.fillRect(18, 11, 8, 6);
          ctx.fillStyle = '#ffd700'; // glowing gold eyes
          ctx.fillRect(8, 12, 4, 4);
          ctx.fillRect(20, 12, 4, 4);
          ctx.fillStyle = '#ffffff'; // sparkle
          ctx.fillRect(10, 12, 2, 2);
          ctx.fillRect(22, 12, 2, 2);

          // Small magical cute smile
          ctx.fillStyle = '#ff66cc';
          ctx.fillRect(14, 22, 4, 2);
        } else if (skinObj === 'princess' || faceStyle === 'princess') {
          // Sweet anime princess blue eyes
          ctx.fillStyle = '#40e0d0'; // Aqua shadow
          ctx.fillRect(6, 12, 8, 4);
          ctx.fillRect(18, 12, 8, 4);
          ctx.fillStyle = '#0066ff'; // Blue iris
          ctx.fillRect(8, 12, 4, 4);
          ctx.fillRect(20, 12, 4, 4);
          ctx.fillStyle = '#ffffff'; // Sparkle
          ctx.fillRect(8, 12, 2, 2);
          ctx.fillRect(20, 12, 2, 2);

          // Rosy cheeks
          ctx.fillStyle = '#ff99bb';
          ctx.fillRect(4, 18, 4, 3);
          ctx.fillRect(24, 18, 4, 3);

          // Tiny princess smile
          ctx.fillStyle = '#ff3366';
          ctx.fillRect(13, 21, 6, 3);
        } else if (skinObj === 'mermaid' || faceStyle === 'mermaid') {
          // Sea blue green star eyes
          ctx.fillStyle = '#1e5a5a';
          ctx.fillRect(8, 12, 4, 4);
          ctx.fillRect(20, 12, 4, 4);
          ctx.fillStyle = '#00ffcc'; // Sea foam iris
          ctx.fillRect(8, 12, 2, 4);
          ctx.fillRect(20, 12, 2, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(10, 12, 2, 2);
          ctx.fillRect(22, 12, 2, 2);

          // Rosy coral cheeks
          ctx.fillStyle = '#ff7f50';
          ctx.fillRect(4, 18, 4, 3);
          ctx.fillRect(24, 18, 4, 3);

          // Shell pink mouth
          ctx.fillStyle = '#e9967a';
          ctx.fillRect(13, 22, 6, 2);
        } else if (skinObj === 'wizard' || faceStyle === 'wizard') {
          // Wizard Glasses & Red Lightning Bolt Scar
          // 1. Draw Emerald Green eyes
          ctx.fillStyle = '#00aa50'; // emerald green iris
          ctx.fillRect(8, 12, 4, 4);
          ctx.fillRect(20, 12, 4, 4);
          ctx.fillStyle = '#ffffff'; // glare
          ctx.fillRect(8, 12, 2, 2);
          ctx.fillRect(20, 12, 2, 2);

          // 2. Draw black round glasses
          ctx.strokeStyle = '#111111';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(10, 14, 4, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(22, 14, 4, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(14, 14);
          ctx.lineTo(18, 14);
          ctx.stroke();

          // 3. Draw red lightning bolt scar on upper forehead
          ctx.fillStyle = '#ff1111'; // Bright scarlet red lightning
          ctx.fillRect(13, 2, 2, 3);
          ctx.fillRect(11, 4, 3, 2);
          ctx.fillRect(11, 5, 2, 4);

          // 4. Little content smile
          ctx.fillStyle = '#d35252';
          ctx.fillRect(14, 22, 4, 2);
        } else {
          // Standard face
          ctx.fillStyle = '#1e3c72'; // Blue eyes
          ctx.fillRect(8, 12, 4, 4);
          ctx.fillRect(20, 12, 4, 4);
          ctx.fillStyle = '#ff99aa'; // Rosy cheeks
          ctx.fillRect(4, 18, 4, 3);
          ctx.fillRect(24, 18, 4, 3);
          ctx.fillStyle = '#d35252'; // Mouth
          ctx.fillRect(12, 22, 8, 3);
        }
      } else if (side === 'top') {
        // Full hair on top
        fillNoiseBlock(0, 0, 32, 32, hairColor);
      } else if (side === 'sides') {
        // Hair wraps down half way
        fillNoiseBlock(0, 0, 32, 14, hairColor);
        // Long hair strands down the sides
        fillNoiseBlock(0, 14, 8, 18, hairColor);
        fillNoiseBlock(24, 14, 8, 18, hairColor);
      } else if (side === 'back') {
        // Hair covers back entirely
        fillNoiseBlock(0, 0, 32, 32, hairColor);
      }
    } else if (type === 'body') {
      if (side === 'front') {
        if (skinObj === 'gothic' || faceStyle === 'gothic') {
          // Goth corset with silver lace details
          fillNoiseBlock(10, 6, 12, 20, '#333333'); // Silver corset core
          ctx.fillStyle = '#121212';
          // Draw horizontal lace bands
          ctx.fillRect(12, 10, 8, 2);
          ctx.fillRect(12, 16, 8, 2);
          ctx.fillRect(12, 22, 8, 2);
          // Velvet collar
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, 32, 4);
        } else if (skinObj === 'galaxy' || faceStyle === 'galaxy') {
          // Nebula swirls & Golden stars
          fillNoiseBlock(0, 0, 32, 32, '#2a1a5e');
          ctx.fillStyle = '#ffd700'; // Golden stars
          ctx.fillRect(6, 6, 2, 2);
          ctx.fillRect(24, 8, 2, 2);
          ctx.fillRect(14, 20, 2, 2);
          fillNoiseBlock(4, 16, 6, 4, '#ff80ff'); // Neon pink nebula dust
          fillNoiseBlock(20, 22, 8, 4, '#ff80ff');
        } else if (skinObj === 'princess' || faceStyle === 'princess') {
          // Princess corset and gold embroidery medallion
          ctx.strokeStyle = '#ff1a75'; // darker hot pink borders
          ctx.strokeRect(4, 4, 24, 24);
          ctx.fillStyle = '#ffd700'; // Gold center medal
          ctx.fillRect(14, 12, 4, 4);
          fillNoiseBlock(8, 0, 16, 4, '#ffffff'); // White lace neck trim
        } else if (skinObj === 'mermaid' || faceStyle === 'mermaid') {
          // Shell bikini top drawn over skin
          fillNoiseBlock(0, 0, 32, 20, skinColor);
          ctx.fillStyle = '#00ffff'; // Turquoise shells
          ctx.fillRect(6, 8, 8, 6);
          ctx.fillRect(18, 8, 8, 6);
          // Dark teal border
          ctx.fillStyle = '#006666';
          ctx.strokeRect(6, 8, 8, 6);
          ctx.strokeRect(18, 8, 8, 6);
          // Scales bottom
          fillNoiseBlock(0, 20, 32, 12, '#008080');
          ctx.fillStyle = '#20b2aa';
          ctx.fillRect(4, 24, 4, 2);
          ctx.fillRect(14, 24, 4, 2);
          ctx.fillRect(24, 24, 4, 2);
        }
      }
    } else if (type === 'arm') {
      // Arms have shirt sleeve color on top, skin color at bottom 30% (hand/cuff)
      if (side === 'bottom') {
        fillNoiseBlock(0, 0, 32, 32, skinColor);
      } else if (side !== 'top') {
        fillNoiseBlock(0, 22, 32, 10, skinColor);
      }
    } else if (type === 'leg') {
      // Legs have pants color on top, shoe color at bottom 20% (shoes)
      if (side === 'bottom') {
        fillNoiseBlock(0, 0, 32, 32, shoeColor);
      } else if (side !== 'top') {
        fillNoiseBlock(0, 26, 32, 6, shoeColor);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
  };

  // --- 3. BASIC BODY CONSTRUCTION ---
  // A. Head Materials
  const headMaterials = [
    createPixelMaterial(skinColor, { type: 'head', side: 'sides' }), // Right
    createPixelMaterial(skinColor, { type: 'head', side: 'sides' }), // Left
    createPixelMaterial(hairColor, { type: 'head', side: 'top' }),   // Top
    createPixelMaterial(skinColor),                                  // Bottom
    createPixelMaterial(skinColor, { type: 'head', side: 'front' }), // Front Face
    createPixelMaterial(hairColor, { type: 'head', side: 'back' })   // Back
  ];
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), headMaterials);
  headMesh.position.y = 0.64;
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  avatarGroup.add(headMesh);

  // B. Torso Materials
  const bodyMaterials = [
    createPixelMaterial(shirtColor), // Right
    createPixelMaterial(shirtColor), // Left
    createPixelMaterial(shirtColor), // Top
    createPixelMaterial(shirtColor), // Bottom
    createPixelMaterial(shirtColor, { type: 'body', side: 'front' }), // Front Details
    createPixelMaterial(shirtColor)  // Back
  ];
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.24), bodyMaterials);
  bodyMesh.position.y = 0.06;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  avatarGroup.add(bodyMesh);

  // C. Arms
  const armMaterials = [
    createPixelMaterial(shirtColor, { type: 'arm', side: 'side' }),   // Right
    createPixelMaterial(shirtColor, { type: 'arm', side: 'side' }),   // Left
    createPixelMaterial(shirtColor, { type: 'arm', side: 'top' }),    // Top (shoulder)
    createPixelMaterial(skinColor, { type: 'arm', side: 'bottom' }),  // Bottom (hand)
    createPixelMaterial(shirtColor, { type: 'arm', side: 'side' }),   // Front
    createPixelMaterial(shirtColor, { type: 'arm', side: 'side' })    // Back
  ];
  const armGeo = new THREE.BoxGeometry(0.14, 0.72, 0.14);

  const leftArm = new THREE.Mesh(armGeo, armMaterials);
  leftArm.position.set(-0.33, 0.06, 0);
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  avatarGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMaterials);
  rightArm.position.set(0.33, 0.06, 0);
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  avatarGroup.add(rightArm);

  // D. Legs
  const legMaterials = [
    createPixelMaterial(pantsColor, { type: 'leg', side: 'side' }),   // Right
    createPixelMaterial(pantsColor, { type: 'leg', side: 'side' }),   // Left
    createPixelMaterial(pantsColor, { type: 'leg', side: 'top' }),    // Top
    createPixelMaterial(shoeColor, { type: 'leg', side: 'bottom' }),  // Bottom (sole)
    createPixelMaterial(pantsColor, { type: 'leg', side: 'side' }),   // Front
    createPixelMaterial(pantsColor, { type: 'leg', side: 'side' })    // Back
  ];
  const legGeo = new THREE.BoxGeometry(0.18, 0.72, 0.18);

  const leftLeg = new THREE.Mesh(legGeo, legMaterials);
  leftLeg.position.set(-0.11, -0.66, 0);
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  avatarGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, legMaterials);
  rightLeg.position.set(0.11, -0.66, 0);
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  avatarGroup.add(rightLeg);

  // --- 4. EXQUISITE 3D PROGRAMMATIC ACCESSORIES ---
  let wingGroup = null;
  let crownMesh = null;
  let wizardHatGroup = null;
  let starfishMesh = null;
  let wandMesh = null;

  // A. WINGS — multiple style variants (bat / fairy / angel / dragon)
  const wingVariant = (skinObj === 'gothic') ? 'wings' :
                      (['wings', 'fairy-wings', 'angel-wings', 'dragon-wings'].includes(accessoryType) ? accessoryType : null);

  if (wingVariant) {
    const palettes = {
      'wings':         { main: '#090014', rib: '#2d004d', emissive: '#000000', opacity: 1.0 },   // Gothic bat
      'fairy-wings':   { main: '#ffb3ff', rib: '#ff66cc', emissive: '#330033', opacity: 0.55 },  // Translucent pink fairy
      'angel-wings':   { main: '#fafafa', rib: '#e0e0e0', emissive: '#222222', opacity: 1.0 },   // White feathered
      'dragon-wings':  { main: '#a8001a', rib: '#400008', emissive: '#1a0000', opacity: 1.0 }    // Red leathery dragon
    };
    const palette = palettes[wingVariant];

    wingGroup = new THREE.Group();
    wingGroup.name = 'wings';
    wingGroup.userData.variant = wingVariant;
    wingGroup.position.set(0, 0.15, -0.13); // Mount behind body

    // Left Wing
    const leftWing = new THREE.Group();
    leftWing.position.set(-0.1, 0, 0);

    const mainWingMat = new THREE.MeshStandardMaterial({
      color: palette.main, roughness: 0.9, side: THREE.DoubleSide,
      emissive: palette.emissive,
      transparent: palette.opacity < 1, opacity: palette.opacity
    });
    const wingRibMat = new THREE.MeshStandardMaterial({ color: palette.rib, roughness: 0.7 });

    const lPanel1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.03), mainWingMat);
    lPanel1.position.set(-0.175, 0.05, 0);
    lPanel1.rotation.z = Math.PI / 12;
    leftWing.add(lPanel1);

    const lPanel2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.25, 0.02), mainWingMat);
    lPanel2.position.set(-0.35, -0.05, 0);
    lPanel2.rotation.z = -Math.PI / 6;
    leftWing.add(lPanel2);

    const lRib = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.04), wingRibMat);
    lRib.position.set(-0.22, 0.12, 0.01);
    lRib.rotation.z = Math.PI / 12;
    leftWing.add(lRib);

    wingGroup.add(leftWing);

    // Right Wing (Mirror Image)
    const rightWing = new THREE.Group();
    rightWing.position.set(0.1, 0, 0);

    const rPanel1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.03), mainWingMat);
    rPanel1.position.set(0.175, 0.05, 0);
    rPanel1.rotation.z = -Math.PI / 12;
    rightWing.add(rPanel1);

    const rPanel2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.25, 0.02), mainWingMat);
    rPanel2.position.set(0.35, -0.05, 0);
    rPanel2.rotation.z = Math.PI / 6;
    rightWing.add(rPanel2);

    const rRib = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.04), wingRibMat);
    rRib.position.set(0.22, 0.12, 0.01);
    rRib.rotation.z = -Math.PI / 12;
    rightWing.add(rRib);

    wingGroup.add(rightWing);

    // Retain references for animation
    wingGroup.userData = { leftWing, rightWing, variant: wingVariant };
    avatarGroup.add(wingGroup);
  }

  // B. SHINING 3D GOLDEN PRINCESS CROWN (Margot's Special Princess Skin or Custom Accessory)
  if (skinObj === 'princess' || accessoryType === 'crown') {
    crownMesh = new THREE.Group();
    crownMesh.name = 'crown';
    crownMesh.position.set(0, 0.26, 0); // Sits on top of the head

    const goldMat = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      metalness: 0.9,
      roughness: 0.2,
      emissive: '#3d2d00'
    });
    const jewelMat = new THREE.MeshStandardMaterial({
      color: '#ff007f', // Pink diamond
      metalness: 0.3,
      roughness: 0.1,
      emissive: '#4d0020'
    });

    // Gold band base (voxelized ring of box meshes)
    const baseBand = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.36), goldMat);
    crownMesh.add(baseBand);

    // Peak spikes
    const peakGeo = new THREE.ConeGeometry(0.05, 0.1, 4);
    
    const peakFront = new THREE.Mesh(peakGeo, goldMat);
    peakFront.position.set(0, 0.06, 0.15);
    crownMesh.add(peakFront);

    const peakLeft = new THREE.Mesh(peakGeo, goldMat);
    peakLeft.position.set(-0.15, 0.06, 0);
    crownMesh.add(peakLeft);

    const peakRight = new THREE.Mesh(peakGeo, goldMat);
    peakRight.position.set(0.15, 0.06, 0);
    crownMesh.add(peakRight);

    const peakBack = new THREE.Mesh(peakGeo, goldMat);
    peakBack.position.set(0, 0.06, -0.15);
    crownMesh.add(peakBack);

    // Shining gemstones on the peaks
    const jewelGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const jFront = new THREE.Mesh(jewelGeo, jewelMat);
    jFront.position.set(0, 0.12, 0.15);
    crownMesh.add(jFront);

    const jLeft = new THREE.Mesh(jewelGeo, jewelMat);
    jLeft.position.set(-0.15, 0.12, 0);
    crownMesh.add(jLeft);

    const jRight = new THREE.Mesh(jewelGeo, jewelMat);
    jRight.position.set(0.15, 0.12, 0);
    crownMesh.add(jRight);

    const jBack = new THREE.Mesh(jewelGeo, jewelMat);
    jBack.position.set(0, 0.12, -0.15);
    crownMesh.add(jBack);

    headMesh.add(crownMesh); // Child of head so it rotates perfectly together
  }

  // C. POINTED 3D WIZARD HAT (Manon's Special Galaxy Mage Skin or Custom Accessory)
  if (skinObj === 'galaxy' || accessoryType === 'hat') {
    wizardHatGroup = new THREE.Group();
    wizardHatGroup.name = 'wizardHat';
    wizardHatGroup.position.set(0, 0.24, 0); // Sits on top of head

    const indigoHatMat = new THREE.MeshStandardMaterial({
      color: '#18073b',
      roughness: 0.9,
      bumpScale: 0.05
    });
    const goldBandMat = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      metalness: 0.8,
      roughness: 0.2
    });

    // Hat brim
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.55), indigoHatMat);
    wizardHatGroup.add(brim);

    // Hat gold band
    const goldBand = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.38), goldBandMat);
    goldBand.position.y = 0.035;
    wizardHatGroup.add(goldBand);

    // Hat cone (voxelized stacks of decreasing boxes to look retro!)
    const cone1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), indigoHatMat);
    cone1.position.y = 0.11;
    wizardHatGroup.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), indigoHatMat);
    cone2.position.set(-0.02, 0.22, 0); // Slight slant
    wizardHatGroup.add(cone2);

    const cone3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), indigoHatMat);
    cone3.position.set(-0.05, 0.32, 0); // slanting more
    wizardHatGroup.add(cone3);

    // Gold tip star
    const starTip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), goldBandMat);
    starTip.position.set(-0.07, 0.40, 0);
    wizardHatGroup.add(starTip);

    headMesh.add(wizardHatGroup); // Child of head
  }

  // D. ORANGE STARFISH CROWN (Margot's Mermaid Queen Skin or Custom Accessory)
  if (skinObj === 'mermaid' || accessoryType === 'starfish') {
    starfishMesh = new THREE.Group();
    starfishMesh.name = 'starfishCrown';
    starfishMesh.position.set(0.18, 0.14, 0.16); // Placed cute asymmetrically on the front-right of the hair
    starfishMesh.rotation.set(0.2, 0.2, -Math.PI / 6);

    const coralMat = new THREE.MeshStandardMaterial({
      color: '#ff4f1a', // Coral orange
      roughness: 0.9,
      emissive: '#3d0c00'
    });
    const yellowDotMat = new THREE.MeshStandardMaterial({ color: '#ffea00' });

    // Center coral piece
    const center = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.04), coralMat);
    starfishMesh.add(center);

    // 5 Starfish arm prongs
    const armGeo = new THREE.BoxGeometry(0.06, 0.14, 0.03);

    const arm1 = new THREE.Mesh(armGeo, coralMat);
    arm1.position.set(0, 0.08, 0);
    starfishMesh.add(arm1);

    const arm2 = new THREE.Mesh(armGeo, coralMat);
    arm2.position.set(-0.07, -0.04, 0);
    arm2.rotation.z = Math.PI / 2.5;
    starfishMesh.add(arm2);

    const arm3 = new THREE.Mesh(armGeo, coralMat);
    arm3.position.set(0.07, -0.04, 0);
    arm3.rotation.z = -Math.PI / 2.5;
    starfishMesh.add(arm3);

    const arm4 = new THREE.Mesh(armGeo, coralMat);
    arm4.position.set(-0.05, 0.06, 0);
    arm4.rotation.z = -Math.PI / 4;
    starfishMesh.add(arm4);

    const arm5 = new THREE.Mesh(armGeo, coralMat);
    arm5.position.set(0.05, 0.06, 0);
    arm5.rotation.z = Math.PI / 4;
    starfishMesh.add(arm5);

    // Little central decorative yellow dot
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.05), yellowDotMat);
    dot.position.z = 0.01;
    starfishMesh.add(dot);

    headMesh.add(starfishMesh); // Child of head
  }

  // E. GLOWING MAGIC WAND (Harry Potter Theme or Custom Accessory)
  if (skinObj === 'wizard' || accessoryType === 'wand') {
    wandMesh = new THREE.Group();
    wandMesh.name = 'magicWand';
    
    // Position extending from bottom of right arm
    wandMesh.position.set(0, -0.32, 0.1);
    // Angle forward
    wandMesh.rotation.set(Math.PI / 3, 0, 0);

    const woodMat = new THREE.MeshStandardMaterial({
      color: '#4e2f1d', // Mahogany brown
      roughness: 0.9
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: '#ffea00' // Glowing golden light tip
    });

    // Wand shaft
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), woodMat);
    shaft.position.y = 0.1;
    wandMesh.add(shaft);

    // Glowing tip
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), glowMat);
    tip.position.y = 0.28;
    wandMesh.add(tip);

    // Decorative magical tip spark
    const star = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.02), glowMat);
    star.position.set(0, 0.31, 0);
    wandMesh.add(star);

    // Tip glow light sources
    const tipLight = new THREE.PointLight(0xffea00, 0.6, 2);
    tipLight.position.set(0, 0.3, 0);
    wandMesh.add(tipLight);

    rightArm.add(wandMesh); // Child of right arm
  }

  // F. HAIRSTYLE — extra hair mesh attached to head so it rotates with the head
  let hairGroup = null;
  if (hairStyle && hairStyle !== 'default') {
    hairGroup = new THREE.Group();
    hairGroup.name = 'hairStyle';
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });

    if (hairStyle === 'long') {
      // Long curtain of hair down the back + sides
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.08), hairMat);
      back.position.set(0, -0.18, -0.22);
      hairGroup.add(back);
      const lSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.45), hairMat);
      lSide.position.set(-0.22, -0.1, -0.02);
      hairGroup.add(lSide);
      const rSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.45), hairMat);
      rSide.position.set(0.22, -0.1, -0.02);
      hairGroup.add(rSide);
    } else if (hairStyle === 'ponytail') {
      const tieMat = new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.4 });
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.16), tieMat);
      tie.position.set(0, 0.08, -0.26);
      hairGroup.add(tie);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), hairMat);
      tail.position.set(0, -0.18, -0.27);
      hairGroup.add(tail);
    } else if (hairStyle === 'pigtails') {
      const tieMat = new THREE.MeshStandardMaterial({ color: '#ff66cc', roughness: 0.4 });
      [-1, 1].forEach((side) => {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), tieMat);
        tie.position.set(0.26 * side, 0.06, 0);
        hairGroup.add(tie);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.1), hairMat);
        tail.position.set(0.3 * side, -0.13, 0);
        hairGroup.add(tail);
      });
    } else if (hairStyle === 'braids') {
      // Wednesday Addams braids — two long thin black plaits down the front
      [-1, 1].forEach((side) => {
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.07), hairMat);
        top.position.set(0.22 * side, -0.06, 0.18);
        hairGroup.add(top);
        const mid = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), hairMat);
        mid.position.set(0.22 * side, -0.22, 0.2);
        hairGroup.add(mid);
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), hairMat);
        tip.position.set(0.22 * side, -0.36, 0.21);
        hairGroup.add(tip);
        const bowMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
        const bow = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.05), bowMat);
        bow.position.set(0.22 * side, -0.43, 0.22);
        hairGroup.add(bow);
      });
    } else if (hairStyle === 'bun') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), hairMat);
      bun.position.set(0, 0.18, -0.1);
      hairGroup.add(bun);
    } else if (hairStyle === 'short') {
      // Eleven (Stranger Things) — close-cropped helmet of hair around the head
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.52), hairMat);
      cap.position.set(0, 0.15, 0);
      hairGroup.add(cap);
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.06), hairMat);
      fringe.position.set(0, 0.06, 0.22);
      hairGroup.add(fringe);
    } else if (hairStyle === 'fringe-long') {
      // Long hair with a thick front fringe (bangs) across the forehead
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.08), hairMat);
      back.position.set(0, -0.18, -0.22);
      hairGroup.add(back);
      const lSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.45), hairMat);
      lSide.position.set(-0.22, -0.1, -0.02);
      hairGroup.add(lSide);
      const rSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.45), hairMat);
      rSide.position.set(0.22, -0.1, -0.02);
      hairGroup.add(rSide);
      // Heavy fringe across the forehead
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.08), hairMat);
      fringe.position.set(0, 0.12, 0.22);
      hairGroup.add(fringe);
    } else if (hairStyle === 'fringe-bob') {
      // Chin-length bob with a straight fringe
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.4, 0.54), hairMat);
      helmet.position.set(0, -0.02, 0);
      hairGroup.add(helmet);
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.08), hairMat);
      fringe.position.set(0, 0.12, 0.22);
      hairGroup.add(fringe);
    } else if (hairStyle === 'side-fringe') {
      // Asymmetric side-swept fringe + medium hair
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.08), hairMat);
      back.position.set(0, -0.04, -0.22);
      hairGroup.add(back);
      const lSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.45), hairMat);
      lSide.position.set(-0.22, -0.02, -0.02);
      hairGroup.add(lSide);
      const rSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.45), hairMat);
      rSide.position.set(0.22, -0.02, -0.02);
      hairGroup.add(rSide);
      // Slanted side-fringe
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.07), hairMat);
      fringe.position.set(-0.07, 0.13, 0.22);
      fringe.rotation.z = -0.35;
      hairGroup.add(fringe);
    } else if (hairStyle === 'sally') {
      // Sally (Nightmare Before Christmas) — long red rag-doll hair
      const sallyMat = new THREE.MeshStandardMaterial({ color: '#b8001f', roughness: 0.95 });
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, 0.08), sallyMat);
      back.position.set(0, -0.28, -0.22);
      hairGroup.add(back);
      const lSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.45), sallyMat);
      lSide.position.set(-0.22, -0.18, -0.02);
      hairGroup.add(lSide);
      const rSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.45), sallyMat);
      rSide.position.set(0.22, -0.18, -0.02);
      hairGroup.add(rSide);
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.08), sallyMat);
      fringe.position.set(0, 0.12, 0.22);
      hairGroup.add(fringe);
    }

    headMesh.add(hairGroup);
  }

  // G. OUTFIT OVERLAY — full gown/dress meshes replacing the plain torso/legs look
  let outfitGroup = null;
  if (outfitStyle && outfitStyle !== 'default') {
    outfitGroup = new THREE.Group();
    outfitGroup.name = 'outfit';

    if (outfitStyle === 'princess-gown') {
      // Wide flared skirt
      const skirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.3), skirtMat);
      top.position.set(0, -0.36, 0);
      outfitGroup.add(top);
      const mid = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.45), skirtMat);
      mid.position.set(0, -0.55, 0);
      outfitGroup.add(mid);
      const hem = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 0.6), skirtMat);
      hem.position.set(0, -0.75, 0);
      outfitGroup.add(hem);
      // Gold trim at the hem
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.97, 0.05, 0.62),
        new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.8, roughness: 0.2 }));
      trim.position.set(0, -0.86, 0);
      outfitGroup.add(trim);
    } else if (outfitStyle === 'mermaid-tail') {
      const tailMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.4, metalness: 0.5 });
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.45, 0.26), tailMat);
      upper.position.set(0, -0.45, 0);
      outfitGroup.add(upper);
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.18), tailMat);
      lower.position.set(0, -0.85, 0);
      outfitGroup.add(lower);
      // Fin
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.4), tailMat);
      fin.position.set(0, -1.04, 0);
      outfitGroup.add(fin);
    } else if (outfitStyle === 'witch-robes') {
      const robeMat = new THREE.MeshStandardMaterial({ color: '#0a0014', roughness: 0.95 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.3), robeMat);
      top.position.set(0, -0.3, 0);
      outfitGroup.add(top);
      const flow = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.5), robeMat);
      flow.position.set(0, -0.66, 0);
      outfitGroup.add(flow);
      // Tattered hem strips
      for (let i = -3; i <= 3; i++) {
        const tatter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), robeMat);
        tatter.position.set(i * 0.12, -0.95, 0.2);
        outfitGroup.add(tatter);
      }
    } else if (outfitStyle === 'wednesday-dress') {
      // Wednesday Addams — black dress with white peter-pan collar
      const dressMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.9 });
      const collarMat = new THREE.MeshStandardMaterial({ color: '#fafafa', roughness: 0.6 });
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.28), collarMat);
      collar.position.set(0, 0.36, 0.01);
      outfitGroup.add(collar);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.4, 0.26), dressMat);
      top.position.set(0, -0.18, 0);
      outfitGroup.add(top);
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.36), dressMat);
      skirt.position.set(0, -0.58, 0);
      outfitGroup.add(skirt);
      const hem = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.05, 0.4), collarMat);
      hem.position.set(0, -0.78, 0);
      outfitGroup.add(hem);
    } else if (outfitStyle === 'eleven-pink') {
      // Stranger Things Eleven — pink frilly dress
      const pinkMat = new THREE.MeshStandardMaterial({ color: '#ffb3c8', roughness: 0.7 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.4, 0.26), pinkMat);
      top.position.set(0, -0.18, 0);
      outfitGroup.add(top);
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.18, 0.4), pinkMat);
      skirt.position.set(0, -0.45, 0);
      outfitGroup.add(skirt);
      const frill = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.45),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }));
      frill.position.set(0, -0.56, 0);
      outfitGroup.add(frill);
    } else if (outfitStyle === 'sally-patchwork') {
      // Sally's patchwork rag-doll dress — colourful patches
      const patches = ['#5a8c4a', '#8a3a3a', '#3a4f8a', '#a87bc7', '#c9a44a', '#6e6e6e'];
      const patchAt = (x, y, z, w, h, d, colorIdx) => {
        const mat = new THREE.MeshStandardMaterial({ color: patches[colorIdx % patches.length], roughness: 0.9 });
        const patch = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        patch.position.set(x, y, z);
        outfitGroup.add(patch);
      };
      // Bodice in 4 patches
      patchAt(-0.13, -0.05, 0.13, 0.26, 0.36, 0.02, 0);
      patchAt(0.13, -0.05, 0.13, 0.26, 0.36, 0.02, 1);
      patchAt(-0.13, -0.05, -0.13, 0.26, 0.36, 0.02, 2);
      patchAt(0.13, -0.05, -0.13, 0.26, 0.36, 0.02, 3);
      // Skirt in 6 patches
      patchAt(-0.18, -0.5, 0.16, 0.32, 0.4, 0.02, 4);
      patchAt(0.18, -0.5, 0.16, 0.32, 0.4, 0.02, 5);
      patchAt(-0.18, -0.5, -0.16, 0.32, 0.4, 0.02, 0);
      patchAt(0.18, -0.5, -0.16, 0.32, 0.4, 0.02, 1);
      patchAt(0, -0.5, 0.21, 0.6, 0.4, 0.02, 2);
      patchAt(0, -0.5, -0.21, 0.6, 0.4, 0.02, 3);
    } else if (outfitStyle === 'jack-pinstripe') {
      // Jack Skellington's pinstripe suit — black with thin white vertical stripes + bow tie
      const suitMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.9 });
      const stripeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.74, 0.28), suitMat);
      top.position.set(0, -0.05, 0);
      outfitGroup.add(top);
      // Vertical white pinstripes
      for (let i = -2; i <= 2; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.74, 0.295), stripeMat);
        stripe.position.set(i * 0.1, -0.05, 0);
        outfitGroup.add(stripe);
      }
      // Long tailcoat at bottom
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.26), suitMat);
      tail.position.set(0, -0.55, -0.05);
      outfitGroup.add(tail);
      // Bat-shaped bow tie
      const bowMat = new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.6 });
      const bow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.05), bowMat);
      bow.position.set(0, 0.35, 0.15);
      outfitGroup.add(bow);
    } else if (outfitStyle === 'fairy-dress') {
      const petalMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6, transparent: true, opacity: 0.85 });
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.05), petalMat);
        petal.position.set(Math.cos(angle) * 0.18, -0.45, Math.sin(angle) * 0.18);
        petal.rotation.y = -angle;
        outfitGroup.add(petal);
      }
    }

    avatarGroup.add(outfitGroup);
  }

  // --- 5. VISIBILITY LAYERS ---
  // Ensure the entire avatar group casts and receives shadows recursively and gets glossy standard material properties
  avatarGroup.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            m.side = THREE.DoubleSide;
            if (m.isMeshStandardMaterial) {
              m.roughness = 0.65;
              m.metalness = 0.2;
            }
          });
        } else {
          child.material.side = THREE.DoubleSide;
          if (child.material.isMeshStandardMaterial) {
            child.material.roughness = 0.65;
            child.material.metalness = 0.2;
          }
        }
      }
    }
  });

  return {
    group: avatarGroup,
    head: headMesh,
    body: bodyMesh,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    wings: wingGroup,
    crown: crownMesh,
    hat: wizardHatGroup,
    starfish: starfishMesh,
    wand: wandMesh,
    hairStyle: hairGroup,
    outfit: outfitGroup
  };
}

/**
 * Update limbs and accessory animations in the render loop
 */
export function updateAvatarAnimations(avatarData, time, isMoving) {
  if (!avatarData || !avatarData.group) return;

  const { leftArm, rightArm, leftLeg, rightLeg, wings, crown, hat, starfish, wand } = avatarData;

  // 1. Walk/Limb movement
  if (isMoving) {
    const speedFactor = 15;
    const angle = 0.6 * Math.sin(time * 0.001 * speedFactor);
    
    if (leftLeg) leftLeg.rotation.x = angle;
    if (rightLeg) rightLeg.rotation.x = -angle;
    if (leftArm) leftArm.rotation.x = -angle;
    if (rightArm) rightArm.rotation.x = angle;
  } else {
    const restSpeed = 0.15;
    if (leftLeg) leftLeg.rotation.x += (0 - leftLeg.rotation.x) * restSpeed;
    if (rightLeg) rightLeg.rotation.x += (0 - rightLeg.rotation.x) * restSpeed;
    if (leftArm) leftArm.rotation.x += (0 - leftArm.rotation.x) * restSpeed;
    if (rightArm) rightArm.rotation.x += (0 - rightArm.rotation.x) * restSpeed;
  }

  // 2. Gothic bat wings flapping
  if (wings && wings.userData && wings.userData.leftWing && wings.userData.rightWing) {
    const flapSpeed = isMoving ? 12 : 5;
    const flapAngle = 0.3 * Math.sin(time * 0.001 * flapSpeed);
    
    // Flutter symmetrically
    wings.userData.leftWing.rotation.y = flapAngle - 0.2;
    wings.userData.rightWing.rotation.y = -flapAngle + 0.2;
    
    // Add light breathing sway
    wings.position.y = 0.15 + 0.02 * Math.sin(time * 0.001 * 2);
  }

  // 3. Shining crown/accessories breathing sway
  if (crown) {
    crown.position.y = 0.26 + 0.01 * Math.sin(time * 0.001 * 3);
    // Slight shimmering rotation
    crown.rotation.y = 0.05 * Math.sin(time * 0.001 * 1);
  }

  if (hat) {
    // Elegant floppy float
    hat.position.y = 0.24 + 0.012 * Math.sin(time * 0.001 * 2.5);
    hat.rotation.z = 0.03 * Math.sin(time * 0.001 * 1.5);
  }

  if (starfish) {
    // Tiny sea-sway
    starfish.rotation.z = -Math.PI / 6 + 0.05 * Math.sin(time * 0.001 * 2);
  }

  if (wand) {
    // Elegant shimmering wand glow
    wand.rotation.y = time * 0.003;
    const tipLight = wand.children.find(c => c.type === 'PointLight');
    if (tipLight) {
      tipLight.intensity = 0.5 + 0.3 * Math.sin(time * 0.005);
    }
  }
}
