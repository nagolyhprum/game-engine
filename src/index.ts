import fs from "fs/promises";
import path from "path";
import { URL } from "url";

const port = process.env.PORT || 80;

const html = `<!doctype html>
<html>
    <head>
      <style>
        canvas {
          background : black;
        }
      </style>
    </head>
    </body>
        <canvas>Canvas element not supported.</canvas>
        <script src="/scripts/minesweeper"></script>
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

Bun.serve({
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith(PUBLIC)) {
      const filePath = path.join(__dirname, "..", url.pathname);
      const extension = path.extname(filePath);
      const file = await fs.readFile(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": extensions[extension],
        },
      });
    }
    if (url.pathname.startsWith(SCRIPTS)) {
      const match = scriptsRouter.match(url.pathname.slice(SCRIPTS.length - 1));
      if (match) {
        const output = await Bun.build({
          entrypoints: [match.filePath],
        });
        console.log(output);
        const body = await Promise.all(
          output.outputs.map((output) => output.text())
        );
        return new Response(body.join(""), {
          headers: {
            "Content-Type": "text/javascript",
          },
        });
      }
    }
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
  port,
});

console.log(`Running on port ${port}`);
