import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../src/app.js";

const server = http.createServer();
const app = createApp(server);
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
try {
  const url = `http://127.0.0.1:${server.address().port}/api/v1`;
  const health = await fetch(`${url}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).data.status, "ok");
  const protectedResponse = await fetch(`${url}/appointments`);
  assert.equal(protectedResponse.status, 401);
  const error = await protectedResponse.json();
  assert.equal(error.success, false);
  assert.equal(error.error.code, "UNAUTHENTICATED");
  console.log("PASS HTTP health endpoint and unauthenticated route guard");
} finally {
  await new Promise((resolve) => app.get("io").close(resolve));
}
