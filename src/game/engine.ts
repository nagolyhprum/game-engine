import { Engine, Unknown } from "../types";
import { isDefined } from "../utility";

export const start = <State extends Engine.GlobalState>(
  config: Engine.ConfigWithOptionals<State>
) => {
  const renderable: Engine.Config<State> = {
    signals: [],
    ...config,
  };
  const canvasMap: Record<
    string,
    {
      canvas: HTMLCanvasElement;
      context: CanvasRenderingContext2D;
    }
  > = {};
  const engine: Engine.Instance = {
    play(src, volume = 1) {
      const audio = loadAudio(src);
      audio.volume = volume;
      audio.play();
    },
    getCanvas(id) {
      const realID = id || "";
      if (!(realID in canvasMap)) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvasMap[realID] = {
          canvas,
          context,
        };
      }
      return canvasMap[realID]!;
    },
  };
  if (typeof document !== "undefined") {
    const canvas = document.querySelector("canvas")!;
    const context = canvas.getContext("2d")!;
    context.imageSmoothingEnabled = false;
    canvas.width = renderable.width;
    canvas.height = renderable.height;
    // TODO : MAKE THESE EVENTS BETTER
    canvas.onmousemove = (event) => {
      renderable.state.mouse.location.x = event.offsetX;
      renderable.state.mouse.location.y = event.offsetY;
    };
    canvas.onmousedown = () => {
      renderable.state.mouse.leftIsDown = true;
    };
    canvas.onmouseup = () => {
      renderable.state.mouse.leftIsDown = false;
    };
    canvas.onmouseleave = () => {
      renderable.state.mouse.leftIsDown = false;
    };
    canvas.onmouseout = () => {
      renderable.state.mouse.leftIsDown = false;
    };
    canvas.onclick = (event) => {
      event.preventDefault();
      renderable.signals.push({
        x: event.offsetX,
        y: event.offsetY,
        name: "click",
      });
    };
    canvas.oncontextmenu = (event) => {
      event.preventDefault();
      renderable.signals.push({
        x: event.offsetX,
        y: event.offsetY,
        name: "context",
      });
    };
    render(renderable, context, engine);
  }
};

const startAt = Date.now();
let frames = 0;
const render = <State extends Engine.GlobalState>(
  renderable: Engine.Config<State>,
  context: CanvasRenderingContext2D,
  engine: Engine.Instance
) => {
  requestAnimationFrame(() => render(renderable, context, engine));
  const before = Date.now();
  renderable.state.now = before;
  context.fillStyle = renderable.background ?? "black";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  renderable.state = drawAll({
    drawables: renderable.drawables as Engine.Drawable<State, unknown>[],
    context,
    state: renderable.state,
    signals: renderable.signals,
    debug: renderable.debug,
    engine,
  });
  renderable.signals = [];
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.font = "24px Courier New";
  if (renderable.debug) {
    frames++;
    const fps = Math.floor(frames / ((before - startAt) / 1000));
    context.fillStyle = "red";
    context.fillText(
      `${fps}`,
      context.canvas.width - 5,
      context.canvas.height - 5
    );
  }
};

const audioCache: Record<string, HTMLAudioElement> = {};

const loadAudio = (src: string) => {
  if (!(src in audioCache)) {
    const audio = new Audio(src);
    audioCache[src] = audio;
  }
  return audioCache[src]!;
};

export const getValue = <T, State extends Engine.GlobalState, Data>(
  value: Engine.Value<T, State, Data>,
  state: State,
  drawable: Engine.Drawable<State, Data>
): T | null | undefined => {
  if (typeof value === "function") {
    return (value as Unknown).call(drawable, state);
  }
  return value;
};

const imageCache: Record<string, HTMLImageElement> = {};

const loadImage = <State extends Engine.GlobalState, Data>(
  value: Engine.Value<string, State, Data>,
  state: State,
  drawable: Engine.Drawable<State, Data>
) => {
  const src = getValue(value, state, drawable);
  if (!src) return null;
  if (!(src in imageCache)) {
    const image = new Image();
    image.src = src;
    imageCache[src] = image;
  }
  return imageCache[src];
};

const drawAll = <State extends Engine.GlobalState, Data>({
  context,
  drawables,
  signals,
  state,
  debug,
  engine,
}: Engine.DrawAllConfig<State, Data>): State => {
  drawables.forEach((drawable) => {
    const draw = drawable.draw;
    if (draw) {
      state = draw.call(drawable, { context, state, signals, debug, engine });
    }
  });
  return state;
};

export const draw = <State extends Engine.GlobalState, Data>({
  context,
  drawable,
  signals,
  state,
  debug,
  engine,
}: Engine.DrawConfig<State, Data>) => {
  if (drawable.debug) {
    debugger;
  }
  const visible = getValue(drawable.visible, state, drawable) ?? true;
  if (visible) {
    const image = loadImage(drawable.image, state, drawable);
    const dx = getValue(drawable.x, state, drawable) ?? 0,
      dy = getValue(drawable.y, state, drawable) ?? 0,
      dw = getValue(drawable.width, state, drawable) ?? 0,
      dh = getValue(drawable.height, state, drawable) ?? 0;
    const mouse = state.mouse.location;
    drawable.isMouseInBounds =
      mouse.x >= dx && mouse.x < dx + dw && mouse.y >= dy && mouse.y < dy + dh;
    const source = getValue(drawable.source, state, drawable);
    const sx = getValue(source?.x, state, drawable),
      sy = getValue(source?.y, state, drawable),
      sw = getValue(source?.width, state, drawable),
      sh = getValue(source?.height, state, drawable);
    signals.forEach((signal) => {
      if (signal.name === "click") {
        if (
          drawable.onClick &&
          signal.x >= dx &&
          signal.x < dx + dw &&
          signal.y >= dy &&
          signal.y < dy + dh
        ) {
          state = drawable.onClick({
            state,
            context,
            debug,
            engine,
            signals,
          });
        }
      }
      if (signal.name === "context") {
        if (
          drawable.onContext &&
          signal.x >= dx &&
          signal.x < dx + dw &&
          signal.y >= dy &&
          signal.y < dy + dh
        ) {
          state = drawable.onContext({
            state,
            context,
            debug,
            engine,
            signals,
          });
        }
      }
    });
    context.beginPath();
    const radius = getValue(drawable.radius, state, drawable) ?? 0;
    context.roundRect(dx, dy, dw, dh, radius);
    const background = getValue(drawable.background, state, drawable);
    if (background) {
      context.fillStyle = background;
      context.fill();
    }
    if (image?.complete) {
      if (isDefined(sx) && isDefined(sy) && isDefined(sw) && isDefined(sh)) {
        context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
      } else {
        context.drawImage(image, dx, dy, dw, dh);
      }
    }
    const text = getValue(drawable.text, state, drawable);
    if (text) {
      context.textAlign = getValue(drawable.align, state, drawable) ?? "left";
      context.textBaseline =
        getValue(drawable.baseline, state, drawable) ?? "top";
      context.font =
        getValue(drawable.font, state, drawable) ?? `24px sans-sarif`;
      context.fillStyle = getValue(drawable.color, state, drawable) ?? "";
      context.fillText(text, dx + dw / 2, dy + dh / 2);
    }
    const stroke = getValue(drawable.stroke, state, drawable);
    if (stroke) {
      const lineWidth = getValue(drawable.lineWidth, state, drawable) ?? 1;
      context.lineWidth = lineWidth;
      context.strokeStyle = stroke;
      context.stroke();
    }
    if (drawable.children) {
      state = drawAll({
        drawables: drawable.children,
        debug,
        context,
        state,
        signals,
        engine,
      });
    }
    if (debug) {
      context.lineWidth = 1;
      context.strokeStyle = "red";
      context.beginPath();
      context.rect(dx, dy, dw, dh);
      context.stroke();
    }
  }
  return state;
};

export const drawable = <State extends Engine.GlobalState, Data = Unknown>(
  config: Engine.DrawableWithOptionals<State, Data>
): Engine.Drawable<State, Data> => {
  const parent: Engine.Drawable<State, Data> = {
    draw({ context, state, signals, debug, engine }) {
      return draw({ drawable: this, context, state, signals, debug, engine });
    },
    data: config.data!,
    id: crypto.randomUUID(),
    ...config,
  };
  config.children?.forEach((child) => {
    child.parent = parent;
  });
  return parent;
};

export const defaultState = (): Engine.GlobalState => ({
  mouse: {
    leftIsDown: false,
    rightIsDown: false,
    location: {
      x: -1,
      y: -1,
    },
  },
  now: Date.now(),
});
