// Sprite loading and management

const cache = {};
let totalToLoad = 0;
let totalLoaded = 0;

export function loadImage(path) {
  if (cache[path]) return cache[path];

  totalToLoad++;
  const img = new Image();
  img.src = path;
  img.onload = () => { totalLoaded++; };
  img.onerror = () => { console.warn('Failed to load:', path); totalLoaded++; };
  cache[path] = img;
  return img;
}

export function getLoadProgress() {
  if (totalToLoad === 0) return 1;
  return totalLoaded / totalToLoad;
}

export function isLoaded() {
  return totalToLoad > 0 && totalLoaded >= totalToLoad;
}

// Preload all game sprites
export function preloadAll() {
  const paths = [
    // Chrys
    'sprites/chrys/idle.png', 'sprites/chrys/walk1.png', 'sprites/chrys/walk2.png',
    'sprites/chrys/attack.png', 'sprites/chrys/happy.png', 'sprites/chrys/cheer.png',
    'sprites/chrys/love.png', 'sprites/chrys/hearts.png',
    // Josh
    'sprites/josh/idle.png', 'sprites/josh/giving.png', 'sprites/josh/talking.png',
    // JP (DoppleJosher)
    'sprites/jp/idle.png', 'sprites/jp/attack.png', 'sprites/jp/glitch.png', 'sprites/jp/defeated.png',
    // Zelda (Junie)
    'sprites/zelda/idle.png', 'sprites/zelda/attack.png',
    'sprites/zelda/beg.png', 'sprites/zelda/nap.png',
    'sprites/zelda/sneak.png', 'sprites/zelda/zoomies.png',
    // Thorin
    'sprites/thorin/idle1.png', 'sprites/thorin/idle2.png',
    'sprites/thorin/hiss.png', 'sprites/thorin/swipe.png',
    'sprites/thorin/grumpy.png', 'sprites/thorin/loaf.png',
    'sprites/thorin/sit_angry.png', 'sprites/thorin/yawn.png', 'sprites/thorin/attack.png',
    // Enemies
    'sprites/enemies/rock-idle.png', 'sprites/enemies/rock-attack.png', 'sprites/enemies/rock-hurt.png',
    'sprites/enemies/fire-idle.png', 'sprites/enemies/fire-attack.png', 'sprites/enemies/fire-hurt.png',
    'sprites/enemies/lightning-idle.png', 'sprites/enemies/lightning-attack.png', 'sprites/enemies/lightning-hurt.png',
    // Ball Pikachu
    'sprites/ball/ball.png', 'sprites/ball/thrown.png', 'sprites/ball/open.png',
    // Title card
    'sprites/title-card@2x.png',
  ];

  paths.forEach(loadImage);
}

export function getSprite(path) {
  return cache[path] || null;
}
