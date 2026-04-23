const SVG_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" fill="#0f766e" />
  <path d="M20 18h8v16c0 6.6 2.9 10 9 10s9-3.4 9-10V18h8v17c0 11.3-7.3 19-17 19s-17-7.7-17-19V18Z" fill="#ffffff" />
</svg>
`.trim();

export async function GET() {
  return new Response(SVG_ICON, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
