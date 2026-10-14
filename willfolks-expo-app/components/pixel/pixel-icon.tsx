import { memo, useMemo } from "react";
import { PixelRatio, StyleProp, View, ViewStyle } from "react-native";

import { FACE_ROW, PET_H, PET_W, PetMood, petFrame } from "@/constants/pet-sprite";
import { PIXEL_ICONS, PixelIconName } from "@/constants/pixel-icons";

/** A horizontal run of inked pixels: [x, y, width]. */
type Run = [number, number, number];

function toRuns(rows: readonly string[], tone: string): Run[] {
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === tone) {
        let w = 1;
        while (row[x + w] === tone) w++;
        runs.push([x, y, w]);
        x += w;
      } else {
        x++;
      }
    }
  });
  return runs;
}

/** Snaps a bitmap cell to whole device pixels so runs never show seams. */
export function cellFor(size: number, columns: number) {
  return Math.max(PixelRatio.roundToNearestPixel(size / columns), 1 / PixelRatio.get());
}

function Runs({ runs, cell, color, opacity }: { runs: Run[]; cell: number; color: string; opacity?: number }) {
  return (
    <>
      {runs.map(([x, y, w]) => (
        <View
          key={`${x}-${y}`}
          style={{
            position: "absolute",
            left: x * cell,
            top: y * cell,
            width: w * cell,
            height: cell,
            backgroundColor: color,
            opacity,
          }}
        />
      ))}
    </>
  );
}

const ICON_RUNS = new Map<PixelIconName, Run[]>();

function iconRuns(name: PixelIconName) {
  let runs = ICON_RUNS.get(name);
  if (!runs) {
    runs = toRuns(PIXEL_ICONS[name], "#");
    ICON_RUNS.set(name, runs);
  }
  return runs;
}

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

/** 12×12 bitmap icon drawn as crisp device-pixel-aligned blocks. */
export const PixelIcon = memo(function PixelIcon({ name, size = 24, color, style }: PixelIconProps) {
  const cell = cellFor(size, 12);
  return (
    <View style={[{ width: cell * 12, height: cell * 12 }, style]}>
      <Runs runs={iconRuns(name)} cell={cell} color={color} />
    </View>
  );
});

interface PixelBitmapProps {
  rows: readonly string[];
  /** Character that marks an inked pixel. */
  tone?: string;
  /** Side of one pixel; snap it with `cellFor`. */
  cell: number;
  color: string;
}

/** Any bitmap drawn like the icons, one block per horizontal run. */
export const PixelBitmap = memo(function PixelBitmap({ rows, tone = "#", cell, color }: PixelBitmapProps) {
  const runs = useMemo(() => toRuns(rows, tone), [rows, tone]);
  return (
    <View style={{ width: cell * (rows[0]?.length ?? 0), height: cell * rows.length }}>
      <Runs runs={runs} cell={cell} color={color} />
    </View>
  );
});

const PET_RUNS = new Map<PetMood, { ink: Run[]; tone: Run[] }>();

function petRuns(mood: PetMood) {
  let runs = PET_RUNS.get(mood);
  if (!runs) {
    const rows = petFrame(mood);
    runs = { ink: toRuns(rows, "#"), tone: toRuns(rows, "o") };
    PET_RUNS.set(mood, runs);
  }
  return runs;
}

interface PetBitmapProps {
  mood: PetMood;
  width: number;
  color: string;
}

/** The WillPet frame for a mood; `o` pixels render as a lighter mid-tone. */
export const PetBitmap = memo(function PetBitmap({ mood, width, color }: PetBitmapProps) {
  const cell = cellFor(width, PET_W);
  const { ink, tone } = petRuns(mood);
  return (
    <View style={{ width: cell * PET_W, height: cell * PET_H }}>
      <Runs runs={ink} cell={cell} color={color} />
      <Runs runs={tone} cell={cell} color={color} opacity={0.38} />
    </View>
  );
});

export { FACE_ROW };
