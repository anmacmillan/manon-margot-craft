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

  // A. GOTHIC BAT WINGS (Manon's Special Gothic Skin or Custom Accessory)
  if (skinObj === 'gothic' || accessoryType === 'wings') {
    wingGroup = new THREE.Group();
    wingGroup.name = 'wings';
    wingGroup.position.set(0, 0.15, -0.13); // Mount behind body

    // Left Wing
    const leftWing = new THREE.Group();
    leftWing.position.set(-0.1, 0, 0);
    
    // Custom voxel/panel batwing shapes
    const mainWingMat = new THREE.MeshStandardMaterial({ color: '#090014', roughness: 0.9, side: THREE.DoubleSide });
    const wingRibMat = new THREE.MeshStandardMaterial({ color: '#2d004d', roughness: 0.7 });

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
    wingGroup.userData = { leftWing, rightWing };
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
    wand: wandMesh
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
