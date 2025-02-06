// MECHANICS
// FIRST LEVEL
// * Gravity - objects fall
// * We can eat directionally
// * Bombs explode
// * Collision detection
// * Rolling bombs
// * Scissors

import { defaultState, drawable, start } from "../src/game/engine";
import { spritesheet } from "../src/game/spritesheet";
import { Supaplex } from "../src/types";

const ROWS = 10;
const COLUMNS = 10;
const CELL_SIZE = 50;
const IDLE_AT = 600;
const MOVE_SPEED = 300;
const IMAGE_PADDING = 50;
const FALL_SPEED = 2 * MOVE_SPEED;

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

const infotron = spritesheet<Supaplex.State, Supaplex.TileData>({
  x: 0,
  y(state) {
    const cell = state.tiles[this.data.row]?.[this.data.column];
    if (cell?.isFalling) {
      return Math.min(
        0,
        -CELL_SIZE + (CELL_SIZE * (state.now - cell.lastMovedAt)) / FALL_SPEED
      );
    }
    return 0;
  },
  width: CELL_SIZE,
  height: CELL_SIZE,
  image: "/public/supaplex/infotron.png",
  data: {
    row: -1,
    column: -1,
  },
  spritesheet: {
    column(state) {
      // if murphy is eating it
      if (
        state.murphy.column === this.data.column &&
        state.murphy.row === this.data.row
      ) {
        return Math.floor(
          ((state.now - state.murphy.lastMovedAt) / MOVE_SPEED) * 8
        );
      }
      return 0;
    },
    row: 1,
    padding: IMAGE_PADDING,
    height: 1152 / 3,
    width: 3072 / 8,
  },
});

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
  background: "black",
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
      padding: IMAGE_PADDING,
    };
  },
  onKeyDown({ state, data }) {
    const isMoving = state.now - state.murphy.lastMovedAt < MOVE_SPEED;
    if (!isMoving) {
      switch (data.key) {
        case "ArrowUp":
          if (state.murphy.row > 0) {
            state.murphy.row--;
            state.murphy.direction = "up";
            state.murphy.lastMovedAt = state.now;
          }
          break;
        case "ArrowRight":
          if (state.murphy.column + 1 < COLUMNS) {
            state.murphy.column++;
            state.murphy.direction = "right";
            state.murphy.lastMovedAt = state.now;
          }
          break;
        case "ArrowDown":
          if (state.murphy.row + 1 < ROWS) {
            state.murphy.row++;
            state.murphy.direction = "down";
            state.murphy.lastMovedAt = state.now;
          }
          break;
        case "ArrowLeft":
          if (state.murphy.column > 0) {
            state.murphy.column--;
            state.murphy.direction = "left";
            state.murphy.lastMovedAt = state.now;
          }
          break;
      }
    }
    return state;
  },
  onKeyUp({ state, data }) {
    console.log("key up", data.key);
    return state;
  },
});

const chip = drawable<Supaplex.State>({
  x: 0,
  y: 0,
  width: CELL_SIZE,
  height: CELL_SIZE,
  background: "green",
  children: [
    spritesheet({
      x: 0,
      y: 0,
      width: CELL_SIZE,
      height: CELL_SIZE,
      image: "/public/supaplex/chip.png",
      spritesheet: {
        padding: IMAGE_PADDING,
        width: 2688 / 7,
        height: 1152 / 3,
        row: 0,
        column: 0,
      },
    }),
    spritesheet({
      x: 0,
      y: 0,
      width: CELL_SIZE,
      height: CELL_SIZE,
      image: "/public/supaplex/chip.png",
      spritesheet: {
        padding: IMAGE_PADDING,
        width: 2688 / 7,
        height: 1152 / 3,
        row: 1,
        column: 0,
      },
    }),
  ],
});

const tiles = drawable<Supaplex.State>({
  x: 0,
  y: 0,
  draw(config) {
    const { state, context } = config;
    state.tiles.forEach((row, rowIndex) => {
      row.forEach((column, columnIndex) => {
        context.save();
        context.translate(columnIndex * CELL_SIZE, rowIndex * CELL_SIZE);
        switch (column.type) {
          case "chip":
            chip.draw?.(config);
            break;
          case "infotron":
            infotron.data.row = rowIndex;
            infotron.data.column = columnIndex;
            infotron.draw?.(config);
            break;
          case "empty":
            break;
        }
        context.restore();
      });
    });
    return state;
  },
  onUpdate({ state }) {
    // eat
    const isMoving = state.now - state.murphy.lastMovedAt < MOVE_SPEED;
    if (!isMoving) {
      const tile = state.tiles[state.murphy.row]?.[state.murphy.column];
      if (tile?.type == "chip" || tile?.type === "infotron") {
        tile.type = "empty";
      }
    }
    // gravity
    state.tiles.forEach((row, rowIndex) => {
      row.forEach((column, columnIndex) => {
        if (column.type === "infotron") {
          const isFalling = state.now - column.lastMovedAt < FALL_SPEED;
          const under = state.tiles[rowIndex + 1]?.[columnIndex];
          const hasMurphy =
            state.murphy.row === rowIndex + 1 &&
            state.murphy.column === columnIndex;
          if (!isFalling) {
            if (!hasMurphy && under?.type === "empty") {
              under.type = column.type;
              under.lastMovedAt = state.now;
              under.isFalling = true;
              column.type = "empty";
            } else {
              column.isFalling = false;
            }
          }
        }
      });
    });
    return state;
  },
});

const overrides: Record<string, Supaplex.TileType> = {
  "1,1": "infotron",
};

start<Supaplex.State>({
  drawables: [tiles, murphy],
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
    tiles: Array.from({ length: ROWS }).map((_, row) =>
      Array.from({
        length: COLUMNS,
      }).map((_, column) => {
        const key = `${row},${column}`;
        return {
          type: overrides[key] ?? (column || row ? "chip" : "empty"),
          isFalling: false,
          lastMovedAt: 0,
        };
      })
    ),
  },
  debug: true,
});
