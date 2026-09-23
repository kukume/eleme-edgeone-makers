import { wrap } from "../http.js";
import { health } from "../health.js";

export const onRequestGet = wrap(async () => health());
export const onRequest = onRequestGet;
