'use client';

type Variant = 'info' | 'warning' | 'error' | 'success';

const VARIANT_MAP: Record<Variant, { bg: string; border: string; text: string; icon: string }> = {
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  icon: 'ℹ' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚠' },
  error:   { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',   icon: '✕' },
  success: { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800', icon: '✓' },
};

interface Props {
  variant?: Variant;
  title?: string;
  message: string;
  onClose?: () => void;
}

export default function AlertBanner({ variant = 'info', title, message, onClose }: Props) {
  const s = VARIANT_MAP[variant];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${s.bg} ${s.border} ${s.text}`}>
      <span className="text-base leading-none mt-0.5">{s.icon}</span>
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        <p className={title ? 'opacity-80' : ''}>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-lg leading-none opacity-50 hover:opacity-100">×</button>
      )}
    </div>
  );
}
