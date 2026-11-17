/**
 * The robot's LED face: two 7×5 dot matrices that show expressions.
 * Patterns are written left eye / right eye ('#' = lit). The renderer
 * crossfades each dot, so changes read like a real LED panel.
 */

export const EYE_COLS = 7;
export const EYE_ROWS = 5;

export type Expression =
  | "neutral"
  | "blink"
  | "happy"
  | "wink"
  | "heart"
  | "surprised"
  | "sleepy"
  | "reading"
  | "curious";

const p = (rows: string[]) => rows.map((r) => [...r].map((c) => c === "#"));

const NEUTRAL = p([".......", "#######", "#######", "#######", "......."]);
const BLINK = p([".......", ".......", "#######", ".......", "......."]);
const HAPPY = p([".......", "...#...", "..#.#..", ".#...#.", "#.....#"]);
const HEART = p([".##.##.", "#######", ".#####.", "..###..", "...#..."]);
const SURPRISED = p(["..###..", ".#...#.", ".#...#.", ".#...#.", "..###.."]);
const SLEEPY = p([".......", ".......", ".......", "#######", "......."]);
const SQUINT = p([".......", ".......", "#######", "#######", "......."]);
const RAISED = p(["#######", "#######", "#######", ".......", "......."]);

/** [left eye, right eye] lit masks for an expression. */
export const FACES: Record<Expression, [boolean[][], boolean[][]]> = {
  neutral: [NEUTRAL, NEUTRAL],
  blink: [BLINK, BLINK],
  happy: [HAPPY, HAPPY],
  wink: [HAPPY, BLINK],
  heart: [HEART, HEART],
  surprised: [SURPRISED, SURPRISED],
  sleepy: [SLEEPY, SLEEPY],
  reading: [SQUINT, SQUINT],
  curious: [SQUINT, RAISED],
};

/** LED colour per expression (linear-ish RGB, values above 1 bloom brighter). */
export const FACE_COLORS: Record<Expression, [number, number, number]> = {
  neutral: [1.6, 1.75, 2],
  blink: [1.6, 1.75, 2],
  happy: [1.9, 1.75, 1.4],
  wink: [1.9, 1.75, 1.4],
  heart: [2.2, 0.55, 0.9],
  surprised: [1.6, 1.9, 2.2],
  sleepy: [1.1, 1.2, 1.5],
  reading: [1.5, 1.85, 2],
  curious: [1.6, 1.75, 2],
};
