'use client';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  accentColor?: 'green' | 'red';
  steps?: number[];
}

export default function QtyPad({
  label,
  value,
  onChange,
  accentColor = 'green',
  steps = [1, 5, 10, 50, 100],
}: Props) {
  const accent = accentColor === 'green'
    ? { display: 'text-green-400', btn: 'bg-gray-600 hover:bg-gray-500 active:bg-gray-400' }
    : { display: 'text-red-400', btn: 'bg-gray-600 hover:bg-gray-500 active:bg-gray-400' };

  return (
    <div className="bg-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-300 text-sm font-medium">{label}</span>
        <span className={`text-3xl font-bold ${accent.display}`}>
          {value.toLocaleString()} <span className="text-lg">EA</span>
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step) => (
          <button
            key={step}
            onClick={() => onChange(Math.max(0, value + step))}
            className={`${accent.btn} text-white font-bold py-3 rounded-xl transition-colors text-sm`}
          >
            +{step}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="bg-gray-600 hover:bg-gray-500 disabled:opacity-30 text-gray-300 py-2 rounded-lg text-sm transition-colors"
        >
          -1
        </button>
        <button
          onClick={() => onChange(0)}
          className="bg-gray-800 hover:bg-gray-700 text-gray-400 py-2 rounded-lg text-sm transition-colors"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
