'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout, disconnectGmail } from '../lib/api';

const menuItems = [
  {
    id: 'invoices',
    icon: '📄',
    title: 'Moji računi',
    description: 'Pregled i upravljanje računima iz Gmaila',
    href: '/dashboard/invoices',
    enabled: true,
    accent: '#8B1A1A',
  },
  {
    id: 'analytics',
    icon: '📊',
    title: 'Analitika',
    description: 'Statistike potrošnje i trendovi',
    href: null,
    enabled: false,
    accent: '#7A6255',
  },
  {
    id: 'notifications',
    icon: '🔔',
    title: 'Obavijesti',
    description: 'Postavke podsjetnika i upozorenja',
    href: null,
    enabled: false,
    accent: '#7A6255',
  },
  {
    id: 'integrations',
    icon: '🔗',
    title: 'Integracije',
    description: 'Poveži dodatne email račune i servise',
    href: null,
    enabled: false,
    accent: '#7A6255',
  },
  {
    id: 'export',
    icon: '⬇️',
    title: 'Izvoz podataka',
    description: 'Preuzmi račune u PDF ili CSV formatu',
    href: null,
    enabled: false,
    accent: '#7A6255',
  },
  {
    id: 'profile',
    icon: '👤',
    title: 'Profil i sigurnost',
    description: 'Upravljanje računom i lozinkom',
    href: '/settings',
    enabled: true,
    accent: '#8B1A1A',
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    // Check authentication and Gmail connection
    const checkAuthAndGmail = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          // Validate that we have proper user data
          if (data && data.userId && data.email) {
            setGmailConnected(data.hasGmail || false);
          } else {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };
    checkAuthAndGmail();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      // Even if logout fails, redirect to login
      router.push('/login');
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? This will revoke access and stop fetching invoices.')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectGmail();
      setGmailConnected(false);
      alert('Gmail disconnected successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to disconnect Gmail');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#EDE8DF', fontFamily: 'Inter, sans-serif' }}>
      <style>{`.menu-tile:hover { border-color: #8B1A1A !important; box-shadow: 0 4px 20px rgba(139,26,26,0.10); transform: translateY(-1px); } .menu-tile { transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }`}</style>

      {/* Navbar */}
      <nav style={{ background: '#F5F0E8', borderBottom: '1px solid #C9BFB0', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#8B1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📄</div>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>Utility Bills</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {gmailConnected && (
            <button
              onClick={handleDisconnectGmail}
              disabled={isDisconnecting}
              style={{ 
                padding: '0.5rem 1rem', 
                background: isDisconnecting ? 'rgba(122,98,85,0.08)' : 'rgba(122,98,85,0.08)', 
                border: '1px solid rgba(122,98,85,0.2)', 
                borderRadius: '8px', 
                color: '#7A6255', 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                cursor: isDisconnecting ? 'not-allowed' : 'pointer',
                opacity: isDisconnecting ? 0.6 : 1
              }}
            >
              {isDisconnecting ? 'Prekidanje...' : 'Prekini Gmail'}
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{ padding: '0.5rem 1rem', background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '8px', color: '#8B1A1A', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Odjava
          </button>
        </div>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2C1810', margin: 0, letterSpacing: '-0.025em' }}>Dobrodošli</h1>
          <p style={{ color: '#7A6255', fontSize: '0.9375rem', marginTop: '0.375rem' }}>Odaberite što želite upravljati</p>
        </div>

        {/* Menu grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {menuItems.map((item) => {
            const tileStyle: React.CSSProperties = {
              background: '#F5F0E8',
              border: `1px solid ${item.enabled ? '#C9BFB0' : '#DDD6CC'}`,
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: item.enabled ? 'pointer' : 'not-allowed',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              opacity: item.enabled ? 1 : 0.5,
              position: 'relative',
            };

            const inner = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: item.enabled ? 'rgba(139,26,26,0.10)' : 'rgba(122,98,85,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>
                    {item.icon}
                  </div>
                  {!item.enabled && (
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9E887A', background: '#E4DDD3', border: '1px solid #C9BFB0', borderRadius: '999px', padding: '0.1875rem 0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                      Uskoro
                    </span>
                  )}
                  {item.enabled && (
                    <span style={{ color: '#8B1A1A', fontSize: '1.25rem', fontWeight: 700 }}>›</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: item.enabled ? '#2C1810' : '#9E887A', marginBottom: '0.25rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#9E887A', lineHeight: 1.5 }}>{item.description}</div>
                </div>
              </>
            );

            if (item.enabled && item.href) {
              return (
                <div
                  key={item.id}
                  className="menu-tile"
                  style={tileStyle}
                  onClick={() => router.push(item.href!)}
                >
                  {inner}
                </div>
              );
            }

            return (
              <div key={item.id} style={tileStyle}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
