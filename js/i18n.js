/* i18n.js — Multi-language support for the toio Digital Twin Viewer.
   Languages: ja (Japanese), en (English), zh (Chinese, Simplified).
   To add a language: add an entry to LANGS below and an <option> in index.html. */

const LANGS = {

  /* ── Japanese ─────────────────────────────────────────────────────────── */
  ja: {
    'app.title':        'toio デジタルツイン ビューワー',
    'app.subtitle':     'ラジコン・遠隔操作',

    // Header / connection
    'ui.connect':       '+ キューブ接続',
    'ui.addDemo':       '+ デモキューブ',
    'ui.disconnect':    '切断',
    'ui.connecting':    '接続中…',
    'ui.notSupported':  'このブラウザは Web Bluetooth に対応していません（Chrome / Edge を推奨）。',

    // View
    'ui.view2d':        '2D',
    'ui.view3d':        '3D',
    'ui.mat':           'マット',
    'ui.matSimple':     '簡易プレイマット (A3)',
    'ui.matOriginal':   'トイコレマット(表)',
    'ui.fullscreen':    '全画面',
    'ui.exitFullscreen':'全画面解除',
    'ui.resetView':     '視点リセット',
    'ui.clearTrail':    '軌跡クリア',
    'ui.trail':         '軌跡',

    // Theme / language
    'ui.theme':         'テーマ',
    'ui.themeLight':    'ライト',
    'ui.themeDark':     'ダーク',
    'ui.themeHc':       'ハイコントラスト',
    'ui.lang':          '言語',
    'ui.install':       'アプリをインストール',
    'ui.about':         'このアプリについて',

    // Cube panel
    'ui.cubes':         'キューブ',
    'ui.noCubes':       'キューブが接続されていません。',
    'ui.noCubesHint':   '「+ キューブ接続」で実機を接続するか、「+ デモキューブ」で仮想キューブを試せます。',
    'ui.demoTag':       'デモ',
    'ui.realTag':       '実機',
    'ui.offMat':        'マット外',
    'ui.battery':       'バッテリー',
    'ui.press':         'ボタン',

    // Remote control
    'ui.remote':        'リモート操作',
    'ui.target':        '操作対象',
    'ui.targetAll':     'すべて',
    'ui.speed':         '速度',
    'ui.forward':       '前進',
    'ui.back':          '後退',
    'ui.turnLeft':      '左回転',
    'ui.turnRight':     '右回転',
    'ui.stop':          '停止',
    'ui.led':           'LED',
    'ui.sound':         'サウンド',
    'ui.spin':          'その場回転',
    'ui.center':        '中央へ',
    'ui.keyboardHint':  'キーボード: ↑↓←→ または W/A/S/D で操作、スペースで停止。数字キー 1–4 で対象キューブ切替、0 で全体。マットをクリックで移動。',
    'ui.clickToMove':   'マットをクリックすると対象キューブがその地点へ移動します。',

    // LED colors
    'color.red':        '赤',
    'color.green':      '緑',
    'color.blue':       '青',
    'color.white':      '白',
    'color.yellow':     '黄',
    'color.cyan':       'シアン',
    'color.pink':       'ピンク',
    'color.off':        'OFF',

    // Sound effects
    'sound.enter':      '入場',
    'sound.select':     '選択',
    'sound.cancel':     'キャンセル',
    'sound.cursor':     'カーソル',
    'sound.mat':        'マット',
    'sound.item':       'アイテム',
    'sound.score':      '得点',
    'sound.error':      'エラー',

    // 3D toolbar
    'sim3d.orbit':      '視点',
    'sim3d.trail':      '軌跡',
    'sim3d.hintOrbit':  'ドラッグ: 視点回転  ホイール: ズーム  右ドラッグ: パン',

    // Status / messages
    'msg.ready':        'toio デジタルツイン ビューワーを起動しました。',
    'msg.connected':    'を接続しました。',
    'msg.disconnected': 'を切断しました。',
    'msg.failed':       'に接続できませんでした。',
    'msg.demoAdded':    'デモキューブを追加しました。',
    'msg.installed':    'インストールできます。ボタンから追加してください。',

    // About dialog
    'about.title':      'このアプリについて',
    'about.desc':       'toio™ Core Cube の位置・向き・LED をリアルタイムに 2D/3D 表示し、キーボードや画面上のボタンでラジコンのように遠隔操作できるデジタルツイン ビューワーです。複数キューブ接続・軌跡描画に対応。',
    'about.fanMade':    'ファンメイド・非公式ツール',
    'about.disclaimer': 'このアプリは株式会社ソニー・インタラクティブエンタテインメントとは無関係の個人が制作したファンメイドツールです。toio™ は同社の商標です。',
    'about.oss':        'オープンソース (MIT ライセンス)',
    'about.github':     'GitHub リポジトリ',
    'about.official':   'toio 公式サイト',
    'about.close':      '閉じる',
  },

  /* ── English ──────────────────────────────────────────────────────────── */
  en: {
    'app.title':        'toio Digital Twin Viewer',
    'app.subtitle':     'RC / Remote Control',

    'ui.connect':       '+ Connect Cube',
    'ui.addDemo':       '+ Demo Cube',
    'ui.disconnect':    'Disconnect',
    'ui.connecting':    'Connecting…',
    'ui.notSupported':  'This browser does not support Web Bluetooth (use Chrome / Edge).',

    'ui.view2d':        '2D',
    'ui.view3d':        '3D',
    'ui.mat':           'Mat',
    'ui.matSimple':     'Simple Play Mat (A3)',
    'ui.matOriginal':   'Toio Collection Mat',
    'ui.fullscreen':    'Fullscreen',
    'ui.exitFullscreen':'Exit Fullscreen',
    'ui.resetView':     'Reset View',
    'ui.clearTrail':    'Clear Trail',
    'ui.trail':         'Trail',

    'ui.theme':         'Theme',
    'ui.themeLight':    'Light',
    'ui.themeDark':     'Dark',
    'ui.themeHc':       'High Contrast',
    'ui.lang':          'Language',
    'ui.install':       'Install App',
    'ui.about':         'About',

    'ui.cubes':         'Cubes',
    'ui.noCubes':       'No cubes connected.',
    'ui.noCubesHint':   'Use "+ Connect Cube" for a real cube, or "+ Demo Cube" to try a virtual one.',
    'ui.demoTag':       'Demo',
    'ui.realTag':       'Real',
    'ui.offMat':        'Off mat',
    'ui.battery':       'Battery',
    'ui.press':         'Button',

    'ui.remote':        'Remote Control',
    'ui.target':        'Target',
    'ui.targetAll':     'All',
    'ui.speed':         'Speed',
    'ui.forward':       'Forward',
    'ui.back':          'Back',
    'ui.turnLeft':      'Turn Left',
    'ui.turnRight':     'Turn Right',
    'ui.stop':          'Stop',
    'ui.led':           'LED',
    'ui.sound':         'Sound',
    'ui.spin':          'Spin',
    'ui.center':        'Center',
    'ui.keyboardHint':  'Keyboard: ↑↓←→ or W/A/S/D to drive, Space to stop. Number keys 1–4 select a cube, 0 selects all. Click the mat to move.',
    'ui.clickToMove':   'Click the mat to send the target cube to that point.',

    'color.red':        'Red',
    'color.green':      'Green',
    'color.blue':       'Blue',
    'color.white':      'White',
    'color.yellow':     'Yellow',
    'color.cyan':       'Cyan',
    'color.pink':       'Pink',
    'color.off':        'OFF',

    'sound.enter':      'Enter',
    'sound.select':     'Select',
    'sound.cancel':     'Cancel',
    'sound.cursor':     'Cursor',
    'sound.mat':        'Mat',
    'sound.item':       'Item',
    'sound.score':      'Score',
    'sound.error':      'Error',

    'sim3d.orbit':      'Orbit',
    'sim3d.trail':      'Trail',
    'sim3d.hintOrbit':  'Drag: rotate  Wheel: zoom  Right-drag: pan',

    'msg.ready':        'toio Digital Twin Viewer started.',
    'msg.connected':    ' connected.',
    'msg.disconnected': ' disconnected.',
    'msg.failed':       ' failed to connect.',
    'msg.demoAdded':    'Demo cube added.',
    'msg.installed':    'Ready to install — use the button to add the app.',

    'about.title':      'About This App',
    'about.desc':       'A digital twin viewer that shows a toio™ Core Cube\'s position, heading and LED in real time (2D/3D) and lets you drive it like an RC car from the keyboard or on-screen buttons. Supports multiple cubes and trajectory drawing.',
    'about.fanMade':    'Fan-made / Unofficial Tool',
    'about.disclaimer': 'This app is an independent fan-made tool, not affiliated with Sony Interactive Entertainment Inc. toio™ is their trademark.',
    'about.oss':        'Open Source (MIT License)',
    'about.github':     'GitHub Repository',
    'about.official':   'toio Official Site',
    'about.close':      'Close',
  },

  /* ── Chinese (Simplified) ─────────────────────────────────────────────── */
  zh: {
    'app.title':        'toio 数字孪生查看器',
    'app.subtitle':     '遥控操作',

    'ui.connect':       '+ 连接方块',
    'ui.addDemo':       '+ 演示方块',
    'ui.disconnect':    '断开',
    'ui.connecting':    '连接中…',
    'ui.notSupported':  '此浏览器不支持 Web Bluetooth（建议使用 Chrome / Edge）。',

    'ui.view2d':        '2D',
    'ui.view3d':        '3D',
    'ui.mat':           '垫子',
    'ui.matSimple':     '简易游戏垫 (A3)',
    'ui.matOriginal':   '原版游戏垫',
    'ui.fullscreen':    '全屏',
    'ui.exitFullscreen':'退出全屏',
    'ui.resetView':     '重置视角',
    'ui.clearTrail':    '清除轨迹',
    'ui.trail':         '轨迹',

    'ui.theme':         '主题',
    'ui.themeLight':    '明亮',
    'ui.themeDark':     '暗黑',
    'ui.themeHc':       '高对比度',
    'ui.lang':          '语言',
    'ui.install':       '安装应用',
    'ui.about':         '关于',

    'ui.cubes':         '方块',
    'ui.noCubes':       '未连接方块。',
    'ui.noCubesHint':   '使用“+ 连接方块”连接真实设备，或“+ 演示方块”试用虚拟方块。',
    'ui.demoTag':       '演示',
    'ui.realTag':       '真实',
    'ui.offMat':        '垫外',
    'ui.battery':       '电量',
    'ui.press':         '按钮',

    'ui.remote':        '遥控',
    'ui.target':        '目标',
    'ui.targetAll':     '全部',
    'ui.speed':         '速度',
    'ui.forward':       '前进',
    'ui.back':          '后退',
    'ui.turnLeft':      '左转',
    'ui.turnRight':     '右转',
    'ui.stop':          '停止',
    'ui.led':           'LED',
    'ui.sound':         '声音',
    'ui.spin':          '原地旋转',
    'ui.center':        '回中心',
    'ui.keyboardHint':  '键盘：↑↓←→ 或 W/A/S/D 驾驶，空格停止。数字键 1–4 选择方块，0 选择全部。点击垫子移动。',
    'ui.clickToMove':   '点击垫子让目标方块移动到该点。',

    'color.red':        '红',
    'color.green':      '绿',
    'color.blue':       '蓝',
    'color.white':      '白',
    'color.yellow':     '黄',
    'color.cyan':       '青',
    'color.pink':       '粉',
    'color.off':        '关',

    'sound.enter':      '入场',
    'sound.select':     '选择',
    'sound.cancel':     '取消',
    'sound.cursor':     '光标',
    'sound.mat':        '垫子',
    'sound.item':       '道具',
    'sound.score':      '得分',
    'sound.error':      '错误',

    'sim3d.orbit':      '视角',
    'sim3d.trail':      '轨迹',
    'sim3d.hintOrbit':  '拖拽：旋转  滚轮：缩放  右键拖拽：平移',

    'msg.ready':        'toio 数字孪生查看器已启动。',
    'msg.connected':    ' 已连接。',
    'msg.disconnected': ' 已断开。',
    'msg.failed':       ' 连接失败。',
    'msg.demoAdded':    '已添加演示方块。',
    'msg.installed':    '可以安装 — 请点击按钮添加应用。',

    'about.title':      '关于本应用',
    'about.desc':       '一款数字孪生查看器：以 2D/3D 实时显示 toio™ Core Cube 的位置、朝向与 LED，并可通过键盘或屏幕按钮像遥控车一样操控。支持多方块连接与轨迹绘制。',
    'about.fanMade':    '粉丝制作 / 非官方工具',
    'about.disclaimer': '本应用为个人制作的粉丝工具，与索尼互动娱乐株式会社无关。toio™ 为其商标。',
    'about.oss':        '开源 (MIT 许可证)',
    'about.github':     'GitHub 仓库',
    'about.official':   'toio 官方网站',
    'about.close':      '关闭',
  },
};

/* ── Public API ─────────────────────────────────────────────────────────── */
const _SUPPORTED = Object.keys(LANGS);
let _current = localStorage.getItem('lang') || (navigator.language || 'ja').slice(0, 2);
if (!_SUPPORTED.includes(_current)) _current = 'ja';

function t(key) {
  return (LANGS[_current] && LANGS[_current][key]) ||
         (LANGS['ja'] && LANGS['ja'][key]) ||
         key;
}

function currentLang() { return _current; }

function setLang(lang) {
  if (!_SUPPORTED.includes(lang)) return;
  localStorage.setItem('lang', lang);
  location.reload();
}

/** Apply all data-i18n / data-i18n-title / data-i18n-ph attributes in the DOM. */
function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
}

window.t           = t;
window.currentLang = currentLang;
window.setLang     = setLang;
window.applyI18n   = applyI18n;
window.LANGS       = LANGS;
