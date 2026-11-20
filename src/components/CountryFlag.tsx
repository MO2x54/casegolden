import React from 'react';
import { CountryCode } from '../types/game';

interface CountryFlagProps {
  code: CountryCode;
  className?: string;
}

/**
 * Crisp inline SVG vector flags for all Arab countries on the Classic Egyptian Bank El-Hazz board.
 */
export const CountryFlag: React.FC<CountryFlagProps> = ({ code, className = 'w-6 h-4' }) => {
  const wrap = (children: React.ReactNode) => (
    <svg
      viewBox="0 0 36 24"
      className={`rounded-[2px] shadow-xs ring-1 ring-white/20 shrink-0 ${className}`}
      aria-label={code}
    >
      {children}
    </svg>
  );

  switch (code) {
    case 'EG': // Egypt
      return wrap(
        <>
          <rect width="36" height="8" y="0" fill="#CE1126" />
          <rect width="36" height="8" y="8" fill="#FFFFFF" />
          <rect width="36" height="8" y="16" fill="#111827" />
          <path d="M18 9.2 L19.8 11.4 L19 14.4 L18 13.7 L17 14.4 L16.2 11.4 Z" fill="#C09300" />
        </>
      );
    case 'SY': // Syria
      return wrap(
        <>
          <rect width="36" height="8" y="0" fill="#CE1126" />
          <rect width="36" height="8" y="8" fill="#FFFFFF" />
          <rect width="36" height="8" y="16" fill="#111827" />
          <circle cx="13" cy="12" r="1.7" fill="#007A3D" />
          <circle cx="23" cy="12" r="1.7" fill="#007A3D" />
        </>
      );
    case 'PS': // Palestine
      return wrap(
        <>
          <rect width="36" height="8" y="0" fill="#111827" />
          <rect width="36" height="8" y="8" fill="#FFFFFF" />
          <rect width="36" height="8" y="16" fill="#007A3D" />
          <polygon points="0,0 14,12 0,24" fill="#CE1126" />
        </>
      );
    case 'JO': // Jordan
      return wrap(
        <>
          <rect width="36" height="8" y="0" fill="#111827" />
          <rect width="36" height="8" y="8" fill="#FFFFFF" />
          <rect width="36" height="8" y="16" fill="#007A3D" />
          <polygon points="0,0 15,12 0,24" fill="#CE1126" />
          <circle cx="5.2" cy="12" r="1.6" fill="#FFFFFF" />
        </>
      );
    case 'LB': // Lebanon
      return wrap(
        <>
          <rect width="36" height="6" y="0" fill="#ED1C24" />
          <rect width="36" height="12" y="6" fill="#FFFFFF" />
          <rect width="36" height="6" y="18" fill="#ED1C24" />
          <polygon points="18,7 13,15.5 23,15.5" fill="#00A651" />
          <rect x="17.2" y="15.5" width="1.6" height="2" fill="#00A651" />
        </>
      );
    case 'IQ': // Iraq
      return wrap(
        <>
          <rect width="36" height="8" y="0" fill="#CE1126" />
          <rect width="36" height="8" y="8" fill="#FFFFFF" />
          <rect width="36" height="8" y="16" fill="#111827" />
          <rect x="11" y="10.8" width="14" height="2.4" rx="1" fill="#007A3D" />
        </>
      );
    case 'YE': // Yemen
      return wrap(
        <>
          <rect width="36" height="8" y="0" fill="#CE1126" />
          <rect width="36" height="8" y="8" fill="#FFFFFF" />
          <rect width="36" height="8" y="16" fill="#111827" />
        </>
      );
    case 'SD': // Sudan
      return wrap(
        <>
          <rect width="36" height="8" y="0" fill="#D21034" />
          <rect width="36" height="8" y="8" fill="#FFFFFF" />
          <rect width="36" height="8" y="16" fill="#111827" />
          <polygon points="0,0 14,12 0,24" fill="#007229" />
        </>
      );
    case 'LY': // Libya
      return wrap(
        <>
          <rect width="36" height="6" y="0" fill="#E70013" />
          <rect width="36" height="12" y="6" fill="#111827" />
          <rect width="36" height="6" y="18" fill="#239E46" />
          <circle cx="17.5" cy="12" r="3.4" fill="#FFFFFF" />
          <circle cx="18.7" cy="12" r="2.7" fill="#111827" />
          <circle cx="21" cy="12" r="1.1" fill="#FFFFFF" />
        </>
      );
    case 'TN': // Tunisia
      return wrap(
        <>
          <rect width="36" height="24" fill="#E70013" />
          <circle cx="18" cy="12" r="6" fill="#FFFFFF" />
          <circle cx="18.8" cy="12" r="4" fill="#E70013" />
          <circle cx="20.2" cy="12" r="3.2" fill="#FFFFFF" />
          <circle cx="20.2" cy="12" r="1.3" fill="#E70013" />
        </>
      );
    case 'DZ': // Algeria
      return wrap(
        <>
          <rect width="18" height="24" x="0" fill="#006633" />
          <rect width="18" height="24" x="18" fill="#FFFFFF" />
          <circle cx="18" cy="12" r="5" fill="#D21034" />
          <circle cx="19.6" cy="12" r="3.8" fill="#FFFFFF" />
          <circle cx="20.5" cy="12" r="1.3" fill="#D21034" />
        </>
      );
    case 'MA': // Morocco
      return wrap(
        <>
          <rect width="36" height="24" fill="#C1272D" />
          <polygon
            points="18,6.5 19.6,11.2 24.5,11.2 20.5,14 22,18.7 18,15.8 14,18.7 15.5,14 11.5,11.2 16.4,11.2"
            fill="none"
            stroke="#006233"
            strokeWidth="1.5"
          />
        </>
      );
    case 'BH': // Bahrain
      return wrap(
        <>
          <rect width="36" height="24" fill="#CE1126" />
          <polygon points="0,0 10,0 14,2.4 10,4.8 14,7.2 10,9.6 14,12 10,14.4 14,16.8 10,19.2 14,21.6 10,24 0,24" fill="#FFFFFF" />
        </>
      );
    case 'QA': // Qatar
      return wrap(
        <>
          <rect width="36" height="24" fill="#8D1B3D" />
          <polygon points="0,0 10,0 14,2 10,4 14,6 10,8 14,10 10,12 14,14 10,16 14,18 10,20 14,22 10,24 0,24" fill="#FFFFFF" />
        </>
      );
    case 'SA': // Saudi Arabia
      return wrap(
        <>
          <rect width="36" height="24" fill="#006C35" />
          <rect x="8" y="8" width="20" height="3.2" rx="1.2" fill="#FFFFFF" />
          <rect x="10" y="14.5" width="16" height="1.8" rx="0.9" fill="#FFFFFF" />
        </>
      );
    case 'KW': // Kuwait
      return wrap(
        <>
          <rect width="36" height="8" y="0" fill="#007A3D" />
          <rect width="36" height="8" y="8" fill="#FFFFFF" />
          <rect width="36" height="8" y="16" fill="#CE1126" />
          <polygon points="0,0 10,7 10,17 0,24" fill="#111827" />
        </>
      );
  }
};
