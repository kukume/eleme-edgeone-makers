export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function ok(data) {
  return json({ ok: true, ...data });
}

export function fail(err, status = 400) {
  const message = err && err.message ? err.message : String(err || "error");
  return json({ ok: false, error: message }, status);
}

export async function readJson(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    throw new Error("请求 Body 不是合法 JSON");
  }
}

export function wrap(handler) {
  return async (context) => {
    try {
      return await handler(context.request);
    } catch (e) {
      return fail(e, 500);
    }
  };
}
