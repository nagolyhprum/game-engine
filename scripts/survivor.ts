// Add attacks
// Add experience
// Add enemies
// Add menus
// Add health

import {
  collides,
  defaultState,
  drawable,
  drawAll,
  start,
} from "../src/game/engine";
import { spritesheet } from "../src/game/spritesheet";
import { Survivor } from "../src/types";

const WIDTH = 640;
const HEIGHT = 480;
const player_SPEED = 100;
const TILE_SIZE = 40;
const COLUMNS = 100;
const ROWS = 100;
const EXPERIENCE_SPAWN_RATE = 100;
const EXPIRES_AT = 10_000;
const SOLID_COLOR = "rgba(0, 0, 255, 1)";
const HOLLOW_COLOR = "rgba(0, 0, 255, .3)";
const EXPERIENCE_HEIGHT = 20;

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

const experienceSpawner = drawable<Survivor.State>({
  x: 0,
  y: 0,
  draw({ state, context }) {
    state.experience.orbs.forEach((orb) => {
      const radius = orb.value / 2;
      const x = orb.x;
      const y = orb.y;

      context.fillStyle = HOLLOW_COLOR;
      context.beginPath();
      context.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
      context.fill();

      const percent = (orb.expiresAt - state.now) / EXPIRES_AT;
      context.fillStyle = SOLID_COLOR;
      context.beginPath();
      context.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI * percent);
      context.lineTo(x, y);
      context.closePath();
      context.fill();
    });
  },
  onUpdate({ state }) {
    const shouldSpawn =
      state.now - state.experience.lastSpawnedAt > EXPERIENCE_SPAWN_RATE;
    if (shouldSpawn) {
      state.experience.lastSpawnedAt = state.now;
      const orb: Survivor.ExperienceOrb = {
        value: Math.floor(Math.random() * 90) + 10,
        x: Math.random() * COLUMNS * TILE_SIZE,
        y: Math.random() * ROWS * TILE_SIZE,
        expiresAt: state.now + EXPIRES_AT,
      };
      state.experience.orbs.push(orb);
      state.experience.orbs = state.experience.orbs.filter((orb) => {
        const radius = orb.value / 2;
        if (
          collides(player.bounds, {
            x: orb.x - radius,
            y: orb.y - radius,
            width: 2 * radius,
            height: 2 * radius,
          })
        ) {
          orb.expiresAt = state.now;
          state.player.experience += orb.value;
        }
        return orb.expiresAt > state.now;
      });
    }
    return state;
  },
});

const camera = drawable<Survivor.State>({
  x: 0,
  y: 0,
  children: [tilemap, player, experienceSpawner],
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

const experienceBar = drawable<Survivor.State>({
  x: 0,
  y: 0,
  width: (state) => (WIDTH * state.player.experience) / state.player.levelAt,
  height: EXPERIENCE_HEIGHT,
  background: SOLID_COLOR,
  children: [
    drawable({
      x: 0,
      y: 0,
      width: WIDTH,
      height: EXPERIENCE_HEIGHT,
      background: HOLLOW_COLOR,
    }),
  ],
});

start<Survivor.State>({
  drawables: [camera, experienceBar],
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
      experience: 0,
      velocity: {
        x: 0,
        y: 0,
      },
      levelAt: 1_000,
    },
    experience: {
      orbs: [],
      lastSpawnedAt: 0,
    },
  },
  debug: true,
});
