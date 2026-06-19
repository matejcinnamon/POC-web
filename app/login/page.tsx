'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated by calling /api/auth/me
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Validate that we have proper user data
          if (data && data.userId && data.email) {
            router.replace('/dashboard');
          }
        }
      } catch {
        // Not authenticated, stay on login page
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const body: Record<string, string> = { email, password };
      if (requiresTwoFactor) {
        body.twoFactorToken = twoFactorToken;
      }

      const res = await axios.post('/api/auth/login', body, { withCredentials: true, validateStatus: () => true });

      if (res.status === 206 && res.data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTwoFactorToken('');
        return;
      }

      if (res.status !== 200) {
        setError(res.data?.message || 'Prijava neuspješna. Provjerite email i lozinku.');
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Prijava neuspješna. Provjerite email i lozinku.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', background: '#EDE8DF', border: '1px solid #C9BFB0', borderRadius: '10px', color: '#2C1810', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDE8DF', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: '#8B1A1A', marginBottom: '1rem', fontSize: '1.5rem' }}>
            📄
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2C1810', margin: 0, letterSpacing: '-0.025em' }}>Utility Bills</h1>
          <p style={{ color: '#7A6255', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {requiresTwoFactor ? 'Unesite kod iz autentifikatora' : 'Prijavite se u svoj račun'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#F5F0E8', border: '1px solid #C9BFB0', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(44,24,16,0.10)' }}>
          {error && (
            <div style={{ background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#8B1A1A', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!requiresTwoFactor ? (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#7A6255', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="vas@email.com"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#8B1A1A')}
                    onBlur={e => (e.target.style.borderColor = '#C9BFB0')}
                  />
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#7A6255', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    LOZINKA
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#8B1A1A')}
                    onBlur={e => (e.target.style.borderColor = '#C9BFB0')}
                  />
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#7A6255', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                  KOD IZ AUTENTIFIKATORA
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={twoFactorToken}
                  onChange={(e) => { setTwoFactorToken(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="000000"
                  style={{ ...inputStyle, fontSize: '1.5rem', letterSpacing: '0.4em', textAlign: 'center' }}
                  onFocus={e => (e.target.style.borderColor = '#8B1A1A')}
                  onBlur={e => (e.target.style.borderColor = '#C9BFB0')}
                />
                <button
                  type="button"
                  onClick={() => { setRequiresTwoFactor(false); setTwoFactorToken(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#8B1A1A', fontSize: '0.8125rem', cursor: 'pointer', marginTop: '0.5rem', padding: 0 }}
                >
                  ← Natrag na prijavu
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (requiresTwoFactor && twoFactorToken.length !== 6)}
              style={{ width: '100%', padding: '0.875rem', background: isLoading ? '#A52525' : '#8B1A1A', border: 'none', borderRadius: '10px', color: '#F5F0E8', fontSize: '0.9375rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'opacity 0.2s', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading && (
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(245,240,232,0.3)', borderTopColor: '#F5F0E8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              )}
              {isLoading ? 'Učitavanje...' : requiresTwoFactor ? 'Potvrdi' : 'Prijava'}
            </button>
          </form>

          {!requiresTwoFactor && (
            <>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link
                  href="/forgot-password"
                  style={{ display: 'inline-block', fontSize: '0.875rem', color: '#8B1A1A', textDecoration: 'none', fontWeight: 500, marginBottom: '0.5rem' }}
                >
                  Zaboravili ste lozinku?
                </Link>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#9E887A', marginTop: '1rem' }}>
                Nemate račun?{' '}
                <a href="/register" style={{ color: '#8B1A1A', textDecoration: 'none', fontWeight: 600 }}>Registrirajte se</a>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
