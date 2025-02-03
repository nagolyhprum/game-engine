import { Engine, Unknown } from "../types";

export const start = <State extends Engine.GlobalState>(
  renderable: Engine.Config<State>
): Engine.Instance => {
  if (typeof document !== "undefined") {
    const canvas = document.querySelector("canvas")!;
    const context = canvas.getContext("2d")!;
    context.imageSmoothingEnabled = false;
    canvas.width = renderable.width;
    canvas.height = renderable.height;
    // TODO : MAKE THESE EVENTS BETTER
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
    render(renderable, context);
  }
  return {
    play(src, volume = 1) {
      const audio = loadAudio(src);
      audio.volume = volume;
      audio.play();
    },
  };
};

const render = <State extends Engine.GlobalState>(
  renderable: Engine.Config<State>,
  context: CanvasRenderingContext2D
) => {
  requestAnimationFrame(() => render(renderable, context));
  renderable.state.now = Date.now();
  renderable.state = drawAll(
    renderable.drawables as Engine.Drawable<State, unknown>[],
    context,
    renderable.state,
    renderable.signals
  );
  renderable.signals = [];
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

const drawAll = <State extends Engine.GlobalState, Data>(
  drawables: Array<Engine.Drawable<State, Data>>,
  context: CanvasRenderingContext2D,
  state: State,
  signals: Engine.Signal[]
): State => {
  drawables.forEach((drawable) => {
    const draw = drawable.draw;
    if (draw) {
      state = draw.call(drawable, context, state, signals);
    }
  });
  return state;
};

export const draw = <State extends Engine.GlobalState, Data>(
  drawable: Engine.Drawable<State, Data>,
  context: CanvasRenderingContext2D,
  state: State,
  signals: Engine.Signal[]
) => {
  const visible = getValue(drawable.visible, state, drawable) ?? true;
  if (visible) {
    const image = loadImage(drawable.image, state, drawable);
    const dx = getValue(drawable.x, state, drawable) ?? 0,
      dy = getValue(drawable.y, state, drawable) ?? 0,
      dw = getValue(drawable.width, state, drawable) ?? 0,
      dh = getValue(drawable.height, state, drawable) ?? 0;
    context.rect(dx, dy, dw, dh);
    const source = getValue(drawable.source, state, drawable);
    const sx = getValue(source?.x, state, drawable) ?? 0,
      sy = getValue(source?.y, state, drawable) ?? 0,
      sw = getValue(source?.width, state, drawable) ?? dw,
      sh = getValue(source?.height, state, drawable) ?? dh;
    signals.forEach((signal) => {
      if (signal.name === "click") {
        if (
          drawable.onClick &&
          signal.x >= dx &&
          signal.x < dx + dw &&
          signal.y >= dy &&
          signal.y < dy + dh
        ) {
          state = drawable.onClick(state);
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
          state = drawable.onContext(state);
        }
      }
    });
    if (image?.complete) {
      context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    const background = getValue(drawable.background, state, drawable);
    if (background) {
      context.fillStyle = background;
      context.fillRect(dx, dy, dw, dh);
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
    state = drawAll(drawable.children ?? [], context, state, signals);
  }
  return state;
};

export const drawable = <State extends Engine.GlobalState, Data = Unknown>(
  config: Engine.Drawable<State, Data>
): Engine.Drawable<State, Data> => ({
  draw(
    context: CanvasRenderingContext2D,
    state: State,
    signals: Engine.Signal[]
  ) {
    return draw(this, context, state, signals);
  },
  ...config,
});

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
