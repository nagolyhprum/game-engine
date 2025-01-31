const MENU_HEIGHT = 50;
const CELL_SIZE = 40;
const ROWS = 10;
const COLUMNS = 15;
const WIDTH = CELL_SIZE * COLUMNS;
const HEIGHT = MENU_HEIGHT + CELL_SIZE * ROWS;

const canvas = document.querySelector("canvas")!;
const context = canvas.getContext("2d")!;

canvas.width = WIDTH;
canvas.height = HEIGHT;

// cells have a danger or not
// cells are flagged or not
// cells are flipped or not

const state = {
  cells: Array.from({ length: ROWS }).map(() =>
    Array.from({ length: COLUMNS }).map(() => ({
      isFlagged: false,
      isRevealed: false,
      isDangerous: false,
      surroundingDangers: 0,
    }))
  ),
};

state.cells[0][0].isFlagged = true;

state.cells[0][1].isDangerous = true;

state.cells[0][2].isRevealed = true;

state.cells[0][3].surroundingDangers = 5;

const clear = () => {
  context.fillStyle = "lightgray";
  context.fillRect(0, 0, WIDTH, HEIGHT);
};

const drawCells = () => {
  context.beginPath();
  for (let row = 0; row < ROWS; row++) {
    context.moveTo(0, row * CELL_SIZE + MENU_HEIGHT);
    context.lineTo(0 + WIDTH, row * CELL_SIZE + MENU_HEIGHT);
  }
  for (let column = 1; column < COLUMNS; column++) {
    context.moveTo(column * CELL_SIZE, MENU_HEIGHT);
    context.lineTo(column * CELL_SIZE, HEIGHT);
  }
  context.strokeStyle = "darkgray";
  context.stroke();
};

const draw = () => {
  clear();
  drawCells();
};

draw();
