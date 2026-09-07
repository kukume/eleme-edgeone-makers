import { smsLogin, wrap } from "../routes.js";

export const onRequestPost = wrap(smsLogin);
export const onRequest = onRequestPost;
