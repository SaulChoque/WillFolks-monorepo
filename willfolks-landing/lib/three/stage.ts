import * as THREE from "three";

export interface StageOptions {
  /** Cap on devicePixelRatio; transmission passes get expensive above ~1.5. */
  maxDpr?: number;
  fov?: number;
  cameraZ?: number;
  antialias?: boolean;
  onResize?: (width: number, height: number, stage: Stage) => void;
}

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Size of the canvas in CSS pixels. */
  size: { width: number; height: number };
  /** World-space width/height visible at z = 0. */
  viewport: { width: number; height: number };
  start: (frame: (dt: number, elapsed: number) => void) => void;
  renderOnce: () => void;
  dispose: () => void;
}

/**
 * Minimal three.js lifecycle: transparent renderer, resize tracking, and a
 * render loop that only runs while the canvas is on screen and the tab is
 * visible. Returns null when WebGL is unavailable so callers can degrade.
 */
export function createStage(canvas: HTMLCanvasElement, options: StageOptions = {}): Stage | null {
  const { maxDpr = 1.5, fov = 30, cameraZ = 10, antialias = true, onResize } = options;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, cameraZ);

  const stage: Stage = {
    renderer,
    scene,
    camera,
    size: { width: 1, height: 1 },
    viewport: { width: 1, height: 1 },
    start,
    renderOnce: () => renderer.render(scene, camera),
    dispose,
  };

  const host = canvas.parentElement ?? canvas;

  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    stage.size = { width, height };
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * cameraZ;
    stage.viewport = { width: visibleHeight * camera.aspect, height: visibleHeight };
    onResize?.(width, height, stage);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  let onScreen = true;
  let frameId = 0;
  let last = 0;
  let elapsed = 0;
  let frameFn: ((dt: number, elapsed: number) => void) | null = null;

  const intersection = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      schedule();
    },
    { rootMargin: "120px" },
  );
  intersection.observe(host);

  function onVisibility() {
    schedule();
  }
  document.addEventListener("visibilitychange", onVisibility);

  function tick(now: number) {
    frameId = 0;
    if (!frameFn) return;
    // Clamp so a background tab does not produce one giant catch-up step.
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    elapsed += dt;
    frameFn(dt, elapsed);
    renderer.render(scene, camera);
    schedule();
  }

  function schedule() {
    const active = onScreen && !document.hidden && frameFn !== null;
    if (active && !frameId) {
      frameId = requestAnimationFrame(tick);
    } else if (!active && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      last = 0;
    }
  }

  function start(frame: (dt: number, elapsed: number) => void) {
    frameFn = frame;
    schedule();
  }

  function dispose() {
    frameFn = null;
    if (frameId) cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersection.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
    scene.environment?.dispose();
    renderer.dispose();
  }

  return stage;
}

/** Smoothed, normalised pointer position (-1..1) for parallax. */
export function trackPointer() {
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  function onMove(event: PointerEvent) {
    target.x = (event.clientX / window.innerWidth) * 2 - 1;
    target.y = (event.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener("pointermove", onMove, { passive: true });

  return {
    current,
    update(dt: number, stiffness = 4) {
      const k = 1 - Math.exp(-stiffness * dt);
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
    },
    dispose() {
      window.removeEventListener("pointermove", onMove);
    },
  };
}
