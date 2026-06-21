// =============================================
//  Player.js  —  Character Load, Move, Camera
//  Soldier.glb + সব animation ঠিকঠাক
// =============================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const SPEED      = 5;
const RUN_SPEED  = 10;
const JUMP_FORCE = 8;
const GRAVITY    = -20;

const CAM_DISTANCE = 6;
const CAM_HEIGHT   = 2.5;

export class Player {

  constructor(scene, camera, input) {
    this.scene  = scene;
    this.camera = camera;
    this.input  = input;

    this.velocity  = new THREE.Vector3();
    this.onGround  = true;
    this.yaw       = 0;
    this.pitch     = 0.25;

    // animation actions
    this.mixer      = null;
    this.idleAction = null;
    this.walkAction = null;
    this.runAction  = null;
    this.currentAction = null;

    this.mesh = null;
    this._createPlaceholder();

    this.clock = new THREE.Clock();
  }

  async load() {
    const loader = new GLTFLoader();
    const MODEL_PATH = 'models/Soldier.glb';

    try {
      const gltf = await loader.loadAsync(MODEL_PATH);
      const model = gltf.scene;

      // Soldier.glb সাইজ ঠিক করা
      model.scale.setScalar(1);
      model.position.set(0, 0, 0);

      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });

      this.scene.remove(this.mesh);
      this.mesh = model;
      this.scene.add(this.mesh);

      // ── Animation setup
      // Soldier.glb এ আছে: idle, walk, run (index 0,1,2)
      this.mixer = new THREE.AnimationMixer(model);

      const anims = gltf.animations;
      console.log('✅ Soldier loaded! Animations:', anims.map((a,i) => `[${i}] ${a.name}`));

      // নাম দিয়ে খোঁজা (Soldier.glb এর exact নাম)
      const findAnim = (keywords) => {
        return anims.find(a =>
          keywords.some(k => a.name.toLowerCase().includes(k))
        ) || anims[0];
      };

      const idleClip = findAnim(['idle']);
      const walkClip = findAnim(['walk']);
      const runClip  = findAnim(['run']);

      this.idleAction = this.mixer.clipAction(idleClip);
      this.walkAction = this.mixer.clipAction(walkClip);
      this.runAction  = this.mixer.clipAction(runClip);

      // সব action এর weight শুরুতে 0
      [this.walkAction, this.runAction].forEach(a => {
        a.enabled = true;
        a.setEffectiveWeight(0);
        a.play();
      });

      // idle দিয়ে শুরু
      this.idleAction.enabled = true;
      this.idleAction.setEffectiveWeight(1);
      this.idleAction.play();
      this.currentAction = 'idle';

    } catch (err) {
      console.warn('⚠️ Model not loaded:', err.message);
    }
  }

  _createPlaceholder() {
    const geo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x4488ff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(0, 1, 0);
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }

  // ── Animation switch (smooth crossfade)
  _switchAnim(name) {
    if (this.currentAction === name) return;
    if (!this.mixer) return;

    const prev = {
      idle: this.idleAction,
      walk: this.walkAction,
      run:  this.runAction,
    }[this.currentAction];

    const next = {
      idle: this.idleAction,
      walk: this.walkAction,
      run:  this.runAction,
    }[name];

    if (!next) return;

    if (prev) {
      prev.crossFadeTo(next, 0.2, true);
    } else {
      next.setEffectiveWeight(1);
    }

    this.currentAction = name;
  }

  update() {
    const dt    = this.clock.getDelta();
    const mouse = this.input.flushMouseDelta();

    // ── Camera rotation
    const SENS = 0.002;
    this.yaw   -= mouse.x * SENS;
    this.pitch  = Math.max(-0.3, Math.min(0.7, this.pitch + mouse.y * SENS));

    // ── Movement
    const keys    = this.input.keys;
    const isRun   = keys.shift;
    const speed   = isRun ? RUN_SPEED : SPEED;
    const moveVec = new THREE.Vector3();

    // ✅ ঠিক direction (W=সামনে)
    if (keys.w) moveVec.z -= 1;
    if (keys.s) moveVec.z += 1;
    if (keys.a) moveVec.x -= 1;
    if (keys.d) moveVec.x += 1;

    const isMoving = moveVec.length() > 0;

    if (isMoving) {
      moveVec.normalize();
      moveVec.applyEuler(new THREE.Euler(0, this.yaw, 0));

      this.velocity.x = moveVec.x * speed;
      this.velocity.z = moveVec.z * speed;

      // character মুখ ঘোরানো
      const angle = Math.atan2(moveVec.x, moveVec.z);
      const targetQ = new THREE.Quaternion();
      targetQ.setFromEuler(new THREE.Euler(0, angle, 0));
      this.mesh.quaternion.slerp(targetQ, 0.12);

      // animation
      this._switchAnim(isRun ? 'run' : 'walk');

    } else {
      this.velocity.x *= 0.75;
      this.velocity.z *= 0.75;
      this._switchAnim('idle');
    }

    // ── Jump
    if (keys.space && this.onGround) {
      this.velocity.y = JUMP_FORCE;
      this.onGround   = false;
    }

    // ── Gravity
    this.velocity.y += GRAVITY * dt;

    // ── Apply
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z += this.velocity.z * dt;

    // ── Ground check
    if (this.mesh.position.y <= 0) {
      this.mesh.position.y = 0;
      this.velocity.y      = 0;
      this.onGround        = true;
    }

    // ── Mixer update
    if (this.mixer) this.mixer.update(dt);

    // ── Camera
    this._updateCamera();
  }

  _updateCamera() {
    const pos = this.mesh.position;

    const camX = pos.x + CAM_DISTANCE * Math.sin(this.yaw) * Math.cos(this.pitch);
    const camY = pos.y + CAM_DISTANCE * Math.sin(this.pitch) + CAM_HEIGHT;
    const camZ = pos.z + CAM_DISTANCE * Math.cos(this.yaw) * Math.cos(this.pitch);

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.08);
    this.camera.lookAt(pos.x, pos.y + 1.0, pos.z);
  }
}
