import { useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FileText,
  ShieldCheck,
  BellRing,
  ArrowUpDown,
  KeyRound,
  DollarSign,
  Check,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TaskAction } from '@/components/tasks/task-action';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useTasks, type TaskItem } from '@/hooks/use-tasks';

const TYPE_META: Record<string, { icon: LucideIcon; label: string }> = {
  upload_lease: { icon: FileText, label: 'Upload Lease' },
  upload_insurance: { icon: ShieldCheck, label: 'Upload Insurance' },
  register_buzzer: { icon: BellRing, label: 'Register Buzzer' },
  schedule_elevator: { icon: ArrowUpDown, label: 'Schedule Elevator' },
  key_fob_pickup: { icon: KeyRound, label: 'Key / Fob Pickup' },
  pay_deposit: { icon: DollarSign, label: 'Pay Deposit' },
};

function TaskCard({
  task,
  expanded,
  onToggleExpand,
  onSubmit,
  onToggleComplete,
}: {
  task: TaskItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onSubmit: (taskId: string, response: Record<string, any>) => void;
  onToggleComplete: (taskId: string) => void;
}) {
  const meta = task.type ? TYPE_META[task.type] : null;
  const Icon = meta?.icon ?? FileText;
  const hasAction = !!task.type;

  return (
    <View style={[styles.card, task.completed && styles.cardDone]}>
      <Pressable style={styles.cardHeader} onPress={hasAction ? onToggleExpand : () => onToggleComplete(task.id)}>
        <View style={[styles.iconWrap, task.completed && styles.iconWrapDone]}>
          {task.completed ? (
            <Check size={15} color={Colors.cream} strokeWidth={2.5} />
          ) : (
            <Icon size={15} color={Colors.brown} strokeWidth={1.8} />
          )}
        </View>

        <View style={styles.cardContent}>
          <Text
            variant="body"
            medium
            color={task.completed ? Colors.brownMuted : Colors.brown}
            style={task.completed ? styles.doneText : undefined}
          >
            {task.title}
          </Text>
          {task.completed && hasAction ? (
            <Text variant="caption" color={Colors.brownMuted}>
              Tap to review
            </Text>
          ) : task.description && !task.completed ? (
            <Text variant="caption" color={Colors.brownMuted} numberOfLines={2}>
              {task.description}
            </Text>
          ) : !task.completed && task.type ? (
            <Text variant="caption" color={Colors.brownMuted}>
              {task.type === 'upload_lease' || task.type === 'upload_insurance'
                ? 'Tap to upload a file'
                : task.type === 'register_buzzer'
                  ? 'Tap to register your buzzer'
                  : task.type === 'key_fob_pickup'
                    ? 'Tap to request keys & fobs'
                    : task.type === 'schedule_elevator'
                      ? 'Tap to pick an elevator slot'
                      : task.type === 'pay_deposit'
                        ? 'Tap to authorize card hold'
                        : 'Tap for details'}
            </Text>
          ) : null}
        </View>

        {hasAction && (
          <ChevronDown
            size={16}
            color={Colors.brownMuted}
            strokeWidth={1.8}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        )}
      </Pressable>

      {expanded && hasAction && (
        <View style={styles.actionArea}>
          <TaskAction
            taskId={task.id}
            type={task.type}
            config={task.config}
            response={task.response}
            onSubmit={onSubmit}
          />
        </View>
      )}
    </View>
  );
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, toggle, submitResponse, completed, total } = useTasks();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <ScreenContainer style={{ paddingTop: insets.top + Spacing.md }}>
        <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
      </ScreenContainer>
    );
  }

  const progress = total > 0 ? completed / total : 0;

  return (
    <ScreenContainer style={{ paddingTop: insets.top + Spacing.md }}>
      <Text variant="title" style={styles.title}>Checklist</Text>

      {total === 0 ? (
        <View style={styles.empty}>
          <Text variant="body" color={Colors.brownMuted} center>
            Your property team hasn't assigned any tasks yet. Check back soon.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.progressSection}>
            <Text variant="caption" color={Colors.brownMuted}>
              {completed} of {total} complete
            </Text>
            <ProgressBar progress={progress} height={4} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                expanded={expandedId === task.id}
                onToggleExpand={() => setExpandedId(expandedId === task.id ? null : task.id)}
                onSubmit={submitResponse}
                onToggleComplete={toggle}
              />
            ))}
          </ScrollView>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.xs,
  },
  progressSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  listContent: {
    gap: Spacing.sm,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  cardDone: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDone: {
    backgroundColor: Colors.brown,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  doneText: {
    textDecorationLine: 'line-through',
  },
  actionArea: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
});
