// =============================================
//  main.js  —  Game Entry Point
//  সব কিছু এখান থেকে শুরু হয়
// =============================================

import { SceneManager } from './SceneManager.js';
import { Player }       from './Player.js';
import { InputHandler } from './InputHandler.js';
import { World }        from './World.js';

// ── Loading screen elements
const loadingScreen = document.getElementById('loading-screen');
const loadingBar    = document.getElementById('loading-bar');
const loadingText   = document.getElementById('loading-text');

function setProgress(pct, label) {
  loadingBar.style.width = pct + '%';
  if (label) loadingText.textContent = label;
}

// ── Bootstrap
async function init() {

  setProgress(10, 'Setting up scene...');
  const scene = new SceneManager();

  setProgress(30, 'Building world...');
  const world = new World(scene.scene);

  setProgress(60, 'Loading character...');
  const input  = new InputHandler();
  const player = new Player(scene.scene, scene.camera, input);
  await player.load();          // loads your GLB model

  setProgress(90, 'Almost ready...');

  // ── Hide loading screen
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
  }, 400);

  setProgress(100, 'Go!');

  // ── Main game loop
  function gameLoop() {
    requestAnimationFrame(gameLoop);
    player.update();
    scene.render();
  }

  gameLoop();
}

init().catch(err => {
  console.error('Game init failed:', err);
  loadingText.textContent = 'Error: ' + err.message;
});
