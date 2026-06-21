// =============================================
//  SceneManager.js  —  Scene, Camera, Lights, Renderer
//  Three.js-এর মূল সেটআপ এখানে
// =============================================

import * as THREE from 'three';

export class SceneManager {

  constructor() {
    // ── Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

    // ── Camera (3rd person view)
    this.camera = new THREE.PerspectiveCamera(
      60,                                     // FOV
      window.innerWidth / window.innerHeight, // aspect ratio
      0.1,                                    // near clip
      500                                     // far clip
    );
    this.camera.position.set(0, 5, 10);

    // ── Renderer
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ── Lights
    this._setupLights();

    // ── Resize handler
    window.addEventListener('resize', () => this._onResize());
  }

  _setupLights() {
    // Ambient — soft fill light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Directional — sun light with shadows
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width  = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far  = 300;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -80;
    sun.shadow.camera.right = sun.shadow.camera.top   =  80;
    this.scene.add(sun);

    // Hemisphere — sky/ground colour bounce
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3a7d44, 0.4);
    this.scene.add(hemi);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
