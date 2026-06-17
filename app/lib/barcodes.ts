// Builds payment-barcode payloads from extracted invoice data.
//
// Supports:
//   - HUB-3 (Croatian national payment slip, rendered as PDF417)
//   - EPC QR (SEPA European Payments Council, rendered as QR code)

export interface PaymentData {
  amount: number;
  currency: string;
  vendor: string;
  iban?: string;
  referenceNumber?: string;
  description?: string;
  purposeCode?: string;
}

export interface PayerInfo {
  name?: string;
  address?: string;
  city?: string;
}

// HUB-3 payload: 14 newline-separated fields, used by every Croatian bank.
// Spec reference: https://www.hub.hr (HUB 3A standard)
export function buildHub3Payload(p: PaymentData, payer: PayerInfo = {}): string {
  const amountCents = Math.round(p.amount * 100).toString().padStart(15, '0');
  const refRaw = (p.referenceNumber || '').replace(/\s/g, '');

  // The Croatian model prefix (HR + 2 digits) may appear at the start of the
  // reference. If present, split it out; otherwise default to HR99 (free-form).
  const modelMatch = refRaw.match(/^(HR\d{2})/i);
  const model = modelMatch ? modelMatch[1].toUpperCase() : 'HR99';
  const reference = modelMatch ? refRaw.slice(modelMatch[1].length) : refRaw;

  const lines = [
    'HRVHUB30',
    (p.currency || 'EUR').toUpperCase(),
    amountCents,
    (payer.name || '').slice(0, 30),
    (payer.address || '').slice(0, 27),
    (payer.city || '').slice(0, 27),
    (p.vendor || '').slice(0, 25),
    '',
    '',
    (p.iban || '').replace(/\s/g, '').toUpperCase(),
    model,
    reference.slice(0, 22),
    (p.purposeCode || 'COST').slice(0, 4).toUpperCase(),
    (p.description || '').slice(0, 35),
  ];
  return lines.join('\n');
}

// EPC QR (SEPA Credit Transfer) — works with most EU banking apps.
// Spec reference: EPC069-12 v2.
// Line 5 is the BIC (optional per spec v2, but some apps may require it).
export function buildEpcQrPayload(p: PaymentData, bic = ''): string {
  const amount = `${(p.currency || 'EUR').toUpperCase()}${p.amount.toFixed(2)}`;
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    bic.slice(0, 11),
    (p.vendor || '').slice(0, 70),
    (p.iban || '').replace(/\s/g, '').toUpperCase(),
    amount,
    '',
    (p.referenceNumber || '').slice(0, 35),
    '',
    (p.description || '').slice(0, 140),
  ].join('\n');
}
