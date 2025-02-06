// POWER-UPS
// SOUND EFFECTS

import { defaultState, drawable, start } from "../src/game/engine";
import { Breakout, Engine } from "../src/types";

const COLORS = ["red", "orange", "yellow", "green", "blue", "indigo", "cyan"];
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 10;
const GAP = 5;
const COLUMNS = 12;
const WIDTH = COLUMNS * BRICK_WIDTH + (COLUMNS + 1) * GAP;
const HEIGHT = (COLORS.length * BRICK_HEIGHT + (COLORS.length + 1) * GAP) * 4;
const BALL_DIAMETER = BRICK_HEIGHT;
const FPS = 24;
const BALL_SPEED = BRICK_HEIGHT * FPS;

const bricks = COLORS.flatMap((background, row) => {
  return Array.from({
    length: COLUMNS,
  }).map((_, column) => {
    return drawable<Breakout.State, Breakout.BrickData>({
      x: column * BRICK_WIDTH + (column + 1) * GAP,
      y: row * BRICK_HEIGHT + (row + 1) * GAP + HEIGHT / 10,
      width: BRICK_WIDTH,
      height: BRICK_HEIGHT,
      data: {
        row,
        column,
      },
      background: (state) => {
        const isAlive = state.bricks[row]?.[column]?.isAlive;
        return isAlive ? background : "black";
      },
    });
  });
});

const getBallBounce = (percent: number) => {
  const theta = -Math.PI / 4 + (percent * Math.PI) / 2;
  return {
    x: Math.sin(theta) * BALL_SPEED,
    y: -Math.cos(theta) * BALL_SPEED,
  };
};

const paddle = drawable<Breakout.State>({
  x: (state) => state.paddle.position,
  y: HEIGHT - BRICK_HEIGHT - GAP,
  width: BRICK_WIDTH,
  height: BRICK_HEIGHT,
  background: "white",
  onUpdate({ state, data }) {
    const x =
      state.paddle.position +
      (state.paddle.velocity * data.deltaTime * WIDTH) / 3;
    const min = 0;
    const max = WIDTH - BRICK_WIDTH;
    state.paddle.position = Math.max(min, Math.min(max, x));
    return state;
  },
  onKeyDown({ state, data }) {
    switch (data.key) {
      case "ArrowLeft":
        state.paddle.velocity -= 1;
        break;
      case "ArrowRight":
        state.paddle.velocity += 1;
        break;
    }
    return state;
  },
  onKeyUp({ state, data }) {
    switch (data.key) {
      case "ArrowLeft":
        state.paddle.velocity += 1;
        break;
      case "ArrowRight":
        state.paddle.velocity -= 1;
        break;
    }
    return state;
  },
});

const collides = (a: Engine.Rect, b: Engine.Rect) => {
  const minX = Math.max(a.x, b.x),
    minY = Math.max(a.y, b.y),
    maxX = Math.min(a.x + a.width, b.x + b.width),
    maxY = Math.min(a.y + a.height, b.y + b.height);
  const width = maxX - minX;
  const height = maxY - minY;
  return width > 0 && height > 0
    ? {
        x: 0,
        y: 0,
        width,
        height,
      }
    : false;
};

const amend = (
  state: Breakout.State,
  bounds: Engine.Rect,
  collision: Engine.Rect
) => {
  const ballRadius = ball.bounds.width / 2;
  // updates
  if (collision.width > collision.height) {
    const ballCenterY = ball.bounds.y + ballRadius;
    const boundsCenterY = bounds.y + bounds.height / 2;
    const moveY = collision.height * (ballCenterY < boundsCenterY ? -1 : 1);
    state.ball.position.y += moveY;
    ball.bounds.y += moveY;
  } else {
    const ballCenterX = ball.bounds.x + ballRadius;
    const boundsCenterX = bounds.x + bounds.width / 2;
    const moveX = collision.width * (ballCenterX < boundsCenterX ? -1 : 1);
    state.ball.position.x += moveX;
    ball.bounds.x += moveX;
  }
};

const ball = drawable<Breakout.State>({
  x: (state) => {
    const isMoving = state.ball.velocty.x || state.ball.velocty.y;
    return isMoving
      ? state.ball.position.x
      : state.paddle.position + BRICK_WIDTH / 2 - BALL_DIAMETER / 2;
  },
  y: (state) => {
    const isMoving = state.ball.velocty.x || state.ball.velocty.y;
    return isMoving
      ? state.ball.position.y
      : HEIGHT - 2 * GAP - 2 * BRICK_HEIGHT;
  },
  width: BALL_DIAMETER,
  height: BALL_DIAMETER,
  radius: BALL_DIAMETER / 2,
  background: "white",
  onKeyDown({ state, data }) {
    switch (data.key) {
      case " ":
        const isMoving = state.ball.velocty.x || state.ball.velocty.y;
        if (!isMoving) {
          state.ball.position.x = ball.bounds.x;
          state.ball.position.y = ball.bounds.y;
          const velocity = getBallBounce(Math.random());
          state.ball.velocty.x = velocity.x;
          state.ball.velocty.y = velocity.y;
        } else {
          state.ball.velocty.x = 0;
          state.ball.velocty.y = 0;
        }
        break;
    }
    return state;
  },
  onUpdate({ state, data }) {
    state.ball.position.x += state.ball.velocty.x * data.deltaTime;
    state.ball.position.y += state.ball.velocty.y * data.deltaTime;
    ball.bounds.x += state.ball.velocty.x * data.deltaTime;
    ball.bounds.y += state.ball.velocty.y * data.deltaTime;
    // detect paddle
    const collision =
      state.ball.velocty.y > 0 && collides(paddle.bounds, ball.bounds);
    if (collision) {
      const radius = ball.bounds.width / 2;
      const minX = paddle.bounds.x - radius;
      const maxX = paddle.bounds.x + paddle.bounds.width + radius;
      const x = ball.bounds.x + radius;
      const percent = (x - minX) / (maxX - minX);
      const velocity = getBallBounce(percent);
      state.ball.velocty.x = velocity.x;
      state.ball.velocty.y = velocity.y;
      amend(state, paddle.bounds, collision);
      if (!state.bricks.flat().find((brick) => brick.isAlive)) {
        restartBricks(state);
      }
    }
    // detect brick
    let collided = false;
    bricks.forEach((brick) => {
      if (!collided) {
        const cell = state.bricks[brick.data.row]?.[brick.data.column];
        if (cell) {
          const isAlive = cell.isAlive;
          const collision = isAlive && collides(brick.bounds, ball.bounds);
          if (collision) {
            const isXBounce = collision.height > collision.width;
            if (isXBounce) {
              state.ball.velocty.x = -state.ball.velocty.x;
            } else {
              state.ball.velocty.y = -state.ball.velocty.y;
            }
            amend(state, brick.bounds, collision);
            const power = COLORS.length - brick.data.row - 1;
            state.score += 10 * Math.pow(2, power);
            cell.isAlive = false;
            collided = true;
          }
        }
      }
    });
    // bounce walls
    if (
      (state.ball.velocty.x < 0 && state.ball.position.x <= 0) ||
      (state.ball.velocty.x > 0 &&
        state.ball.position.x + BALL_DIAMETER > WIDTH)
    ) {
      state.ball.velocty.x = -state.ball.velocty.x;
    }
    // bounce ceiling
    if (state.ball.velocty.y < 0 && state.ball.position.y <= 0) {
      state.ball.velocty.y = -state.ball.velocty.y;
    }
    // out of bounds
    if (state.ball.velocty.y > 0 && state.ball.position.y > HEIGHT) {
      state.ball.velocty.x = state.ball.velocty.y = 0;
      state.lives--;
      if (!state.lives) {
        restart(state);
      }
    }
    return state;
  },
});

const lives = drawable<Breakout.State>({
  x: GAP,
  y: GAP,
  text: (state) => `Lives: ${state.lives}`,
  color: "white",
  font: "24px Courier New",
});

const score = drawable<Breakout.State>({
  x: WIDTH - GAP,
  y: GAP,
  align: "right",
  text: (state) => `Score: ${state.score}`,
  color: "white",
  font: "24px Courier New",
});

const restartBricks = (state: Breakout.State) => {
  state.bricks = COLORS.map(() =>
    Array.from({ length: COLUMNS }).map(() => ({
      isAlive: true,
    }))
  );
};

const restart = (state: Breakout.State) => {
  state.lives = 3;
  state.score = 0;
  restartBricks(state);
  return state;
};

start({
  drawables: [...bricks, ball, paddle, lives, score],
  width: WIDTH,
  height: HEIGHT,
  state: restart({
    ...defaultState(),
    lives: 3,
    score: 0,
    paddle: {
      position: WIDTH / 2 - BRICK_WIDTH / 2,
      velocity: 0,
    },
    ball: {
      position: {
        x: 0,
        y: 0,
      },
      velocty: {
        x: 0,
        y: 0,
      },
    },
    bricks: [],
  }),
});
