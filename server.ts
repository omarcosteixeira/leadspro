import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API proxy to bypass CORS / Mixed Content in browsers
  app.all("/api/bot-proxy", async (req: express.Request, res: express.Response) => {
    const targetUrl = req.headers["x-target-url"];
    if (!targetUrl || typeof targetUrl !== "string") {
      return res.status(400).json({ error: "Missing or invalid x-target-url header" });
    }

    try {
      const method = req.method;
      const hasBody = method !== "GET" && method !== "HEAD";
      
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      };

      if (hasBody) {
        options.body = JSON.stringify(req.body);
      }

      const botResponse = await fetch(targetUrl, options);
      
      const contentType = botResponse.headers.get("content-type") || "";
      res.status(botResponse.status);

      if (contentType.includes("application/json")) {
        const json = await botResponse.json();
        return res.json(json);
      } else {
        const text = await botResponse.text();
        return res.send(text);
      }
    } catch (err: any) {
      console.error("Proxy error for:", targetUrl, err);
      return res.status(502).json({ 
        error: `Erro ao conectar com o bot. O servidor do bot pode estar offline ou a URL é inválida. Erro original: ${err.message}` 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
