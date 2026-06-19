'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('If an account with that email exists, a password reset link has been sent.');
        setEmail('');
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#EDE8DF', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>Forgot Password</h1>
          <p style={{ color: '#7A6255', fontSize: '0.875rem', marginTop: '0.5rem' }}>Enter your email to receive a reset link</p>
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#2C1810', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #C9BFB0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#8B1A1A')}
              onBlur={(e) => (e.target.style.borderColor = '#C9BFB0')}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isLoading ? '#C9BFB0' : '#8B1A1A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link
            href="/login"
            style={{
              color: '#8B1A1A',
              fontSize: '0.875rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
