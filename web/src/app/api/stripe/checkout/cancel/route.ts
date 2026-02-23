import { NextResponse } from 'next/server';

export async function GET() {
  const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FAF4F3;color:#30261E}
.card{text-align:center;padding:2rem;border-radius:1rem;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.05);max-width:320px}
.icon{font-size:3rem;margin-bottom:1rem}p{color:#9A8B7D;font-size:0.875rem;margin-top:0.5rem}</style>
</head><body><div class="card"><div class="icon">&#10007;</div><h2>Payment Cancelled</h2><p>You can close this window and return to the app.</p></div></body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
