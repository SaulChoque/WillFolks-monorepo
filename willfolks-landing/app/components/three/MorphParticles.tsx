"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { animate } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";
import { createStage, trackPointer, type Stage } from "@/lib/three/stage";
import { SHAPE_ORDER, buildShapes, type ShapeName } from "@/lib/three/shapes";
import { INK } from "@/lib/three/plastic";

const TURN = Math.PI * 2;

const VERTEX = /* glsl */ `
  attribute vec3 aSeed;
  uniform float uBurst;
  uniform float uTime;
  uniform float uSize;
  uniform float uScale;
  varying float vFade;

  void main() {
    // Scatter outwards while a morph is in flight, then settle.
    vec3 p = position + aSeed * uBurst;
    // Tiny per-particle shimmer so a resting shape still feels alive.
    p += 0.014 * sin(uTime * 1.6 + aSeed.x * 40.0) * aSeed.yzx;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.55 + 0.9 * fract(aSeed.x * 7.13 + 0.5));
    gl_PointSize = max(1.5, size * uScale / -mv.z);

    // Far side of the cloud reads lighter: depth without lighting.
    vFade = smoothstep(-1.7, 1.5, (modelMatrix * vec4(p, 1.0)).z);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vFade;

  void main() {
    gl_FragColor = vec4(uColor, mix(0.28, 1.0, vFade));
  }
`;

interface MorphParticlesProps {
  /** Index into SHAPE_ORDER. */
  index: number;
  className?: string;
}

interface Controller {
  morphTo: (name: ShapeName) => void;
}

export default function MorphParticles({ index, className }: MorphParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const indexRef = useRef(index);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = prefersReducedMotion();
    const count = window.innerWidth < 820 ? 4200 : 7600;
    const shapes = buildShapes(count);

    let material: THREE.ShaderMaterial | null = null;

    function onResize(_width: number, height: number, stage: Stage) {
      if (!material) return;
      const fov = THREE.MathUtils.degToRad(stage.camera.fov);
      material.uniforms.uScale.value = (height * stage.renderer.getPixelRatio()) / (2 * Math.tan(fov / 2));
      if (reduced) stage.renderOnce();
    }

    const stage = createStage(canvas, { maxDpr: 2, fov: 30, cameraZ: 8.2, antialias: false, onResize });
    if (!stage) return;

    const start = shapes[SHAPE_ORDER[indexRef.current]];
    const positions = new Float32Array(start);
    let target = start;

    const seeds = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = Math.random() * 2 - 1;
      seeds[i * 3 + 1] = Math.random() * 2 - 1;
      seeds[i * 3 + 2] = Math.random() * 2 - 1;
      speeds[i] = 2.4 + Math.random() * 5.2;
    }

    const geometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positionAttribute);
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    // Points move every frame; skip culling against a stale bounding sphere.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);

    material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uBurst: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 0.03 },
        uScale: { value: 1 },
        uColor: { value: new THREE.Color(INK) },
      },
    });

    const cloud = new THREE.Points(geometry, material);
    const tilt = new THREE.Group();
    tilt.add(cloud);
    tilt.rotation.x = 0.18;
    stage.scene.add(tilt);
    onResize(stage.size.width, stage.size.height, stage);

    // anime.js drives the "energy" of each morph; the loop reads it.
    // `turn` is the base angle: every morph adds one full revolution to it.
    const motion = { turn: 0 };
    const burst = material.uniforms.uBurst;
    let burstTween: ReturnType<typeof animate> | null = null;
    let spinTween: ReturnType<typeof animate> | null = null;

    controllerRef.current = {
      morphTo(name) {
        target = shapes[name];
        if (reduced) {
          positions.set(target);
          positionAttribute.needsUpdate = true;
          stage.renderOnce();
          return;
        }
        burstTween?.cancel();
        spinTween?.cancel();
        burstTween = animate(burst, { value: [0.85, 0], duration: 1300, ease: "outExpo" });
        spinTween = animate(motion, {
          turn: Math.round(motion.turn / TURN) * TURN + TURN,
          duration: 1700,
          ease: "outExpo",
        });
      },
    };

    if (reduced) {
      stage.renderOnce();
      return () => {
        controllerRef.current = null;
        stage.dispose();
      };
    }

    const pointer = trackPointer();

    stage.start((dt, elapsed) => {
      pointer.update(dt, 3);
      material!.uniforms.uTime.value = elapsed;

      for (let i = 0; i < count; i++) {
        const k = 1 - Math.exp(-speeds[i] * dt);
        const o = i * 3;
        positions[o] += (target[o] - positions[o]) * k;
        positions[o + 1] += (target[o + 1] - positions[o + 1]) * k;
        positions[o + 2] += (target[o + 2] - positions[o + 2]) * k;
      }
      positionAttribute.needsUpdate = true;

      // Sway on its own axis rather than spin freely: flat formations
      // (clock face, standing coin) never go fully edge-on.
      cloud.rotation.y = motion.turn + Math.sin(elapsed * 0.6) * 0.8;
      tilt.rotation.x = 0.18 + pointer.current.y * 0.22;
      tilt.rotation.z = -pointer.current.x * 0.1;
    });

    return () => {
      controllerRef.current = null;
      burstTween?.cancel();
      spinTween?.cancel();
      pointer.dispose();
      stage.dispose();
    };
  }, []);

  useEffect(() => {
    if (indexRef.current === index) return;
    indexRef.current = index;
    controllerRef.current?.morphTo(SHAPE_ORDER[index]);
  }, [index]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
