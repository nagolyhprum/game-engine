import { Engine } from "../types";

export const tilemap = <
  State extends Engine.GlobalState
>({}: Engine.TilemapConfig<State>): Engine.Drawable<State> => {
  return {};
};
