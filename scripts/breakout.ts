import { defaultState, drawable, start } from "../src/game/engine";
import { Breakout } from "../src/types";

const COLORS = ["red", "orange", "yellow", "green", "blue", "indigo", "cyan"];
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 10;
const GAP = 5;
const COLUMNS = 12;
const WIDTH = COLUMNS * BRICK_WIDTH + (COLUMNS + 1) * GAP;
const HEIGHT = (COLORS.length * BRICK_HEIGHT + (COLORS.length + 1) * GAP) * 4;
const BALL_DIAMETER = BRICK_HEIGHT;

const bricks = COLORS.flatMap((background, row) => {
  return Array.from({
    length: COLUMNS,
  }).map((_, column) => {
    return drawable<Breakout.State>({
      x: column * BRICK_WIDTH + (column + 1) * GAP,
      y: row * BRICK_HEIGHT + (row + 1) * GAP + HEIGHT / 10,
      width: BRICK_WIDTH,
      height: BRICK_HEIGHT,
      background,
    });
  });
});

const paddle = drawable<Breakout.State>({
  x: WIDTH / 2 - BRICK_WIDTH / 2,
  y: HEIGHT - BRICK_HEIGHT - GAP,
  width: BRICK_WIDTH,
  height: BRICK_HEIGHT,
  background: "white",
});

const ball = drawable<Breakout.State>({
  x: WIDTH / 2 - BALL_DIAMETER / 2,
  y: HEIGHT - 2 * BALL_DIAMETER - 2 * GAP,
  width: BALL_DIAMETER,
  height: BALL_DIAMETER,
  radius: BALL_DIAMETER / 2,
  background: "white",
});

start({
  debug: true,
  drawables: [...bricks, ball, paddle],
  width: WIDTH,
  height: HEIGHT,
  state: {
    ...defaultState(),
  },
});
