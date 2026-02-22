'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Item {
  id: string;
  title: string;
  sort_order: number;
}

interface Props {
  templateId: string;
  initialItems: Item[];
}

export function TemplateItems({ templateId, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  async function addItem() {
    if (!newTitle.trim()) return;
    setAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('checklist_template_items')
      .insert({
        template_id: templateId,
        title: newTitle.trim(),
        sort_order: items.length,
      })
      .select()
      .single();
    setAdding(false);
    if (!error && data) {
      setItems([...items, data]);
      setNewTitle('');
    }
  }

  async function removeItem(id: string) {
    const supabase = createClient();
    await supabase.from('checklist_template_items').delete().eq('id', id);
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-3 group">
          <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}</span>
          <span className="text-sm flex-1">{item.title}</span>
          <button
            onClick={() => removeItem(item.id)}
            className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <Input
          placeholder="Add checklist item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          className="text-sm"
        />
        <Button size="sm" variant="secondary" onClick={addItem} disabled={adding}>
          Add
        </Button>
      </div>
    </div>
  );
}
