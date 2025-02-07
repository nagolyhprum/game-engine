import { defaultState, drawable, start } from "../src/game/engine";
import { spritesheet } from "../src/game/spritesheet";
import { Survivor } from "../src/types";

const WIDTH = 640;
const HEIGHT = 480;
const CAMERA_SPEED = 100;
const TILE_SIZE = 40;

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
    const { x, y } = state.camera.position;
    const offsetRow = Math.floor(-y / TILE_SIZE);
    const shownRows = Math.ceil(HEIGHT / TILE_SIZE);
    const offsetColumn = Math.floor(-x / TILE_SIZE);
    const shownColumns = Math.ceil(WIDTH / TILE_SIZE);
    for (let row = offsetRow; row <= offsetRow + shownRows; row++) {
      for (
        let column = offsetColumn;
        column <= offsetColumn + shownColumns;
        column++
      ) {
        const cell = state.tiles[row]?.[column];
        if (cell) {
          context.save();
          context.translate(column * TILE_SIZE + x, row * TILE_SIZE + y);
          tile.data.row = cell.row;
          tile.data.column = cell.column;
          tile.draw?.(config);
          context.restore();
        }
      }
    }
  },
  onKeyDown({ data, state }) {
    switch (data.key) {
      case "ArrowUp":
        state.camera.velocity.y += 1;
        break;
      case "ArrowRight":
        state.camera.velocity.x -= 1;
        break;
      case "ArrowDown":
        state.camera.velocity.y -= 1;
        break;
      case "ArrowLeft":
        state.camera.velocity.x += 1;
        break;
    }
    return state;
  },
  onKeyUp({ data, state }) {
    switch (data.key) {
      case "ArrowUp":
        state.camera.velocity.y -= 1;
        break;
      case "ArrowRight":
        state.camera.velocity.x += 1;
        break;
      case "ArrowDown":
        state.camera.velocity.y += 1;
        break;
      case "ArrowLeft":
        state.camera.velocity.x -= 1;
        break;
    }
    return state;
  },
  onUpdate({ data, state }) {
    state.camera.position.x +=
      state.camera.velocity.x * data.deltaTime * CAMERA_SPEED;
    state.camera.position.y +=
      state.camera.velocity.y * data.deltaTime * CAMERA_SPEED;
    return state;
  },
});

const player = spritesheet({
  x: 0,
  y: 0,
  width: TILE_SIZE,
  height: TILE_SIZE,
  spritesheet: {
    width: 16,
    height: 16,
    padding: 1,
  },
});

start<Survivor.State>({
  drawables: [tilemap],
  width: WIDTH,
  height: HEIGHT,
  state: {
    ...defaultState(),
    tiles: Array.from({
      length: 1000,
    }).map(() =>
      Array.from({ length: 1000 }).map(() => ({
        column: Math.floor(Math.random() * 3),
        row: 0,
      }))
    ),
    camera: {
      position: {
        x: 0,
        y: 0,
      },
      velocity: {
        x: 0,
        y: 0,
      },
    },
  },
  debug: true,
});
