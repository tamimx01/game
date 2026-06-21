// =============================================
//  World.js  —  Ground, Trees, Environment
//  সবুজ মাঠ ও পরিবেশ তৈরি হয় এখানে
// =============================================

import * as THREE from 'three';

export class World {

  constructor(scene) {
    this.scene = scene;
    this._createGround();
    this._createTrees();
    this._createRocks();
  }

  // ── সবুজ মাঠ
  _createGround() {
    const geo = new THREE.PlaneGeometry(200, 200, 40, 40);
    const mat = new THREE.MeshLambertMaterial({ color: 0x3a7d44 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2; // শুইয়ে দাও
    ground.receiveShadow = true;
    this.scene.add(ground);

    // মাঠে একটু উঁচু-নিচু ভাব আনা (optional wave)
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // simple noise-like bumps
      pos.setZ(i, Math.sin(x * 0.3) * 0.3 + Math.cos(y * 0.3) * 0.3);
    }
    geo.computeVertexNormals();
  }

  // ── গাছ (সিম্পল সিলিন্ডার + কোন)
  _createTrees() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const leafMat  = new THREE.MeshLambertMaterial({ color: 0x228B22 });

    // ৩০টি গাছ র‍্যান্ডমলি রাখো
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 180;
      const z = (Math.random() - 0.5) * 180;

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 2, 8),
        trunkMat
      );
      trunk.position.set(x, 1, z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      // Leaves (cone shape)
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 3, 8),
        leafMat
      );
      leaves.position.set(x, 3.5, z);
      leaves.castShadow = true;
      this.scene.add(leaves);
    }
  }

  // ── পাথর (ছোট ছোট)
  _createRocks() {
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;
      const s = 0.3 + Math.random() * 0.7;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(s, 0),
        rockMat
      );
      rock.position.set(x, s * 0.5, z);
      rock.rotation.y = Math.random() * Math.PI;
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }
}
