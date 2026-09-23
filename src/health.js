import { ok } from "./http.js";

export async function health() {
  return ok({ service: "eleme-edgeone-makers", ts: Date.now() });
}
