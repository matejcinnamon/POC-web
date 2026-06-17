'use client';

import { useEffect, useRef, useState } from 'react';
import bwipjs from 'bwip-js/browser';
import { buildHub3Payload, buildEpcQrPayload, PaymentData } from '../lib/barcodes';

interface Props {
  invoice: PaymentData;
}

type Tab = 'hub3' | 'epc';

export default function PaymentBarcode({ invoice }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<Tab>('hub3');
  const [error, setError] = useState<string | null>(null);

  const canRender = !!invoice.iban && invoice.amount > 0;

  useEffect(() => {
    if (!canvasRef.current || !canRender) return;
    setError(null);
    try {
      // bwip-js accepts many symbology-specific options (columns, eclevel,
      // padding, …) that aren't declared on RenderOptions, so cast to any.
      const opts: any =
        tab === 'hub3'
          ? {
              bcid: 'pdf417',
              text: buildHub3Payload(invoice),
              scale: 2,
              columns: 6,
              padding: 8,
              backgroundcolor: 'FFFFFF',
            }
          : {
              bcid: 'qrcode',
              text: buildEpcQrPayload(invoice),
              scale: 4,
              eclevel: 'M',
              padding: 8,
              backgroundcolor: 'FFFFFF',
            };
      bwipjs.toCanvas(canvasRef.current, opts);
    } catch (e: any) {
      setError(e?.message || 'Greška pri generiranju barkoda');
    }
  }, [tab, invoice, canRender]);

  const downloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.vendor || 'placanje'}-${tab}.png`.replace(/[^a-z0-9.\-]+/gi, '_');
    a.click();
  };

  if (!canRender) {
    return (
      <div className="text-sm text-gray-500 italic">
        Nedovoljno podataka za generiranje barkoda (potrebni IBAN i iznos).
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('hub3')}
          className={`px-3 py-1 text-sm rounded ${
            tab === 'hub3' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          HUB-3 (HR banke)
        </button>
        <button
          onClick={() => setTab('epc')}
          className={`px-3 py-1 text-sm rounded ${
            tab === 'epc' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          EPC QR (SEPA)
        </button>
      </div>
      <canvas ref={canvasRef} className="border border-gray-300 rounded bg-white" />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        onClick={downloadPng}
        className="text-xs text-blue-600 hover:underline"
      >
        Preuzmi kao sliku
      </button>
      <p className="text-xs text-gray-500 text-center max-w-sm">
        Skenirajte ovaj kod u mobilnoj bankarskoj aplikaciji za automatsko popunjavanje uplatnice.
      </p>
    </div>
  );
}
