import "dotenv/config";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import {
  CopilotRuntime,
  copilotRuntimeNodeHttpEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";

const port = 4000;

const runtime = new CopilotRuntime();
const serviceAdapter = new OpenAIAdapter();

// This creates the single-route handler that accepts all methods via POST
const singleRouteHandler = copilotRuntimeNodeHttpEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit",
});

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle GET /info by converting to single-route POST
  if (req.method === "GET" && req.url === "/api/copilotkit/info") {
    const response = await (singleRouteHandler as any)(
      new Request(`http://localhost:${port}/api/copilotkit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "info" }),
      })
    );
    res.writeHead(response.status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(await response.text());
    return;
  }

  if (req.url?.startsWith("/api/copilotkit")) {
    singleRouteHandler(req, res);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(port, () => {
  console.log(`CopilotKit runtime listening on http://localhost:${port}`);
});
