"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { animate, onScroll, stagger } from "animejs";
import "animejs/adapters/three";
import { logoSvgString } from "@/lib/logo";
import { prefersReducedMotion } from "@/lib/motion";
import { createStage, trackPointer, type Stage } from "@/lib/three/stage";
import { ACID, INK, applyStudioEnvironment, createInk, createPlastic } from "@/lib/three/plastic";

const LOGO_WIDTH = 4.6;
const DUST_COUNT = 420;

interface Orbiter {
  mesh: THREE.Mesh;
  angle: number;
  radius: number;
  height: number;
  speed: number;
  spin: THREE.Vector3;
}

/** Extrude the brand mark into a chunky, bevelled slab. */
function buildLogoGeometry(): THREE.ExtrudeGeometry {
  const data = new SVGLoader().parse(logoSvgString());
  const shapes = data.paths.flatMap((path) => path.toShapes());
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 52,
    bevelEnabled: true,
    bevelThickness: 9,
    bevelSize: 5,
    // Pull the bevel inwards so the three leaves keep their hairline gaps.
    bevelOffset: -5,
    bevelSegments: 5,
    curveSegments: 24,
  });
  geometry.center();
  geometry.computeBoundingBox();
  const width = geometry.boundingBox!.max.x - geometry.boundingBox!.min.x;
  const scale = LOGO_WIDTH / width;
  geometry.scale(scale, scale, scale);
  // SVG y points down; a half turn about X fixes it without mirroring faces.
  geometry.rotateX(Math.PI);
  return geometry;
}

function buildCrossGeometry(): THREE.ExtrudeGeometry {
  const a = 0.14;
  const b = 0.42;
  const shape = new THREE.Shape();
  shape.moveTo(-a, -b);
  shape.lineTo(a, -b);
  shape.lineTo(a, -a);
  shape.lineTo(b, -a);
  shape.lineTo(b, a);
  shape.lineTo(a, a);
  shape.lineTo(a, b);
  shape.lineTo(-a, b);
  shape.lineTo(-a, a);
  shape.lineTo(-b, a);
  shape.lineTo(-b, -a);
  shape.lineTo(-a, -a);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 3,
  });
  geometry.center();
  return geometry;
}

export default function HeroScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = prefersReducedMotion();
    let rig: THREE.Group | null = null;
    const backdrop = new THREE.Group();

    function layout(width: number, _height: number, stage: Stage) {
      if (!rig) return;
      const { width: vw, height: vh } = stage.viewport;
      const compact = width < 820;
      // On narrow screens the ink bars would cross the headline, so drop them.
      backdrop.visible = !compact;
      if (compact) {
        rig.position.set(vw * 0.16, vh * 0.335, 0);
        rig.scale.setScalar(Math.min(0.5, vw / 8.6));
      } else {
        rig.position.set(vw * 0.27, vh * 0.17, 0);
        rig.scale.setScalar(THREE.MathUtils.clamp(vw / 18.5, 0.68, 1.04));
      }
      if (reduced) stage.renderOnce();
    }

    const stage = createStage(canvas, { maxDpr: 1.5, fov: 28, cameraZ: 12, onResize: layout });
    if (!stage) return;
    const { scene, renderer } = stage;

    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.15;
    applyStudioEnvironment(renderer, scene);

    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-4, 6, 8);
    const rim = new THREE.PointLight(ACID, 40, 30);
    rim.position.set(5, -2, 4);
    scene.add(key, rim);

    rig = new THREE.Group();
    scene.add(rig);

    const plastic = createPlastic();
    const deepPlastic = createPlastic({ color: 0x9be400, frost: 0.55, attenuationDistance: 0.7 });
    const ink = createInk();

    // --- Ink graphics behind the mark: they are what the plastic refracts.
    backdrop.position.z = -1.9;
    const barGeometry = new THREE.BoxGeometry(3.7, 0.1, 0.05);
    for (let i = 0; i < 11; i++) {
      const bar = new THREE.Mesh(barGeometry, ink);
      bar.position.y = (i - 5) * 0.21;
      bar.scale.y = 0.45 + (i / 10) * 1.1;
      backdrop.add(bar);
    }
    backdrop.position.x = 0.5;
    backdrop.position.y = -0.1;
    rig.add(backdrop);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: INK });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.012, 8, 160), ringMaterial);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.012, 8, 160), ringMaterial);
    ringA.rotation.x = Math.PI / 2.35;
    ringB.rotation.set(Math.PI / 2.9, 0.5, 0);
    rig.add(ringA, ringB);

    // --- The mark. `logoSpin` turns forever; `logo` carries the intro tween.
    const logoSpin = new THREE.Group();
    const logo = new THREE.Mesh(buildLogoGeometry(), plastic);
    logoSpin.add(logo);
    logoSpin.rotation.set(0.18, -0.5, -0.06);
    rig.add(logoSpin);

    // --- Orbiting toys, each spinning on its own axis.
    const orbitGeometries: [THREE.BufferGeometry, THREE.Material][] = [
      [new THREE.CylinderGeometry(0.42, 0.42, 0.1, 48), plastic],
      [buildCrossGeometry(), deepPlastic],
      [new THREE.CapsuleGeometry(0.17, 0.42, 6, 18), ink],
      [new RoundedBoxGeometry(0.56, 0.56, 0.56, 4, 0.12), plastic],
      [new THREE.TorusGeometry(0.3, 0.12, 18, 48), deepPlastic],
      [new THREE.IcosahedronGeometry(0.3, 0), ink],
      [new THREE.SphereGeometry(0.26, 32, 24), plastic],
    ];
    const orbit = new THREE.Group();
    orbit.rotation.set(0.42, 0, -0.16);
    rig.add(orbit);

    const orbiters: Orbiter[] = orbitGeometries.map(([geometry, material], i) => {
      const mesh = new THREE.Mesh(geometry, material);
      orbit.add(mesh);
      return {
        mesh,
        angle: (i / orbitGeometries.length) * Math.PI * 2,
        radius: 3.25 + (i % 3) * 0.28 - 0.28,
        height: Math.sin(i * 2.1) * 0.35,
        speed: 0.11 + (i % 4) * 0.012,
        spin: new THREE.Vector3(0.5 + (i % 3) * 0.35, 0.8 - (i % 2) * 0.45, 0.25 + (i % 4) * 0.2),
      };
    });

    function placeOrbiters() {
      for (const o of orbiters) {
        o.mesh.position.set(Math.cos(o.angle) * o.radius, o.height, Math.sin(o.angle) * o.radius);
      }
    }
    placeOrbiters();

    // --- Dust: square ink particles drifting up through the whole hero.
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustSpeeds = new Float32Array(DUST_COUNT);
    const DUST_BOX = { x: 26, y: 13, z: 9 };
    for (let i = 0; i < DUST_COUNT; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * DUST_BOX.x;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * DUST_BOX.y;
      dustPositions[i * 3 + 2] = (Math.random() - 0.7) * DUST_BOX.z;
      dustSpeeds[i] = 0.12 + Math.random() * 0.4;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({ color: INK, size: 0.055, sizeAttenuation: true }),
    );
    scene.add(dust);

    layout(stage.size.width, stage.size.height, stage);

    if (reduced) {
      stage.renderOnce();
      return () => stage.dispose();
    }

    // --- Intro, driven by anime.js through its three.js adapter.
    const intro = [
      animate(logo, {
        scale: [0, 1],
        rotateY: [-220, 0],
        duration: 2200,
        delay: 350,
        ease: "outElastic(1, .7)",
      }),
      animate(
        orbiters.map((o) => o.mesh),
        { scale: [0, 1], duration: 900, delay: stagger(80, { start: 900 }), ease: "outBack(2.2)" },
      ),
      animate([ringA, ringB, backdrop], {
        scale: [0, 1],
        duration: 1400,
        delay: stagger(140, { start: 300 }),
        ease: "outExpo",
      }),
    ];

    // --- Scroll: the rig lifts and tilts as the hero leaves the viewport.
    let scrollProgress = 0;
    const section = canvas.closest("section");
    const scrollObserver = section
      ? onScroll({
          target: section,
          enter: "start start",
          leave: "start end",
          onUpdate: (self) => {
            scrollProgress = self.progress;
          },
        })
      : null;

    const pointer = trackPointer();

    // The resting height depends on the breakpoint, so derive it per frame
    // instead of capturing a value that goes stale on resize.
    const restingY = () => stage.viewport.height * (stage.size.width < 820 ? 0.335 : 0.17);

    stage.start((dt, elapsed) => {
      pointer.update(dt);
      const activeRig = rig!;

      logoSpin.rotation.y += dt * (0.32 + scrollProgress * 2.4);
      logoSpin.position.y = Math.sin(elapsed * 0.9) * 0.12;

      for (const o of orbiters) {
        o.angle += dt * o.speed;
        o.mesh.rotation.x += dt * o.spin.x;
        o.mesh.rotation.y += dt * o.spin.y;
        o.mesh.rotation.z += dt * o.spin.z;
      }
      placeOrbiters();

      ringA.rotation.z += dt * 0.08;
      ringB.rotation.z -= dt * 0.05;

      // Pointer parallax: near things move more than far things.
      activeRig.rotation.y = pointer.current.x * 0.22;
      activeRig.rotation.x = pointer.current.y * 0.12 + scrollProgress * 0.5;
      backdrop.position.x = 0.5 - pointer.current.x * 0.35;
      backdrop.position.y = -0.1 + pointer.current.y * 0.2;
      activeRig.position.y = restingY() + scrollProgress * stage.viewport.height * 0.35;

      const positions = dustGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DUST_COUNT; i++) {
        let y = positions.getY(i) + dustSpeeds[i] * dt;
        if (y > DUST_BOX.y / 2) y = -DUST_BOX.y / 2;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
      dust.position.x = -pointer.current.x * 0.5;
      dust.position.y = pointer.current.y * 0.3 + scrollProgress * 2.5;
    });

    return () => {
      intro.forEach((animation) => animation.revert());
      scrollObserver?.revert();
      pointer.dispose();
      stage.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
