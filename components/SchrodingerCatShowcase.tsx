"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGlowCanvas } from "@/lib/three-utils";

type Phase = "sealed" | "opening" | "revealed" | "resealing";

export default function SchrodingerCatShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const phaseRef = useRef<Phase>("sealed");
  const phaseTimeRef = useRef(0);

  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 3, phi: Math.PI / 5 });
  const cameraDistance = 7;

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

    const boxSize = 2.2;

    // ── Box walls (5 sides, top opens) ──────────────────────
    const wallMat = new THREE.MeshPhysicalMaterial({
      color: 0x333344,
      transparent: true,
      opacity: 0.5,
      roughness: 0.4,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });

    // Bottom
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(boxSize, 0.08, boxSize), wallMat);
    bottom.position.y = -boxSize / 2;
    scene.add(bottom);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, boxSize, boxSize), wallMat);
    leftWall.position.x = -boxSize / 2;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, boxSize, boxSize), wallMat);
    rightWall.position.x = boxSize / 2;
    scene.add(rightWall);

    // Front wall (transparent)
    const frontMat = wallMat.clone();
    frontMat.opacity = 0.2;
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(boxSize, boxSize, 0.08), frontMat);
    frontWall.position.z = boxSize / 2;
    scene.add(frontWall);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(boxSize, boxSize, 0.08), wallMat.clone());
    backWall.position.z = -boxSize / 2;
    scene.add(backWall);

    // Top lid (animated)
    const lidMat = new THREE.MeshPhysicalMaterial({
      color: 0x444455,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.4,
    });
    const lid = new THREE.Mesh(new THREE.BoxGeometry(boxSize, 0.08, boxSize), lidMat);
    lid.position.y = boxSize / 2;
    lid.name = "lid";
    scene.add(lid);

    // ── Cat silhouette (emoji-style, inside box) ────────────
    const catCanvas = document.createElement("canvas");
    catCanvas.width = 128;
    catCanvas.height = 128;
    const catCtx = catCanvas.getContext("2d")!;
    catCtx.clearRect(0, 0, 128, 128);
    catCtx.font = "80px serif";
    catCtx.textAlign = "center";
    catCtx.textBaseline = "middle";
    catCtx.fillText("🐱", 64, 64);
    const catTex = new THREE.CanvasTexture(catCanvas);
    const catMat = new THREE.SpriteMaterial({
      map: catTex, transparent: true, opacity: 0.7, depthWrite: false,
    });
    const cat = new THREE.Sprite(catMat);
    cat.scale.set(1.2, 1.2, 1);
    cat.position.set(0, -0.3, 0);
    cat.name = "cat";
    scene.add(cat);

    // ── Question mark (superposition indicator) ──────────────
    const qCanvas = document.createElement("canvas");
    qCanvas.width = 128;
    qCanvas.height = 128;
    const qCtx = qCanvas.getContext("2d")!;
    qCtx.clearRect(0, 0, 128, 128);
    qCtx.font = "bold 96px sans-serif";
    qCtx.textAlign = "center";
    qCtx.textBaseline = "middle";
    qCtx.fillStyle = "rgba(255,255,255,0.6)";
    qCtx.fillText("?", 64, 64);
    const qTex = new THREE.CanvasTexture(qCanvas);
    const qMat = new THREE.SpriteMaterial({
      map: qTex, transparent: true, opacity: 0.5, depthWrite: false,
    });
    const questionMark = new THREE.Sprite(qMat);
    questionMark.scale.set(1, 1, 1);
    questionMark.position.set(0, 0.5, 0);
    questionMark.name = "questionMark";
    scene.add(questionMark);

    // ── Radioactive atom (orbiting inside box) ──────────────
    const atomGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const atomMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xef4444,
      emissiveIntensity: 2,
      roughness: 0.1,
    });
    const atom = new THREE.Mesh(atomGeo, atomMat);
    atom.name = "atom";
    scene.add(atom);

    const atomGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createGlowCanvas(0xef4444)),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    atomGlow.scale.set(0.8, 0.8, 1);
    atomGlow.name = "atomGlow";
    scene.add(atomGlow);

    // ── Alive/Dead indicators (hidden until revealed) ────────
    const aliveCanvas = document.createElement("canvas");
    aliveCanvas.width = 128;
    aliveCanvas.height = 64;
    const aliveCtx = aliveCanvas.getContext("2d")!;
    aliveCtx.font = "bold 28px sans-serif";
    aliveCtx.textAlign = "center";
    aliveCtx.fillStyle = "#22c55e";
    aliveCtx.fillText("✓ ALIVE", 64, 40);
    const aliveTex = new THREE.CanvasTexture(aliveCanvas);
    const aliveSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: aliveTex, transparent: true, opacity: 0, depthWrite: false,
    }));
    aliveSprite.scale.set(1.5, 0.4, 1);
    aliveSprite.position.set(0, 1.8, 0);
    aliveSprite.name = "aliveLabel";
    scene.add(aliveSprite);

    const deadCanvas = document.createElement("canvas");
    deadCanvas.width = 128;
    deadCanvas.height = 64;
    const deadCtx = deadCanvas.getContext("2d")!;
    deadCtx.font = "bold 28px sans-serif";
    deadCtx.textAlign = "center";
    deadCtx.fillStyle = "#ef4444";
    deadCtx.fillText("✗ DEAD", 64, 40);
    const deadTex = new THREE.CanvasTexture(deadCanvas);
    const deadSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: deadTex, transparent: true, opacity: 0, depthWrite: false,
    }));
    deadSprite.scale.set(1.5, 0.4, 1);
    deadSprite.position.set(0, -1.8, 0);
    deadSprite.name = "deadLabel";
    scene.add(deadSprite);

    // ── Glow box outline ────────────────────────────────────
    const boxEdgeMat = new THREE.LineBasicMaterial({
      color: 0xef4444, transparent: true, opacity: 0.15,
    });
    const boxEdgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(boxSize, boxSize, boxSize));
    const boxEdges = new THREE.LineSegments(boxEdgeGeo, boxEdgeMat);
    boxEdges.name = "boxEdges";
    scene.add(boxEdges);

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.5));
    const pl1 = new THREE.PointLight(0xef4444, 2, 20);
    pl1.position.set(3, 4, 3);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x22c55e, 1.5, 15);
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
      if (phaseRef.current === "sealed") {
        phaseRef.current = "opening";
        phaseTimeRef.current = clockRef.current.getElapsedTime();
      } else if (phaseRef.current === "revealed") {
        phaseRef.current = "resealing";
        phaseTimeRef.current = clockRef.current.getElapsedTime();
      }
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

      const lid = scene.getObjectByName("lid") as THREE.Mesh;
      const cat = scene.getObjectByName("cat") as THREE.Sprite;
      const questionMark = scene.getObjectByName("questionMark") as THREE.Sprite;
      const atom = scene.getObjectByName("atom") as THREE.Mesh;
      const atomGlow = scene.getObjectByName("atomGlow") as THREE.Sprite;
      const aliveLabel = scene.getObjectByName("aliveLabel") as THREE.Sprite;
      const deadLabel = scene.getObjectByName("deadLabel") as THREE.Sprite;
      const boxEdges = scene.getObjectByName("boxEdges") as THREE.LineSegments;

      const boxSize = 2.2;

      // Atom orbiting inside box
      if (atom) {
        const atomAngle = time * 3;
        const atomR = 0.5;
        atom.position.set(
          Math.cos(atomAngle) * atomR,
          -0.3 + Math.sin(atomAngle * 0.7) * 0.3,
          Math.sin(atomAngle) * atomR
        );
        (atom.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
          1.5 + Math.sin(time * 5) * 0.5;
      }
      if (atomGlow && atom) {
        atomGlow.position.copy(atom.position);
      }

      // Box edge glow pulse
      if (boxEdges) {
        const pulse = 0.1 + Math.sin(time * 2) * 0.05;
        (boxEdges.material as THREE.LineBasicMaterial).opacity = pulse;
      }

      if (phase === "sealed") {
        // Lid closed, cat flickers between alive/dead
        if (lid) {
          lid.position.y = boxSize / 2;
          lid.rotation.x = 0;
        }
        if (cat) {
          // Flicker between alive (green) and dead (red)
          const flicker = Math.sin(time * 4) > 0;
          cat.material.opacity = 0.5 + Math.sin(time * 3) * 0.2;
          // Color tint
          const hue = flicker ? 0.33 : 0; // green : red
          cat.material.color.setHSL(hue, 0.8, 0.7);
        }
        if (questionMark) {
          questionMark.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
          questionMark.rotation.z = Math.sin(time) * 0.2;
        }
        if (aliveLabel) aliveLabel.material.opacity = 0;
        if (deadLabel) deadLabel.material.opacity = 0;
      } else if (phase === "opening") {
        const elapsed = time - phaseTimeRef.current;
        const progress = Math.min(1, elapsed * 1.5);

        // Open lid
        if (lid) {
          lid.position.y = boxSize / 2 + progress * 1.5;
          lid.rotation.x = -progress * 0.3;
        }

        // Cat becomes more visible
        if (cat) {
          cat.material.opacity = 0.5 + progress * 0.3;
          // Slowly settle on one state
          const settled = Math.sin(time * 4 + elapsed * 10) > 0;
          cat.material.color.setHSL(settled ? 0.33 : 0, 0.8, 0.7);
        }

        if (questionMark) {
          questionMark.material.opacity = Math.max(0, 0.5 - progress * 0.5);
        }

        if (progress >= 1) {
          phaseRef.current = "revealed";
          phaseTimeRef.current = time;
          // Final state: 50/50 chance alive or dead
          const isAlive = Math.random() < 0.5;
          if (cat) {
            cat.material.color.setHSL(isAlive ? 0.33 : 0, 0.9, 0.6);
          }
          if (aliveLabel) aliveLabel.material.opacity = isAlive ? 1 : 0;
          if (deadLabel) deadLabel.material.opacity = isAlive ? 0 : 1;
        }
      } else if (phase === "revealed") {
        // Hold revealed state
        if (lid) {
          lid.position.y = boxSize / 2 + 1.5;
        }
        if (cat) {
          cat.material.opacity = 0.8;
        }
        if (aliveLabel) aliveLabel.material.opacity = 1;
        if (deadLabel) deadLabel.material.opacity = 1;

        // Auto-reseal after 4 seconds
        if (time - phaseTimeRef.current > 4) {
          phaseRef.current = "resealing";
          phaseTimeRef.current = time;
        }
      } else if (phase === "resealing") {
        const elapsed = time - phaseTimeRef.current;
        const progress = Math.min(1, elapsed * 1.2);

        // Close lid
        if (lid) {
          lid.position.y = boxSize / 2 + 1.5 * (1 - progress);
          lid.rotation.x = -0.3 * (1 - progress);
        }

        // Fade out labels
        if (aliveLabel) aliveLabel.material.opacity = Math.max(0, 1 - progress);
        if (deadLabel) deadLabel.material.opacity = Math.max(0, 1 - progress);

        // Cat starts flickering again
        if (cat) {
          cat.material.opacity = 0.5 + Math.sin(time * 4) * 0.2;
          const flicker = Math.sin(time * 4) > 0;
          cat.material.color.setHSL(flicker ? 0.33 : 0, 0.8, 0.7);
        }

        if (questionMark) {
          questionMark.material.opacity = progress * 0.5;
        }

        if (progress >= 1) {
          phaseRef.current = "sealed";
        }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-red-500/20">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-red-500/30 text-red-300/60 text-sm pointer-events-none select-none">
        Click to open box · Drag to orbit
      </div>
    </div>
  );
}
