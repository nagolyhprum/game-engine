export type Unknown = any;

export interface Game {
  name: string;
  slug: string;
}

export namespace Engine {
  export type ConfigWithOptionals<State extends GlobalState> = Omit<
    Config<State>,
    "signals"
  >;

  export type DrawableWithOptionals<State extends GlobalState, Data> = Omit<
    Drawable<State, Data>,
    "data" | "id"
  > & {
    data?: Data;
    id?: string;
  };

  export interface GlobalState {
    now: number;
    mouse: {
      leftIsDown: boolean;
      rightIsDown: boolean;
      location: {
        x: number;
        y: number;
      };
    };
  }

  export interface CommonDrawConfig<State extends GlobalState> {
    context: CanvasRenderingContext2D;
    state: State;
    signals: Engine.Signal[];
    debug?: boolean;
    engine: Instance;
  }

  export interface DrawAllConfig<State extends GlobalState, Data>
    extends CommonDrawConfig<State> {
    drawables: Array<Engine.Drawable<State, Data>>;
  }

  export interface DrawConfig<State extends GlobalState, Data>
    extends CommonDrawConfig<State> {
    drawable: Engine.Drawable<State, Data>;
  }

  export interface DrawableDrawConfig<State extends GlobalState>
    extends CommonDrawConfig<State> {}

  export interface DrawableEventConfig<State extends GlobalState>
    extends CommonDrawConfig<State> {}

  export type Value<T, State extends GlobalState, Data> =
    | T
    | null
    | undefined
    | ((this: Drawable<State, Data>, state: State) => T);

  export type TilemapConfig<State extends GlobalState> = {
    rows: number;
    columns: number;
    onClick(): State;
    onContext(): State;
  };

  export interface NinePatchSource<State extends GlobalState, Data> {
    width: Value<number, State, Data>;
    height: Value<number, State, Data>;
    sourceEdge: Value<number, State, Data>;
    destinationEdge: Value<number, State, Data>;
  }

  export interface NinePatchConfig<State extends GlobalState, Data> {
    ninePatch: Value<NinePatchSource<State, Data>, State, Data>;
  }

  export interface SpritesheetSource<State extends GlobalState, Data> {
    width: Value<number, State, Data>;
    height: Value<number, State, Data>;
    row: Value<number, State, Data>;
    column: Value<number, State, Data>;
  }

  export interface SpritesheetConfig<State extends GlobalState, Data> {
    spritesheet: Value<SpritesheetSource<State, Data>, State, Data>;
  }

  export interface Drawable<State extends GlobalState, Data = unknown> {
    id: string;
    debug?: boolean;
    x: Value<number, State, Data>;
    y: Value<number, State, Data>;
    z?: Value<number, State, Data>;
    width?: Value<number, State, Data>;
    height?: Value<number, State, Data>;
    background?: Value<string, State, Data>;
    stroke?: Value<string, State, Data>;
    lineWidth?: Value<number, State, Data>;
    radius?: Value<number, State, Data>;
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
    onClick?: (
      this: Drawable<State, Data>,
      config: DrawableEventConfig<State>
    ) => State;
    onContext?: (
      this: Drawable<State, Data>,
      config: DrawableEventConfig<State>
    ) => State;
    children?: Array<Drawable<State, Unknown>>;
    isMouseInBounds?: boolean;
    draw?: (
      this: Drawable<State, Data>,
      config: DrawableDrawConfig<State>
    ) => State;
    parent?: Drawable<State, Unknown>;
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

  export interface Config<State extends GlobalState> {
    drawables: Array<Drawable<State, Unknown>>;
    width: number;
    height: number;
    state: State;
    signals: Signal[];
    background?: string;
    debug?: boolean;
  }

  export interface Instance {
    play(src: string, volume?: number): void;
    getCanvas(id: string | null | undefined): {
      canvas: HTMLCanvasElement;
      context: CanvasRenderingContext2D;
    };
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

  export interface State extends Engine.GlobalState {
    cells: CellState[][];
    lastRevealedAt: number;
    startedAt: number;
  }

  export type Cell = Engine.Drawable<State, CellData>;

  export type WinState = "win" | "lose" | "neutral";
}

export namespace Solitaire {
  export interface CardState {
    suit: Suit;
    rank: Rank;
    isRevealed: boolean;
  }

  export interface State extends Engine.GlobalState {
    stock: CardState[][];
    tableau: CardState[][];
    foundation: CardState[][];
    hand: {
      cards: CardState[];
      pile: string;
      index: number;
    };
  }

  export type Suit = "Spades" | "Hearts" | "Diamond" | "Clubs";
  export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

  export interface CardData {
    suit: Suit;
    rank: Rank;
  }
}
