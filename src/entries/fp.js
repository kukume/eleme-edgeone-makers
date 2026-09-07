import { fp, wrap } from "../routes.js";

export const onRequestPost = wrap(fp);
export const onRequest = onRequestPost;
