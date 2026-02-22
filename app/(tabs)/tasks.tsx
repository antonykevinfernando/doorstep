import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { TaskCategory } from '@/components/tasks/task-category';
import { Colors, Spacing } from '@/constants/theme';
import { useTasks, type TaskItem } from '@/hooks/use-tasks';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, toggle, completed, total } = useTasks();

  if (loading) {
    return (
      <ScreenContainer style={{ paddingTop: insets.top + Spacing.md }}>
        <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={{ paddingTop: insets.top + Spacing.md }}>
      <Text variant="title" style={styles.title}>Checklist</Text>
      <Text variant="caption" color={Colors.brownMuted} style={styles.sub}>
        {total > 0 ? `${completed} of ${total} complete` : 'No tasks yet'}
      </Text>

      {total === 0 ? (
        <View style={styles.empty}>
          <Text variant="body" color={Colors.brownMuted} center>
            Your property team hasn't assigned any tasks yet. Check back soon.
          </Text>
        </View>
      ) : (
        <View>
          {tasks.map((task: TaskItem) => (
            <TaskCategory
              key={task.id}
              title=""
              tasks={[{ id: task.id, title: task.title, completed: task.completed }]}
              onToggle={toggle}
            />
          ))}
        </View>
      )}
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
  empty: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
});
