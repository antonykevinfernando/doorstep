export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskCategory {
  id: string;
  title: string;
  tasks: Task[];
}

export const defaultTasks: TaskCategory[] = [
  {
    id: 'before',
    title: 'Before Move',
    tasks: [
      { id: 'b1', title: 'Notify landlord / give notice', completed: false },
      { id: 'b2', title: 'Sort & declutter belongings', completed: false },
      { id: 'b3', title: 'Gather packing supplies', completed: false },
      { id: 'b4', title: 'Change address with post office', completed: false },
      { id: 'b5', title: 'Transfer utilities to new address', completed: false },
      { id: 'b6', title: 'Update bank & insurance info', completed: false },
      { id: 'b7', title: 'Pack non-essentials first', completed: false },
      { id: 'b8', title: 'Book moving company', completed: false },
    ],
  },
  {
    id: 'day',
    title: 'Moving Day',
    tasks: [
      { id: 'd1', title: 'Do final walkthrough of old place', completed: false },
      { id: 'd2', title: 'Check all rooms, closets & drawers', completed: false },
      { id: 'd3', title: 'Hand over keys to landlord', completed: false },
      { id: 'd4', title: 'Supervise loading of truck', completed: false },
      { id: 'd5', title: 'Keep essentials bag with you', completed: false },
    ],
  },
  {
    id: 'after',
    title: 'After Move',
    tasks: [
      { id: 'a1', title: 'Inspect new place for damage', completed: false },
      { id: 'a2', title: 'Set up internet & Wi-Fi', completed: false },
      { id: 'a3', title: 'Unpack kitchen & bathroom first', completed: false },
      { id: 'a4', title: 'Update driver\'s license address', completed: false },
      { id: 'a5', title: 'Register to vote at new address', completed: false },
      { id: 'a6', title: 'Meet your neighbours', completed: false },
    ],
  },
];
