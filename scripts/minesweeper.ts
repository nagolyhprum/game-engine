// TODO : MISSING
// TIMER
// REMAINING DANGER COUNT
// RESET

type WinState = "win" | "lose" | "neutral";

const MENU_HEIGHT = 0;
const CELL_SIZE = 40;
const ROWS = 10;
const COLUMNS = 15;
const WIDTH = CELL_SIZE * COLUMNS;
const HEIGHT = MENU_HEIGHT + CELL_SIZE * ROWS;
const DANGERS = Math.ceil(ROWS * COLUMNS * 0.1);

const canvas = document.querySelector("canvas")!;
const context = canvas.getContext("2d")!;
context.imageSmoothingEnabled = false;

const image = new Image();
image.src = "/public/minesweeper.png";

canvas.width = WIDTH;
canvas.height = HEIGHT;

const explosion = new Audio("/public/explosion.wav");
explosion.volume = 0.5;

const onClick = (event: MouseEvent, isRightClick = false) => {
  const winState = getWinState();
  if (winState !== "neutral") {
    start();
  } else {
    const x = event.offsetX;
    const y = event.offsetY - MENU_HEIGHT;
    const row = Math.floor(y / CELL_SIZE);
    const column = Math.floor(x / CELL_SIZE);
    const cell = state.cells[row]?.[column];
    if (cell) {
      if (isRightClick) {
        cell.isFlagged = true;
      } else {
        if (!cell.isRevealed && !cell.isFlagged) {
          if (cell.isDangerous) {
            explosion.play();
          }
          revealNeighbors(cell.row, cell.column);
        }
      }
    }
  }
  draw();
};

const revealNeighbors = (row: number, column: number) => {
  const cell = state.cells[row]?.[column];
  if (cell) {
    if (!cell.isRevealed) {
      cell.isRevealed = true;
      if (!cell.isDangerous && !cell.surroundingDangers) {
        for (let x = -1; x < 2; x++) {
          for (let y = -1; y < 2; y++) {
            revealNeighbors(row + y, column + x);
          }
        }
      }
    }
  }
};

const getWinState = (): WinState => {
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

canvas.onclick = onClick;

canvas.oncontextmenu = (event) => {
  onClick(event, true);
  event.preventDefault();
};

const state = {
  cells: Array.from({ length: ROWS }).map((_, row) =>
    Array.from({ length: COLUMNS }).map((_, column) => ({
      isFlagged: false,
      isRevealed: false,
      isDangerous: false,
      surroundingDangers: 0,
      row,
      column,
    }))
  ),
};

const shuffle = <T>(input: T[]): T[] => {
  for (let from = 0; from < input.length; from++) {
    const temp = input[from]!;
    const to = Math.floor(Math.random() * input.length);
    input[from] = input[to]!;
    input[to] = temp;
  }
  return input;
};

const start = () => {
  const cells = state.cells.flat();
  cells.forEach((cell) => {
    cell.isDangerous = false;
    cell.isFlagged = false;
    cell.isRevealed = false;
    cell.surroundingDangers = 0;
  });
  shuffle(cells)
    .slice(0, DANGERS)
    .forEach((cell) => {
      cell.isDangerous = true;
    });
  cells.forEach((cell) => {
    if (!cell.isDangerous) {
      cell.surroundingDangers = findDangers(cell.row, cell.column);
    }
  });
};

const findDangers = (row: number, column: number) => {
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

const clear = () => {
  context.fillStyle = "lightgray";
  context.fillRect(0, 0, WIDTH, HEIGHT);
};

const drawCells = () => {
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      const cell = state.cells[row]?.[column];
      if (cell) {
        if (cell.isRevealed) {
          if (cell.surroundingDangers) {
            const drawNumber = drawNumbers[cell.surroundingDangers - 1];
            if (drawNumber) {
              drawNumber(row, column);
            }
          } else if (cell.isDangerous) {
            drawDanger(row, column);
          } else {
            drawRevealed(row, column);
          }
        } else if (cell.isFlagged) {
          drawFlag(row, column);
        } else {
          drawHidden(row, column);
        }
      }
    }
  }
};

const drawEndState = () => {
  const winState = getWinState();
  if (winState !== "neutral") {
    context.fillStyle = "rgba(0, 0, 0, .3)";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = winState === "win" ? "green" : "red";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${2 * CELL_SIZE}px sans-serif`;
    context.fillText(
      winState === "win" ? "You win!" : "You lose!",
      WIDTH / 2,
      HEIGHT / 2
    );
  }
};

const draw = () => {
  clear();
  drawCells();
  drawEndState();
};

const drawPartial = (sr: number, sc: number, dr: number, dc: number) => {
  const sw = image.width / 4,
    sh = image.height / 3,
    sx = sw * sc,
    sy = sh * sr,
    dw = CELL_SIZE,
    dh = CELL_SIZE,
    dx = dc * dw,
    dy = dr * dh + MENU_HEIGHT;
  context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
};

const drawNumbers = Array.from({
  length: 8,
}).map((_, index) => (row: number, column: number) => {
  const sc = index % 4;
  const sr = Math.floor(index / 4);
  drawPartial(sr, sc, row, column);
});

const drawRevealed = (row: number, column: number) => {
  drawPartial(2, 0, row, column);
};
const drawHidden = (row: number, column: number) => {
  drawPartial(2, 1, row, column);
};
const drawDanger = (row: number, column: number) => {
  drawPartial(2, 2, row, column);
};
const drawFlag = (row: number, column: number) => {
  drawPartial(2, 3, row, column);
};

image.onload = () => {
  start();
  draw();
};
