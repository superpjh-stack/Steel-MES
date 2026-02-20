'use client';

import { useEffect, useRef } from 'react';

export interface SopStep {
  seq:          number;
  title:        string;
  description:  string;
  imageUrl?:    string;
  warningLevel?: 'info' | 'caution' | 'danger';
}

interface Props {
  sopCode:  string;
  sopTitle: string;
  steps:    SopStep[];
  onClose?: () => void;
}

const WARNING_STYLE = {
  info:    { bg: 'bg-blue-900/50 border-blue-500',    icon: 'ℹ', text: 'text-blue-200' },
  caution: { bg: 'bg-yellow-900/50 border-yellow-500', icon: '⚠', text: 'text-yellow-200' },
  danger:  { bg: 'bg-red-900/50 border-red-600',      icon: '✕', text: 'text-red-200' },
};

export default function SopViewer({ sopCode, sopTitle, steps, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key + focus trap
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${sopTitle} 작업표준서`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div>
            <p className="text-xs text-gray-400 font-mono">{sopCode}</p>
            <h2 className="text-white font-bold text-lg">{sopTitle}</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="SOP 뷰어 닫기"
              className="text-gray-400 hover:text-white text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-700"
            >
              ×
            </button>
          )}
        </div>

        {/* Steps */}
        <ol className="overflow-y-auto space-y-4 p-5 flex-1">
          {steps.map((step) => {
            const warn = step.warningLevel ? WARNING_STYLE[step.warningLevel] : null;
            return (
              <li key={step.seq} className="flex gap-4 min-h-[60px]">
                {/* Step badge */}
                <span className="bg-blue-600 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {step.seq}
                </span>

                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">{step.title}</p>
                  <p className="text-sm text-gray-300">{step.description}</p>

                  {step.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={step.imageUrl}
                      alt={`${step.title} 참고 이미지`}
                      className="rounded-lg object-contain max-h-40 w-auto border border-gray-600"
                    />
                  )}

                  {warn && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg border ${warn.bg}`}>
                      <span className={`text-lg shrink-0 ${warn.text}`}>{warn.icon}</span>
                      <p className={`text-xs ${warn.text}`}>
                        {step.warningLevel === 'danger' ? '안전 주의 사항' :
                         step.warningLevel === 'caution' ? '주의' : '참고'}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
          {steps.length === 0 && (
            <li className="text-gray-400 text-sm text-center py-8">작업표준서가 없습니다.</li>
          )}
        </ol>
      </div>
    </div>
  );
}
