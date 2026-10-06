/**
 * WillPet — a 22×20 pixel sprout creature.
 * `#` ink, `o` mid-tone (rendered as a dither), `.` empty.
 * The body is shared; faces are swapped in on rows FACE_ROW..FACE_ROW+5.
 */
export type PetMood = "idle" | "blink" | "happy" | "sad" | "sleep";

const BODY = [
  "..........##..........",
  ".........#oo#..###....",
  ".........#oo#.#ooo#...",
  "..........#o##oooo#...",
  "..........#o#oooo#....",
  "...........####.......",
  "......###########.....",
  "....##...........##...",
  "...#...............#..",
  "..#.................#.",
  "..#.................#.",
  ".#...................#",
  ".#...................#",
  ".#...................#",
  ".#...................#",
  "..#.................#.",
  "..#.................#.",
  "...##.............##..",
  ".....#############....",
  "....###.......###.....",
];

export const FACE_ROW = 10;

const FACES: Record<PetMood, string[]> = {
  idle: [
    "......##.....##.......",
    "......##.....##.......",
    "......##.....##.......",
    "...oo............oo...",
    ".........#..#.........",
    "..........##..........",
  ],
  blink: [
    "......................",
    ".....####...####......",
    "......................",
    "......................",
    ".........#..#.........",
    "..........##..........",
  ],
  happy: [
    "......#.......#.......",
    ".....#.#.....#.#......",
    "....#...#...#...#.....",
    "...oo............oo...",
    "........######........",
    ".........####.........",
  ],
  sad: [
    ".......##...##........",
    ".....##.......##......",
    "......##.....##.......",
    "......................",
    "..........##..........",
    ".........#..#.........",
  ],
  sleep: [
    "......................",
    ".....####...####......",
    "......................",
    "......................",
    "..........##..........",
    "......................",
  ],
};

export const PET_W = BODY[0].length;
export const PET_H = BODY.length;

function overlay(base: string, face: string): string {
  let out = "";
  for (let i = 0; i < base.length; i++) {
    out += face[i] !== "." ? face[i] : base[i];
  }
  return out;
}

export function petFrame(mood: PetMood): string[] {
  const face = FACES[mood];
  return BODY.map((row, y) => {
    const f = face[y - FACE_ROW];
    return f ? overlay(row, f) : row;
  });
}

/** Path for one tone of a frame, with horizontal runs merged. */
export function petPath(rows: string[], tone: "#" | "o"): string {
  let d = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === tone) {
        let w = 1;
        while (row[x + w] === tone) w++;
        d += `M${x} ${y}h${w}v1h-${w}z`;
        x += w;
      } else {
        x++;
      }
    }
  });
  return d;
}
