export type UserRole = 'manager' | 'resident';
export type MoveType = 'move_in' | 'move_out';
export type MoveStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  org_id: string | null;
  approved: boolean;
  requested_building_id: string | null;
  requested_unit_number: string | null;
  requested_move_in_date: string | null;
  created_at: string;
}

export interface Building {
  id: string;
  org_id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Unit {
  id: string;
  building_id: string;
  number: string;
  floor: string | null;
  created_at: string;
}

export interface Move {
  id: string;
  type: MoveType;
  status: MoveStatus;
  resident_id: string;
  unit_id: string;
  scheduled_date: string;
  time_slot: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoveWithDetails extends Move {
  resident?: Profile;
  unit?: Unit & { building?: Building };
}

export interface ChecklistTemplate {
  id: string;
  building_id: string;
  title: string;
  created_at: string;
}

export interface ChecklistTemplateItem {
  id: string;
  template_id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

export interface MoveTask {
  id: string;
  move_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  move_id: string | null;
  building_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  move_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: Profile;
}

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization> & Pick<Organization, 'name' | 'slug'>; Update: Partial<Organization> };
      profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, 'id'>; Update: Partial<Profile> };
      buildings: { Row: Building; Insert: Partial<Building> & Pick<Building, 'org_id' | 'name'>; Update: Partial<Building> };
      units: { Row: Unit; Insert: Partial<Unit> & Pick<Unit, 'building_id' | 'number'>; Update: Partial<Unit> };
      moves: { Row: Move; Insert: Partial<Move> & Pick<Move, 'type' | 'resident_id' | 'unit_id' | 'scheduled_date'>; Update: Partial<Move> };
      checklist_templates: { Row: ChecklistTemplate; Insert: Partial<ChecklistTemplate> & Pick<ChecklistTemplate, 'building_id' | 'title'>; Update: Partial<ChecklistTemplate> };
      checklist_template_items: { Row: ChecklistTemplateItem; Insert: Partial<ChecklistTemplateItem> & Pick<ChecklistTemplateItem, 'template_id' | 'title'>; Update: Partial<ChecklistTemplateItem> };
      move_tasks: { Row: MoveTask; Insert: Partial<MoveTask> & Pick<MoveTask, 'move_id' | 'title'>; Update: Partial<MoveTask> };
      documents: { Row: Document; Insert: Partial<Document> & Pick<Document, 'title' | 'file_path'>; Update: Partial<Document> };
      messages: { Row: Message; Insert: Partial<Message> & Pick<Message, 'move_id' | 'sender_id' | 'body'>; Update: Partial<Message> };
    };
  };
}
