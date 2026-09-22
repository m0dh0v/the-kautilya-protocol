import React, { useState } from "react";

/**
 * Netra 404 Logo
 * Matches the uploaded netra-404.jpeg:
 * Left: Radiating sunburst arc with dot rays, Lord Shiva's Trishula with Damru,
 * crescent moon, and the third eye (Netra) with teardrop.
 * Right: Bold uppercase "NETRA 404"
 */
export const NetraLogo: React.FC<{
  className?: string;
  showText?: boolean;
  iconClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
}> = ({
  className = "h-11",
  showText = true,
  iconClassName = "text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]",
  textClassName = "text-white",
  subtitleClassName = "text-cyan-400/80",
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Intricate Netra Icon from netra-404.jpeg */}
      <svg
        viewBox="0 0 140 120"
        className={`h-full w-auto shrink-0 ${iconClassName}`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Outer Radiance Arc (dotted / rayed halo) */}
        <path d="M 16 78 A 54 54 0 0 1 124 78" strokeWidth="2.2" />
        <path d="M 22 78 A 48 48 0 0 1 118 78" strokeWidth="1" strokeDasharray="2 2" />

        {/* 11 Radiating Sunburst Antenna Rays with Circles at the tips */}
        {/* Ray 1 (far left) */}
        <line x1="20" y1="74" x2="8" y2="72" strokeWidth="1.8" />
        <circle cx="7" cy="72" r="2" fill="currentColor" />

        {/* Ray 2 */}
        <line x1="24" y1="60" x2="13" y2="54" strokeWidth="1.8" />
        <circle cx="12" cy="53" r="2" fill="currentColor" />

        {/* Ray 3 */}
        <line x1="31" y1="46" x2="22" y2="38" strokeWidth="1.8" />
        <circle cx="21" cy="37" r="2" fill="currentColor" />

        {/* Ray 4 */}
        <line x1="42" y1="34" x2="35" y2="24" strokeWidth="1.8" />
        <circle cx="34" cy="23" r="2" fill="currentColor" />

        {/* Ray 5 */}
        <line x1="55" y1="26" x2="50" y2="15" strokeWidth="1.8" />
        <circle cx="49" cy="14" r="2" fill="currentColor" />

        {/* Ray 6 (center top - tallest) */}
        <line x1="70" y1="24" x2="70" y2="10" strokeWidth="2" />
        <circle cx="70" cy="9" r="2.2" fill="currentColor" />

        {/* Ray 7 */}
        <line x1="85" y1="26" x2="90" y2="15" strokeWidth="1.8" />
        <circle cx="91" cy="14" r="2" fill="currentColor" />

        {/* Ray 8 */}
        <line x1="98" y1="34" x2="105" y2="24" strokeWidth="1.8" />
        <circle cx="106" cy="23" r="2" fill="currentColor" />

        {/* Ray 9 */}
        <line x1="109" y1="46" x2="118" y2="38" strokeWidth="1.8" />
        <circle cx="119" cy="37" r="2" fill="currentColor" />

        {/* Ray 10 */}
        <line x1="116" y1="60" x2="127" y2="54" strokeWidth="1.8" />
        <circle cx="128" cy="53" r="2" fill="currentColor" />

        {/* Ray 11 (far right) */}
        <line x1="120" y1="74" x2="132" y2="72" strokeWidth="1.8" />
        <circle cx="133" cy="72" r="2" fill="currentColor" />

        {/* Left Crescent Moon */}
        <path
          d="M 45 42 C 43 47 45 53 49 56 C 44 55 40 50 41 45 C 41 43 43 41 45 42 Z"
          fill="currentColor"
          strokeWidth="0.5"
        />

        {/* Lord Shiva Trishula (Trident) at top center */}
        {/* Central vertical blade */}
        <path d="M 70 20 L 70 42" strokeWidth="2.2" />
        <path d="M 68 20 L 70 14 L 72 20 Z" fill="currentColor" />
        {/* Left outer prong */}
        <path d="M 64 34 C 61 30 61 24 64 20" strokeWidth="2" />
        <path d="M 63 20 L 64 16 L 66 20 Z" fill="currentColor" />
        {/* Right outer prong */}
        <path d="M 76 34 C 79 30 79 24 76 20" strokeWidth="2" />
        <path d="M 74 20 L 76 16 L 77 20 Z" fill="currentColor" />
        {/* Base bracket of trident */}
        <path d="M 62 34 C 65 37 75 37 78 34" strokeWidth="2" />

        {/* Damru (hourglass drum) on central staff */}
        <path
          d="M 64 39 L 76 39 L 66 48 L 74 48 L 64 39 Z"
          fill="none"
          strokeWidth="1.8"
        />
        <line x1="63" y1="48" x2="77" y2="48" strokeWidth="2" />

        {/* The Eye (Netra) below the trident */}
        {/* Outer Eye Contour */}
        <path
          d="M 52 75 C 60 55 80 55 88 75 C 80 95 60 95 52 75 Z"
          strokeWidth="2.4"
        />
        {/* Upper eyelid crease */}
        <path d="M 50 71 C 60 51 80 51 90 71" strokeWidth="1.6" />

        {/* Concentric Iris rings and Central Pupil */}
        <circle cx="70" cy="75" r="10" strokeWidth="1.8" />
        <circle cx="70" cy="75" r="6.5" strokeWidth="1.8" />
        <circle cx="70" cy="75" r="3.2" fill="currentColor" />

        {/* Lower tear drop extending downward */}
        <path
          d="M 70 98 C 68 103 68 107 70 109 C 72 107 72 103 70 98 Z"
          fill="currentColor"
          strokeWidth="1"
        />
        <line x1="70" y1="95" x2="70" y2="98" strokeWidth="1.8" />
      </svg>

      {/* Bold, wide, professional typography: NETRA 404 */}
      {showText && (
        <div className="flex flex-col">
          <span className={`whitespace-nowrap text-lg sm:text-2xl md:text-lg font-black tracking-[0.1em] leading-none uppercase font-sans ${textClassName}`}>
            NETRA 404
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Rashtriya Raksha University (RRU) Shield Crest
 * Matches the uploaded rru-logo.png:
 * - Shield with blue and gold border
 * - Top header: "RASHTRIYA RAKSHA UNIVERSITY" and Hindi "राष्ट्रीय रक्षा विश्वविद्यालय"
 * - 4 Quadrants:
 *   1. Key with cyber nodes
 *   2. Flaming torch
 *   3. Hexagonal cyber chip
 *   4. Open book
 * - Flanked by olive laurel wreaths
 * - Bottom ribbon: "National Security is Supreme" / "राष्ट्रीय सुरक्षा सर्वोपरि"
 */
export const RruShieldLogo: React.FC<{ className?: string }> = ({
  className = "h-14 w-auto",
}) => {
  const [imageError, setImageError] = useState(false);

  if (!imageError) {
    return (
      <img
        src="/rru-logo.png"
        alt="Rashtriya Raksha University"
        onError={() => setImageError(true)}
        className={`object-contain select-none shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
        title="Rashtriya Raksha University (An Institution of National Importance, Ministry of Home Affairs)"
      />
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
      title="Rashtriya Raksha University (National Security University, MHA)"
    >
      <svg
        viewBox="0 0 160 170"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Laurel Wreath (Olive Green Leaves) */}
        <g stroke="#3B6B38" strokeWidth="1.6" fill="#4B7E48" opacity="0.95">
          {/* Left Laurel Leaves */}
          <path d="M 42 120 C 26 100 24 65 42 42" fill="none" strokeWidth="2.5" />
          <path d="M 38 108 C 28 104 25 96 32 90 C 37 96 39 104 38 108 Z" />
          <path d="M 32 92 C 22 87 20 78 28 73 C 33 79 34 88 32 92 Z" />
          <path d="M 28 75 C 19 69 19 59 27 55 C 31 62 31 71 28 75 Z" />
          <path d="M 30 58 C 22 51 25 42 33 40 C 36 47 34 54 30 58 Z" />
          <path d="M 36 44 C 31 36 38 29 46 30 C 46 37 42 42 36 44 Z" />

          {/* Right Laurel Leaves */}
          <path d="M 118 120 C 134 100 136 65 118 42" fill="none" strokeWidth="2.5" />
          <path d="M 122 108 C 132 104 135 96 128 90 C 123 96 121 104 122 108 Z" />
          <path d="M 128 92 C 138 87 140 78 132 73 C 127 79 126 88 128 92 Z" />
          <path d="M 132 75 C 141 69 141 59 133 55 C 129 62 129 71 132 75 Z" />
          <path d="M 130 58 C 138 51 135 42 127 40 C 124 47 126 54 130 58 Z" />
          <path d="M 124 44 C 129 36 122 29 114 30 C 114 37 118 42 124 44 Z" />
        </g>

        {/* Top Arc Cream Background for English & Hindi University Names */}
        <path
          d="M 28 40 C 44 20 116 20 132 40 L 138 116 C 138 128 80 144 80 144 C 80 144 22 128 22 116 Z"
          fill="#FFFFFF"
          stroke="#164E87"
          strokeWidth="3.2"
        />
        <path
          d="M 31 42 C 45 24 115 24 129 42 L 134 114 C 134 125 80 140 80 140 C 80 140 26 125 26 114 Z"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.2"
        />

        {/* English Text in Top Arc: RASHTRIYA RAKSHA UNIVERSITY */}
        <text
          x="80"
          y="31"
          textAnchor="middle"
          fill="#164E87"
          fontSize="7.2"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.4"
        >
          RASHTRIYA RAKSHA UNIVERSITY
        </text>

        {/* Hindi Text: राष्ट्रीय रक्षा विश्वविद्यालय */}
        <text
          x="80"
          y="41"
          textAnchor="middle"
          fill="#164E87"
          fontSize="6.8"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.2"
        >
          राष्ट्रीय रक्षा विश्वविद्यालय
        </text>

        {/* Inner Shield (Divided into 4 Quadrants) */}
        <g id="rru-inner-shield">
          {/* Inner Shield Outline */}
          <path
            id="shield-cutout"
            d="M 52 48 L 108 48 C 108 48 112 85 108 100 C 102 112 80 120 80 120 C 80 120 58 112 52 100 C 48 85 52 48 52 48 Z"
            fill="#FFFFFF"
            stroke="#164E87"
            strokeWidth="2.5"
          />

          {/* Quadrant 1 (Top Left): Blue background */}
          <path
            d="M 52 48 L 80 48 L 80 82 L 50 82 C 49 70 52 48 52 48 Z"
            fill="#104C88"
          />
          {/* Top Left Symbol: White Key with Cyber Circuit Nodes */}
          <circle cx="70" cy="62" r="5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
          <circle cx="70" cy="62" r="2.2" fill="#FFFFFF" />
          <line x1="65" y1="62" x2="57" y2="62" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="59" y1="62" x2="59" y2="66" stroke="#FFFFFF" strokeWidth="1.8" />
          <line x1="62" y1="62" x2="62" y2="65" stroke="#FFFFFF" strokeWidth="1.8" />
          <circle cx="70" cy="54" r="1.5" fill="#FFFFFF" />
          <line x1="70" y1="57" x2="70" y2="55.5" stroke="#FFFFFF" strokeWidth="1.2" />

          {/* Quadrant 2 (Top Right): White background */}
          <path
            d="M 80 48 L 108 48 C 108 48 110 65 110 82 L 80 82 Z"
            fill="#FFFFFF"
          />
          {/* Top Right Symbol: Navy Blue Flaming Torch */}
          <path d="M 94 65 L 96 78 L 94 78 L 92 65 Z" fill="#104C88" />
          <path d="M 89 65 L 97 65 L 95 62 L 91 62 Z" fill="#104C88" />
          {/* Flame */}
          <path
            d="M 93 62 C 89 57 91 52 94 49 C 97 53 100 55 96 62 Z"
            fill="#104C88"
          />

          {/* Quadrant 3 (Bottom Left): White background */}
          <path
            d="M 50 82 L 80 82 L 80 120 C 80 120 60 113 52 100 C 49 93 50 82 50 82 Z"
            fill="#FFFFFF"
          />
          {/* Bottom Left Symbol: Blue Hexagonal Cyber Circuit / Chip */}
          <polygon
            points="65,88 73,88 77,95 73,102 65,102 61,95"
            fill="none"
            stroke="#104C88"
            strokeWidth="1.8"
          />
          <polygon
            points="66,90 72,90 75,95 72,100 66,100 63,95"
            fill="#104C88"
            opacity="0.25"
          />
          <circle cx="69" cy="95" r="2.5" fill="#104C88" />

          {/* Quadrant 4 (Bottom Right): Blue background */}
          <path
            d="M 80 82 L 110 82 C 110 82 110 93 108 100 C 100 113 80 120 80 120 Z"
            fill="#104C88"
          />
          {/* Bottom Right Symbol: Open Book in Gold & White */}
          <path
            d="M 86 94 C 91 92 95 93 95 93 C 95 93 99 92 104 94 L 104 104 C 99 102 95 103 95 103 C 95 103 91 102 86 104 Z"
            fill="#E2B755"
            stroke="#FFFFFF"
            strokeWidth="0.8"
          />
          <line x1="95" y1="93" x2="95" y2="103" stroke="#FFFFFF" strokeWidth="1" />

          {/* Center Cross Divider in Gold / Navy */}
          <line x1="80" y1="48" x2="80" y2="120" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="50" y1="82" x2="110" y2="82" stroke="#FFFFFF" strokeWidth="2" />
        </g>

        {/* Bottom Ribbon / Banner (Navy Blue with Folded Ends) */}
        {/* Ribbon Fold Backs */}
        <polygon points="18,142 36,134 36,154 18,162 25,152" fill="#0D3560" />
        <polygon points="142,142 124,134 124,154 142,162 135,152" fill="#0D3560" />

        {/* Main Ribbon Center */}
        <rect
          x="30"
          y="134"
          width="100"
          height="24"
          rx="2"
          fill="#104C88"
          stroke="#FFFFFF"
          strokeWidth="1.2"
        />

        {/* Ribbon Motto: National Security is Supreme / राष्ट्रीय सुरक्षा सर्वोपरि */}
        <text
          x="80"
          y="143"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="6.5"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.3"
        >
          National Security is Supreme
        </text>
        <text
          x="80"
          y="152"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="6.2"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.2"
        >
          राष्ट्रीय सुरक्षा सर्वोपरि
        </text>
      </svg>
    </div>
  );
};

/**
 * School of Information Technology, Artificial Intelligence & Cyber Security (SITAICS)
 * Circular Crest Seal
 * Matches the uploaded sitaics-logo.png:
 * - Circular seal with double border and dots
 * - Arched top text: "SCHOOL OF INFO TECHNOLOGY, ARTIFICIAL INTELLIGENCE & CYBERSECURITY"
 * - Arched bottom text: "RASHTRIYA RAKSHA UNIVERSITY"
 * - Center shield with 4 quadrants:
 *   1. Cyber padlock
 *   2. Magnifying glass over cyber fingerprint
 *   3. AI Brain / microchip
 *   4. Code brackets </> with gear
 * - Laurel wreath beneath shield
 */
export const SitaicsCircularLogo: React.FC<{ className?: string }> = ({
  className = "h-14 w-auto",
}) => {
  const [imageError, setImageError] = useState(false);

  if (!imageError) {
    return (
      <img
        src="/sitaics-logo.png"
        alt="School of Information Technology, Artificial Intelligence and Cyber Security (SITAICS), Rashtriya Raksha University"
        onError={() => setImageError(true)}
        className={`object-contain select-none shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
        title="School of Information Technology, Artificial Intelligence & Cyber Security (SITAICS), Rashtriya Raksha University"
      />
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
      title="School of Info Technology, Artificial Intelligence & Cybersecurity (SITAICS)"
    >
      <svg
        viewBox="0 0 160 160"
        className="h-full w-auto text-slate-900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Rings */}
        <circle cx="80" cy="80" r="76" stroke="#0F172A" strokeWidth="3.2" fill="#FFFFFF" />
        <circle cx="80" cy="80" r="70" stroke="#0F172A" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="80" cy="80" r="54" stroke="#0F172A" strokeWidth="2.2" />

        {/* Text Along Circular Arc (Top): SCHOOL OF INFO TECHNOLOGY, ARTIFICIAL INTELLIGENCE & CYBERSECURITY */}
        <path
          id="sitaics-text-top-arc"
          d="M 19 80 A 61 61 0 1 1 141 80"
          fill="none"
        />
        <text
          fontSize="6"
          fontWeight="800"
          fill="#0F172A"
          letterSpacing="0.28"
          fontFamily="system-ui, sans-serif"
        >
          <textPath href="#sitaics-text-top-arc" startOffset="50%" textAnchor="middle">
            SCHOOL OF INFO TECHNOLOGY, ARTIFICIAL INTELLIGENCE &amp; CYBERSECURITY
          </textPath>
        </text>

        {/* Text Along Circular Arc (Bottom): RASHTRIYA RAKSHA UNIVERSITY */}
        <path
          id="sitaics-text-bottom-arc"
          d="M 141 80 A 61 61 0 0 1 19 80"
          fill="none"
        />
        <text
          fontSize="6.8"
          fontWeight="900"
          fill="#0F172A"
          letterSpacing="0.35"
          fontFamily="system-ui, sans-serif"
        >
          <textPath href="#sitaics-text-bottom-arc" startOffset="50%" textAnchor="middle">
            RASHTRIYA RAKSHA UNIVERSITY
          </textPath>
        </text>

        {/* Separator Bullets */}
        <circle cx="16" cy="80" r="2.5" fill="#0F172A" />
        <circle cx="144" cy="80" r="2.5" fill="#0F172A" />

        {/* Laurel Wreath Beneath Center Shield */}
        <g stroke="#0F172A" strokeWidth="1.4" fill="#0F172A" opacity="0.9">
          {/* Left Laurel */}
          <path d="M 64 114 C 54 110 44 98 46 86" fill="none" strokeWidth="1.8" />
          <path d="M 62 110 C 56 108 52 102 56 98 C 59 102 61 107 62 110 Z" />
          <path d="M 54 102 C 48 99 46 93 50 89 C 53 93 54 98 54 102 Z" />
          <path d="M 48 92 C 43 88 43 81 48 78 C 50 82 50 88 48 92 Z" />

          {/* Right Laurel */}
          <path d="M 96 114 C 106 110 116 98 114 86" fill="none" strokeWidth="1.8" />
          <path d="M 98 110 C 104 108 108 102 104 98 C 101 102 99 107 98 110 Z" />
          <path d="M 106 102 C 112 99 114 93 110 89 C 107 93 106 98 106 102 Z" />
          <path d="M 112 92 C 117 88 117 81 112 78 C 110 82 110 88 112 92 Z" />
        </g>

        {/* Center Shield */}
        <path
          d="M 58 54 L 102 54 C 102 54 106 82 102 96 C 96 106 80 112 80 112 C 80 112 64 106 58 96 C 54 82 58 54 58 54 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2.4"
        />

        {/* Cross Dividers */}
        <line x1="80" y1="54" x2="80" y2="112" stroke="#0F172A" strokeWidth="1.8" />
        <line x1="56" y1="78" x2="104" y2="78" stroke="#0F172A" strokeWidth="1.8" />

        {/* Quadrant 1 (Top Left): Padlock with cyber keyhole */}
        <rect x="65" y="66" width="10" height="8" rx="1.5" fill="#0F172A" />
        <path d="M 67 66 L 67 62 C 67 59 73 59 73 62 L 73 66" stroke="#0F172A" strokeWidth="1.8" fill="none" />
        <circle cx="70" cy="70" r="1" fill="#FFFFFF" />

        {/* Quadrant 2 (Top Right): Magnifying Glass with fingerprint scan */}
        <circle cx="89" cy="65" r="4.5" stroke="#0F172A" strokeWidth="1.8" fill="none" />
        <line x1="92" y1="68.5" x2="96" y2="73" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
        {/* Inner scan wave */}
        <path d="M 87 65 C 88 63 90 63 91 65" stroke="#0F172A" strokeWidth="1" fill="none" />

        {/* Quadrant 3 (Bottom Left): AI Brain / Neural Chip */}
        <rect x="65" y="86" width="9" height="9" rx="1.5" fill="none" stroke="#0F172A" strokeWidth="1.4" />
        <line x1="69.5" y1="84" x2="69.5" y2="86" stroke="#0F172A" strokeWidth="1.2" />
        <line x1="69.5" y1="95" x2="69.5" y2="97" stroke="#0F172A" strokeWidth="1.2" />
        <line x1="63" y1="90.5" x2="65" y2="90.5" stroke="#0F172A" strokeWidth="1.2" />
        <line x1="74" y1="90.5" x2="76" y2="90.5" stroke="#0F172A" strokeWidth="1.2" />
        <circle cx="69.5" cy="90.5" r="2" fill="#0F172A" />

        {/* Quadrant 4 (Bottom Right): Code brackets </> with gear */}
        <text
          x="89"
          y="93"
          textAnchor="middle"
          fill="#0F172A"
          fontSize="7"
          fontWeight="bold"
          fontFamily="monospace"
        >
          &lt;/&gt;
        </text>
        {/* Gear tick marks */}
        <circle cx="89" cy="99" r="1.8" stroke="#0F172A" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
  );
};
