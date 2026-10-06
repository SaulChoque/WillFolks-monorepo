"use client";

import { useEffect, useMemo, useState } from "react";
import { PET_H, PET_W, petFrame, petPath, type PetMood } from "@/lib/pet-sprite";

interface PetSpriteProps {
  mood: PetMood;
  className?: string;
}

/** The WillPet, drawn from its bitmap. Blinks on its own while idle. */
export function PetSprite({ mood, className }: PetSpriteProps) {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (mood !== "idle") return;
    let closeTimer: ReturnType<typeof setTimeout>;
    const openTimer = setInterval(() => {
      setBlinking(true);
      closeTimer = setTimeout(() => setBlinking(false), 160);
    }, 2900);
    return () => {
      clearInterval(openTimer);
      clearTimeout(closeTimer);
      setBlinking(false);
    };
  }, [mood]);

  const shown: PetMood = mood === "idle" && blinking ? "blink" : mood;
  const paths = useMemo(() => {
    const rows = petFrame(shown);
    return { ink: petPath(rows, "#"), tone: petPath(rows, "o") };
  }, [shown]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${PET_W} ${PET_H}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={paths.ink} />
      <path d={paths.tone} opacity="0.38" />
    </svg>
  );
}
