import { smsSend, wrap } from "../routes.js";

export const onRequestPost = wrap(smsSend);
export const onRequest = onRequestPost;
