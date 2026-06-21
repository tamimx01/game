# 🎮 Open World Game — Three.js

## 📁 ফোল্ডার স্ট্রাকচার

```
OpenWorldGame/
│
├── index.html              ← গেমের মূল পেজ (এটা ব্রাউজারে খুলুন)
│
├── css/
│   └── style.css           ← লোডিং স্ক্রিন + HUD স্টাইল
│
├── js/
│   ├── main.js             ← সব কিছু শুরু হয় এখান থেকে
│   ├── SceneManager.js     ← Scene, Camera, Light, Renderer
│   ├── World.js            ← সবুজ মাঠ, গাছ, পাথর
│   ├── Player.js           ← চরিত্র লোড + WASD মুভমেন্ট
│   └── InputHandler.js     ← কীবোর্ড + মাউস ইনপুট
│
├── models/
│   ├── Model.glb           ← ← আপনার মডেল এখানে রাখুন
│   └── Wailk.glb           ← ← আপনার walk মডেল এখানে রাখুন
│
└── textures/               ← পরে texture রাখার জায়গা
```

## 🚀 কিভাবে চালাবেন

### ১. মডেল রাখুন
GitHub থেকে ডাউনলোড করে `models/` ফোল্ডারে রাখুন:
- `Model.glb`
- `Wailk.glb`

### ২. Local Server চালু করুন
```bash
# Python দিয়ে (সহজ):
python -m http.server 8000

# অথবা VS Code-এ "Live Server" extension দিয়ে
```

### ৩. ব্রাউজারে খুলুন
```
http://localhost:8000
```

### ৪. মডেল পাথ ঠিক করুন
`js/Player.js` ফাইলে এই লাইনটা দেখুন:
```js
const MODEL_PATH = 'models/Wailk.glb';
```
আপনার ফাইলের নাম অনুযায়ী পরিবর্তন করুন।

## 🎮 কন্ট্রোলস

| কী | কাজ |
|---|---|
| W / ↑ | সামনে |
| S / ↓ | পিছনে |
| A / ← | বামে |
| D / → | ডানে |
| Space | জাম্প |
| Shift | দৌড় |
| Mouse | ক্যামেরা ঘোরানো |
| Click | মাউস লক (গেম মোড) |
| ESC | মাউস আনলক |

## 📦 টেকনোলজি

- **Three.js r165** — 3D রেন্ডারিং (CDN থেকে লোড হয়)
- **GLTFLoader** — GLB মডেল লোড
- **Vanilla JS** — কোনো framework নেই, সহজ!

## ⚠️ সমস্যা হলে

**"Model not loaded" দেখাচ্ছে?**
→ নীল capsule দিয়ে গেম চলবে, মডেল ছাড়াও।
→ models/ ফোল্ডারে .glb ফাইল আছে কিনা চেক করুন।

**Canvas দেখাচ্ছে না?**
→ Browser console (F12) দেখুন error আছে কিনা।
→ সরাসরি index.html double-click করলে কাজ করবে না, server লাগবে।
