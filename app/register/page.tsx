'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api, { storeAuthTokens } from '../lib/api';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (Cookies.get('token')) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/register', { email, password });
      const { token, refreshToken, refreshTokenId } = response.data;
      storeAuthTokens(token, refreshToken, refreshTokenId);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registracija neuspješna. Email možda već postoji.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDE8DF', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: '#8B1A1A', marginBottom: '1rem', fontSize: '1.5rem' }}>
            📄
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2C1810', margin: 0, letterSpacing: '-0.025em' }}>Utility Bills</h1>
          <p style={{ color: '#7A6255', fontSize: '0.875rem', marginTop: '0.5rem' }}>Kreirajte novi račun</p>
        </div>

        <div style={{ background: '#F5F0E8', border: '1px solid #C9BFB0', borderRadius: '16px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
          {error && (
            <div style={{ background: 'rgba(139,26,26,0.1)', border: '1px solid rgba(139,26,26,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#8B1A1A', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#7A6255', marginBottom: '0.5rem', letterSpacing: '0.025em' }}>
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vas@email.com"
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#FFFFFF', border: '1px solid #C9BFB0', borderRadius: '10px', color: '#2C1810', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = '#8B1A1A')}
                onBlur={e => (e.target.style.borderColor = '#C9BFB0')}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#7A6255', marginBottom: '0.5rem', letterSpacing: '0.025em' }}>
                LOZINKA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#FFFFFF', border: '1px solid #C9BFB0', borderRadius: '10px', color: '#2C1810', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = '#8B1A1A')}
                onBlur={e => (e.target.style.borderColor = '#C9BFB0')}
              />
              <p style={{ fontSize: '0.75rem', color: '#9E887A', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Min. 8 znakova · jedno veliko slovo · jedno malo slovo · jedan broj · jedan poseban znak (npr. <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0 3px', borderRadius: '3px' }}>!</code>)
              </p>
            </div>

            <div style={{ marginBottom: '1.75rem' }} />

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', padding: '0.875rem', background: isLoading ? '#A67B5B' : '#8B1A1A', border: 'none', borderRadius: '10px', color: '#F5F0E8', fontSize: '0.9375rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading && (
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              )}
              {isLoading ? 'Kreiranje...' : 'Kreiraj račun'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#7A6255', marginTop: '1.5rem' }}>
            Već imate račun?{' '}
            <a href="/login" style={{ color: '#8B1A1A', textDecoration: 'none', fontWeight: 500 }}>Prijavite se</a>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
