import { defaultState, drawable, drawAll, start } from "../src/game/engine";
import { spritesheet } from "../src/game/spritesheet";
import { Survivor } from "../src/types";

const WIDTH = 640;
const HEIGHT = 480;
const player_SPEED = 100;
const TILE_SIZE = 40;
const COLUMNS = 100;
const ROWS = 100;

const tile = spritesheet<Survivor.State, Survivor.TileData>({
  x: 0,
  y: 0,
  width: TILE_SIZE,
  height: TILE_SIZE,
  image: "/public/survivor/tilemap/Tilemap/tilemap_packed.png",
  data: {
    row: 0,
    column: 0,
  },
  spritesheet: {
    row() {
      return this.data.row;
    },
    column() {
      return this.data.column;
    },
    width: 192 / 12,
    height: 176 / 11,
    padding: 1,
  },
});

const tilemap = drawable<Survivor.State>({
  x: 0,
  y: 0,
  width: WIDTH,
  height: HEIGHT,
  draw(config) {
    const { state, context } = config;
    const x = -state.player.position.x + WIDTH / 2;
    const y = -state.player.position.y + HEIGHT / 2;

    const shownRows = Math.ceil(HEIGHT / TILE_SIZE) + 1;
    const offsetRow = Math.min(
      Math.max(Math.floor(-y / TILE_SIZE), 0),
      ROWS - shownRows
    );
    const shownColumns = Math.ceil(WIDTH / TILE_SIZE) + 1;
    const offsetColumn = Math.min(
      Math.max(Math.floor(-x / TILE_SIZE), 0),
      COLUMNS - shownColumns
    );
    for (let row = offsetRow; row <= offsetRow + shownRows; row++) {
      for (
        let column = offsetColumn;
        column <= offsetColumn + shownColumns;
        column++
      ) {
        const cell = state.tiles[row]?.[column];
        if (cell) {
          context.save();
          context.translate(column * TILE_SIZE, row * TILE_SIZE);
          tile.data.row = cell.row;
          tile.data.column = cell.column;
          tile.draw?.(config);
          context.restore();
        }
      }
    }
  },
});

const player = spritesheet<Survivor.State>({
  x: (state) => state.player.position.x,
  y: (state) => state.player.position.y,
  width: TILE_SIZE,
  height: TILE_SIZE,
  spritesheet: {
    width: 17,
    height: 17,
    padding: 0,
    row: 11,
    column: 0,
  },
  image:
    "/public/survivor/characters/Spritesheet/roguelikeChar_transparent.png",
  onKeyDown({ data, state }) {
    switch (data.key) {
      case "ArrowUp":
        state.player.velocity.y -= 1;
        break;
      case "ArrowRight":
        state.player.velocity.x += 1;
        break;
      case "ArrowDown":
        state.player.velocity.y += 1;
        break;
      case "ArrowLeft":
        state.player.velocity.x -= 1;
        break;
    }
    return state;
  },
  onKeyUp({ data, state }) {
    switch (data.key) {
      case "ArrowUp":
        state.player.velocity.y += 1;
        break;
      case "ArrowRight":
        state.player.velocity.x -= 1;
        break;
      case "ArrowDown":
        state.player.velocity.y -= 1;
        break;
      case "ArrowLeft":
        state.player.velocity.x += 1;
        break;
    }
    return state;
  },
  onUpdate({ data, state }) {
    state.player.position.x +=
      state.player.velocity.x * data.deltaTime * player_SPEED;
    state.player.position.y +=
      state.player.velocity.y * data.deltaTime * player_SPEED;
    state.player.position.x = Math.min(
      Math.max(state.player.position.x, 0),
      TILE_SIZE * (COLUMNS - 1)
    );
    state.player.position.y = Math.min(
      Math.max(state.player.position.y, 0),
      TILE_SIZE * (ROWS - 1)
    );
    return state;
  },
});

const camera = drawable<Survivor.State>({
  x: 0,
  y: 0,
  children: [tilemap, player],
  draw(config) {
    const { context, state } = config;
    context.save();
    const x = -state.player.position.x + WIDTH / 2 - TILE_SIZE / 2;
    const y = -state.player.position.y + HEIGHT / 2 - TILE_SIZE / 2;
    context.translate(
      Math.max(Math.min(x, 0), -COLUMNS * TILE_SIZE + WIDTH),
      Math.max(Math.min(y, 0), -ROWS * TILE_SIZE + HEIGHT)
    );
    drawAll({
      ...config,
      drawables: this.children ?? [],
    });
    context.restore();
  },
});

start<Survivor.State>({
  drawables: [camera],
  width: WIDTH,
  height: HEIGHT,
  state: {
    ...defaultState(),
    tiles: Array.from({
      length: ROWS,
    }).map(() =>
      Array.from({ length: COLUMNS }).map(() => ({
        column: Math.floor(Math.random() * 3),
        row: 0,
      }))
    ),
    player: {
      position: {
        x: WIDTH / 2 - TILE_SIZE / 2,
        y: HEIGHT / 2 - TILE_SIZE / 2,
      },
      velocity: {
        x: 0,
        y: 0,
      },
    },
  },
  debug: true,
});
