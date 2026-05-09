// Edge function: serves static site from storage bucket with correct MIME types
const STORAGE_BASE = "https://ykoipcgzyhekrfeccuoj.supabase.co/storage/v1/object/public/site"

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  let path = url.pathname

  // Normalize: / -> /index.html
  if (path === "/" || path === "") {
    path = "/index.html"
  }

  // Map route paths to file paths (SPA fallback)
  // Only serve actual files, everything else gets index.html
  const hasExt = path.includes(".")

  // Fetch the file from storage
  const fetchUrl = hasExt
    ? `${STORAGE_BASE}${path}`
    : `${STORAGE_BASE}/index.html`

  const resp = await fetch(fetchUrl)

  if (!resp.ok && hasExt) {
    // Asset not found, serve index.html for SPA routing
    const indexResp = await fetch(`${STORAGE_BASE}/index.html`)
    const html = await indexResp.text()
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  // Determine content type from extension
  const contentType = path.includes(".")
    ? MIME[path.substring(path.lastIndexOf("."))] || "application/octet-stream"
    : "text/html"

  const body = await resp.arrayBuffer()
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Cache-Control": "public, max-age=3600",
    },
  })
})
