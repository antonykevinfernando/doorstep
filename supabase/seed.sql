-- Dev seed data for Doorstep
-- Run after migrations. Assumes a test manager user already exists in auth.users.

-- Org
insert into public.organizations (id, name, slug)
values ('a0000000-0000-0000-0000-000000000001', 'Maple Properties', 'maple-properties');

-- Building
insert into public.buildings (id, org_id, name, address)
values ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'The Willows', '42 Elm Street, Brooklyn, NY 11201');

-- Units
insert into public.units (id, building_id, number, floor) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '4A', '4'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '7B', '7'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '12C', '12');

-- Checklist template
insert into public.checklist_templates (id, building_id, title)
values ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Standard Move-In');

insert into public.checklist_template_items (template_id, title, sort_order) values
  ('d0000000-0000-0000-0000-000000000001', 'Submit proof of insurance', 0),
  ('d0000000-0000-0000-0000-000000000001', 'Reserve elevator time slot', 1),
  ('d0000000-0000-0000-0000-000000000001', 'Pick up keys from front desk', 2),
  ('d0000000-0000-0000-0000-000000000001', 'Complete unit walkthrough', 3),
  ('d0000000-0000-0000-0000-000000000001', 'Set up utilities transfer', 4),
  ('d0000000-0000-0000-0000-000000000001', 'Sign community guidelines', 5);
