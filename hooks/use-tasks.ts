import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useMove } from './use-move';

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
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
        .select('id, title, completed, sort_order')
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
    await supabase.from('move_tasks').update({
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }).eq('id', taskId);
  }, [tasks]);

  const completed = tasks.filter((t) => t.completed).length;

  return { tasks, loading, toggle, completed, total: tasks.length };
}
