"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGlowCanvas } from "@/lib/three-utils";

// ── State machine ──────────────────────────────────────────────
type Phase = "superposition" | "measuring" | "collapsed" | "resetting";

// ── Component ──────────────────────────────────────────────────
export default function SuperpositionShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const phaseRef = useRef<Phase>("superposition");

  // Qubit state on the Bloch sphere: theta (0..PI from north), phi (azimuthal)
  const thetaRef = useRef(Math.PI / 3); // starting at ~60° from north pole
  const phiRef = useRef(0);
  const targetThetaRef = useRef(Math.PI / 3);
  const collapsedValueRef = useRef(0); // 0 or 1
  const collapseStartTimeRef = useRef(0);

  // Camera orbit
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 6 });
  const cameraDistance = 9;

  // ── Setup Three.js scene ──────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    cameraRef.current = camera;

    // ── Bloch Sphere ──────────────────────────────────────────
    const sphereRadius = 2;

    // Translucent sphere with vertex colors (red top, blue bottom)
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const sphereColors = new Float32Array(sphereGeo.attributes.position.count * 3);
    const posAttr = sphereGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i); // -sphereRadius..+sphereRadius
      const t = (y / sphereRadius + 1) / 2; // 0 (bottom) to 1 (top)
      // Blue bottom → purple middle → red top
      sphereColors[i * 3] = 0.1 + t * 0.85;     // R
      sphereColors[i * 3 + 1] = 0.15 * (1 - t); // G
      sphereColors[i * 3 + 2] = 0.85 * (1 - t) + 0.1; // B
    }
    sphereGeo.setAttribute("color", new THREE.BufferAttribute(sphereColors, 3));

    const sphereMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Wireframe rings (latitude lines)
    for (let i = 1; i < 6; i++) {
      const latAngle = (i / 6) * Math.PI;
      const r = sphereRadius * Math.sin(latAngle);
      const y = sphereRadius * Math.cos(latAngle);
      const ringGeo = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path()
          .absarc(0, 0, r, 0, Math.PI * 2, false)
          .getPoints(64)
          .map((p) => new THREE.Vector3(p.x, y, p.y))
      );
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x8855ff,
        transparent: true,
        opacity: 0.15,
      });
      scene.add(new THREE.Line(ringGeo, ringMat));
    }

    // Wireframe meridian lines
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const t = (j / 64) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            sphereRadius * Math.sin(t) * Math.cos(angle),
            sphereRadius * Math.cos(t),
            sphereRadius * Math.sin(t) * Math.sin(angle)
          )
        );
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x8855ff,
        transparent: true,
        opacity: 0.1,
      });
      scene.add(new THREE.Line(lineGeo, lineMat));
    }

    // ── Axes ──────────────────────────────────────────────────
    // Z-axis (north pole)
    const zAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -sphereRadius - 0.5, 0),
      new THREE.Vector3(0, sphereRadius + 0.5, 0),
    ]);
    const zAxisMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    scene.add(new THREE.Line(zAxisGeo, zAxisMat));

    // X-axis
    const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-sphereRadius - 0.5, 0, 0),
      new THREE.Vector3(sphereRadius + 0.5, 0, 0),
    ]);
    scene.add(new THREE.Line(xAxisGeo, zAxisMat.clone()));

    // Y-axis
    const yAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -sphereRadius - 0.5),
      new THREE.Vector3(0, 0, sphereRadius + 0.5),
    ]);
    scene.add(new THREE.Line(yAxisGeo, zAxisMat.clone()));

    // ── Qubit particle (glowing sphere) ───────────────────────
    const qubitGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const qubitMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xccaaff,
      emissiveIntensity: 2,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 1,
    });
    const qubit = new THREE.Mesh(qubitGeo, qubitMat);
    qubit.name = "qubit";
    scene.add(qubit);

    // Qubit glow sprite
    const glowTexture = new THREE.CanvasTexture(createGlowCanvas(0xb48cff));
    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(1.2, 1.2, 1);
    glowSprite.name = "glow";
    scene.add(glowSprite);

    // ── North/South pole indicators ───────────────────────────
    const poleGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const northMat = new THREE.MeshBasicMaterial({ color: 0xff4466 });
    const southMat = new THREE.MeshBasicMaterial({ color: 0x4488ff });
    const northPole = new THREE.Mesh(poleGeo, northMat);
    northPole.position.set(0, sphereRadius, 0);
    scene.add(northPole);
    const southPole = new THREE.Mesh(poleGeo, southMat);
    southPole.position.set(0, -sphereRadius, 0);
    scene.add(southPole);

    // ── Measurement flash ring ─────────────────────────────────
    const flashRingGeo = new THREE.RingGeometry(0.1, 0.15, 64);
    const flashRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flashRing = new THREE.Mesh(flashRingGeo, flashRingMat);
    flashRing.name = "flash";
    scene.add(flashRing);

    // ── Ambient + Point lights ─────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xaabbff, 2, 20);
    pointLight.position.set(3, 4, 3);
    scene.add(pointLight);
    const pointLight2 = new THREE.PointLight(0xff6688, 1, 15);
    pointLight2.position.set(-3, -2, -3);
    scene.add(pointLight2);

    // ── Mouse events for camera orbit ─────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      didDragRef.current = false;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDragRef.current = true;
      cameraAngleRef.current.phi -= dx * 0.005;
      cameraAngleRef.current.theta = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, cameraAngleRef.current.theta - dy * 0.005)
      );
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        didDragRef.current = false;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDragRef.current = true;
      cameraAngleRef.current.phi -= dx * 0.005;
      cameraAngleRef.current.theta = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, cameraAngleRef.current.theta - dy * 0.005)
      );
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    // Click to measure (only if not dragging)
    const onClick = () => {
      if (phaseRef.current !== "superposition") return;
      if (didDragRef.current) return; // ignore click after drag
      phaseRef.current = "measuring";
      collapsedValueRef.current = Math.random() < 0.5 ? 0 : 1;
      // Collapse to |0⟩ (south, theta=PI) or |1⟩ (north, theta=0)
      targetThetaRef.current = collapsedValueRef.current === 1 ? 0.05 : Math.PI - 0.05;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
    renderer.domElement.addEventListener("touchend", onTouchEnd);
    renderer.domElement.addEventListener("click", onClick);

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      // Dispose shared ghost resources
      if (sceneRef.current?.userData.sharedGhostGeo) {
        sceneRef.current.userData.sharedGhostGeo.dispose();
      }
      if (sceneRef.current?.userData.sharedGhostMat) {
        sceneRef.current.userData.sharedGhostMat.dispose();
      }
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mouseleave", onMouseUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const visibleRef = useRef(true);

  // ── Animation loop ──────────────────────────────────────────
  useEffect(() => {
    const animate = () => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      if (!scene || !camera || !renderer) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const time = clockRef.current.getElapsedTime();
      const phase = phaseRef.current;

      // ── Camera orbit ────────────────────────────────────────
      const ca = cameraAngleRef.current;
      camera.position.set(
        cameraDistance * Math.sin(ca.theta) * Math.cos(ca.phi),
        cameraDistance * Math.cos(ca.theta),
        cameraDistance * Math.sin(ca.theta) * Math.sin(ca.phi)
      );
      camera.lookAt(0, 0, 0);

      // ── Qubit position update ───────────────────────────────
      const qubit = scene.getObjectByName("qubit") as THREE.Mesh;
      const glow = scene.getObjectByName("glow") as THREE.Sprite;
      const flash = scene.getObjectByName("flash") as THREE.Mesh;
      const sphereR = 2;

      if (phase === "superposition") {
        // Orbit around the sphere surface — superposition state
        const speed = 0.8;
        phiRef.current += speed * 0.016;
        // Slight wobble in theta
        thetaRef.current =
          thetaRef.current * 0.98 + targetThetaRef.current * 0.02;

        // Slowly drift theta for visual interest
        targetThetaRef.current =
          Math.PI / 3 + Math.sin(time * 0.3) * 0.4;

        const theta = thetaRef.current;
        const phi = phiRef.current;

        const x = sphereR * Math.sin(theta) * Math.cos(phi);
        const y = sphereR * Math.cos(theta);
        const z = sphereR * Math.sin(theta) * Math.sin(phi);

        if (qubit) {
          qubit.position.set(x, y, z);
          // Pulsing scale
          const pulse = 1 + Math.sin(time * 3) * 0.15;
          qubit.scale.setScalar(pulse);
          (qubit.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
            1.5 + Math.sin(time * 4) * 0.5;
        }
        if (glow) {
          glow.position.copy(qubit.position);
          const glowPulse = 1 + Math.sin(time * 2) * 0.2;
          glow.scale.setScalar(1.2 * glowPulse);
        }

        // Trail effect — spawn ghost particles at previous positions
        // Use a frame counter to limit spawn rate (~3 per second)
        if (!scene.userData.ghostTimer) scene.userData.ghostTimer = 0;
        scene.userData.ghostTimer++;
        if (scene.userData.ghostTimer % 20 === 0 && qubit) {
          // Object pool: reuse geometries and materials
          if (!scene.userData.sharedGhostGeo) {
            scene.userData.sharedGhostGeo = new THREE.SphereGeometry(0.04, 8, 8);
            scene.userData.sharedGhostMat = new THREE.MeshBasicMaterial({
              color: 0xaa88ff,
              transparent: true,
              opacity: 0.4,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
          }
          const ghost = new THREE.Mesh(
            scene.userData.sharedGhostGeo,
            scene.userData.sharedGhostMat.clone()
          );
          ghost.position.copy(qubit.position);
          ghost.userData.life = 1.0; // starts at full opacity
          ghost.name = "ghost";
          scene.add(ghost);
        }

        // Fade all existing ghosts each frame (iterate directly to avoid array allocation)
        for (let i = scene.children.length - 1; i >= 0; i--) {
          const child = scene.children[i];
          if (child.name !== "ghost") continue;
          const g = child as THREE.Mesh;
          g.userData.life = (g.userData.life || 1) - 0.02;
          const mat = g.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, g.userData.life * 0.4);
          if (g.userData.life <= 0) {
            scene.remove(g);
            mat.dispose();
          }
        }
      } else if (phase === "measuring") {
        // Animate collapse — flash + movement to pole
        const theta = thetaRef.current;
        const target = targetThetaRef.current;

        // Smooth interpolation
        thetaRef.current += (target - theta) * 0.06;

        // Flash ring
        if (flash) {
          const fMat = flash.material as THREE.MeshBasicMaterial;
          fMat.opacity = Math.min(1, fMat.opacity + 0.05);
          const flashScale = 1 + (1 - fMat.opacity) * 4;
          flash.scale.setScalar(flashScale);
          flash.lookAt(camera.position);
        }

        const currentTheta = thetaRef.current;
        const x = sphereR * Math.sin(currentTheta) * Math.cos(phiRef.current);
        const y = sphereR * Math.cos(currentTheta);
        const z = sphereR * Math.sin(currentTheta) * Math.sin(phiRef.current);

        if (qubit) {
          qubit.position.set(x, y, z);
          // Bright flash
          (qubit.material as THREE.MeshPhysicalMaterial).emissive.set(
            collapsedValueRef.current === 1 ? 0xff4466 : 0x4488ff
          );
          (qubit.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 3;
        }
        if (glow) {
          glow.position.copy(qubit.position);
          glow.scale.setScalar(2);
          (glow.material as THREE.SpriteMaterial).color.set(
            collapsedValueRef.current === 1 ? 0xff4466 : 0x4488ff
          );
        }

        // Transition to collapsed
        if (Math.abs(thetaRef.current - target) < 0.05) {
          phaseRef.current = "collapsed";
          collapseStartTimeRef.current = clockRef.current.getElapsedTime();
          if (flash) {
            (flash.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        }
      } else if (phase === "collapsed") {
        // Hold at pole, then auto-reset after 2s
        if (qubit) {
          const bob = Math.sin(time * 2) * 0.03;
          const target = targetThetaRef.current;
          const x =
            sphereR * Math.sin(target) * Math.cos(phiRef.current);
          const y = sphereR * Math.cos(target) + bob;
          const z =
            sphereR * Math.sin(target) * Math.sin(phiRef.current);
          qubit.position.set(x, y, z);

          // Glow color at pole
          const isNorth = collapsedValueRef.current === 1;
          (qubit.material as THREE.MeshPhysicalMaterial).emissive.set(
            isNorth ? 0xff4466 : 0x4488ff
          );
          (qubit.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
            2 + Math.sin(time * 3) * 0.5;
        }
        if (glow) {
          glow.position.copy(qubit.position);
          (glow.material as THREE.SpriteMaterial).color.set(
            collapsedValueRef.current === 1 ? 0xff4466 : 0x4488ff
          );
        }

        // Auto-reset after 2.5 seconds
        if (time - collapseStartTimeRef.current > 2.5) {
          phaseRef.current = "resetting";
          targetThetaRef.current = Math.PI / 3;
        }
      } else if (phase === "resetting") {
        // Transition back to superposition
        thetaRef.current += (targetThetaRef.current - thetaRef.current) * 0.03;

        const theta = thetaRef.current;
        const x = sphereR * Math.sin(theta) * Math.cos(phiRef.current);
        const y = sphereR * Math.cos(theta);
        const z = sphereR * Math.sin(theta) * Math.sin(phiRef.current);

        if (qubit) {
          qubit.position.set(x, y, z);
          // Blend color back to white
          const mat = qubit.material as THREE.MeshPhysicalMaterial;
          const resetT = Math.abs(theta - targetThetaRef.current) / Math.PI;
          mat.emissive.lerpColors(
            collapsedValueRef.current === 1
              ? new THREE.Color(0xff4466)
              : new THREE.Color(0x4488ff),
            new THREE.Color(0xccaaff),
            1 - resetT
          );
          mat.emissiveIntensity = 1.5 + resetT;
        }
        if (glow) {
          glow.position.copy(qubit.position);
          (glow.material as THREE.SpriteMaterial).color.lerpColors(
            collapsedValueRef.current === 1
              ? new THREE.Color(0xff4466)
              : new THREE.Color(0x4488ff),
            new THREE.Color(0xaabbff),
            0.02
          );
          glow.scale.lerp(new THREE.Vector3(1.2, 1.2, 1), 0.05);
        }

        if (Math.abs(thetaRef.current - targetThetaRef.current) < 0.05) {
          phaseRef.current = "superposition";
          // Reset glow color
          if (glow) {
            (glow.material as THREE.SpriteMaterial).color.set(0xaabbff);
          }
        }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-purple-500/20" style={{ contain: "layout style paint" }}>
      <div ref={containerRef} className="w-full h-full" />
      {/* Subtle click hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-purple-500/30 text-purple-300/60 text-sm pointer-events-none select-none">
        Click to measure · Drag to orbit
      </div>
    </div>
  );
}
