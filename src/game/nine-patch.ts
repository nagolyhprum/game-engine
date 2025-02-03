import { Engine } from "../types";
import { draw, drawable, getValue } from "./engine";

const getCanvas = () => {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    return {
      canvas,
      context,
    };
  }
  return {
    canvas: null,
    context: null,
  };
};

export const ninePatch = <State, Data = unknown>(
  config: Engine.NinePatchConfig<State, Data>
) => {
  const { canvas: backCanvas, context: backContext } = getCanvas();
  return drawable({
    ...config,
    draw(context, state, signals) {
      if (backCanvas && backContext) {
        const ninePatch = getValue(config.ninePatch, state, this);
        const sourceEdge = ninePatch?.sourceEdge ?? 0;
        const destinationEdge = ninePatch?.destinationEdge ?? 0;
        backCanvas.width = ninePatch?.width ?? 0;
        backCanvas.height = ninePatch?.height ?? 0;
        const x = getValue(this.x, state, this) ?? 0,
          y = getValue(this.y, state, this) ?? 0,
          width = getValue(this.width, state, this) ?? 0,
          height = getValue(this.height, state, this) ?? 0;
        state = draw(this, backContext, state, signals);
        const sourceColumns = [
          0,
          sourceEdge,
          backCanvas.width - sourceEdge,
          backCanvas.width,
        ];
        const sourceRows = [
          0,
          sourceEdge,
          backCanvas.height - sourceEdge,
          backCanvas.height,
        ];
        const destinationColumns = [
          0,
          destinationEdge,
          width - destinationEdge,
          width,
        ];
        const destinationRows = [
          0,
          destinationEdge,
          height - destinationEdge,
          height,
        ];
        for (let row = 0; row < 3; row++) {
          for (let column = 0; column < 3; column++) {
            const currentSourceColumn = sourceColumns[column] ?? 0,
              nextSourceColumn = sourceColumns[column + 1] ?? 0,
              currentSourceRow = sourceRows[row] ?? 0,
              nextSourceRow = sourceRows[row + 1] ?? 0,
              currentDestinationColumn = destinationColumns[column] ?? 0,
              nextDestinationColumn = destinationColumns[column + 1] ?? 0,
              currentDestinationRow = destinationRows[row] ?? 0,
              nextDestinationRow = destinationRows[row + 1] ?? 0;
            const sx = currentSourceColumn,
              sy = currentSourceRow,
              sw = nextSourceColumn - currentSourceColumn,
              sh = nextSourceRow - currentSourceRow,
              dx = x + currentDestinationColumn,
              dy = y + currentDestinationRow,
              dw = nextDestinationColumn - currentDestinationColumn,
              dh = nextDestinationRow - currentDestinationRow;
            context.drawImage(backCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
          }
        }

        // context.drawImage(backCanvas, x, y, width, height);
      }
      return state;
    },
  });
};
