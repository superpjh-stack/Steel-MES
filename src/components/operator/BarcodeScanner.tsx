'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onScan:   (value: string) => void;
  onClose?: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<any>(null);
  const onScanRef  = useRef(onScan);        // keep ref current without restarting scanner
  const divId      = 'barcode-reader';
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  // Sync ref on every render without adding to effect deps
  useEffect(() => { onScanRef.current = onScan; });

  useEffect(() => {
    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode(divId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => { onScanRef.current(decodedText); },
          () => { /* ignore per-frame decode errors */ }
        );
        setLoading(false);
      } catch (e: any) {
        setError(e.message ?? '카메라를 시작할 수 없습니다.');
        setLoading(false);
      }
    }

    startScanner();

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []); // empty: scanner starts once; onScanRef stays current

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <p className="text-white font-semibold">바코드 스캔</p>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="스캐너 닫기"
              className="text-gray-400 hover:text-white text-xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-700"
            >
              ×
            </button>
          )}
        </div>

        <div className="p-4">
          {loading && <p className="text-gray-400 text-sm text-center py-4">카메라 초기화 중...</p>}
          {error   && <p className="text-red-400 text-sm text-center py-4">{error}</p>}
          <div id={divId} className="w-full rounded-lg overflow-hidden" />
          <p className="text-gray-500 text-xs text-center mt-3">바코드 또는 QR코드를 카메라에 비춰주세요</p>
        </div>

        <div className="px-4 pb-4">
          <ManualInput onScan={(v) => onScanRef.current(v)} />
        </div>
      </div>
    </div>
  );
}

function ManualInput({ onScan }: { onScan: (v: string) => void }) {
  const [value, setValue] = useState('');
  const submit = () => { if (value.trim()) { onScan(value.trim()); setValue(''); } };

  return (
    <div className="flex gap-2 mt-2">
      <label htmlFor="manual-barcode" className="sr-only">바코드 직접 입력</label>
      <input
        id="manual-barcode"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500"
        placeholder="직접 입력 후 Enter"
      />
      <button
        onClick={submit}
        aria-label="바코드 확인"
        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm min-w-[44px]"
      >
        확인
      </button>
    </div>
  );
}
