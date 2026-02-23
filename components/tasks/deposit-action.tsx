import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { DollarSign, Check, CreditCard } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useMove } from '@/hooks/use-move';
import { supabase } from '@/lib/supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

interface Props {
  taskId: string;
  config: Record<string, any> | null;
  response: Record<string, any> | null;
  onSubmit: (taskId: string, response: Record<string, any>) => void;
}

export function DepositAction({ taskId, config, response, onSubmit }: Props) {
  const { move } = useMove();
  const [loading, setLoading] = useState(false);

  const amountCents = config?.amount_cents ?? 0;
  const amountDollars = (amountCents / 100).toFixed(2);

  if (response?.payment_intent_id) {
    return (
      <View style={styles.completedRow}>
        <DollarSign size={14} color={Colors.greenDark} strokeWidth={2} />
        <Text variant="caption" color={Colors.brown}>
          Hold authorized — ${amountDollars}
        </Text>
        <Check size={14} color={Colors.greenDark} strokeWidth={2.5} />
      </View>
    );
  }

  if (!amountCents) {
    return (
      <View style={styles.emptyWrap}>
        <Text variant="caption" color={Colors.brownMuted}>
          Deposit amount not configured. Contact your property manager.
        </Text>
      </View>
    );
  }

  async function handlePay() {
    if (!move) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          move_id: move.id,
          amount_cents: amountCents,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        Alert.alert('Error', error || 'Failed to start payment');
        setLoading(false);
        return;
      }

      const { url } = await res.json();
      await WebBrowser.openBrowserAsync(url);

      const { data } = await supabase
        .from('move_tasks')
        .select('response, completed')
        .eq('id', taskId)
        .single();

      if (data?.completed && data?.response?.payment_intent_id) {
        onSubmit(taskId, data.response);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    }
    setLoading(false);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.amountRow}>
        <CreditCard size={15} color={Colors.brownMuted} strokeWidth={1.8} />
        <Text variant="caption" color={Colors.brownMuted}>
          A hold of <Text variant="caption" medium color={Colors.brown}>${amountDollars}</Text> will be placed on your card. No money is charged.
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.payBtn, loading && styles.disabled, pressed && { opacity: 0.7 }]}
        onPress={handlePay}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.cream} />
        ) : (
          <>
            <DollarSign size={15} color={Colors.cream} strokeWidth={2.5} />
            <Text variant="caption" medium color={Colors.cream}>Authorize ${amountDollars}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brown,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.4,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  emptyWrap: {
    paddingVertical: Spacing.sm,
  },
});
