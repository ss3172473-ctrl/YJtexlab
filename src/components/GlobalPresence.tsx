"use client";

export default function GlobalPresence() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-10 bg-white overflow-hidden border-t border-gray-100">
      <div className="max-w-7xl mx-auto relative">
        <h2 className="text-xs tracking-[0.2em] font-sans uppercase text-gray-400 mb-16 text-center">
          Global Presence
        </h2>
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl lg:text-6xl font-serif text-gray-900">
            Exporting to the World
          </h3>
        </div>
        
        <div className="relative w-full max-w-5xl mx-auto aspect-[2/1]">
          {/* Base World Map Image */}
          <img 
            src="/world-map.svg" 
            alt="World Map" 
            className="w-full h-full object-contain opacity-20 filter grayscale"
          />

          {/* SVG for Flight Paths and Animation */}
          <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="pathGradient" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Flight Paths */}
            {/* Korea to USA */}
            <path id="path-usa" d="M 830 180 Q 515 50 200 160" fill="none" stroke="url(#pathGradient)" strokeWidth="1.5" strokeDasharray="6,6" className="opacity-60" />
            {/* Korea to Japan */}
            <path id="path-jp" d="M 830 180 Q 845 170 860 185" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-30" />
            {/* Korea to China */}
            <path id="path-cn" d="M 830 180 Q 800 160 770 170" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-30" />
            {/* Korea to Vietnam */}
            <path id="path-vn" d="M 830 180 Q 795 210 780 240" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-30" />
            {/* Korea to Thailand */}
            <path id="path-th" d="M 830 180 Q 760 210 750 245" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4,4" className="opacity-30" />

            {/* Animated Airplanes (Tiny right-facing airplane: M -6,-4 L 8,0 L -6,4 L -2,0 Z) pointing forward on the path */}
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="8s" rotate="auto" path="M 830 180 Q 515 50 200 160" />
              </path>
            </g>
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="3s" rotate="auto" path="M 830 180 Q 845 170 860 185" />
              </path>
            </g>
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="2.5s" rotate="auto" path="M 830 180 Q 800 160 770 170" />
              </path>
            </g>
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="5s" rotate="auto" path="M 830 180 Q 795 210 780 240" />
              </path>
            </g>
            <g className="text-black drop-shadow-md">
              <path d="M-6,-4 L8,0 L-6,4 L-2,0 Z" fill="currentColor">
                <animateMotion repeatCount="indefinite" dur="4.5s" rotate="auto" path="M 830 180 Q 760 210 750 245" />
              </path>
            </g>
          </svg>

          {/* Dots and Labels */}
          {/* Korea */}
          <div className="absolute group cursor-pointer" style={{ top: '36%', left: '83%' }}>
            <div className="absolute -inset-2 w-4 h-4 bg-black/20 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2" />
            <div className="w-2.5 h-2.5 bg-black rounded-full relative z-10 border border-white -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold font-sans tracking-widest text-black bg-white/90 px-2 py-0.5 rounded shadow-sm whitespace-nowrap">KOREA (HQ)</span>
          </div>

          <div className="absolute group cursor-pointer" style={{ top: '37%', left: '86%' }}>
            <div className="w-1.5 h-1.5 bg-black rounded-full relative z-10 -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-sans tracking-widest text-black bg-white/70 px-1 py-0.5 rounded shadow-sm whitespace-nowrap">JAPAN</span>
          </div>

          <div className="absolute group cursor-pointer" style={{ top: '34%', left: '77%' }}>
            <div className="w-1.5 h-1.5 bg-black rounded-full relative z-10 -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-sans tracking-widest text-black bg-white/70 px-1 py-0.5 rounded shadow-sm whitespace-nowrap">CHINA</span>
          </div>

          <div className="absolute group cursor-pointer" style={{ top: '32%', left: '20%' }}>
            <div className="w-1.5 h-1.5 bg-black rounded-full relative z-10 -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-sans tracking-widest text-black bg-white/70 px-1 py-0.5 rounded shadow-sm whitespace-nowrap">USA</span>
          </div>

          <div className="absolute group cursor-pointer" style={{ top: '48%', left: '78%' }}>
            <div className="w-1.5 h-1.5 bg-black rounded-full relative z-10 -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-sans tracking-widest text-black bg-white/70 px-1 py-0.5 rounded shadow-sm whitespace-nowrap">VIETNAM</span>
          </div>

          <div className="absolute group cursor-pointer" style={{ top: '49%', left: '75%' }}>
            <div className="w-1.5 h-1.5 bg-black rounded-full relative z-10 -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-sans tracking-widest text-black bg-white/70 px-1 py-0.5 rounded shadow-sm whitespace-nowrap">THAILAND</span>
          </div>
        </div>
      </div>
    </section>
  );
}
