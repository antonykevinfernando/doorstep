import { useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { TaskCategory } from '@/components/tasks/task-category';
import { defaultTasks, type TaskCategory as TaskCategoryType } from '@/data/tasks';
import { Colors, Spacing } from '@/constants/theme';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<TaskCategoryType[]>(defaultTasks);

  const handleToggle = useCallback((taskId: string) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        tasks: cat.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t,
        ),
      })),
    );
  }, []);

  const allTasks = categories.flatMap((c) => c.tasks);
  const completed = allTasks.filter((t) => t.completed).length;

  return (
    <ScreenContainer style={{ paddingTop: insets.top + Spacing.md }}>
      <Text variant="title" style={styles.title}>
        Checklist
      </Text>
      <Text variant="caption" color={Colors.brownMuted} style={styles.sub}>
        {completed} of {allTasks.length} complete
      </Text>

      {categories.map((cat) => (
        <TaskCategory
          key={cat.id}
          title={cat.title}
          tasks={cat.tasks}
          onToggle={handleToggle}
        />
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.xs,
  },
  sub: {
    marginBottom: Spacing.xl,
  },
});
