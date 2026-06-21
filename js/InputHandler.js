// =============================================
//  InputHandler.js  —  Keyboard & Mouse Input
//  কীবোর্ড ইনপুট ট্র্যাক করা হয় এখানে
// =============================================

export class InputHandler {

  constructor() {
    // কোন কী চাপা আছে তার Map
    this.keys = {
      w:     false,  // সামনে
      s:     false,  // পিছনে
      a:     false,  // বামে
      d:     false,  // ডানে
      space: false,  // jump
      shift: false,  // দৌড়
    };

    // Mouse look (pointer lock)
    this.mouseDelta = { x: 0, y: 0 };
    this._pointerLocked = false;

    this._bindEvents();
  }

  _bindEvents() {
    // Key down
    window.addEventListener('keydown', e => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    this.keys.w     = true; break;
        case 'KeyS': case 'ArrowDown':  this.keys.s     = true; break;
        case 'KeyA': case 'ArrowLeft':  this.keys.a     = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.d     = true; break;
        case 'Space':                   this.keys.space  = true; e.preventDefault(); break;
        case 'ShiftLeft':               this.keys.shift  = true; break;
      }
    });

    // Key up
    window.addEventListener('keyup', e => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    this.keys.w     = false; break;
        case 'KeyS': case 'ArrowDown':  this.keys.s     = false; break;
        case 'KeyA': case 'ArrowLeft':  this.keys.a     = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.d     = false; break;
        case 'Space':                   this.keys.space  = false; break;
        case 'ShiftLeft':               this.keys.shift  = false; break;
      }
    });

    // Mouse — click করলে pointer lock
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('click', () => canvas.requestPointerLock());

    document.addEventListener('pointerlockchange', () => {
      this._pointerLocked = document.pointerLockElement === canvas;
    });

    // Mouse movement (camera rotation)
    document.addEventListener('mousemove', e => {
      if (this._pointerLocked) {
        this.mouseDelta.x += e.movementX;
        this.mouseDelta.y += e.movementY;
      }
    });
  }

  // প্রতি frame-এ mouse delta reset করতে হবে
  flushMouseDelta() {
    const d = { ...this.mouseDelta };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return d;
  }
}
