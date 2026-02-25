import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { deposit_id, notes } = await req.json();
    if (!deposit_id) {
      return NextResponse.json({ error: 'deposit_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: deposit, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', deposit_id)
      .single();

    if (error || !deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    if (deposit.status !== 'authorized') {
      return NextResponse.json({ error: `Cannot release a ${deposit.status} deposit` }, { status: 400 });
    }

    await stripe.paymentIntents.cancel(deposit.stripe_payment_intent_id);

    await supabase
      .from('deposits')
      .update({
        status: 'released',
        ...(notes ? { notes } : {}),
      })
      .eq('id', deposit_id);

    return NextResponse.json({ success: true, status: 'released' });
  } catch (err: any) {
    console.error('Stripe release error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
