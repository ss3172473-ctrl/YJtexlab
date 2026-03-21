"use client";

import { useEffect, useRef, useState } from "react";

import type { FabricMotionPreset } from "@/components/fabric-scatter/config";

type FabricScatterCanvasProps = {
  src: string;
  preset: FabricMotionPreset;
  showDebugIds: boolean;
};

type Chip = {
  id: number;
  major: boolean;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  rotationVelocity: number;
  baseRotation: number;
  depth: number;
  driftSeed: number;
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
};

type PointerState = {
  inside: boolean;
  x: number;
  y: number;
};

const CHIP_COUNTS = {
  major: 28,
  micro: 48,
} as const;

const PHYSICS = {
  pointerRadius: 140,
  spring: 0.09,
  damping: 0.82,
  idleDriftMin: 0.6,
  idleDriftMax: 1.2,
} as const;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: string) {
  let state = hashString(seed) || 1;

  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function makeChips(
  width: number,
  height: number,
  naturalWidth: number,
  naturalHeight: number,
  preset: FabricMotionPreset,
): Chip[] {
  const random = createRandom(`${preset.id}-${width}x${height}`);
  const chips: Chip[] = [];

  const createChip = (index: number, columns: number, rows: number, major: boolean) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const centerX = cellWidth * (column + 0.5);
    const centerY = cellHeight * (row + 0.5);
    const jitterX = (random() - 0.5) * cellWidth * (major ? 0.35 : 0.6);
    const jitterY = (random() - 0.5) * cellHeight * (major ? 0.35 : 0.6);
    const baseX = clamp(centerX + jitterX, 24, width - 24);
    const baseY = clamp(centerY + jitterY, 24, height - 24);

    const [minSize, maxSize] = major ? preset.chipSize.major : preset.chipSize.micro;
    const sizeA = minSize + (maxSize - minSize) * random();
    const sizeB = minSize + (maxSize - minSize) * random();

    let chipWidth = sizeA;
    let chipHeight = sizeB;
    if (preset.id === "stripes") {
      chipWidth = major ? sizeB : sizeB * 0.85;
      chipHeight = major ? sizeA * 0.34 : sizeA * 0.42;
    } else if (preset.id === "checks") {
      chipWidth = major ? sizeB : sizeB * 0.76;
      chipHeight = major ? sizeB : sizeB * 0.76;
    } else {
      chipWidth = sizeB;
      chipHeight = major ? sizeA * (0.75 + random() * 0.35) : sizeA * 0.72;
    }

    const naturalX = (baseX / width) * naturalWidth;
    const naturalY = (baseY / height) * naturalHeight;
    const naturalScale = naturalWidth / width;
    const srcW = clamp(chipWidth * naturalScale * 1.4, 24, naturalWidth * 0.28);
    const srcH = clamp(chipHeight * naturalScale * 1.4, 18, naturalHeight * 0.28);

    return {
      id: chips.length + 1,
      major,
      baseX,
      baseY,
      x: baseX,
      y: baseY,
      vx: 0,
      vy: 0,
      width: chipWidth,
      height: chipHeight,
      rotation: (random() - 0.5) * preset.rotationMax * 0.28,
      rotationVelocity: 0,
      baseRotation: (random() - 0.5) * preset.rotationMax * 0.14,
      depth: major ? 0.92 + random() * 0.55 : 0.44 + random() * 0.42,
      driftSeed: random() * Math.PI * 2,
      srcX: clamp(naturalX - srcW / 2, 0, naturalWidth - srcW),
      srcY: clamp(naturalY - srcH / 2, 0, naturalHeight - srcH),
      srcW,
      srcH,
    };
  };

  for (let index = 0; index < CHIP_COUNTS.major; index += 1) {
    chips.push(createChip(index, 7, 4, true));
  }

  for (let index = 0; index < CHIP_COUNTS.micro; index += 1) {
    chips.push(createChip(index, 8, 6, false));
  }

  return chips;
}

export default function FabricScatterCanvas({
  src,
  preset,
  showDebugIds,
}: FabricScatterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<PointerState>({ inside: false, x: 0, y: 0 });
  const chipsRef = useRef<Chip[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hoverMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncInteractive = () => {
      setInteractive(hoverMedia.matches && !motionMedia.matches);
    };

    syncInteractive();
    hoverMedia.addEventListener("change", syncInteractive);
    motionMedia.addEventListener("change", syncInteractive);

    return () => {
      hoverMedia.removeEventListener("change", syncInteractive);
      motionMedia.removeEventListener("change", syncInteractive);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !interactive) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const image = new Image();
    image.src = src;
    image.decoding = "async";
    imageRef.current = image;

    const resize = () => {
      if (!canvas || !imageRef.current) {
        return;
      }

      const bounds = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(bounds.width * dpr);
      canvas.height = Math.round(bounds.height * dpr);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
      chipsRef.current = makeChips(
        bounds.width,
        bounds.height,
        imageRef.current.naturalWidth || bounds.width,
        imageRef.current.naturalHeight || bounds.height,
        preset,
      );
    };

    const updatePointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointerRef.current = {
        inside: true,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };

    const handleLeave = () => {
      pointerRef.current = {
        ...pointerRef.current,
        inside: false,
      };
    };

    const render = (timestamp: number) => {
      const bounds = canvas.getBoundingClientRect();
      const chips = chipsRef.current;
      context.clearRect(0, 0, bounds.width, bounds.height);

      for (const chip of chips) {
        const pointer = pointerRef.current;
        const dx = chip.x - pointer.x;
        const dy = chip.y - pointer.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const distanceRatio = Math.max(0, 1 - distance / PHYSICS.pointerRadius);
        const driftStrength =
          PHYSICS.idleDriftMin +
          (PHYSICS.idleDriftMax - PHYSICS.idleDriftMin) * chip.depth;

        const driftX =
          Math.sin(timestamp * 0.0011 + chip.driftSeed) * driftStrength * 0.06;
        const driftY =
          Math.cos(timestamp * 0.0009 + chip.driftSeed * 1.2) * driftStrength * 0.06;

        const forceX = distance > 0 ? dx / distance : 0;
        const forceY = distance > 0 ? dy / distance : 0;
        const majorMultiplier = chip.major ? 1 : 0.55;
        let pushX = 0;
        let pushY = 0;
        let spin = 0;

        if (pointer.inside && distanceRatio > 0) {
          if (preset.id === "stripes") {
            pushX =
              (forceX + preset.pushBias.x * 0.6) *
              distanceRatio *
              4.8 *
              chip.depth *
              majorMultiplier;
            pushY =
              (forceY * 0.45 + preset.pushBias.y * 0.12) *
              distanceRatio *
              2.1 *
              majorMultiplier;
            spin = distanceRatio * 0.0022 * (chip.major ? 1 : 0.7);
          } else if (preset.id === "checks") {
            const tileX = Math.sign(forceX) || 1;
            const tileY = Math.sign(forceY) || 1;
            pushX =
              (tileX * 2.5 + forceX * 1.6 + preset.pushBias.x) *
              distanceRatio *
              1.6 *
              chip.depth *
              majorMultiplier;
            pushY =
              (tileY * 2.1 + forceY * 1.6 + preset.pushBias.y) *
              distanceRatio *
              1.45 *
              chip.depth *
              majorMultiplier;
            spin = distanceRatio * 0.0012;
          } else {
            pushX =
              (forceX * 2.9 + preset.pushBias.x * 1.2) *
              distanceRatio *
              2.3 *
              chip.depth *
              majorMultiplier;
            pushY =
              (forceY * 2.7 + preset.pushBias.y * 0.95) *
              distanceRatio *
              2.4 *
              chip.depth *
              majorMultiplier;
            spin = distanceRatio * 0.0035 * (chip.major ? 1.1 : 0.8);
          }
        }

        chip.vx += (chip.baseX - chip.x) * PHYSICS.spring * preset.returnSpeed + driftX + pushX;
        chip.vy += (chip.baseY - chip.y) * PHYSICS.spring * preset.returnSpeed + driftY + pushY;
        chip.vx *= PHYSICS.damping;
        chip.vy *= PHYSICS.damping;
        chip.x += chip.vx;
        chip.y += chip.vy;

        chip.rotationVelocity += (chip.baseRotation - chip.rotation) * 0.018 + spin;
        chip.rotationVelocity *= 0.8;
        chip.rotation += chip.rotationVelocity;
        chip.rotation = clamp(chip.rotation, -preset.rotationMax, preset.rotationMax);

        context.save();
        context.translate(chip.x, chip.y);
        context.rotate((chip.rotation * Math.PI) / 180);
        context.shadowColor = "rgba(15, 23, 42, 0.16)";
        context.shadowBlur = chip.major ? 16 : 9;
        context.shadowOffsetY = chip.major ? 7 : 4;
        context.beginPath();
        const radius = Math.min(chip.width, chip.height) * (preset.id === "checks" ? 0.18 : 0.48);
        context.roundRect(-chip.width / 2, -chip.height / 2, chip.width, chip.height, radius);
        context.clip();
        context.globalAlpha = chip.major ? 0.96 : 0.62;
        context.drawImage(
          image,
          chip.srcX,
          chip.srcY,
          chip.srcW,
          chip.srcH,
          -chip.width / 2,
          -chip.height / 2,
          chip.width,
          chip.height,
        );
        context.restore();

        if (showDebugIds && chip.major) {
          context.save();
          context.translate(chip.x, chip.y);
          context.fillStyle = "rgba(17, 24, 39, 0.72)";
          context.font = "500 10px Inter, sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(String(chip.id).padStart(2, "0"), 0, 0);
          context.restore();
        }
      }

      frameRef.current = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      if (document.hidden && frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        return;
      }

      if (!document.hidden && frameRef.current === null) {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    image.addEventListener("load", resize);
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerenter", updatePointer);
    canvas.addEventListener("pointermove", updatePointer);
    canvas.addEventListener("pointerleave", handleLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (image.complete) {
      resize();
    }
    frameRef.current = requestAnimationFrame(render);

    return () => {
      image.removeEventListener("load", resize);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerenter", updatePointer);
      canvas.removeEventListener("pointermove", updatePointer);
      canvas.removeEventListener("pointerleave", handleLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [interactive, preset, showDebugIds, src]);

  if (!interactive) {
    return null;
  }

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
