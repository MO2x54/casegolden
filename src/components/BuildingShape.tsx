import React from 'react';

interface BuildingShapeProps {
  level: number; // 1 = جراج (مستطيل), 2 = استراحة (مثلث), 3 = سوق (مربع)
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
}

/**
 * Classic Egyptian Bank El-Hazz geometric building tokens:
 * - Level 1: جراج (مستطيل / كشك)
 * - Level 2: استراحة (مثلث)
 * - Level 3: سوق (مربع)
 */
export const BuildingShape: React.FC<BuildingShapeProps> = ({
  level,
  size = 'sm',
  showLabel = false,
}) => {
  if (level <= 0) return null;

  const dims =
    size === 'xs'
      ? 'w-3 h-2.5'
      : size === 'sm'
      ? 'w-4 h-3.5'
      : 'w-5 h-4';

  const label =
    level === 1 ? 'جراج' : level === 2 ? 'استراحة' : 'سوق';

  return (
    <span
      className="inline-flex items-center gap-1 leading-none"
      title={label}
    >
      {level === 1 && (
        <svg viewBox="0 0 20 12" className={dims} aria-label="جراج">
          <rect
            x="1.5"
            y="2"
            width="17"
            height="8"
            rx="1.5"
            fill="#34D399"
            stroke="#064E3B"
            strokeWidth="1.5"
          />
        </svg>
      )}
      {level === 2 && (
        <svg viewBox="0 0 18 16" className={dims} aria-label="استراحة">
          <polygon
            points="9,1.5 16.5,14.5 1.5,14.5"
            fill="#38BDF8"
            stroke="#0C4A6E"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {level === 3 && (
        <svg viewBox="0 0 16 16" className={dims} aria-label="سوق">
          <rect
            x="2"
            y="2"
            width="12"
            height="12"
            rx="1.5"
            fill="#FACC15"
            stroke="#713F12"
            strokeWidth="1.5"
          />
        </svg>
      )}
      {showLabel && (
        <span className="font-bold text-slate-100">{label}</span>
      )}
    </span>
  );
};
