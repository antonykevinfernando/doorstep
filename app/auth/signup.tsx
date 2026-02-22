import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, FontFamily, Spacing, Radius, FontSize } from '@/constants/theme';
import { MapPin, Building2, Search } from 'lucide-react-native';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

interface DbBuilding {
  id: string;
  name: string;
  address: string;
}

interface MapboxSuggestion {
  id: string;
  place_name: string;
  text: string;
}

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [dbBuildings, setDbBuildings] = useState<DbBuilding[]>([]);
  const [mapboxResults, setMapboxResults] = useState<MapboxSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<DbBuilding | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase
      .from('buildings')
      .select('id, name, address')
      .then(({ data }) => {
        if (data) setDbBuildings(data);
      });
  }, []);

  const matchedDbBuildings = searchQuery.length > 0
    ? dbBuildings.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const searchMapbox = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.length < 3) {
      setMapboxResults([]);
      setSearching(false);
      return;
    }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&limit=5&country=us,ca`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features) {
        setMapboxResults(
          data.features.map((f: any) => ({
            id: f.id,
            place_name: f.place_name,
            text: f.text,
          })),
        );
      }
    } catch {
      setMapboxResults([]);
    }
    setSearching(false);
  }, []);

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    setSelectedBuilding(null);
    setNoMatch(false);
    setShowDropdown(true);
    setSearching(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMapbox(text), 350);
  }

  function selectDbBuilding(b: DbBuilding) {
    setSelectedBuilding(b);
    setSearchQuery(b.name);
    setShowDropdown(false);
    setNoMatch(false);
  }

  function selectMapboxResult(suggestion: MapboxSuggestion) {
    const addr = suggestion.place_name.toLowerCase();
    const match = dbBuildings.find(
      (b) =>
        addr.includes(b.address.toLowerCase()) ||
        b.address.toLowerCase().includes(suggestion.text.toLowerCase()),
    );
    if (match) {
      selectDbBuilding(match);
    } else {
      setSearchQuery(suggestion.place_name);
      setShowDropdown(false);
      setSelectedBuilding(null);
      setNoMatch(true);
    }
  }

  function formatDateInput(text: string) {
    const digits = text.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '/' + digits.slice(4, 8);
    setMoveInDate(formatted);
  }

  function parseDateToISO(dateStr: string): string | null {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [mm, dd, yyyy] = parts;
    if (!mm || !dd || !yyyy || yyyy.length !== 4) return null;
    const month = parseInt(mm, 10);
    const day = parseInt(dd, 10);
    const year = parseInt(yyyy, 10);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2024) return null;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  async function handleSignup() {
    setError('');
    if (!fullName.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!selectedBuilding) { setError('Please select a building registered on Doorstep'); return; }
    if (!unitNumber.trim()) { setError('Please enter your unit number'); return; }
    const isoDate = parseDateToISO(moveInDate);
    if (!isoDate) { setError('Please enter a valid date (MM/DD/YYYY)'); return; }

    setLoading(true);
    const signupPayload = {
      full_name: fullName.trim(),
      role: 'resident',
      building_id: selectedBuilding.id,
      unit_number: unitNumber.trim(),
      move_in_date: isoDate,
    };
    console.log('[Signup] Payload:', JSON.stringify(signupPayload));

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: signupPayload },
    });
    setLoading(false);
    console.log('[Signup] Result:', JSON.stringify({ data, error: signUpError }));
    if (signUpError) {
      setError(`${signUpError.message} (${signUpError.status ?? 'no status'})`);
    } else {
      router.replace('/(tabs)');
    }
  }

  const hasDbMatches = matchedDbBuildings.length > 0;
  const hasMapboxResults = mapboxResults.length > 0;
  const showResults = showDropdown && !selectedBuilding && searchQuery.length > 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('@/assets/images/doorstep-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>doorstep</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={Colors.brownMuted}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.brownMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.brownMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Your move details</Text>

          <View style={{ zIndex: 10 }}>
            <View style={styles.searchInputWrap}>
              <Search size={16} color={Colors.brownMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search address or building name"
                placeholderTextColor={Colors.brownMuted}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
              />
              {searching && <ActivityIndicator size="small" color={Colors.brownMuted} style={styles.searchSpinner} />}
            </View>

            {selectedBuilding && (
              <View style={styles.selectedChip}>
                <Building2 size={14} color={Colors.green} />
                <Text style={styles.selectedChipText}>{selectedBuilding.name}</Text>
                <Pressable onPress={() => { setSelectedBuilding(null); setSearchQuery(''); }}>
                  <Text style={styles.selectedChipClear}>×</Text>
                </Pressable>
              </View>
            )}

            {noMatch && (
              <View style={styles.noMatchBanner}>
                <Text style={styles.noMatchText}>
                  This address isn't on Doorstep yet. Ask your building management to join.
                </Text>
              </View>
            )}

            {showResults && (hasDbMatches || hasMapboxResults) && (
              <View style={styles.dropdown}>
                {hasDbMatches && (
                  <>
                    <View style={styles.dropdownSection}>
                      <Building2 size={12} color={Colors.brownMuted} />
                      <Text style={styles.dropdownSectionLabel}>On Doorstep</Text>
                    </View>
                    {matchedDbBuildings.slice(0, 3).map((b) => (
                      <Pressable key={b.id} style={styles.dropdownItem} onPress={() => selectDbBuilding(b)}>
                        <Text style={styles.dropdownName}>{b.name}</Text>
                        <Text style={styles.dropdownAddress}>{b.address}</Text>
                      </Pressable>
                    ))}
                  </>
                )}
                {hasMapboxResults && (
                  <>
                    <View style={styles.dropdownSection}>
                      <MapPin size={12} color={Colors.brownMuted} />
                      <Text style={styles.dropdownSectionLabel}>Addresses</Text>
                    </View>
                    {mapboxResults.slice(0, 4).map((s) => (
                      <Pressable key={s.id} style={styles.dropdownItem} onPress={() => selectMapboxResult(s)}>
                        <Text style={styles.dropdownName}>{s.text}</Text>
                        <Text style={styles.dropdownAddress} numberOfLines={1}>{s.place_name}</Text>
                      </Pressable>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Unit number (e.g. 4A)"
            placeholderTextColor={Colors.brownMuted}
            value={unitNumber}
            onChangeText={setUnitNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Move-in date (MM/DD/YYYY)"
            placeholderTextColor={Colors.brownMuted}
            value={moveInDate}
            onChangeText={formatDateInput}
            keyboardType="number-pad"
            maxLength={10}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create account'}</Text>
          </Pressable>
        </View>

        <Link href="/auth/login" style={styles.link}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    tintColor: Colors.brown,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.regular,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.brown,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brownMuted,
    marginTop: Spacing.xs,
  },
  form: {
    width: '100%',
    gap: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.brownMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -Spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brown,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.brown,
  },
  searchSpinner: {
    marginLeft: Spacing.sm,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  selectedChipText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.brown,
  },
  selectedChipClear: {
    fontSize: 18,
    color: Colors.brownMuted,
    marginLeft: 2,
    lineHeight: 18,
  },
  noMatchBanner: {
    backgroundColor: 'rgba(217, 79, 79, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  noMatchText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.brownLight,
    lineHeight: 18,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  dropdownSectionLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.brownMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownName: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.brown,
  },
  dropdownAddress: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.brownMuted,
    marginTop: 2,
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: '#D32F2F',
  },
  button: {
    backgroundColor: Colors.brown,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.cream,
  },
  link: {
    marginTop: Spacing.xl,
  },
  linkText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.brownMuted,
  },
  linkBold: {
    fontWeight: '600',
    color: Colors.brown,
  },
});
