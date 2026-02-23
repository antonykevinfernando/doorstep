import { FlatList, StyleSheet, Pressable, Linking, ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Upload } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Colors, Spacing, FontFamily, FontSize, Radius } from '@/constants/theme';
import { useDocuments, type DocItem } from '@/hooks/use-documents';
import { supabase } from '@/lib/supabase';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function openDocument(filePath: string) {
  const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 60);
  if (data?.signedUrl) {
    Linking.openURL(data.signedUrl);
  }
}

function DocRow({ doc }: { doc: DocItem }) {
  const isUploaded = doc.source === 'uploaded';
  const Icon = isUploaded ? Upload : FileText;

  return (
    <Pressable onPress={() => openDocument(doc.file_path)}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, isUploaded && styles.iconWrapUploaded]}>
            <Icon size={20} color={isUploaded ? Colors.greenDark : Colors.brown} strokeWidth={1.5} />
          </View>
          <View style={styles.info}>
            <Text variant="body" numberOfLines={1}>{doc.title}</Text>
            <Text variant="caption" color={Colors.brownMuted}>
              {isUploaded ? 'Your upload' : 'Shared'} · {formatDate(doc.created_at)}{doc.file_size ? ` · ${formatSize(doc.file_size)}` : ''}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { docs, loading } = useDocuments();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <Text variant="title" style={styles.title}>Documents</Text>
      <Text variant="caption" color={Colors.brownMuted} style={styles.sub}>
        Your uploads &amp; files shared by your property team
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.brown} style={{ marginTop: Spacing.xxl }} />
      ) : docs.length === 0 ? (
        <Text variant="body" color={Colors.brownMuted} style={styles.empty}>
          No documents shared yet.
        </Text>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => <DocRow doc={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  sub: {
    marginBottom: Spacing.xl,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: 100,
  },
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUploaded: {
    backgroundColor: '#D2EDBF40',
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
