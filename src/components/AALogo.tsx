import React from 'react';

interface AALogoProps {
  className?: string;
  size?: number;
  customUrl?: string;
  useUserPhotoAsLogo?: boolean;
  userPhotoUrl?: string;
}

export const AALogo: React.FC<AALogoProps> = ({
  className = '',
  size = 40,
  customUrl,
  useUserPhotoAsLogo = false,
  userPhotoUrl,
}) => {
  const displayImage = useUserPhotoAsLogo && userPhotoUrl ? userPhotoUrl : customUrl;

  if (displayImage) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border border-[#EBDED5] dark:border-[#3D2E24] shadow-xs ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={displayImage}
          alt="Atelier Logo"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-[#FAF7F2] dark:bg-[#251D17] select-none ${className}`}
      style={{ width: size, height: size }}
      title="Atelier & Alento"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Botanical Wreath */}
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="#E8A5B8"
          strokeWidth="1.2"
          strokeDasharray="2 2"
          opacity="0.6"
        />
        <path
          d="M 50 6 C 74 6, 94 26, 94 50 C 94 74, 74 94, 50 94 C 26 94, 6 74, 6 50 C 6 26, 26 6, 50 6"
          stroke="#E8A5B8"
          strokeWidth="1.6"
          fill="none"
        />
        {/* Delicate floral leaves along wreath */}
        <path d="M 50 4 Q 53 1 50 -1 Q 47 1 50 4" fill="#F2C4CE" />
        <circle cx="50" cy="5" r="1.8" fill="#B88E72" />

        <path d="M 94 50 Q 97 53 99 50 Q 97 47 94 50" fill="#F2C4CE" />
        <circle cx="94" cy="50" r="1.8" fill="#B88E72" />

        <path d="M 50 94 Q 53 97 50 99 Q 47 97 50 94" fill="#F2C4CE" />
        <circle cx="50" cy="95" r="1.8" fill="#B88E72" />

        <path d="M 6 50 Q 3 53 1 50 Q 3 47 6 50" fill="#F2C4CE" />
        <circle cx="6" cy="50" r="1.8" fill="#B88E72" />

        {/* Diagonal accents */}
        <circle cx="81" cy="19" r="2.2" fill="#E8A5B8" />
        <circle cx="19" cy="81" r="2.2" fill="#E8A5B8" />
        <circle cx="81" cy="81" r="2" fill="#F2C4CE" />
        <circle cx="19" cy="19" r="2" fill="#F2C4CE" />

        {/* Small floral buds */}
        <path d="M 78 22 Q 83 25 81 29 Q 77 27 78 22" fill="#E8A5B8" opacity="0.8" />
        <path d="M 22 78 Q 17 75 19 71 Q 23 73 22 78" fill="#E8A5B8" opacity="0.8" />

        {/* Entwined AA Serif Monogram in Center */}
        <text
          x="39"
          y="63"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="36"
          fontWeight="600"
          fontStyle="italic"
          fill="#502916"
          textAnchor="middle"
        >
          A
        </text>
        <text
          x="61"
          y="65"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="34"
          fontWeight="600"
          fontStyle="normal"
          fill="#6B3F2A"
          textAnchor="middle"
        >
          A
        </text>
      </svg>
    </div>
  );
};
