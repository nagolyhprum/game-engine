import { Engine } from "../types";
import { draw, drawable, getValue } from "./engine";

export const ninePatch = <State extends Engine.GlobalState, Data = unknown>(
  config: Engine.DrawableWithOptionals<State, Data> &
    Engine.NinePatchConfig<State, Data>
) => {
  return drawable({
    ...config,
    draw({ context, state, debug, engine }) {
      const { canvas: backCanvas, context: backContext } = engine.getCanvas(
        this.id
      );
      const ninePatch = getValue(config.ninePatch, state, this);
      const sourceEdge = getValue(ninePatch?.sourceEdge, state, this) ?? 0;
      const destinationEdge =
        getValue(ninePatch?.destinationEdge, state, this) ?? 0;
      const x = getValue(this.x, state, this) ?? 0,
        y = getValue(this.y, state, this) ?? 0,
        width = getValue(this.width, state, this) ?? 0,
        height = getValue(this.height, state, this) ?? 0;
      const ninePatchWidth = getValue(ninePatch?.width, state, this) ?? 0;
      const ninePatchHeight = getValue(ninePatch?.height, state, this) ?? 0;
      backCanvas.width = ninePatchWidth;
      backCanvas.height = ninePatchHeight;
      draw({
        drawable: {
          ...this,
          x: 0,
          y: 0,
          width: ninePatchWidth,
          height: ninePatchHeight,
        },
        context: backContext,
        state,
        debug,
        engine,
      });
      const sourceColumns = [
        0,
        sourceEdge,
        ninePatchWidth - sourceEdge,
        ninePatchWidth,
      ];
      const sourceRows = [
        0,
        sourceEdge,
        ninePatchHeight - sourceEdge,
        ninePatchHeight,
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
    },
  });
};
