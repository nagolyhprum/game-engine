// Add enemies
// Add levels
// Add health

import {
  collides,
  defaultState,
  drawable,
  drawAll,
  start,
} from "../src/game/engine";
import { ninePatch } from "../src/game/nine-patch";
import { spritesheet } from "../src/game/spritesheet";
import { Survivor } from "../src/types";

const FONT_SIZE = 12;
const WIDTH = 640;
const HEIGHT = 480;
const PLAYER_SPEED = 150;
const TILE_SIZE = 40;
const COLUMNS = 100;
const ROWS = 100;
const EXPERIENCE_SPAWN_RATE = 100;
const EXPIRES_AT = 10_000;
const SOLID_COLOR = "rgba(0, 0, 255, 1)";
const HOLLOW_COLOR = "rgba(0, 0, 255, .3)";
const PADDING = 10;
const BAR_WIDTH = 100;
const BAR_HEIGHT = 10;
const UI_EDGE = 8;

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

const attack = spritesheet<Survivor.State>({
  x: (state) => state.player.position.x,
  y: (state) => state.player.position.y - TILE_SIZE / 2,
  width: 2 * TILE_SIZE,
  height: 2 * TILE_SIZE,
  image: "/public/survivor/attacks/swing03.png",
  spritesheet: (state) => {
    const index = Math.floor(state.now / 100) % 10;
    const row = Math.floor(index / 5);
    const column = index % 5;
    return {
      width: 320 / 5,
      height: 128 / 2,
      row,
      column,
    };
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
    width: 16,
    height: 16,
    row: 11,
    column: 0,
    gap: 1,
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
      state.player.velocity.x * data.deltaTime * PLAYER_SPEED;
    state.player.position.y +=
      state.player.velocity.y * data.deltaTime * PLAYER_SPEED;
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

      const percent = Math.max((orb.expiresAt - state.now) / EXPIRES_AT, 0);
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
  children: [tilemap, player, experienceSpawner, attack],
  draw(config) {
    const { context, state } = config;
    context.save();
    const x = -state.player.position.x + WIDTH / 2 - TILE_SIZE / 2;
    const y = -state.player.position.y + HEIGHT / 2 - TILE_SIZE / 2;
    context.translate(
      Math.round(Math.max(Math.min(x, 0), -COLUMNS * TILE_SIZE + WIDTH)),
      Math.round(Math.max(Math.min(y, 0), -ROWS * TILE_SIZE + HEIGHT))
    );
    drawAll({
      ...config,
      drawables: this.children ?? [],
    });
    context.restore();
  },
});

const healthOffset = 0;
const energyOffset = FONT_SIZE * 2 + BAR_HEIGHT + PADDING;
const experienceOffset = FONT_SIZE * 4 + BAR_HEIGHT * 2 + PADDING * 2;
const fontSpacing = 2;

const barContainer = drawable<Survivor.State>({
  x: 0,
  y: 0,
  children: [
    // PANEL
    ninePatch({
      x: PADDING,
      y: PADDING,
      width: BAR_WIDTH + 2 * UI_EDGE + 2 * PADDING,
      height: 3 * BAR_HEIGHT + 6 * FONT_SIZE + 2 * UI_EDGE + 4 * PADDING,
      image: "/public/survivor/ui/PNG/Default/panel_brown.png",
      ninePatch: {
        destinationEdge: 8,
        height: 64,
        sourceEdge: 8,
        width: 64,
      },
    }),
    // EXPERIENCE
    drawable({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + experienceOffset - fontSpacing,
      text: "Experience",
      color: "black",
      font: `${FONT_SIZE}px Courier New`,
      align: "left",
      baseline: "top",
    }),
    drawable({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + FONT_SIZE + experienceOffset,
      width: BAR_WIDTH,
      height: BAR_HEIGHT,
      background: "rgba(0, 0, 0, .3)",
      radius: 20,
    }),
    ninePatch({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + FONT_SIZE + experienceOffset,
      width: (state) =>
        Math.max(
          (state.player.experience / state.player.levelAt) * BAR_WIDTH,
          10
        ),
      height: BAR_HEIGHT,
      image: "/public/survivor/ui/PNG/Default/progress_green_small.png",
      ninePatch: {
        destinationEdge: 5,
        sourceEdge: 5,
        width: 16,
        height: 16,
      },
    }),
    drawable({
      x: 2 * PADDING + UI_EDGE + BAR_WIDTH,
      y:
        2 * PADDING +
        UI_EDGE +
        FONT_SIZE +
        BAR_HEIGHT +
        2 +
        experienceOffset +
        fontSpacing,
      text: (state) => `${state.player.experience} / ${state.player.levelAt}`,
      color: "black",
      font: `${FONT_SIZE}px Courier New`,
      align: "right",
      baseline: "top",
    }),
    // HEALTH
    drawable({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + healthOffset - fontSpacing,
      text: "Health",
      color: "black",
      font: `${FONT_SIZE}px Courier New`,
      align: "left",
      baseline: "top",
    }),
    drawable({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + FONT_SIZE + healthOffset,
      width: BAR_WIDTH,
      height: BAR_HEIGHT,
      background: "rgba(0, 0, 0, .3)",
      radius: 20,
    }),
    ninePatch({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + FONT_SIZE + healthOffset,
      width: BAR_WIDTH,
      height: BAR_HEIGHT,
      image: "/public/survivor/ui/PNG/Default/progress_red_small.png",
      ninePatch: {
        destinationEdge: 5,
        sourceEdge: 5,
        width: 16,
        height: 16,
      },
    }),
    drawable({
      x: 2 * PADDING + UI_EDGE + BAR_WIDTH,
      y:
        2 * PADDING +
        UI_EDGE +
        FONT_SIZE +
        BAR_HEIGHT +
        healthOffset +
        fontSpacing,
      text: `40 / 40`,
      color: "black",
      font: `${FONT_SIZE}px Courier New`,
      align: "right",
      baseline: "top",
    }),
    // ENERGY

    // HEALTH
    drawable({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + energyOffset - fontSpacing,
      text: "Energy",
      color: "black",
      font: `${FONT_SIZE}px Courier New`,
      align: "left",
      baseline: "top",
    }),
    drawable({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + FONT_SIZE + energyOffset,
      width: BAR_WIDTH,
      height: BAR_HEIGHT,
      background: "rgba(0, 0, 0, .3)",
      radius: 20,
    }),
    ninePatch({
      x: 2 * PADDING + UI_EDGE,
      y: 2 * PADDING + UI_EDGE + FONT_SIZE + energyOffset,
      width: BAR_WIDTH,
      height: BAR_HEIGHT,
      image: "/public/survivor/ui/PNG/Default/progress_blue_small.png",
      ninePatch: {
        destinationEdge: 5,
        sourceEdge: 5,
        width: 16,
        height: 16,
      },
    }),
    drawable({
      x: 2 * PADDING + UI_EDGE + BAR_WIDTH,
      y:
        2 * PADDING +
        UI_EDGE +
        FONT_SIZE +
        BAR_HEIGHT +
        energyOffset +
        fontSpacing,
      text: `100 / 100`,
      color: "black",
      font: `${FONT_SIZE}px Courier New`,
      align: "right",
      baseline: "top",
    }),
  ],
});

start<Survivor.State>({
  drawables: [camera, barContainer],
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
  // debug: true,
});
