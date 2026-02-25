'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Loader2, Truck, Search, MapPin } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
}

export default function MoverSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [description, setDescription] = useState('');

  const [addressQuery, setAddressQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [mapboxResults, setMapboxResults] = useState<MapboxFeature[]>([]);
  const [showAddrDropdown, setShowAddrDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchMapbox = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.length < 3) {
      setMapboxResults([]);
      setSearching(false);
      return;
    }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood&limit=5&country=us,ca`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features) {
        setMapboxResults(data.features.map((f: any) => ({ id: f.id, place_name: f.place_name, text: f.text })));
      }
    } catch {
      setMapboxResults([]);
    }
    setSearching(false);
  }, []);

  function handleAddressChange(text: string) {
    setAddressQuery(text);
    setSelectedAddress('');
    setShowAddrDropdown(true);
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMapbox(text), 350);
  }

  function selectAddress(feature: MapboxFeature) {
    setSelectedAddress(feature.place_name);
    setAddressQuery(feature.place_name);
    setShowAddrDropdown(false);
  }

  function goToStep2() {
    setError('');
    if (!fullName.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!companyName.trim()) { setError('Please enter your company name'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: 'mover',
          company_name: companyName.trim(),
          phone: phone.trim(),
          service_area: selectedAddress,
          description: description.trim(),
        },
      },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      router.push('/mover');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/doorstep-logo.png" alt="Doorstep" width={40} height={40} className="rounded-lg" />
          </div>
          <p className="text-2xl font-bold tracking-tight">doorstep</p>
          <p className="text-sm text-muted-foreground mt-1">Moving services marketplace</p>
        </div>

        <div className="flex items-center gap-2 justify-center mb-8">
          <div className={`h-1.5 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-foreground' : 'bg-foreground/10'}`} />
          <div className={`h-1.5 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-foreground' : 'bg-foreground/10'}`} />
        </div>

        {step === 1 && (
          <div className="glass-strong rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-1">
              <Truck size={20} className="text-foreground/70" />
              <h2 className="text-lg font-semibold">Your account</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Sign up to receive bookings from residents moving into their new homes.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@movers.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={goToStep2} className="w-full gap-2">
                Continue <ArrowRight size={16} />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Already have an account? <Link href="/login" className="underline font-medium text-foreground">Sign in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <div className="glass-strong rounded-2xl p-8">
              <h2 className="text-lg font-semibold mb-1">Company details</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Tell residents about your moving company.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Company name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. SwiftMove Co." />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2 relative">
                  <Label>Service area</Label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={addressQuery}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onFocus={() => { if (mapboxResults.length > 0 && !selectedAddress) setShowAddrDropdown(true); }}
                      placeholder="Search area..."
                      className="pl-9"
                    />
                    {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
                  </div>
                  {selectedAddress && (
                    <div className="flex items-center gap-2 text-sm text-foreground/80 rounded-lg bg-muted/40 px-3 py-2">
                      <MapPin size={14} className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{selectedAddress}</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedAddress(''); setAddressQuery(''); }}
                        className="ml-auto text-muted-foreground hover:text-foreground shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {showAddrDropdown && mapboxResults.length > 0 && !selectedAddress && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-border shadow-lg overflow-hidden">
                      {mapboxResults.map((f) => (
                        <button
                          type="button"
                          key={f.id}
                          onClick={() => selectAddress(f)}
                          className="w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors border-b border-border/50 last:border-0"
                        >
                          <p className="text-sm font-medium">{f.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{f.place_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Min price / hr <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input type="number" step="1" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="$60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max price / hr <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input type="number" step="1" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="$120" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell residents about your services..."
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => { setStep(1); setError(''); }} className="gap-1.5">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Creating...</>
                    ) : (
                      <>Get started <ArrowRight size={16} /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        <p className="text-xs text-center text-muted-foreground mt-8">
          Are you a vendor? <Link href="/vendor/signup" className="underline font-medium text-foreground/80">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}
