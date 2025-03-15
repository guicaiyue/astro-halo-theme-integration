import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import fs from "fs";
import { load } from "cheerio";

export default function astroHaloThemeIntegration(): AstroIntegration {
  return {
    name: "@xirizhi/astro-halo-theme-integration",
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
      "astro:build:done": async ({ dir, pages }) => {
        // 使用pages对象，它包含了所有页面的信息
        const pageEntries = Object.entries(pages);

        for (let i = 0; i < pageEntries.length; i++) {
          const [pathname, pageData] = pageEntries[i];
          
          // 在Astro 5.x中，pages是一个对象，键是路径名，值是页面数据

          if (!pathname) {
            continue; // 跳过此路由而不是返回，以处理其他路由
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

          // 处理astro-island（Astro 1.x）和astro-client/astro-slot（Astro 5.x）组件
          $("astro-island, astro-client, astro-slot").each((_, el) => {
            // 处理不同版本的组件URL属性
            const componentUrl = $(el).attr("component-url") || $(el).attr("component");
            const rendererUrl = $(el).attr("renderer-url") || $(el).attr("renderer");
            const clientOnlyUrl = $(el).attr("client-only");
            
            if (componentUrl?.startsWith("/assets")) {
              $(el).attr("th:component-url", `@{${componentUrl}}`);
              // 同时设置新版本可能使用的属性名
              $(el).attr("th:component", `@{${componentUrl}}`);
            }

            if (rendererUrl?.startsWith("/assets")) {
              $(el).attr("th:renderer-url", `@{${rendererUrl}}`);
              // 同时设置新版本可能使用的属性名
              $(el).attr("th:renderer", `@{${rendererUrl}}`);
            }
            
            if (clientOnlyUrl?.startsWith("/assets")) {
              $(el).attr("th:client-only", `@{${clientOnlyUrl}}`);
            }
          });
          
          // 处理script标签，可能包含Astro客户端脚本
          $("script[src]").each((_, el) => {
            const src = $(el).attr("src");
            
            if (src?.startsWith("/assets")) {
              $(el).attr("th:src", `@{${src}}`);
            }
          });

          await fs.promises.writeFile(pathname, $.html());
        }
      },
    },
  };
}
