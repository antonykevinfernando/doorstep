import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  const taskId = req.nextUrl.searchParams.get('task_id');
  const moveId = req.nextUrl.searchParams.get('move_id');

  if (!sessionId || !taskId || !moveId) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntentId = session.payment_intent as string;

    if (!paymentIntentId) {
      return new NextResponse('No payment intent found', { status: 400 });
    }

    const supabase = createAdminClient();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    await supabase.from('deposits').insert({
      move_id: moveId,
      task_id: taskId,
      stripe_payment_intent_id: paymentIntentId,
      amount_cents: pi.amount,
      status: 'authorized',
    });

    await supabase.from('move_tasks').update({
      response: { payment_intent_id: paymentIntentId, amount_cents: pi.amount },
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId);

    const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FAF4F3;color:#30261E}
.card{text-align:center;padding:2rem;border-radius:1rem;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.05);max-width:320px}
.icon{font-size:3rem;margin-bottom:1rem}p{color:#9A8B7D;font-size:0.875rem;margin-top:0.5rem}</style>
</head><body><div class="card"><div class="icon">&#10003;</div><h2>Deposit Hold Authorized</h2><p>You can close this window and return to the app.</p></div></body></html>`;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    console.error('Checkout success error:', err);
    return new NextResponse('Something went wrong', { status: 500 });
  }
}
