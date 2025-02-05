// MECHANICS
// FIRST LEVEL
// * MOVE DIRECTIONALLY
// * Gravity - objects fall
// * We can eat objects
// * Bombs explode
// * Collision detection
// * Rolling bombs

import { defaultState, start } from "../src/game/engine";
import { spritesheet } from "../src/game/spritesheet";
import { Supaplex } from "../src/types";

const ROWS = 10;
const COLUMNS = 10;
const CELL_SIZE = 50;

const IDLE_AT = 600;
const MOVE_SPEED = 300;

const MOVE: Record<
  Supaplex.Direction,
  Array<{
    row: number;
    column: number;
  }>
> = {
  up: [
    {
      row: 0,
      column: 6,
    },
  ],
  right: Array.from({ length: 8 }).map((_, index) => ({
    row: 1,
    column: 8 + index,
  })),
  down: [
    {
      row: 0,
      column: 10,
    },
  ],
  left: Array.from({ length: 8 }).map((_, index) => ({
    row: 1,
    column: index,
  })),
};

const murphy = spritesheet<Supaplex.State>({
  x: (state) => {
    let offset = 0;
    const percent = Math.max(
      0,
      1 - (state.now - state.murphy.lastMovedAt) / MOVE_SPEED
    );
    switch (state.murphy.direction) {
      case "left":
        offset = CELL_SIZE * percent;
        break;
      case "right":
        offset = -CELL_SIZE * percent;
        break;
    }
    return state.murphy.column * CELL_SIZE + offset;
  },
  y: (state) => {
    let offset = 0;
    const percent = Math.max(
      0,
      1 - (state.now - state.murphy.lastMovedAt) / MOVE_SPEED
    );
    switch (state.murphy.direction) {
      case "up":
        offset = CELL_SIZE * percent;
        break;
      case "down":
        offset = -CELL_SIZE * percent;
        break;
    }
    return state.murphy.row * CELL_SIZE + offset;
  },
  width: CELL_SIZE,
  height: CELL_SIZE,
  image: "/public/supaplex/murphy.png",
  background: "blue",
  spritesheet: (state) => {
    const diff = state.now - state.murphy.lastMovedAt;
    const isIdle = diff >= IDLE_AT;
    const coordinates = isIdle
      ? [
          {
            row: 0,
            column: 0,
          },
        ]
      : MOVE[state.murphy.direction];
    const index = Math.min(
      Math.floor((diff / MOVE_SPEED) * coordinates.length),
      coordinates.length - 1
    );
    const coordinate = coordinates[index]!;
    return {
      column: coordinate.column,
      row: coordinate.row,
      width: 6144 / 16,
      height: 1920 / 5,
    };
  },
  onKeyDown({ state, data }) {
    switch (data.key) {
      case "ArrowUp":
        state.murphy.row--;
        state.murphy.direction = "up";
        state.murphy.lastMovedAt = state.now;
        break;
      case "ArrowRight":
        state.murphy.column++;
        state.murphy.direction = "right";
        state.murphy.lastMovedAt = state.now;
        break;
      case "ArrowDown":
        state.murphy.row++;
        state.murphy.direction = "down";
        state.murphy.lastMovedAt = state.now;
        break;
      case "ArrowLeft":
        state.murphy.column--;
        state.murphy.direction = "left";
        state.murphy.lastMovedAt = state.now;
        break;
    }
    return state;
  },
  onKeyUp({ state, data }) {
    console.log("key up", data.key);
    return state;
  },
});

start<Supaplex.State>({
  drawables: [murphy],
  height: CELL_SIZE * ROWS,
  width: CELL_SIZE * COLUMNS,
  state: {
    ...defaultState(),
    murphy: {
      row: 0,
      column: 0,
      direction: "down",
      lastMovedAt: 0,
    },
  },
});
