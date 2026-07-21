"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGlowCanvas } from "@/lib/three-utils";

type Phase = "approaching" | "tunneling" | "transmitted" | "resetting";

export default function QuantumTunnelingShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const phaseRef = useRef<Phase>("approaching");

  const particleXRef = useRef(-3.5);
  const particleAlphaRef = useRef(1);
  const tunnelStartTimeRef = useRef(0);

  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 3, phi: 0 });
  const cameraDistance = 8;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45, container.clientWidth / container.clientHeight, 0.1, 100
    );
    cameraRef.current = camera;

    // ── Potential barrier (translucent wall) ────────────────
    const barrierGeo = new THREE.BoxGeometry(0.4, 3, 1.5);
    const barrierMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      roughness: 0.3,
      metalness: 0.5,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3,
    });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.set(0, 0, 0);
    barrier.name = "barrier";
    scene.add(barrier);

    // Barrier glow edges
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0xfcd34d,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const edgeGeo = new THREE.BoxGeometry(0.42, 3.02, 1.52);
    const edges = new THREE.Mesh(edgeGeo, edgeMat);
    edges.name = "barrierEdge";
    scene.add(edges);

    // ── Potential energy plateau lines ──────────────────────
    const plateauMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.15 });
    // Top line
    const topPts = [new THREE.Vector3(-4, 1.5, 0), new THREE.Vector3(-0.2, 1.5, 0)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(topPts), plateauMat));
    const topPts2 = [new THREE.Vector3(0.2, 1.5, 0), new THREE.Vector3(4, 1.5, 0)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(topPts2), plateauMat.clone()));
    // Barrier top
    const barPts = [new THREE.Vector3(-0.2, 2.2, 0), new THREE.Vector3(0.2, 2.2, 0)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(barPts), new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 })));

    // ── Ground line ─────────────────────────────────────────
    const groundMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4.5, 0, 0), new THREE.Vector3(4.5, 0, 0)
    ]), groundMat));

    // ── Particle (wave packet) ──────────────────────────────
    const particleGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const particleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xf59e0b,
      emissiveIntensity: 2,
      roughness: 0.1,
      metalness: 0.3,
    });
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.position.set(-3.5, 0, 0);
    particle.name = "particle";
    scene.add(particle);

    // Particle glow
    const glowTex = new THREE.CanvasTexture(createGlowCanvas(0xf59e0b));
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glowSprite.scale.set(1.5, 1.5, 1);
    glowSprite.name = "glow";
    scene.add(glowSprite);

    // ── Wave packet trail ───────────────────────────────────
    // We'll draw this dynamically in the animation loop

    // ── Transmitted particle (initially hidden) ─────────────
    const transMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0,
    });
    const transmitted = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), transMat);
    transmitted.position.set(0.5, 0, 0);
    transmitted.name = "transmitted";
    scene.add(transmitted);

    const transGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createGlowCanvas(0x22d3ee)),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
    }));
    transGlow.scale.set(1.2, 1.2, 1);
    transGlow.name = "transGlow";
    scene.add(transGlow);

    // ── Reflection particle (initially hidden) ──────────────
    const reflMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xef4444,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0,
    });
    const reflected = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), reflMat);
    reflected.position.set(-0.5, 0, 0);
    reflected.name = "reflected";
    scene.add(reflected);

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.5));
    const pl1 = new THREE.PointLight(0xf59e0b, 2, 20);
    pl1.position.set(3, 4, 3);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x22d3ee, 1.5, 15);
    pl2.position.set(-3, -2, -3);
    scene.add(pl2);

    // ── Events ──────────────────────────────────────────────
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
      cameraAngleRef.current.theta = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.theta - dy * 0.005));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDraggingRef.current = false; };
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
      cameraAngleRef.current.theta = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.theta - dy * 0.005));
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDraggingRef.current = false; };

    const onClick = () => {
      if (didDragRef.current) return;
      if (phaseRef.current === "resetting") return;
      if (phaseRef.current !== "approaching") return;
      // Launch particle toward barrier
      phaseRef.current = "approaching";
      particleXRef.current = -3.5;
      particleAlphaRef.current = 1;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
    renderer.domElement.addEventListener("touchend", onTouchEnd);
    renderer.domElement.addEventListener("click", onClick);

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

  // ── Animation loop ──────────────────────────────────────
  useEffect(() => {
    const animate = () => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      if (!scene || !camera || !renderer) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const time = clockRef.current.getElapsedTime();
      const phase = phaseRef.current;

      // Camera
      const ca = cameraAngleRef.current;
      camera.position.set(
        cameraDistance * Math.sin(ca.theta) * Math.cos(ca.phi),
        cameraDistance * Math.cos(ca.theta),
        cameraDistance * Math.sin(ca.theta) * Math.sin(ca.phi)
      );
      camera.lookAt(0, 0, 0);

      const particle = scene.getObjectByName("particle") as THREE.Mesh;
      const glow = scene.getObjectByName("glow") as THREE.Sprite;
      const transmitted = scene.getObjectByName("transmitted") as THREE.Mesh;
      const transGlow = scene.getObjectByName("transGlow") as THREE.Sprite;
      const reflected = scene.getObjectByName("reflected") as THREE.Mesh;
      const barrier = scene.getObjectByName("barrier") as THREE.Mesh;

      // Barrier pulse
      if (barrier) {
        const pulse = 1 + Math.sin(time * 2) * 0.05;
        barrier.scale.set(pulse, 1, 1);
      }

      if (phase === "approaching") {
        // Move particle toward barrier
        particleXRef.current += 0.025;
        const px = particleXRef.current;

        if (particle) {
          particle.position.set(px, 0, 0);
          const wobble = Math.sin(px * 5 + time * 8) * 0.15;
          particle.position.y = wobble;
          const pulse = 1 + Math.sin(time * 4) * 0.1;
          particle.scale.setScalar(pulse);
          (particle.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 2 + Math.sin(time * 5) * 0.5;
        }
        if (glow) {
          glow.position.set(px, 0, 0);
          glow.scale.setScalar(1.5 + Math.sin(time * 3) * 0.2);
        }

        // Wave packet trail
        if (px > -3) {
          if (!scene.userData.trailGeo) {
            scene.userData.trailGeo = new THREE.SphereGeometry(0.06, 8, 8);
            scene.userData.trailMat = new THREE.MeshBasicMaterial({
              color: 0xf59e0b, transparent: true, opacity: 0.3,
              blending: THREE.AdditiveBlending, depthWrite: false,
            });
          }
          if (Math.floor(time * 10) % 2 === 0) {
            const trail = new THREE.Mesh(scene.userData.trailGeo, scene.userData.trailMat.clone());
            trail.position.set(px, Math.sin(px * 5 + time * 8) * 0.15, 0);
            trail.userData.life = 0.3;
            trail.name = "trail";
            scene.add(trail);
          }
        }

        // Clean up old trails
        for (let i = scene.children.length - 1; i >= 0; i--) {
          const child = scene.children[i];
          if (child.name === "trail") {
            const t = child as THREE.Mesh;
            t.userData.life = (t.userData.life || 0) - 0.016;
            (t.material as THREE.MeshBasicMaterial).opacity = t.userData.life * 0.3;
            if (t.userData.life <= 0) {
              scene.remove(t);
              (t.material as THREE.MeshBasicMaterial).dispose();
            }
          }
        }

        // Hit barrier
        if (px >= -0.3) {
          phaseRef.current = "tunneling";
          tunnelStartTimeRef.current = time;
        }
      } else if (phase === "tunneling") {
        const elapsed = time - tunnelStartTimeRef.current;

        // Flash on barrier
        if (barrier) {
          const flash = Math.max(0, 1 - elapsed * 2);
          (barrier.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.3 + flash * 2;
        }

        // Fade out original particle
        if (particle) {
          particleAlphaRef.current = Math.max(0, 1 - elapsed * 3);
          (particle.material as THREE.MeshPhysicalMaterial).opacity = particleAlphaRef.current;
          particle.material.transparent = true;
        }

        // Show transmitted particle emerging
        if (elapsed > 0.3 && transmitted) {
          const t = Math.min(1, (elapsed - 0.3) * 2);
          (transmitted.material as THREE.MeshPhysicalMaterial).opacity = t;
          transmitted.position.set(0.3 + t * 0.5, 0, 0);
        }
        if (elapsed > 0.3 && transGlow) {
          const t = Math.min(1, (elapsed - 0.3) * 2);
          (transGlow.material as THREE.SpriteMaterial).opacity = t * 0.7;
          transGlow.position.copy(transmitted.position);
        }

        // Show reflected particle (partial reflection)
        if (elapsed > 0.2 && reflected) {
          const t = Math.min(1, (elapsed - 0.2) * 2);
          (reflected.material as THREE.MeshPhysicalMaterial).opacity = t * 0.6;
          reflected.position.set(-0.3 - t * 0.8, t * 0.3, 0);
        }

        if (elapsed > 1.5) {
          phaseRef.current = "transmitted";
          tunnelStartTimeRef.current = time;
        }
      } else if (phase === "transmitted") {
        // Continue moving transmitted particle
        if (transmitted) {
          transmitted.position.x += 0.02;
          const wobble = Math.sin(transmitted.position.x * 5 + time * 6) * 0.1;
          transmitted.position.y = wobble;
        }
        if (transGlow) {
          transGlow.position.copy(transmitted.position);
        }

        // Fade reflected
        if (reflected) {
          reflected.position.x -= 0.015;
          (reflected.material as THREE.MeshPhysicalMaterial).opacity *= 0.99;
        }

        // Reset after particle exits
        if (transmitted && transmitted.position.x > 4) {
          phaseRef.current = "resetting";
          tunnelStartTimeRef.current = time;
        }
      } else if (phase === "resetting") {
        const elapsed = time - tunnelStartTimeRef.current;
        if (elapsed > 1) {
          // Reset everything
          particleXRef.current = -3.5;
          particleAlphaRef.current = 1;
          if (particle) {
            particle.position.set(-3.5, 0, 0);
            particle.material.transparent = false;
            (particle.material as THREE.MeshPhysicalMaterial).opacity = 1;
          }
          if (transmitted) {
            transmitted.position.set(0.5, 0, 0);
            (transmitted.material as THREE.MeshPhysicalMaterial).opacity = 0;
          }
          if (transGlow) {
            (transGlow.material as THREE.SpriteMaterial).opacity = 0;
          }
          if (reflected) {
            reflected.position.set(-0.5, 0, 0);
            (reflected.material as THREE.MeshPhysicalMaterial).opacity = 0;
          }
          if (barrier) {
            (barrier.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.3;
          }
          phaseRef.current = "approaching";
        }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-amber-500/20">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-amber-500/30 text-amber-300/60 text-sm pointer-events-none select-none">
        Click to launch particle · Drag to orbit
      </div>
    </div>
  );
}
