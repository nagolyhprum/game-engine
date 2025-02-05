import fs from "fs/promises";
import path from "path";
import { URL } from "url";
import { Game } from "./types";

import "../scripts/supaplex";
import "../scripts/minesweeper";
import "../scripts/solitaire";

const port = process.env.PORT || 80;

const games = [
  {
    name: "Minesweeper",
    slug: "minesweeper",
  },
  {
    name: "Solitaire",
    slug: "solitaire",
  },
  {
    name: "Supaplex Maker",
    slug: "supaplex",
  },
];

const indexResponse = `<!doctype html>
<html>
    <head>
      <style>
        canvas {
          background : black;
          outline : none;
        }
      </style>
    </head>
    </body>
      <ul>
        ${games
          .map((game) => `<li><a href="/${game.slug}">${game.name}</a></li>`)
          .join("")}
      </ul>
    </body>
</html>`;

const gameResponse = (game: Game) => `<!doctype html>
<html>
    <head>
      <style>
        body {
          padding : 50px;
        }
        canvas {
          background : black;
        }
      </style>
    </head>
    </body>
        <h1>${game.name}</h1>
        <div>
          <a href="/">Home</a>
        </div>
        <canvas>Canvas element not supported.</canvas>
        <script src="/scripts/${game.slug}"></script>
    </body>
</html>`;

const PUBLIC = "/public/";
const SCRIPTS = "/scripts/";

const scriptsRouter = new Bun.FileSystemRouter({
  dir: path.join(__dirname, "..", "scripts"),
  style: "nextjs",
});

const extensions: Record<string, string> = {
  ".png": "image/png",
};

const cache: Record<string, string> = {};

const useCache = async (key: string, callback: () => Promise<string>) => {
  if (!(key in cache)) {
    cache[key] = await callback();
  }
  return cache[key] ?? "";
};

Bun.serve({
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith(PUBLIC)) {
      const filePath = path.join(
        __dirname,
        "..",
        decodeURIComponent(url.pathname)
      );
      const extension = path.extname(filePath);
      const file = await fs.readFile(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": extensions[extension] ?? "text/plain",
        },
      });
    }
    if (url.pathname.startsWith(SCRIPTS)) {
      const match = scriptsRouter.match(url.pathname.slice(SCRIPTS.length - 1));
      if (match) {
        const body = await useCache(`script:${match.filePath}`, async () => {
          const output = await Bun.build({
            entrypoints: [match.filePath],
          });
          const body = await Promise.all(
            output.outputs.map((output) => output.text())
          );
          return body.join("");
        });
        return new Response(body, {
          headers: {
            "Content-Type": "text/javascript",
          },
        });
      }
    }
    const gameSlug = url.pathname.slice(1);
    const game = games.find((game) => game.slug === gameSlug);
    if (game) {
      return new Response(gameResponse(game), {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }
    return new Response(indexResponse, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
  port,
});

console.log(`Running on port ${port}`);
