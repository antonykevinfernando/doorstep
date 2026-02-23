import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { task_id, move_id, amount_cents } = await req.json();

    if (!task_id || !move_id || !amount_cents || amount_cents < 50) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('deposits')
      .select('id, status')
      .eq('task_id', task_id)
      .in('status', ['authorized'])
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'A hold already exists for this task' }, { status: 409 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_cents,
      currency: 'usd',
      capture_method: 'manual',
      metadata: { task_id, move_id },
    });

    await supabase.from('deposits').insert({
      move_id,
      task_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents,
      status: 'authorized',
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (err: any) {
    console.error('Stripe create-hold error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
