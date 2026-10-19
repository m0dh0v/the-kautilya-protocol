import type { Request, Response } from "express";
import app from "../server.js";

function apiHandler(req: Request, res: Response) {
  const originalUrl = req.url || "/";
  const queryIndex = originalUrl.indexOf("?");
  const pathname = queryIndex === -1 ? originalUrl : originalUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : originalUrl.slice(queryIndex);

  if (pathname === "/api/index.ts" || pathname.startsWith("/api/index.ts/")) {
    req.url = `/api${pathname.slice("/api/index.ts".length)}${query}`;
  } else if (pathname !== "/api" && !pathname.startsWith("/api/")) {
    req.url = `/api${originalUrl}`;
  }

  app(req, res);
}

export default apiHandler;
