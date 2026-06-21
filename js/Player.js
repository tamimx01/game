// =============================================
//  Player.js  —  Character Load, Move, Camera
//  আপনার GLB মডেল লোড ও চরিত্র নিয়ন্ত্রণ
// =============================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const SPEED      = 5;    // হাঁটার গতি (unit/s)
const RUN_SPEED  = 10;   // দৌড়ানোর গতি
const JUMP_FORCE = 8;    // জাম্প শক্তি
const GRAVITY    = -20;  // মাধ্যাকর্ষণ

// Camera offset (3rd person)
const CAM_DISTANCE = 7;
const CAM_HEIGHT   = 3;

export class Player {

  constructor(scene, camera, input) {
    this.scene  = scene;
    this.camera = camera;
    this.input  = input;

    // state
    this.velocity   = new THREE.Vector3();
    this.onGround   = true;
    this.yaw        = 0;   // horizontal camera angle
    this.pitch      = 0.3; // vertical camera angle

    // placeholder cube (গেম শুরু হবে model ছাড়াও)
    this.mesh = null;
    this._createPlaceholder();

    // clock for delta time
    this.clock = new THREE.Clock();
  }

  // ── GLB মডেল লোড করো
  // 📌 আপনার মডেলের ফাইলের নাম নিচে দিন
  async load() {
    const loader = new GLTFLoader();

    // ── আপনার দুটো মডেল ফাইল এখানে রেফার করুন
    //    models/ ফোল্ডারে রাখুন তারপর path দিন
    //    যেমন: 'models/Model.glb'  বা  'models/Wailk.glb'
    const MODEL_PATH = 'models/Soldier.glb';  // ← এখানে আপনার ফাইলের নাম দিন

    try {
      const gltf = await loader.loadAsync(MODEL_PATH);
      const model = gltf.scene;

      // Scale & position adjust
      model.scale.setScalar(1);
      model.position.y = 0;
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });

      // placeholder সরিয়ে real model যোগ করো
      this.scene.remove(this.mesh);
      this.mesh = model;
      this.scene.add(this.mesh);

      // Animation setup
      this.mixer = new THREE.AnimationMixer(model);
      if (gltf.animations.length > 0) {
        this.idleAction = this.mixer.clipAction(gltf.animations[0]);
        this.idleAction.play();

        if (gltf.animations.length > 1) {
          this.walkAction = this.mixer.clipAction(gltf.animations[1]);
        }
      }

      console.log('✅ Model loaded:', MODEL_PATH);
      console.log('   Animations found:', gltf.animations.map(a => a.name));

    } catch (err) {
      console.warn('⚠️  Model not loaded, using placeholder cube.\n   Put your .glb file in the models/ folder.');
    }
  }

  // ── Placeholder cube (model না থাকলে)
  _createPlaceholder() {
    const geo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x4488ff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(0, 1, 0);
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }

  // ── প্রতি frame-এ call হয়
  update() {
    const dt    = this.clock.getDelta();
    const mouse = this.input.flushMouseDelta();

    // ── Camera yaw/pitch
    const SENS = 0.002;
    this.yaw   -= mouse.x * SENS;
    this.pitch  = Math.max(-0.4, Math.min(0.8, this.pitch + mouse.y * SENS));

    // ── Movement direction (camera-relative)
    const keys   = this.input.keys;
    const speed  = keys.shift ? RUN_SPEED : SPEED;
    const moveVec = new THREE.Vector3();

    if (keys.w) moveVec.z -= 1;
    if (keys.s) moveVec.z += 1;
    if (keys.a) moveVec.x -= 1;
    if (keys.d) moveVec.x += 1;

    if (moveVec.length() > 0) {
      moveVec.normalize();
      // camera yaw দিয়ে rotate করো
      moveVec.applyEuler(new THREE.Euler(0, this.yaw, 0));
      this.velocity.x = moveVec.x * speed;
      this.velocity.z = moveVec.z * speed;

      // চরিত্রকে মুভ দিকে ঘোরাও
      const angle = Math.atan2(moveVec.x, moveVec.z);
      const targetQuat = new THREE.Quaternion();
      targetQuat.setFromEuler(new THREE.Euler(0, angle, 0));
      this.mesh.quaternion.slerp(targetQuat, 0.15);

      // Walk animation
      if (this.walkAction && !this.walkAction.isRunning()) {
        this.idleAction?.fadeOut(0.2);
        this.walkAction.reset().fadeIn(0.2).play();
      }
    } else {
      // friction
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;

      // Idle animation
      if (this.idleAction && !this.idleAction.isRunning()) {
        this.walkAction?.fadeOut(0.2);
        this.idleAction.reset().fadeIn(0.2).play();
      }
    }

    // ── Jump
    if (keys.space && this.onGround) {
      this.velocity.y = JUMP_FORCE;
      this.onGround   = false;
    }

    // ── Gravity
    this.velocity.y += GRAVITY * dt;

    // ── Apply movement
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z += this.velocity.z * dt;

    // ── Simple ground collision (y=0 হলো মাটি)
    if (this.mesh.position.y <= 0) {
      this.mesh.position.y = 0;
      this.velocity.y      = 0;
      this.onGround        = true;
    }

    // ── Update animation mixer
    if (this.mixer) this.mixer.update(dt);

    // ── 3rd person camera follow
    this._updateCamera();
  }

  _updateCamera() {
    const pos = this.mesh.position;

    // Camera position (spherical coordinates)
    const camX = pos.x + CAM_DISTANCE * Math.sin(this.yaw)   * Math.cos(this.pitch);
    const camY = pos.y + CAM_DISTANCE * Math.sin(this.pitch)  + CAM_HEIGHT;
    const camZ = pos.z + CAM_DISTANCE * Math.cos(this.yaw)   * Math.cos(this.pitch);

    // Smooth lerp
    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);

    // Always look at player (head level)
    this.camera.lookAt(pos.x, pos.y + 1.2, pos.z);
  }
}
