import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useMove } from './use-move';

export interface TaskItem {
  id: string;
  title: string;
  type: string | null;
  description: string | null;
  config: Record<string, any> | null;
  completed: boolean;
  sort_order: number;
  response: Record<string, any> | null;
}

export function useTasks() {
  const { move } = useMove();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!move) { setLoading(false); return; }

    async function fetch() {
      const { data } = await supabase
        .from('move_tasks')
        .select('id, title, type, description, config, completed, sort_order, response')
        .eq('move_id', move!.id)
        .order('sort_order', { ascending: true });
      setTasks((data as TaskItem[]) ?? []);
      setLoading(false);
    }
    fetch();
  }, [move]);

  const toggle = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: newCompleted } : t));
    const { error } = await supabase.from('move_tasks').update({
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }).eq('id', taskId);
    if (error) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: !newCompleted } : t));
      Alert.alert('Update failed', error.message);
    }
  }, [tasks]);

  const submitResponse = useCallback(async (taskId: string, response: Record<string, any>) => {
    const prev = tasks.find((t) => t.id === taskId);
    setTasks((all) => all.map((t) =>
      t.id === taskId ? { ...t, response, completed: true } : t
    ));
    const { error } = await supabase.from('move_tasks').update({
      response,
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId);
    if (error) {
      setTasks((all) => all.map((t) =>
        t.id === taskId ? { ...t, response: prev?.response ?? null, completed: prev?.completed ?? false } : t
      ));
      Alert.alert('Save failed', error.message);
    }
  }, [tasks]);

  const completed = tasks.filter((t) => t.completed).length;

  return { tasks, loading, toggle, submitResponse, completed, total: tasks.length };
}
