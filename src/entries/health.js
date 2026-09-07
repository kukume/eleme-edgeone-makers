import { health, wrap } from "../routes.js";

export const onRequestGet = wrap(async () => health());
export const onRequest = onRequestGet;
