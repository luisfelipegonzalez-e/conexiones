export default function DesignGauge({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - value * circumference;
  
  // Decide color based on value
  const color = value > 1.0 ? '#ef4444' : (value > 0.9 ? '#eab308' : '#10b981');
  const bgColor = value > 1.0 ? '#ef444433' : (value > 0.9 ? '#eab30833' : '#10b98133');

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg className="transform -rotate-90" width="90" height="90">
        {/* Background circle */}
        <circle
          cx="45"
          cy="45"
          r={radius}
          stroke={bgColor}
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="45"
          cy="45"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Text inside */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold text-white tracking-tighter" style={{ lineHeight: '1' }}>{value.toFixed(2)}</span>
        <span className="text-[9px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">DCR Máx</span>
      </div>
    </div>
  );
}
