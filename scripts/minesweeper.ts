// TODO : MISSING
// TILEMAP
// TIMER
// REMAINING DANGER COUNT

import { start, drawable } from "../src/game/engine";
import { ninePatch } from "../src/game/nine-patch";
import { spritesheet } from "../src/game/spritesheet";

import { Minesweeper } from "../src/types";
import { shuffle } from "../src/utility";

const MENU_HEIGHT = 50;
const CELL_SIZE = 40;
const ROWS = 10;
const COLUMNS = 15;
const WIDTH = CELL_SIZE * COLUMNS;
const HEIGHT = MENU_HEIGHT + CELL_SIZE * ROWS;
const DANGERS = Math.ceil(ROWS * COLUMNS * 0.05);
const SOURCE_EDGE = 3;
const DESTINATION_EDGE = (CELL_SIZE / 16) * SOURCE_EDGE;

const getWinState = (state: Minesweeper.State): Minesweeper.WinState => {
  const cells = state.cells.flat();
  const danger = cells.find((cell) => cell.isDangerous && cell.isRevealed);
  if (danger) {
    return "lose";
  }
  const unrevealed = cells.find(
    (cell) => !cell.isDangerous && !cell.isRevealed
  );
  if (unrevealed) {
    return "neutral";
  }
  return "win";
};

const getCellSource = (cell: Minesweeper.CellState | null | undefined) => {
  if (!cell) {
    return {
      row: -1,
      column: -1,
    };
  }
  if (cell.isRevealed) {
    if (cell.surroundingDangers) {
      const index = cell.surroundingDangers - 1;
      return {
        row: Math.floor(index / 4),
        column: index % 4,
      };
    } else if (cell.isDangerous) {
      return {
        column: 2,
        row: 2,
      };
    } else {
      return {
        column: 0,
        row: 2,
      };
    }
  } else if (cell.isFlagged) {
    return {
      row: 2,
      column: 3,
    };
  } else {
    return {
      row: 2,
      column: 1,
    };
  }
};

const findDangers = (state: Minesweeper.State, row: number, column: number) => {
  let dangers = 0;
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      const cell = state.cells[row + y]?.[column + x];
      if (cell?.isDangerous) {
        dangers++;
      }
    }
  }
  return dangers;
};

const restart = (state: Minesweeper.State) => {
  const cells = state.cells.flat();
  // reset the state
  cells.forEach((cell) => {
    cell.isDangerous = false;
    cell.isFlagged = false;
    cell.isRevealed = false;
    cell.surroundingDangers = 0;
  });
  // mark random cells as dangerous
  shuffle(cells)
    .slice(0, DANGERS)
    .forEach((cell) => {
      cell.isDangerous = true;
    });
  // mark the numbers
  cells.forEach((cell) => {
    if (!cell.isDangerous) {
      cell.surroundingDangers = findDangers(state, cell.row, cell.column);
    }
  });
  return state;
};

const onClick = (
  cell: Minesweeper.Cell,
  state: Minesweeper.State,
  isRightClick = false
) => {
  const winState = getWinState(state);
  if (winState === "neutral") {
    const data = state.cells[cell.data.row]?.[cell.data.column];
    if (data) {
      if (isRightClick) {
        data.isFlagged = true;
      } else {
        if (!data.isRevealed && !data.isFlagged) {
          if (data.isDangerous) {
            engine.play("/public/explosion.wav", 0.25);
          }
          revealNeighbors(state, cell.data.row, cell.data.column);
        }
      }
    }
  }
  return state;
};

const revealNeighbors = (
  state: Minesweeper.State,
  row: number,
  column: number
) => {
  const cell = state.cells[row]?.[column];
  if (cell) {
    if (!cell.isRevealed) {
      cell.isRevealed = true;
      if (!cell.isDangerous && !cell.surroundingDangers) {
        for (let x = -1; x < 2; x++) {
          for (let y = -1; y < 2; y++) {
            revealNeighbors(state, row + y, column + x);
          }
        }
      }
    }
  }
};

const cells = Array.from({ length: ROWS * COLUMNS }).map(
  (_, index): Minesweeper.Cell => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    return spritesheet({
      spritesheet(state) {
        const source = getCellSource(
          state.cells[this.data.row]?.[this.data.column]
        );
        return {
          column: source.column,
          row: source.row,
          width: 16,
          height: 16,
        };
      },
      x: column * CELL_SIZE,
      y: row * CELL_SIZE + MENU_HEIGHT,
      width: CELL_SIZE,
      height: CELL_SIZE,
      image: "/public/minesweeper.png",
      data: {
        column,
        row,
      },
      onClick(state) {
        return onClick(this, state, false);
      },
      onContext(state) {
        return onClick(this, state, true);
      },
    });
  }
);

const menu = drawable<Minesweeper.State>({
  x: 0,
  y: 0,
  width: WIDTH,
  height: MENU_HEIGHT,
  data: null,
  children: [
    ninePatch({
      x: 0,
      y: 0,
      width: WIDTH,
      height: MENU_HEIGHT,
      ninePatch: {
        sourceEdge: SOURCE_EDGE,
        destinationEdge: DESTINATION_EDGE,
        width: 16,
        height: 16,
      },
      children: [
        spritesheet({
          x: 0,
          y: 0,
          width: 16,
          height: 16,
          spritesheet: {
            column: 0,
            row: 2,
            width: 16,
            height: 16,
          },
          image: "/public/minesweeper.png",
          data: null,
        }),
      ],
      data: null,
    }),
    drawable({
      x: 25,
      y: MENU_HEIGHT / 2,
      baseline: "middle",
      align: "left",
      text: "00:00",
      color: "red",
      font: `${MENU_HEIGHT / 2}px Courier New`,
      data: null,
    }),
    drawable({
      x: WIDTH / 2 - 25,
      y: MENU_HEIGHT / 2 - 25,
      width: 50,
      height: 50,
      baseline: "middle",
      align: "center",
      font: `${MENU_HEIGHT / 2}px Courier New`,
      text: (state) => {
        const winState = getWinState(state);
        if (winState === "win") {
          return "😎";
        }
        if (winState === "lose") {
          return "😵";
        }
        return "🙂";
      },
      onClick(state) {
        return restart(state);
      },
      data: null,
    }),
    drawable({
      x: WIDTH - 25,
      y: MENU_HEIGHT / 2,
      baseline: "middle",
      align: "right",
      text: "99",
      color: "red",
      font: `${MENU_HEIGHT / 2}px Courier New`,
      data: null,
    }),
  ],
});

const winState = drawable<Minesweeper.State>({
  x: 0,
  y: 0,
  width: WIDTH,
  height: HEIGHT,
  background: "rgba(0, 0, 0, .3)",
  baseline: "middle",
  align: "center",
  data: null,
  visible: (state) => {
    const winState = getWinState(state);
    return winState !== "neutral";
  },
  text: (state) => {
    const winState = getWinState(state);
    return winState === "win" ? "You win!" : "You lose!";
  },
  color: (state) => {
    const winState = getWinState(state);
    return winState === "win" ? "green" : "red";
  },
});

const engine = start<Minesweeper.State>({
  width: WIDTH,
  height: HEIGHT,
  state: restart({
    cells: Array.from({ length: ROWS }).map((_, row) =>
      Array.from({ length: COLUMNS }).map((_, column) => ({
        row,
        column,
        isRevealed: false,
        isFlagged: false,
        surroundingDangers: 0,
        isDangerous: false,
      }))
    ),
  }),
  signals: [],
  drawables: [menu, ...cells, winState],
});

// 238
