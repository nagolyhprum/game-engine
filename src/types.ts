export type Unknown = any;

export namespace Engine {
  export type Value<T, State, Data> =
    | T
    | null
    | undefined
    | ((this: Drawable<State, Data>, state: State) => T);

  export type TilemapConfig<State> = {
    rows: number;
    columns: number;
    onClick(): State;
    onContext(): State;
  };

  export interface NinePatchSource {
    width: number;
    height: number;
    sourceEdge: number;
    destinationEdge: number;
  }

  export interface NinePatchConfig<State, Data> extends Drawable<State, Data> {
    ninePatch: Value<NinePatchSource, State, Data>;
  }

  export interface SpritesheetSource {
    width: number;
    height: number;
    row: number;
    column: number;
  }

  export interface SpritesheetConfig<State, Data>
    extends Drawable<State, Data> {
    spritesheet: Value<SpritesheetSource, State, Data>;
  }

  export interface Drawable<State, Data = unknown> {
    x: Value<number, State, Data>;
    y: Value<number, State, Data>;
    width?: Value<number, State, Data>;
    height?: Value<number, State, Data>;
    background?: Value<string, State, Data>;
    text?: Value<string, State, Data>;
    align?: Value<CanvasTextAlign, State, Data>;
    baseline?: Value<CanvasTextBaseline, State, Data>;
    color?: Value<string, State, Data>;
    visible?: Value<boolean, State, Data>;
    font?: Value<string, State, Data>;
    source?: Value<
      {
        x: Value<number, State, Data>;
        y: Value<number, State, Data>;
        width: Value<number, State, Data>;
        height: Value<number, State, Data>;
      },
      State,
      Data
    >;
    image?: Value<string, State, Data>;
    data: Data;
    onClick?: (this: Drawable<State, Data>, state: State) => State;
    onContext?: (this: Drawable<State, Data>, state: State) => State;
    children?: Array<Drawable<State, Unknown>>;
    draw?: (
      this: Drawable<State, Data>,
      context: CanvasRenderingContext2D,
      state: State,
      signals: Engine.Signal[]
    ) => State;
  }

  export interface ClickSignal {
    name: "click";
    x: number;
    y: number;
  }

  export interface ContextSignal {
    name: "context";
    x: number;
    y: number;
  }

  export type Signal = ClickSignal | ContextSignal;

  export interface Config<State> {
    drawables: Array<Drawable<State, Unknown>>;
    width: number;
    height: number;
    state: State;
    signals: Signal[];
  }

  export interface Instance {
    play(src: string, volume?: number): void;
  }
}

export namespace Minesweeper {
  export interface CellData {
    column: number;
    row: number;
  }

  export interface CellState {
    column: number;
    row: number;
    isRevealed: boolean;
    isDangerous: boolean;
    isFlagged: boolean;
    surroundingDangers: number;
  }

  export interface State {
    cells: CellState[][];
  }

  export type Cell = Engine.Drawable<State, CellData>;

  export type WinState = "win" | "lose" | "neutral";
}
