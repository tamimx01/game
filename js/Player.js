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

    // animation state tracking
    this.currentAnim = null;  // 'idle' | 'walk' | 'run'
    this.actions     = {};    // সব animation এখানে থাকবে নামে

    // placeholder cube (গেম শুরু হবে model ছাড়াও)
    this.mesh = null;
    this._createPlaceholder();

    // clock for delta time
    this.clock = new THREE.Clock();
  }

  // ── GLB মডেল লোড করো
  async load() {
    const loader = new GLTFLoader();

    // 📌 আপনার মডেলের ফাইলের নাম নিচে দিন
    const MODEL_PATH = 'models/Wailk.glb';

    try {
      const gltf = await loader.loadAsync(MODEL_PATH);
      const model = gltf.scene;

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

      // ── Animation setup (নাম দিয়ে খোঁজো, index নয়)
      this.mixer = new THREE.AnimationMixer(model);

      console.log('✅ Model loaded:', MODEL_PATH);
      console.log('   Animations found:', gltf.animations.map(a => a.name));

      gltf.animations.forEach(clip => {
        const action = this.mixer.clipAction(clip);
        action.enabled = true;
        // সব animation থেমে শুরু করবে
        action.setEffectiveWeight(0);
        action.play();
        // নামটা lowercase করে রাখো যাতে সহজে মিলানো যায়
        this.actions[clip.name.toLowerCase()] = action;
      });

      // প্রথমে idle চালু করো
      this._playAnim('idle');

    } catch (err) {
      console.warn('⚠️  Model not loaded, using placeholder cube.\n   Put your .glb file in the models/ folder.');
      console.warn(err);
    }
  }

  // ── Animation switch করার সঠিক পদ্ধতি
  _playAnim(name) {
    if (this.currentAnim === name) return; // একই anim চললে কিছু করো না

    const FADE = 0.2; // blend সময় (seconds)

    // আগেরটা fade out
    if (this.currentAnim && this.actions[this.currentAnim]) {
      this.actions[this.currentAnim].setEffectiveWeight(1);
      this.actions[this.currentAnim].fadeOut(FADE);
    }

    // নতুনটা খোঁজো — exact match না পেলে partial match চেষ্টা করো
    let targetKey = Object.keys(this.actions).find(k => k.includes(name));

    if (targetKey) {
      const action = this.actions[targetKey];
      action.reset();
      action.setEffectiveWeight(1);
      action.fadeIn(FADE);
      this.currentAnim = targetKey;
    } else {
      // ওই নামের animation নেই — fallback: প্রথম available animation
      const fallbackKey = Object.keys(this.actions)[0];
      if (fallbackKey && this.currentAnim !== fallbackKey) {
        const action = this.actions[fallbackKey];
        action.reset();
        action.setEffectiveWeight(1);
        action.fadeIn(FADE);
        this.currentAnim = fallbackKey;
        console.warn(`⚠️ Animation "${name}" পাওয়া যায়নি, "${fallbackKey}" চালানো হচ্ছে`);
        console.warn('   Available animations:', Object.keys(this.actions));
      }
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
    const keys    = this.input.keys;
    const isRun   = keys.shift;
    const speed   = isRun ? RUN_SPEED : SPEED;
    const moveVec = new THREE.Vector3();

    if (keys.w) moveVec.z += 1;
    if (keys.s) moveVec.z -= 1;
    if (keys.a) moveVec.x -= 1;
    if (keys.d) moveVec.x += 1;

    const isMoving = moveVec.length() > 0;

    if (isMoving) {
      moveVec.normalize();
      // camera yaw দিয়ে rotate করো
      moveVec.applyEuler(new THREE.Euler(0, this.yaw, 0));
      this.velocity.x = moveVec.x * speed;
      this.velocity.z = moveVec.z * speed;

      // চরিত্রকে মুভ দিকে ঘোরাও
      const angle = Math.atan2(moveVec.x, moveVec.z) + Math.PI;
      const targetQuat = new THREE.Quaternion();
      targetQuat.setFromEuler(new THREE.Euler(0, angle, 0));
      this.mesh.quaternion.slerp(targetQuat, 0.15);

      // ── Animation: walk বা run
      this._playAnim(isRun ? 'run' : 'walk');

    } else {
      // friction
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;

      // ── Animation: idle
      this._playAnim('idle');
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

    const camX = pos.x + CAM_DISTANCE * Math.sin(this.yaw)  * Math.cos(this.pitch);
    const camY = pos.y + CAM_DISTANCE * Math.sin(this.pitch) + CAM_HEIGHT;
    const camZ = pos.z + CAM_DISTANCE * Math.cos(this.yaw)  * Math.cos(this.pitch);

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
    this.camera.lookAt(pos.x, pos.y + 1.2, pos.z);
  }
}
