import { ScrollView, View, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Phone,
  BellRing,
  FileText,
  ShieldCheck,
  KeyRound,
  ArrowUpDown,
  DollarSign,
  ExternalLink,
  Check,
  Mail,
  User,
  Truck,
  PhoneCall,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useMove } from '@/hooks/use-move';
import { useTasks, type TaskItem } from '@/hooks/use-tasks';
import { useBookings, type Booking } from '@/hooks/use-bookings';
import { supabase } from '@/lib/supabase';

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function findTask(tasks: TaskItem[], type: string) {
  return tasks.find((t) => t.type === type && t.completed && t.response);
}

async function openFile(filePath: string) {
  const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 60);
  if (data?.signedUrl) Linking.openURL(data.signedUrl);
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Icon size={14} color={Colors.brownMuted} strokeWidth={1.8} />
      <Text variant="caption" color={Colors.brownMuted} style={styles.detailLabel}>{label}</Text>
      <Text variant="caption" medium color={Colors.brown} style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function FileRow({ label, fileName, filePath }: { label: string; fileName: string; filePath: string }) {
  return (
    <Pressable style={({ pressed }) => [styles.fileRow, pressed && { opacity: 0.7 }]} onPress={() => openFile(filePath)}>
      <View style={styles.fileIconWrap}>
        <FileText size={14} color={Colors.greenDark} strokeWidth={1.8} />
      </View>
      <View style={styles.fileInfo}>
        <Text variant="caption" medium color={Colors.brown} numberOfLines={1}>{fileName}</Text>
        <Text variant="caption" color={Colors.brownMuted}>{label}</Text>
      </View>
      <ExternalLink size={12} color={Colors.brownMuted} strokeWidth={1.5} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { move } = useMove();
  const { tasks } = useTasks();
  const { bookings } = useBookings();

  const buzzer = findTask(tasks, 'register_buzzer');
  const keyfob = findTask(tasks, 'key_fob_pickup');
  const elevator = findTask(tasks, 'schedule_elevator');
  const deposit = findTask(tasks, 'pay_deposit');
  const lease = findTask(tasks, 'upload_lease');
  const insurance = findTask(tasks, 'upload_insurance');

  const hasDocuments = lease || insurance;
  const hasContact = buzzer;
  const hasKeyfob = keyfob;
  const hasElevator = elevator;
  const hasDeposit = deposit;

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + Spacing.md }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header card */}
      <Card>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text variant="title" color={Colors.cream}>
              {(user?.user_metadata?.full_name || user?.email || '?')[0].toUpperCase()}
            </Text>
          </View>
          <Text variant="subtitle" center>
            {user?.user_metadata?.full_name || 'Resident'}
          </Text>
          {move && (
            <Text variant="caption" color={Colors.brownMuted} center>
              {move.unit?.building?.name} · Unit {move.unit?.number}
            </Text>
          )}
          <View style={styles.emailRow}>
            <Mail size={12} color={Colors.brownMuted} strokeWidth={1.5} />
            <Text variant="caption" color={Colors.brownMuted}>{user?.email}</Text>
          </View>
        </View>
      </Card>

      {/* Contact info */}
      {hasContact && (
        <Card>
          <Text variant="body" semibold style={styles.sectionTitle}>Contact</Text>
          {buzzer?.response?.buzzer_code && (
            <DetailRow icon={User} label="Name" value={buzzer.response.buzzer_code} />
          )}
          {buzzer?.response?.phone && (
            <DetailRow icon={Phone} label="Phone" value={buzzer.response.phone} />
          )}
          {buzzer?.response?.assigned_buzzer_code && (
            <DetailRow icon={BellRing} label="Buzzer" value={buzzer.response.assigned_buzzer_code} />
          )}
          {!buzzer?.response?.assigned_buzzer_code && (
            <View style={styles.pendingPill}>
              <Text variant="caption" color={Colors.brownMuted}>Buzzer code assigned by management</Text>
            </View>
          )}
        </Card>
      )}

      {/* Documents */}
      {hasDocuments && (
        <Card>
          <Text variant="body" semibold style={styles.sectionTitle}>Documents</Text>
          <View style={styles.fileList}>
            {lease?.response?.file_path && (
              <FileRow
                label="Lease"
                fileName={lease.response.file_name ?? 'Lease'}
                filePath={lease.response.file_path}
              />
            )}
            {insurance?.response?.file_path && (
              <FileRow
                label="Insurance"
                fileName={insurance.response.file_name ?? 'Insurance'}
                filePath={insurance.response.file_path}
              />
            )}
          </View>
        </Card>
      )}

      {/* Keys and Fobs */}
      {hasKeyfob && (
        <Card>
          <Text variant="body" semibold style={styles.sectionTitle}>Keys & Fobs</Text>
          <View style={styles.keyGrid}>
            {keyfob?.response?.num_keys !== undefined && (
              <View style={styles.keyItem}>
                <Text variant="hero" color={Colors.brown} center style={styles.keyNumber}>
                  {keyfob.response.num_keys}
                </Text>
                <Text variant="caption" color={Colors.brownMuted} center>
                  {keyfob.response.num_keys === 1 ? 'key' : 'keys'}
                </Text>
              </View>
            )}
            {keyfob?.response?.num_fobs !== undefined && (
              <View style={styles.keyItem}>
                <Text variant="hero" color={Colors.brown} center style={styles.keyNumber}>
                  {keyfob.response.num_fobs}
                </Text>
                <Text variant="caption" color={Colors.brownMuted} center>
                  {keyfob.response.num_fobs === 1 ? 'fob' : 'fobs'}
                </Text>
              </View>
            )}
          </View>
          {keyfob?.response?.pickup_person && (
            <DetailRow icon={User} label="Pickup" value={keyfob.response.pickup_person} />
          )}
          {keyfob?.response?.assigned_key_numbers && (
            <DetailRow icon={KeyRound} label="Key #" value={keyfob.response.assigned_key_numbers} />
          )}
          {keyfob?.response?.assigned_fob_numbers && (
            <DetailRow icon={KeyRound} label="Fob #" value={keyfob.response.assigned_fob_numbers} />
          )}
          {!keyfob?.response?.assigned_key_numbers && !keyfob?.response?.assigned_fob_numbers && (
            <View style={styles.pendingPill}>
              <Text variant="caption" color={Colors.brownMuted}>Numbers assigned at pickup</Text>
            </View>
          )}
        </Card>
      )}

      {/* Elevator */}
      {hasElevator && (
        <Card>
          <Text variant="body" semibold style={styles.sectionTitle}>Elevator Booking</Text>
          <View style={styles.elevatorCard}>
            <ArrowUpDown size={16} color={Colors.brown} strokeWidth={1.8} />
            <View>
              <Text variant="body" medium color={Colors.brown}>
                {formatDate(elevator!.response!.date)}
              </Text>
              <Text variant="caption" color={Colors.brownMuted}>
                {formatTime(elevator!.response!.start_time)} — {formatTime(elevator!.response!.end_time)}
              </Text>
            </View>
            <Check size={14} color={Colors.greenDark} strokeWidth={2.5} style={{ marginLeft: 'auto' }} />
          </View>
        </Card>
      )}

      {/* Mover Booking */}
      {bookings.length > 0 && bookings.map((b) => (
        <Card key={b.id}>
          <Text variant="body" semibold style={styles.sectionTitle}>Mover Booking</Text>
          <View style={styles.moverBookingRow}>
            <View style={styles.moverBookingIcon}>
              <Truck size={18} color={Colors.cream} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="body" medium color={Colors.brown}>{b.moverName}</Text>
              <Text variant="caption" color={Colors.brownMuted}>
                {new Date(b.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {b.timeSlot ? ` · ${b.timeSlot}` : ''}
              </Text>
            </View>
            <View style={[
              styles.moverStatusBadge,
              b.status === 'confirmed' && styles.moverStatusConfirmed,
              b.status === 'completed' && styles.moverStatusCompleted,
              b.status === 'cancelled' && styles.moverStatusCancelled,
            ]}>
              <Text variant="label" color={
                b.status === 'pending' ? '#92702B' :
                b.status === 'confirmed' ? Colors.greenDark :
                b.status === 'cancelled' ? Colors.red :
                Colors.brownMuted
              }>
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </Text>
            </View>
          </View>
          {b.status === 'confirmed' && b.moverPhone && (
            <Pressable
              style={({ pressed }) => [styles.callMoverBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
              onPress={() => Linking.openURL(`tel:${b.moverPhone}`)}
            >
              <PhoneCall size={15} color={Colors.cream} strokeWidth={1.8} />
              <Text variant="body" medium color={Colors.cream}>Call Mover</Text>
            </Pressable>
          )}
        </Card>
      ))}

      {/* Deposit */}
      {hasDeposit && (
        <Card>
          <Text variant="body" semibold style={styles.sectionTitle}>Deposit</Text>
          <View style={styles.depositRow}>
            <DollarSign size={16} color={Colors.greenDark} strokeWidth={2} />
            <Text variant="body" medium color={Colors.brown}>
              ${((deposit!.response!.amount_cents ?? 0) / 100).toFixed(2)}
            </Text>
            <View style={styles.depositBadge}>
              <Text variant="caption" medium color={Colors.greenDark}>Hold authorized</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Sign out */}
      <Pressable
        style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
        onPress={handleSignOut}
      >
        <LogOut size={18} color={Colors.red} strokeWidth={1.8} />
        <Text variant="body" medium color={Colors.red}>Sign Out</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    gap: Spacing.md,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  detailLabel: {
    width: 60,
  },
  detailValue: {
    flex: 1,
  },
  fileList: {
    gap: Spacing.sm,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 2,
  },
  fileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    gap: 1,
  },
  keyGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  keyItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
  },
  keyNumber: {
    fontSize: 32,
    lineHeight: 38,
  },
  pendingPill: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  elevatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  moverBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  moverBookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moverStatusBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  moverStatusConfirmed: {
    backgroundColor: Colors.greenLight,
  },
  moverStatusCompleted: {
    backgroundColor: Colors.overlay,
  },
  moverStatusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  callMoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.brown,
    borderRadius: Radius.sm,
    paddingVertical: 12,
  },
  depositRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  depositBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.greenLight,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
});
