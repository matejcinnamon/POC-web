'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setupTwoFactor, enableTwoFactor, getCurrentUser } from '../lib/api';

export default function TwoFactorSetup() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const setup = async () => {
      try {
        const data = await setupTwoFactor();
        setQrCode(data.qrCodeDataURL);
        setSecret(data.secret);
      } catch (err: any) {
        // Handle both axios errors and general errors
        const errorMessage = err.response?.data?.message || err.message || 'Failed to setup 2FA';
        setError(errorMessage);
      }
    };
    setup();
  }, []);

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await enableTwoFactor(token);
      setMessage('2FA enabled successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      // Handle both axios errors and general errors
      const errorMessage = err.response?.data?.message || err.message || 'Failed to enable 2FA';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#EDE8DF', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>Setup Two-Factor Authentication</h1>
          <p style={{ color: '#7A6255', fontSize: '0.875rem', marginTop: '0.5rem' }}>Scan the QR code with your authenticator app</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
            <p style={{ color: '#DC2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {message && (
          <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
            <p style={{ color: '#059669', fontSize: '0.875rem', margin: 0 }}>{message}</p>
          </div>
        )}

        {qrCode && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-block', padding: '1rem', background: '#F9F9F9', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
              <img src={qrCode} alt="2FA QR Code" style={{ width: '200px', height: '200px' }} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Can't scan? Use this secret key:</p>
              <code style={{ background: '#F3F4F6', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {secret}
              </code>
            </div>
          </div>
        )}

        <form onSubmit={handleEnable}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#2C1810', marginBottom: '0.5rem' }}>
              Verification Code
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #C9BFB0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                textAlign: 'center',
                letterSpacing: '0.1em',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#8B1A1A')}
              onBlur={(e) => (e.target.style.borderColor = '#C9BFB0')}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !qrCode}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isLoading || !qrCode ? '#C9BFB0' : '#8B1A1A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isLoading || !qrCode ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {isLoading ? 'Enabling...' : 'Enable 2FA'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#8B1A1A',
              fontSize: '0.875rem',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
