const WEBHOOK_URL = "https://webhook.site/94b523da-6e1c-4190-973e-2220cf6ab322";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const contentType = request.headers.get("content-type") || "application/json";
    const bodyText = await request.text();

    const upstream = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: bodyText,
    });

    return new Response(JSON.stringify({ ok: upstream.ok }), {
      status: upstream.ok ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
