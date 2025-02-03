import { Engine } from "../types";
import { drawable, getValue } from "./engine";

export const spritesheet = <State, Data = unknown>(
  config: Engine.SpritesheetConfig<State, Data>
): Engine.Drawable<State, Data> => {
  return drawable<State, Data>({
    ...config,
    source(state) {
      const spritesheet = getValue(config.spritesheet, state, this);
      return spritesheet
        ? {
            x: spritesheet.column * spritesheet.width,
            y: spritesheet.row * spritesheet.height,
            width: spritesheet.width,
            height: spritesheet.height,
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
