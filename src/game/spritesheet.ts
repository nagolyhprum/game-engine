import { Engine } from "../types";
import { drawable, getValue } from "./engine";

export const spritesheet = <State extends Engine.GlobalState, Data = unknown>(
  config: Engine.DrawableWithOptionals<State, Data> &
    Engine.SpritesheetConfig<State, Data>
): Engine.Drawable<State, Data> => {
  return drawable<State, Data>({
    ...config,
    source(state) {
      const spritesheet = getValue(config.spritesheet, state, this);
      const width = getValue(spritesheet?.width, state, this) ?? 0;
      const height = getValue(spritesheet?.height, state, this) ?? 0;
      const column = getValue(spritesheet?.column, state, this) ?? 0;
      const row = getValue(spritesheet?.row, state, this) ?? 0;
      return spritesheet
        ? {
            x: column * width,
            y: row * height,
            width,
            height,
          }
        : {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          };
    },
  });
};
