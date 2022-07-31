import type { AstroIntegration } from "astro";
import fs from "fs";
import { load } from "cheerio";

export default function astroHaloThemeIntegration(): AstroIntegration {
  return {
    name: "@halo-dev/astro-halo-theme-integration",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          vite: {
            build: {
              rollupOptions: {
                output: {
                  entryFileNames: "assets/[name].[hash].js",
                  chunkFileNames: "assets/chunks/[name].[hash].js",
                  assetFileNames: "assets/[name].[hash][extname]",
                },
              },
            },
          },
        });
      },
      "astro:build:done": async ({ routes }) => {
        const pageRoutes = routes.filter((route) => route.type === "page");

        for (let i = 0; i < pageRoutes.length; i++) {
          const route = pageRoutes[i];

          const pathname = route.distURL?.pathname;

          if (!pathname) {
            return;
          }

          const inputHTML = await fs.promises.readFile(pathname, {
            encoding: "utf-8",
          });

          const $ = load(inputHTML);

          $("link").each((_, el) => {
            const href = $(el).attr("href");

            if (href?.startsWith("/assets")) {
              $(el).attr("th:href", `@{${href}}`);
            }
          });

          $("astro-island").each((_, el) => {
            const componentUrl = $(el).attr("component-url");
            const rendererUrl = $(el).attr("renderer-url");

            if (componentUrl?.startsWith("/assets")) {
              $(el).attr("th:component-url", `@{${componentUrl}}`);
            }

            if (rendererUrl?.startsWith("/assets")) {
              $(el).attr("th:renderer-url", `@{${rendererUrl}}`);
            }
          });

          await fs.promises.writeFile(pathname, $.html());
        }
      },
    },
  };
}
