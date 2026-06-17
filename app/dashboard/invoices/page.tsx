'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api, { clearAuthTokens } from '../../lib/api';
import PaymentBarcode from '../../components/PaymentBarcode';

interface Invoice {
  _id: string;
  vendor: string;
  amount: number;
  invoiceNumber: string;
  description?: string;
  iban?: string;
  paymentDeadline?: string;
  paymentModel?: string;
  referenceNumber?: string;
  emailLink?: string;
  currency: string;
  status: 'unpaid' | 'paid' | 'ignored';
  emailDate?: string;
}

export default function Invoices() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [fetching, setFetching] = useState(false);
  const [daysBack, setDaysBack] = useState(7);
  const [fetchResult, setFetchResult] = useState<{ fetchedCount: number; skippedCached: number; totalScanned: number; method?: string; daysBack?: number } | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailChecking, setGmailChecking] = useState(true);
  const [ignoringBill, setIgnoringBill] = useState(false);
  const [unignoringBill, setUnignoringBill] = useState(false);
  const [blockingVendor, setBlockingVendor] = useState(false);
  const [paying, setPaying] = useState(false);
  const [unmarking, setUnmarking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Invoice>>({});
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid' | 'ignored' | 'vendors'>('unpaid');
  const [blockedVendors, setBlockedVendors] = useState<string[]>([]);
  const [unblockingVendor, setUnblockingVendor] = useState<string | null>(null);
  const fetchResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (fetchResultTimerRef.current) clearTimeout(fetchResultTimerRef.current);
    };
  }, []);

  const checkGmailConnection = useCallback(async () => {
    try {
      const response = await api.get('/gmail/connection-status');
      setGmailConnected(!!response.data.connected);
    } catch (err: any) {
      if (err.response?.status === 404 && err.response?.data?.message === 'User not found') {
        clearAuthTokens();
        router.push('/login');
        return;
      }
    } finally {
      setGmailChecking(false);
    }
  }, [router]);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await api.get('/invoices');
      const freshInvoices: Invoice[] = response.data.invoices;
      setInvoices(freshInvoices);
      setError('');
      setSelectedInvoice(prev =>
        prev ? (freshInvoices.find(i => i._id === prev._id) ?? null) : null
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri učitavanju računa');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBlockedVendors = useCallback(async () => {
    try {
      const response = await api.get('/vendors');
      setBlockedVendors(response.data.vendors.map((v: any) => v.vendor));
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchInvoices();
    fetchBlockedVendors();
    checkGmailConnection();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gmail') === 'connected') {
      setError('');
      checkGmailConnection();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('gmail') === 'error') {
      setError('Greška pri povezivanju Gmaila');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [router, fetchInvoices, fetchBlockedVendors, checkGmailConnection]);

  const fetchFromGmail = async () => {
    setFetching(true);
    setFetchResult(null);
    setError('');
    try {
      const res = await api.post('/gmail/fetch-invoices', { daysBack });
      setFetchResult({
        fetchedCount: res.data.fetchedCount ?? 0,
        skippedCached: res.data.skippedCached ?? 0,
        totalScanned: res.data.totalScanned ?? 0,
        method: res.data.method || 'Smart pipeline',
        daysBack: res.data.daysBack ?? daysBack
      });
      await fetchInvoices();
      if (fetchResultTimerRef.current) clearTimeout(fetchResultTimerRef.current);
      fetchResultTimerRef.current = setTimeout(() => setFetchResult(null), 8000);
    } catch (err: any) {
      setFetchResult(null);
      setError(err.response?.data?.message || 'Greška pri dohvaćanju računa iz Gmaila');
    } finally {
      setFetching(false);
    }
  };

  const connectGmail = async () => {
    try {
      const response = await api.get('/gmail/auth-url');
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri povezivanju Gmaila');
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    router.push('/login');
  };

  const openInvoice = (invoice: Invoice) => setSelectedInvoice(invoice);
  const closeModal = () => setSelectedInvoice(null);

  const unmarkPaid = async (invoice: Invoice) => {
    setUnmarking(true);
    try {
      await api.patch(`/invoices/${invoice._id}/unmark`, {});
      await fetchInvoices();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri poništavanju plaćanja');
    } finally {
      setUnmarking(false);
    }
  };

  const payBill = async (invoice: Invoice) => {
    setPaying(true);
    try {
      await api.patch(`/invoices/${invoice._id}/pay`, {});
      await fetchInvoices();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri označavanju računa kao plaćenog');
    } finally {
      setPaying(false);
    }
  };

  const unignoreBill = async (invoice: Invoice) => {
    setUnignoringBill(true);
    try {
      await api.patch(`/invoices/${invoice._id}/unignore`, {});
      await fetchInvoices();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri vraćanju računa');
    } finally {
      setUnignoringBill(false);
    }
  };

  const ignoreBill = async (invoice: Invoice) => {
    setIgnoringBill(true);
    try {
      await api.patch(`/invoices/${invoice._id}/ignore`, {});
      await fetchInvoices();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri ignoriranju računa');
    } finally {
      setIgnoringBill(false);
    }
  };

  const blockVendor = async (invoice: Invoice) => {
    setBlockingVendor(true);
    try {
      await api.post(`/vendors/${encodeURIComponent(invoice.vendor)}/block`);
      await Promise.all([fetchInvoices(), fetchBlockedVendors()]);
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri blokiranju dobavljača');
    } finally {
      setBlockingVendor(false);
    }
  };

  const unblockVendor = async (vendor: string) => {
    setUnblockingVendor(vendor);
    try {
      await api.delete(`/vendors/${encodeURIComponent(vendor)}/unblock`);
      await Promise.all([fetchInvoices(), fetchBlockedVendors()]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri odblokiranju dobavljača');
    } finally {
      setUnblockingVendor(null);
    }
  };

  const startEditing = (invoice: Invoice) => {
    setEditForm({
      vendor: invoice.vendor,
      amount: invoice.amount,
      invoiceNumber: invoice.invoiceNumber,
      iban: invoice.iban,
      paymentModel: invoice.paymentModel,
      referenceNumber: invoice.referenceNumber,
      paymentDeadline: invoice.paymentDeadline,
      description: invoice.description,
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!selectedInvoice) return;
    setEditing(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (editForm.vendor !== undefined) updateData.vendor = editForm.vendor;
      if (editForm.amount !== undefined) updateData.amount = editForm.amount;
      if (editForm.invoiceNumber !== undefined) updateData.invoiceNumber = editForm.invoiceNumber;
      if (editForm.iban !== undefined) updateData.iban = editForm.iban;
      if (editForm.paymentModel !== undefined) updateData.paymentModel = editForm.paymentModel;
      if (editForm.referenceNumber !== undefined) updateData.referenceNumber = editForm.referenceNumber;
      if (editForm.paymentDeadline !== undefined) updateData.paymentDeadline = editForm.paymentDeadline;
      if (editForm.description !== undefined) updateData.description = editForm.description;

      await api.patch(`/invoices/${selectedInvoice._id}`, updateData);
      await fetchInvoices();
      cancelEditing();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri spremanju promjena');
    } finally {
      setEditing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('hr-HR');
  };

  const formatAmount = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

  const S = {
    page: { minHeight: '100vh', background: '#EDE8DF', fontFamily: 'Inter, sans-serif' } as React.CSSProperties,
    nav: { background: '#F5F0E8', borderBottom: '1px solid #C9BFB0', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 40 },
    brand: { display: 'flex', alignItems: 'center', gap: '0.625rem' },
    brandIcon: { width: '32px', height: '32px', borderRadius: '8px', background: '#8B1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' },
    brandText: { fontSize: '1.125rem', fontWeight: 700, color: '#2C1810', margin: 0 },
    navActions: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    btnPrimary: { padding: '0.5rem 1rem', background: '#8B1A1A', border: 'none', borderRadius: '8px', color: '#F5F0E8', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' } as React.CSSProperties,
    btnGmail: { padding: '0.5rem 1rem', background: '#8B1A1A', border: 'none', borderRadius: '8px', color: '#F5F0E8', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' } as React.CSSProperties,
    btnConnect: { padding: '0.5rem 1rem', background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.3)', borderRadius: '8px', color: '#8B1A1A', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    btnLogout: { padding: '0.5rem 1rem', background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '8px', color: '#8B1A1A', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    btnBack: { padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #C9BFB0', borderRadius: '8px', color: '#7A6255', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' } as React.CSSProperties,
    main: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' },
    alertError: { background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#8B1A1A', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    alertInfo: { background: 'rgba(122,98,85,0.08)', border: '1px solid rgba(122,98,85,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#5A4235', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.625rem' },
    alertSuccess: { background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#2D6A4F', fontSize: '0.875rem' },
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
    tab: (active: boolean, color: string) => ({
      padding: '0.5rem 1.125rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? color : '#C9BFB0'}`,
      background: active ? color : '#F5F0E8', color: active ? '#F5F0E8' : '#7A6255', transition: 'all 0.15s',
    }) as React.CSSProperties,
    badge: (_color: string) => ({ marginLeft: '0.375rem', background: 'rgba(245,240,232,0.25)', color: '#F5F0E8', padding: '0.125rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }) as React.CSSProperties,
    empty: { background: '#F5F0E8', border: '1px solid #C9BFB0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' as const, color: '#9E887A' },
    card: { background: '#F5F0E8', border: '1px solid #C9BFB0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s, box-shadow 0.15s' } as React.CSSProperties,
    vendorName: { fontWeight: 600, color: '#2C1810', fontSize: '0.9375rem' },
    invoiceDesc: { fontSize: '0.8125rem', color: '#9E887A', marginTop: '0.25rem' },
    invoiceDate: { fontSize: '0.8125rem', color: '#B0A396', marginTop: '0.125rem' },
    amount: { fontWeight: 700, fontSize: '1.0625rem', color: '#2C1810', textAlign: 'right' as const },
    chevron: { color: '#C9BFB0', fontSize: '0.875rem', marginLeft: '0.75rem' },
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(44,24,16,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem', backdropFilter: 'blur(4px)' },
    modal: { background: '#F5F0E8', border: '1px solid #C9BFB0', borderRadius: '20px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 20px 60px rgba(44,24,16,0.18)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.5rem', borderBottom: '1px solid #C9BFB0' },
    modalClose: { background: 'none', border: 'none', color: '#9E887A', fontSize: '1.5rem', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', lineHeight: 1 } as React.CSSProperties,
    modalBody: { padding: '1.5rem' },
    statusPill: (status: string) => ({
      padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600,
      background: status === 'paid' ? 'rgba(45,106,79,0.12)' : status === 'ignored' ? 'rgba(122,98,85,0.12)' : 'rgba(181,69,27,0.12)',
      color: status === 'paid' ? '#2D6A4F' : status === 'ignored' ? '#7A6255' : '#B5451B',
    }) as React.CSSProperties,
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' },
    fieldLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#9E887A', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '0.25rem' },
    fieldValue: { fontSize: '0.875rem', color: '#2C1810', wordBreak: 'break-all' as const },
    divider: { borderColor: '#C9BFB0', margin: '1.25rem 0' },
    actionBtn: (bg: string, color: string, border?: string) => ({
      width: '100%', padding: '0.8125rem', background: bg, border: border || 'none', borderRadius: '10px', color, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.625rem',
    }) as React.CSSProperties,
    spinner: (color: string) => ({ display: 'inline-block', width: '15px', height: '15px', border: `2px solid transparent`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }) as React.CSSProperties,
  };

  if (loading) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={S.spinner('#6366f1')} />
          <p style={{ marginTop: '1rem', color: '#475569', fontSize: '0.875rem' }}>Učitavanje...</p>
        </div>
      </div>
    );
  }

  const statusLabel = (status: Invoice['status']) => {
    if (status === 'paid') return 'Plaćeno';
    if (status === 'ignored') return 'Ignorirano';
    return 'Neplaćeno';
  };

  const tabInvoices = [...invoices]
    .filter((i) => activeTab !== 'vendors' && i.status === activeTab)
    .sort((a, b) => {
      const da = a.paymentDeadline ? new Date(a.paymentDeadline).getTime() : Infinity;
      const db = b.paymentDeadline ? new Date(b.paymentDeadline).getTime() : Infinity;
      return da - db;
    });

  const unpaidCount = invoices.filter((i) => i.status === 'unpaid').length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const ignoredCount = invoices.filter((i) => i.status === 'ignored').length;
  const blockedCount = blockedVendors.length;
  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.amount, 0);

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .inv-card:hover { border-color: #8B1A1A !important; box-shadow: 0 4px 16px rgba(139,26,26,0.10); }`}</style>

      {/* Navbar */}
      <nav style={S.nav}>
        <div style={S.brand}>
          <button onClick={() => router.push('/dashboard')} style={S.btnBack}>‹ Natrag</button>
          <div style={{ ...S.brandIcon, marginLeft: '0.5rem' }}>📄</div>
          <span style={S.brandText}>Moji računi</span>
        </div>
        <div style={S.navActions}>
          {gmailChecking ? (
            <span style={S.spinner('#818cf8')} />
          ) : !gmailConnected ? (
            <button onClick={connectGmail} style={S.btnConnect}>⚡ Poveži Gmail</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysBack(d)}
                  disabled={fetching}
                  style={{
                    padding: '0.35rem 0.625rem',
                    background: daysBack === d ? 'rgba(139,26,26,0.15)' : 'transparent',
                    border: `1px solid ${daysBack === d ? '#8B1A1A' : '#C9BFB0'}`,
                    borderRadius: '6px',
                    color: daysBack === d ? '#8B1A1A' : '#7A6255',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {d === 7 ? '1 tjedan' : d === 14 ? '2 tjedna' : '1 mj.'}
                </button>
              ))}
              <button onClick={fetchFromGmail} disabled={fetching} style={{ ...S.btnGmail, opacity: fetching ? 0.6 : 1 }}>
                {fetching && <span style={S.spinner('#fff')} />}
                {fetching ? 'Dohvaćanje...' : '↓ Dohvati'}
              </button>
            </div>
          )}
          <button onClick={handleLogout} style={S.btnLogout}>Odjava</button>
        </div>
      </nav>

      <div style={S.main}>
        {/* Summary strip */}
        {unpaidCount > 0 && (
          <div style={{ background: 'rgba(181,69,27,0.07)', border: '1px solid rgba(181,69,27,0.2)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#B5451B', fontWeight: 600, fontSize: '0.9375rem' }}>
              {unpaidCount} neplaćen{unpaidCount === 1 ? '' : 'ih'} račun{unpaidCount === 1 ? '' : 'a'}
            </span>
            <span style={{ color: '#8B1A1A', fontWeight: 800, fontSize: '1.125rem' }}>
              {totalUnpaid.toFixed(2)} EUR
            </span>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div style={S.alertError}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#8B1A1A', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: 0, marginLeft: '0.75rem' }}>×</button>
          </div>
        )}
        {fetching && (
          <div style={S.alertInfo}>
            <span style={S.spinner('#7A6255')} />
            Dohvaćanje e-mailova iz Gmaila... Ovo može potrajati nekoliko sekundi.
          </div>
        )}
        {fetchResult && !fetching && (
          <div style={S.alertSuccess}>
            {fetchResult.fetchedCount > 0 ? (
              <>Pronađeno <strong>{fetchResult.fetchedCount} novih računa</strong> od {fetchResult.totalScanned} pregledanih e-mailova (zadnjih {fetchResult.daysBack} dana).</>
            ) : (
              <>Pregledano {fetchResult.totalScanned} e-mailova (zadnjih {fetchResult.daysBack} dana). Nema novih računa.</>
            )}
            {fetchResult.skippedCached > 0 && <> ({fetchResult.skippedCached} već obrađeno)</>}
          </div>
        )}

        {/* Tabs */}
        <div style={S.tabs}>
          <button onClick={() => setActiveTab('unpaid')} style={S.tab(activeTab === 'unpaid', '#B5451B')}>
            Neplaćeni {unpaidCount > 0 && <span style={S.badge('#B5451B')}>{unpaidCount}</span>}
          </button>
          <button onClick={() => setActiveTab('paid')} style={S.tab(activeTab === 'paid', '#2D6A4F')}>
            Plaćeni {paidCount > 0 && <span style={S.badge('#2D6A4F')}>{paidCount}</span>}
          </button>
          <button onClick={() => setActiveTab('ignored')} style={S.tab(activeTab === 'ignored', '#7A6255')}>
            Ignorirani {ignoredCount > 0 && <span style={S.badge('#7A6255')}>{ignoredCount}</span>}
          </button>
          <button onClick={() => setActiveTab('vendors')} style={S.tab(activeTab === 'vendors', '#8B1A1A')}>
            Blokirani dobavljači {blockedCount > 0 && <span style={S.badge('#8B1A1A')}>{blockedCount}</span>}
          </button>
        </div>

        {/* Vendors blocklist tab */}
        {activeTab === 'vendors' ? (
          blockedVendors.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚫</div>
              <p style={{ margin: 0, fontWeight: 500 }}>Nema blokiranih dobavljača</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#9E887A' }}>Otvorite račun i kliknite "Blokiraj dobavljača"</p>
            </div>
          ) : (
            blockedVendors.map((vendor) => (
              <div key={vendor} style={{ ...S.card, cursor: 'default' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.vendorName}>{vendor}</div>
                  <div style={S.invoiceDesc}>Svi računi se automatski ignoriraju</div>
                </div>
                <button
                  onClick={() => unblockVendor(vendor)}
                  disabled={unblockingVendor === vendor}
                  style={{ padding: '0.4rem 0.875rem', background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.25)', borderRadius: '8px', color: '#2D6A4F', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                >
                  {unblockingVendor === vendor ? <span style={S.spinner('#2D6A4F')} /> : 'Odblokiraj'}
                </button>
              </div>
            ))
          )
        ) : (
          /* Invoice list */
          tabInvoices.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <p style={{ margin: 0, fontWeight: 500 }}>Nema pronađenih računa</p>
              {activeTab === 'unpaid' && <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#9E887A' }}>Kliknite "Dohvati iz Gmaila" za početak</p>}
            </div>
          ) : (
            tabInvoices.map((invoice) => (
              <div key={invoice._id} className="inv-card" style={S.card} onClick={() => openInvoice(invoice)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.vendorName}>{invoice.vendor}</div>
                  <div style={S.invoiceDesc}>{invoice.description || invoice.invoiceNumber}</div>
                  {invoice.paymentDeadline && (
                    <div style={S.invoiceDate}>Rok: {formatDate(invoice.paymentDeadline)}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <span style={S.amount}>{formatAmount(invoice.amount, invoice.currency)}</span>
                  <span style={S.chevron}>›</span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Modal */}
      {selectedInvoice && (
        <div style={S.overlay} onClick={closeModal}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#2C1810' }}>{selectedInvoice.vendor}</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#9E887A' }}>{selectedInvoice.description || selectedInvoice.invoiceNumber}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!editing && (
                  <button
                    onClick={() => startEditing(selectedInvoice)}
                    style={{ padding: '0.5rem 1rem', background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '8px', color: '#8B1A1A', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Uredi
                  </button>
                )}
                <button onClick={closeModal} style={S.modalClose}>×</button>
              </div>
            </div>

            <div style={S.modalBody}>
              {/* Amount + status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                {editing ? (
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={editForm.vendor || ''}
                      onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                      placeholder="Dobavljač"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #C9BFB0', borderRadius: '8px', fontSize: '1rem', marginBottom: '0.75rem' }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.amount || ''}
                      onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                      placeholder="Iznos"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #C9BFB0', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#2C1810' }}>{formatAmount(selectedInvoice.amount, selectedInvoice.currency)}</span>
                    <span style={S.statusPill(selectedInvoice.status)}>{statusLabel(selectedInvoice.status)}</span>
                  </>
                )}
              </div>

              {/* Fields grid */}
              {editing ? (
                <div style={{ ...S.grid, marginBottom: '1.5rem' }}>
                  <div>
                    <div style={S.fieldLabel}>Broj računa</div>
                    <input
                      type="text"
                      value={editForm.invoiceNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                      placeholder="Broj računa"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #C9BFB0', borderRadius: '6px', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <div style={S.fieldLabel}>IBAN</div>
                    <input
                      type="text"
                      value={editForm.iban || ''}
                      onChange={(e) => setEditForm({ ...editForm, iban: e.target.value })}
                      placeholder="IBAN"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #C9BFB0', borderRadius: '6px', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <div style={S.fieldLabel}>Model</div>
                    <input
                      type="text"
                      value={editForm.paymentModel || ''}
                      onChange={(e) => setEditForm({ ...editForm, paymentModel: e.target.value })}
                      placeholder="HR01"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #C9BFB0', borderRadius: '6px', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <div style={S.fieldLabel}>Poziv na broj</div>
                    <input
                      type="text"
                      value={editForm.referenceNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, referenceNumber: e.target.value })}
                      placeholder="Poziv na broj"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #C9BFB0', borderRadius: '6px', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <div style={S.fieldLabel}>Rok plaćanja</div>
                    <input
                      type="date"
                      value={editForm.paymentDeadline ? editForm.paymentDeadline.split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, paymentDeadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #C9BFB0', borderRadius: '6px', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={S.fieldLabel}>Opis</div>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Opis"
                      rows={2}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #C9BFB0', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={S.grid}>
                  {[
                    ['Broj računa', selectedInvoice.invoiceNumber],
                    ['IBAN', selectedInvoice.iban || '-'],
                    ['Model', selectedInvoice.paymentModel || '-'],
                    ['Poziv na broj', selectedInvoice.referenceNumber || '-'],
                    ['Rok plaćanja', formatDate(selectedInvoice.paymentDeadline)],
                    ['Datum maila', formatDate(selectedInvoice.emailDate)],
                    ['Opis', selectedInvoice.description || '-'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={S.fieldLabel}>{label}</div>
                      <div style={S.fieldValue}>{value}</div>
                    </div>
                  ))}
                  {selectedInvoice.emailLink && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={S.fieldLabel}>Email</div>
                      <a href={selectedInvoice.emailLink} target="_blank" rel="noopener noreferrer" style={{ color: '#8B1A1A', fontSize: '0.875rem', textDecoration: 'none' }}>
                        Otvori u Gmailu ↗
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Edit mode actions */}
              {editing && (
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <button
                    onClick={saveEdit}
                    disabled={editing && !selectedInvoice}
                    style={{ flex: 1, padding: '0.75rem', background: '#2D6A4F', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Spremi promjene
                  </button>
                  <button
                    onClick={cancelEditing}
                    style={{ padding: '0.75rem 1.5rem', background: 'rgba(122,98,85,0.08)', border: '1px solid rgba(122,98,85,0.2)', borderRadius: '8px', color: '#7A6255', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Odustani
                  </button>
                </div>
              )}

              <hr style={S.divider} />

              {/* Barcode */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ ...S.fieldLabel, marginBottom: '0.75rem' }}>Skenirajte za plaćanje</div>
                <PaymentBarcode
                  invoice={{
                    amount: selectedInvoice.amount,
                    currency: selectedInvoice.currency,
                    vendor: selectedInvoice.vendor,
                    iban: selectedInvoice.iban,
                    referenceNumber: selectedInvoice.referenceNumber,
                    description: selectedInvoice.description,
                  }}
                />
              </div>

              <hr style={S.divider} />

              {/* Actions */}
              {selectedInvoice.status === 'paid' && (
                <button onClick={() => unmarkPaid(selectedInvoice)} disabled={unmarking} style={S.actionBtn('rgba(181,69,27,0.08)', '#B5451B', '1px solid rgba(181,69,27,0.2)')}>
                  {unmarking && <span style={S.spinner('#B5451B')} />}
                  {unmarking ? 'Poništavanje...' : 'Poništi plaćanje'}
                </button>
              )}
              {selectedInvoice.status === 'ignored' && (
                <button onClick={() => unignoreBill(selectedInvoice)} disabled={unignoringBill} style={S.actionBtn('rgba(139,26,26,0.08)', '#8B1A1A', '1px solid rgba(139,26,26,0.2)')}>
                  {unignoringBill && <span style={S.spinner('#8B1A1A')} />}
                  {unignoringBill ? 'Vraćanje...' : 'Vrati u neplaćene'}
                </button>
              )}
              <button
                onClick={() => payBill(selectedInvoice)}
                disabled={paying || selectedInvoice.status === 'paid' || selectedInvoice.status === 'ignored'}
                style={{ ...S.actionBtn('#2D6A4F', '#F5F0E8'), opacity: (paying || selectedInvoice.status !== 'unpaid') ? 0.5 : 1 }}
              >
                {paying && <span style={S.spinner('#fff')} />}
                {selectedInvoice.status === 'paid' ? '✓ Već plaćeno' : paying ? 'Označavanje...' : '✓ Označi kao plaćeno'}
              </button>
              <button
                onClick={() => ignoreBill(selectedInvoice)}
                disabled={ignoringBill || selectedInvoice.status !== 'unpaid'}
                style={{ ...S.actionBtn('rgba(122,98,85,0.08)', '#7A6255', '1px solid rgba(122,98,85,0.2)'), opacity: (ignoringBill || selectedInvoice.status !== 'unpaid') ? 0.5 : 1 }}
              >
                {ignoringBill ? 'Ignoriranje...' : 'Ignoriraj ovaj račun'}
              </button>
              <button
                onClick={() => blockVendor(selectedInvoice)}
                disabled={blockingVendor || blockedVendors.includes(selectedInvoice.vendor)}
                style={{ ...S.actionBtn('rgba(139,26,26,0.06)', '#8B1A1A', '1px solid rgba(139,26,26,0.15)'), opacity: (blockingVendor || blockedVendors.includes(selectedInvoice.vendor)) ? 0.5 : 1, fontSize: '0.875rem' }}
              >
                {blockingVendor ? 'Blokiranje...' : blockedVendors.includes(selectedInvoice.vendor) ? `✓ "${selectedInvoice.vendor}" je blokiran` : `🚫 Blokiraj dobavljača "${selectedInvoice.vendor}"`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
