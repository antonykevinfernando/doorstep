import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TaskItem } from './task-item';
import { Colors, Spacing } from '@/constants/theme';
import type { Task } from '@/data/tasks';

interface TaskCategoryProps {
  title: string;
  tasks: Task[];
  onToggle: (taskId: string) => void;
}

export function TaskCategory({ title, tasks, onToggle }: TaskCategoryProps) {
  const [expanded, setExpanded] = useState(true);
  const completed = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? completed / tasks.length : 0;

  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <Card style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.left}>
          <Chevron size={18} color={Colors.brownMuted} strokeWidth={1.8} />
          <Text variant="body" semibold>{title}</Text>
        </View>
        <Text variant="label" color={Colors.brownMuted}>
          {completed}/{tasks.length}
        </Text>
      </Pressable>

      <ProgressBar progress={progress} height={3} />

      {expanded && (
        <View style={styles.list}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              title={task.title}
              completed={task.completed}
              onToggle={() => onToggle(task.id)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  list: {
    marginTop: Spacing.xs,
  },
});
