const WEBHOOK_URL = "https://webhook.site/94b523da-6e1c-4190-973e-2220cf6ab322";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const startedAt = Date.now();
  try {
    const contentType = request.headers.get("content-type") || "application/json";
    const bodyText = await request.text();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const upstream = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: bodyText,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const upstreamText = await upstream.text();

    if (!upstream.ok) {
      console.error(
        `[webhook] upstream error ${upstream.status} (${requestId}) in ${Date.now() - startedAt}ms`
      );
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Upstream error: ${upstream.status}`,
          requestId,
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true, requestId }), {
      status: upstream.ok ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[webhook] request failed (${requestId}) in ${Date.now() - startedAt}ms`,
      err
    );
    return new Response(JSON.stringify({ ok: false, error: message, requestId }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
