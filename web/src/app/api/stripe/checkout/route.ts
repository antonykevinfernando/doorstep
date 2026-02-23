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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual',
        metadata: { task_id, move_id },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount_cents,
            product_data: { name: 'Move-in Deposit (Hold)' },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}&task_id=${task_id}&move_id=${move_id}`,
      cancel_url: `${baseUrl}/api/stripe/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
