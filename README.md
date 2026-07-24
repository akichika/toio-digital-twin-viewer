# toio Digital Twin Viewer

A standalone **digital twin viewer & RC remote control** for the [toio™](https://toio.io) Core Cube.
Connect one or more cubes over **Web Bluetooth**, watch their position, heading, LED and **trajectory** mirrored in real time on a **2D map and 3D scene**, and drive them like an RC car using the **keyboard or on-screen buttons**.

> Extracted and focused from the digital-twin display of *Code Maker for toio*, this app keeps the multi-language UI, PWA support, colour themes, multi-cube connection and trajectory drawing — and adds dedicated remote control.

**▶ Live app:** https://akichika.github.io/toio-digital-twin-viewer/

![digital twin viewer](icons/icon-512.png)

## Features

- 🎮 **Remote / RC control** — drive with arrow keys / WASD or the on-screen D-pad; spin, LED colours and sound effects
- 🛰️ **Digital twin** — real cube position/heading/LED mirrored live from BLE onto the mat
- 🧊 **Official toio 3D model** — the real Core Cube shape (toio spec GLTF) is shown in the 3D view
- 🪂 **Off-mat attitude** — lifted off the mat, the cube floats ~5 cm at its last position and its **motion-sensor tilt (roll/pitch/yaw)** is reflected in 3D
- 🧭 **2D map + 3D view** — orbit the 3D scene; both show the motion **trajectory**
- 🧩 **Multiple cubes** — connect several cubes and target one or all
- 🕹️ **Demo cubes** — try the whole UI without hardware (virtual, simulated cubes)
- 🗺️ **Click to move** — click the mat to send the targeted cube there (`moveTo`)
- 🎛️ **Collapsible control panel** — the remote-control pane folds away (collapsed by default); toggle with the 🎮 button
- 🌐 **Multi-language** — 日本語 / English / 中文
- 🎨 **Colour themes** — light / dark / high-contrast
- 📱 **PWA** — installable (⬇ icon) and works offline

## Usage

1. Open the app in **Chrome or Edge** (Web Bluetooth is required for real cubes; served over HTTPS).
2. Click **+ Connect Cube** and pick your toio, or **+ Demo Cube** to try it without hardware.
3. Place the cube on a **toio play mat** so it reports its position (real cubes only).
4. Select a target cube (or *All*) and drive:
   - **Keyboard:** `↑ ↓ ← →` or `W A S D` to drive, `Space` to stop, `1`–`4` select a cube, `0` selects all.
   - **On-screen:** hold the D-pad buttons; use the LED / sound / spin controls.
   - **Click the mat** to send the cube to that coordinate.

### Requirements

- A Web Bluetooth capable browser (Chrome / Edge on desktop or Android). iOS Safari does not support Web Bluetooth — use demo cubes there.
- A toio™ Core Cube and, for position/trajectory, a toio play mat.

## Develop / run locally

Any static file server works (a service worker + Web Bluetooth need `http://localhost` or HTTPS):

```bash
python -m http.server 3333
# then open http://localhost:3333
```

## Project structure

```
index.html              app shell & layout
css/style.css           themes (light/dark/hc) + responsive layout
js/i18n.js              multi-language strings (ja/en/zh)
js/toio.js              Web Bluetooth multi-cube communication (ToioDevice / ToioManager)
js/twin.js              digital-twin renderer (2D + 3D + trails) & DemoCube physics
js/control.js           keyboard + on-screen remote control
js/app.js               glue: cubes, UI, theme, PWA
js/vendor/              Three.js r128 + OrbitControls + GLTFLoader (bundled for offline PWA)
models/                 official toio Core Cube GLTF model (CC BY-ND 4.0)
manifest.webmanifest    PWA manifest
sw.js                   service worker (offline cache)
```

## Credits & third-party assets

- **toio Core Cube 3D model** (`models/toiocorecube_v003.gltf`) — from the [toio spec hardware shape page](https://toio.github.io/toio-spec/docs/hardware_shape/), © Sony Interactive Entertainment Inc., licensed **CC BY-ND 4.0**. Redistributed unmodified with attribution; displayed (scaled/rotated) at runtime without altering the source file.
- **Three.js** r128 (MIT) — bundled in `js/vendor/` for offline use.

## Disclaimer

This is an **independent, fan-made, unofficial** tool and is **not affiliated with Sony Interactive Entertainment Inc.**
`toio™` and related marks are trademarks of Sony Interactive Entertainment Inc.

## License

[MIT](LICENSE)

---

# toio デジタルツイン ビューワー

[toio™](https://toio.io) Core Cube 用の、独立した **デジタルツイン ビューワー兼ラジコン（遠隔操作）** Web アプリです。
**Web Bluetooth** で 1 台以上のキューブに接続し、位置・向き・LED・**軌跡**を **2D マップと 3D シーン**にリアルタイムで反映。**キーボードや画面上のボタン**でラジコンのように操作できます。

*Code Maker for toio* のデジタルツイン表示部分を取り出して特化させたもので、多言語対応・PWA 対応・カラーモード・複数キューブ接続・軌跡描画を引き継ぎ、遠隔操作機能を追加しています。

**主な機能:** リモート操作（矢印キー / WASD / 画面 D-pad、その場回転、LED、効果音）・デジタルツイン表示・2D/3D 表示と軌跡・複数キューブ・デモ（仮想）キューブ・マットクリックで移動・多言語（日本語/English/中文）・カラーテーマ（ライト/ダーク/ハイコントラスト）・PWA（インストール可・オフライン対応）。

**使い方:** Chrome / Edge で開き、「+ キューブ接続」で実機を接続するか「+ デモキューブ」で試用。実機はマットに載せると位置が反映されます。対象キューブを選び、`↑↓←→` または `WASD` で走行、`Space` で停止、`1`–`4` で対象切替、`0` で全体。マットをクリックするとその座標へ移動します。

本アプリは株式会社ソニー・インタラクティブエンタテインメントとは無関係の**ファンメイド・非公式**ツールです。`toio™` は同社の商標です。
