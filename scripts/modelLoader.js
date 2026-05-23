import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelLoader {
  loader = new GLTFLoader();

  models = {
    pickaxe: undefined
  };

  constructor(onLoad) {
    // Generate fallback list of possible locations for pickaxe.glb
    const paths = ['./models/pickaxe.glb', 'models/pickaxe.glb'];

    // If we're deployed on GitHub Pages in a subfolder, add its absolute path as a fallback
    if (window.location.pathname.includes('/manon-margot-craft')) {
      paths.push('/manon-margot-craft/models/pickaxe.glb');
    }

    let pathIndex = 0;

    const loadAttempt = () => {
      const currentPath = paths[pathIndex];
      console.log(`[ModelLoader] Attempting to load pickaxe from: "${currentPath}"`);

      this.loader.load(
        currentPath,
        (model) => {
          console.log(`[ModelLoader] Successfully loaded pickaxe GLB from: "${currentPath}"`, model);
          const mesh = model.scene;
          this.models.pickaxe = mesh;
          onLoad(this.models);
        },
        // Progress callback
        (xhr) => {
          if (xhr.total > 0) {
            console.log(`[ModelLoader] Loading ${currentPath}: ${Math.round(xhr.loaded / xhr.total * 100)}%`);
          }
        },
        // Error callback
        (error) => {
          console.warn(`[ModelLoader] Failed to load pickaxe from "${currentPath}":`, error);
          pathIndex++;
          if (pathIndex < paths.length) {
            console.log(`[ModelLoader] Checking next fallback path...`);
            loadAttempt();
          } else {
            console.error(`[ModelLoader] All GLB paths failed. Generating high-quality programmatic fallback pickaxe.`);
            this.createFallbackPickaxe(onLoad);
          }
        }
      );
    };

    loadAttempt();
  }

  /**
   * Programmatically creates a beautiful, voxel-style 3D pickaxe mesh
   * to ensure the player is NEVER left without a tool if asset loads fail.
   */
  createFallbackPickaxe(onLoad) {
    const group = new THREE.Group();
    group.name = "fallback_pickaxe";

    // Wood shaft / handle
    const shaftGeom = new THREE.BoxGeometry(0.04, 0.7, 0.04);
    const shaftMat = new THREE.MeshLambertMaterial({ color: 0x8B5A2B }); // Cozy wood brown
    const shaft = new THREE.Mesh(shaftGeom, shaftMat);
    shaft.position.set(0, 0.35, 0); // Bottom is at y = 0
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Pickaxe head (iron metal bar)
    const headGeom = new THREE.BoxGeometry(0.4, 0.05, 0.05);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x708090 }); // Steel blue-slate
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 0.7, 0); // Mounted exactly on top of shaft
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Tip Left
    const tipLeftGeom = new THREE.BoxGeometry(0.08, 0.05, 0.05);
    const tipLeftMat = new THREE.MeshLambertMaterial({ color: 0x485868 }); // Darker metallic edge
    const tipLeft = new THREE.Mesh(tipLeftGeom, tipLeftMat);
    tipLeft.position.set(-0.2, 0.68, 0);
    tipLeft.rotation.z = -0.2; // Angle down slightly for a hook appearance
    tipLeft.castShadow = true;
    tipLeft.receiveShadow = true;
    group.add(tipLeft);

    // Tip Right
    const tipRightGeom = new THREE.BoxGeometry(0.08, 0.05, 0.05);
    const tipRightMat = new THREE.MeshLambertMaterial({ color: 0x485868 });
    const tipRight = new THREE.Mesh(tipRightGeom, tipRightMat);
    tipRight.position.set(0.2, 0.68, 0);
    tipRight.rotation.z = 0.2; // Angle down slightly
    tipRight.castShadow = true;
    tipRight.receiveShadow = true;
    group.add(tipRight);

    this.models.pickaxe = group;
    onLoad(this.models);
  }
}