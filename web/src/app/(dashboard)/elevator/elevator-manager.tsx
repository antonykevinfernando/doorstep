'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowUpDown,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  Clock,
} from 'lucide-react';

interface Building {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  resident_name?: string;
  unit_number?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function BuildingDropdown({ value, onChange, buildings }: {
  value: string;
  onChange: (v: string) => void;
  buildings: Building[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = buildings.find((b) => b.id === value);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-[42px] w-full items-center justify-between rounded-lg border border-input bg-white px-3 text-sm transition-colors hover:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected?.name ?? 'Select building...'}
        </span>
        <ChevronDown size={15} className={`shrink-0 ml-2 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-lg border border-border bg-white shadow-xl">
          <div className="max-h-52 overflow-auto py-1">
            {buildings.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => { onChange(b.id); setOpen(false); }}
                className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                  b.id === value ? 'font-medium text-foreground' : 'text-foreground/80'
                }`}
              >
                <span className="truncate">{b.name}</span>
                {b.id === value && <Check size={13} className="ml-auto shrink-0 text-foreground" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function ElevatorManager({ buildings }: { buildings: Building[] }) {
  const [buildingId, setBuildingId] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  useEffect(() => {
    if (!buildingId) { setSchedules([]); setBookings([]); return; }
    loadData();
  }, [buildingId]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const [{ data: sched }, { data: booked }] = await Promise.all([
      supabase
        .from('elevator_schedules')
        .select('id, day_of_week, start_time, end_time')
        .eq('building_id', buildingId)
        .order('day_of_week')
        .order('start_time'),
      supabase
        .from('elevator_slots')
        .select(`
          id, date, start_time, end_time,
          move:moves!elevator_slots_move_id_fkey(
            resident:profiles!moves_resident_id_fkey(full_name),
            unit:units!moves_unit_id_fkey(number)
          )
        `)
        .eq('building_id', buildingId)
        .not('move_id', 'is', null)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('start_time'),
    ]);

    setSchedules((sched ?? []) as Schedule[]);
    setBookings((booked ?? []).map((b: any) => ({
      id: b.id,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      resident_name: b.move?.resident?.full_name,
      unit_number: b.move?.unit?.number,
    })));
    setLoading(false);
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function addScheduleSlot() {
    if (!buildingId || selectedDays.size === 0 || !startTime || !endTime) return;
    setAdding(true);
    const supabase = createClient();

    const rows = Array.from(selectedDays).map((day) => ({
      building_id: buildingId,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
    }));

    await supabase.from('elevator_schedules').insert(rows);
    setAdding(false);
    loadData();
  }

  async function deleteSchedule(id: string) {
    const supabase = createClient();
    await supabase.from('elevator_schedules').delete().eq('id', id);
    loadData();
  }

  const grouped: Record<number, Schedule[]> = {};
  for (const s of schedules) {
    if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
    grouped[s.day_of_week].push(s);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Elevator Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up recurring time slots — residents book from these automatically
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-6 mb-6">
        <div className="max-w-xs">
          <label className="text-xs text-muted-foreground mb-1.5 block">Building</label>
          <BuildingDropdown value={buildingId} onChange={setBuildingId} buildings={buildings} />
        </div>
      </div>

      {buildingId && !loading && (
        <>
          {/* Add recurring slot */}
          <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-6 mb-6">
            <h3 className="text-sm font-semibold mb-4">Add recurring time slot</h3>

            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-2 block">Available days</label>
              <div className="flex gap-1.5">
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      selectedDays.has(i)
                        ? 'bg-[#30261E] text-[#FAF4F3] shadow-sm'
                        : 'border border-black/5 bg-white/60 text-foreground/60 hover:border-black/10'
                    }`}
                    title={day}
                  >
                    {SHORT_DAYS[i][0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex h-[42px] rounded-lg border border-input bg-white px-3 text-sm transition-colors hover:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex h-[42px] rounded-lg border border-input bg-white px-3 text-sm transition-colors hover:border-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button onClick={addScheduleSlot} disabled={adding || selectedDays.size === 0} className="gap-1.5">
                <Plus size={15} />
                {adding ? 'Adding...' : 'Add Slot'}
              </Button>
            </div>
          </div>

          {/* Schedule overview */}
          <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-6 mb-6">
            <h3 className="text-sm font-semibold mb-4">Weekly schedule</h3>

            {schedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-8 text-center">
                <ArrowUpDown size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No schedule set up yet. Add recurring slots above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-3">
                {DAYS.map((day, i) => {
                  const daySlots = grouped[i] ?? [];
                  return (
                    <div key={i} className="space-y-2">
                      <p className={`text-xs font-semibold text-center pb-2 border-b border-black/5 ${daySlots.length > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                        {SHORT_DAYS[i]}
                      </p>
                      {daySlots.length === 0 && (
                        <p className="text-[10px] text-muted-foreground/30 text-center py-2">—</p>
                      )}
                      {daySlots.map((s) => (
                        <div
                          key={s.id}
                          className="group relative rounded-lg bg-[#E8F5DC]/50 border border-[#D2EDBF]/60 px-2 py-1.5 text-center"
                        >
                          <p className="text-[11px] font-medium text-[#30261E] leading-tight">
                            {formatTime(s.start_time)}
                          </p>
                          <p className="text-[11px] font-medium text-[#30261E] leading-tight">
                            {formatTime(s.end_time)}
                          </p>
                          <button
                            onClick={() => deleteSchedule(s.id)}
                            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-white border border-black/10 text-muted-foreground hover:text-destructive shadow-sm transition-colors"
                          >
                            <Trash2 size={9} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming bookings */}
          {bookings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">
                Upcoming bookings
                <span className="font-normal text-muted-foreground ml-2">{bookings.length}</span>
              </h3>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-4 flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F5DC]">
                    <Clock size={17} className="text-[#30261E]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' '}• {formatTime(b.start_time)} — {formatTime(b.end_time)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.resident_name ?? 'Resident'}{b.unit_number ? ` — Unit ${b.unit_number}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {buildingId && loading && (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      )}
    </div>
  );
}
