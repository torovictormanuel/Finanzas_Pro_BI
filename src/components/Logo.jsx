export default function Logo({ size = 36, color = '#6366f1', className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 210"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 60,90 Q 18,78 10,22"/>
        <path d="M 70,85 Q 30,74 22,25"/>
        <line x1="10" y1="22" x2="22" y2="25"/>
        <line x1="60" y1="90" x2="70" y2="85"/>
        <path d="M 140,90 Q 182,78 190,22"/>
        <path d="M 130,85 Q 170,74 178,25"/>
        <line x1="190" y1="22" x2="178" y2="25"/>
        <line x1="140" y1="90" x2="130" y2="85"/>
        <polygon points="100,64 140,90 158,124 142,166 120,186 100,195 80,186 58,166 42,124 60,90"/>
        <line x1="60"  y1="90"  x2="100" y2="64"/>
        <line x1="140" y1="90"  x2="100" y2="64"/>
        <line x1="60"  y1="90"  x2="72"  y2="112"/>
        <line x1="140" y1="90"  x2="128" y2="112"/>
        <line x1="72"  y1="112" x2="128" y2="112"/>
        <polygon points="64,130 82,112 100,130 82,148"/>
        <polygon points="100,130 118,112 136,130 118,148"/>
        <line x1="100" y1="130" x2="100" y2="112"/>
        <line x1="42"  y1="124" x2="64"  y2="130"/>
        <line x1="158" y1="124" x2="136" y2="130"/>
        <line x1="64"  y1="148" x2="74"  y2="160"/>
        <line x1="136" y1="148" x2="126" y2="160"/>
        <polygon points="74,160 126,160 116,180 84,180"/>
        <polygon points="100,162 114,171 100,180 86,171"/>
        <line x1="58"  y1="166" x2="84"  y2="180"/>
        <line x1="142" y1="166" x2="116" y2="180"/>
        <line x1="80"  y1="186" x2="84"  y2="180"/>
        <line x1="120" y1="186" x2="116" y2="180"/>
        <line x1="80"  y1="186" x2="100" y2="194"/>
        <line x1="120" y1="186" x2="100" y2="194"/>
      </g>
    </svg>
  )
}
