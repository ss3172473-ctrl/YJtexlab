import Image from "next/image";
import { MapPin } from "lucide-react";

export default function Locations({
  verifyMode = false,
}: {
  verifyMode?: boolean;
}) {
  return (
    <section className="py-20 md:py-32 bg-white px-6 md:px-10" data-home-section="locations">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-sans font-medium tracking-[0.01em] mb-16 text-center">
          Our Facilities
        </h2>

        <div className="flex flex-col lg:flex-row bg-white shadow-sm border border-gray-200 overflow-hidden">
          {/* Map Image Section */}
          <div className="w-full lg:w-1/2 h-[400px] lg:h-auto min-h-[500px] relative bg-white flex items-center justify-center p-8">
            <div className="relative w-full max-w-sm aspect-[4/5] mx-auto">
              <Image
                src="/korea-map.svg"
                alt="Map of South Korea"
                fill
                unoptimized
                className="object-contain opacity-80 filter grayscale contrast-125"
              />
              
              {/* Seoul Pin */}
              <div 
                className="absolute flex flex-col items-center group cursor-pointer"
                style={{ top: '21%', left: '31.5%' }}
              >
                <div className="relative">
                  {!verifyMode ? (
                    <div className="absolute -inset-2 bg-black/20 rounded-full animate-ping" />
                  ) : null}
                  <MapPin className="relative z-10 w-6 h-6 text-black drop-shadow-md transition-transform duration-300 group-hover:scale-110" strokeWidth={2} fill="white" />
                </div>
                <span className="mt-1 text-xs font-bold font-sans tracking-widest text-black bg-white/90 px-2 py-0.5 rounded shadow-sm opacity-100">SEOUL</span>
              </div>

              {/* Daegu Pin */}
              <div 
                className="absolute flex flex-col items-center group cursor-pointer"
                style={{ top: '55.4%', left: '68.2%' }}
              >
                <div className="relative">
                  {!verifyMode ? (
                    <div className="absolute -inset-2 bg-black/20 rounded-full animate-ping" />
                  ) : null}
                  <MapPin className="relative z-10 w-6 h-6 text-black drop-shadow-md transition-transform duration-300 group-hover:scale-110" strokeWidth={2} fill="white" />
                </div>
                <span className="mt-1 text-xs font-bold font-sans tracking-widest text-black bg-white/90 px-2 py-0.5 rounded shadow-sm opacity-100">DAEGU</span>
              </div>
            </div>
          </div>

          {/* Locations Info */}
          <div className="w-full lg:w-1/2 p-10 md:p-16 flex flex-col justify-center gap-12">
            
            {/* Seoul */}
            <div className="flex gap-6 items-start">
              <div className="bg-white border border-gray-100 p-3 rounded-full shrink-0">
                <MapPin className="w-6 h-6 text-gray-800" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl font-serif mb-2 text-gray-900">Seoul</h3>
                <p className="text-gray-500 text-sm tracking-[0.15em] font-sans uppercase mb-3 text-nowrap">Warehouse</p>
                <p className="text-gray-700 font-light leading-relaxed font-sans">
                  대한민국 텍스타일 유통의 중심 서울에서 빠르고 정확한 물류 거점 창고를 운영하고 있습니다.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Daegu */}
            <div className="flex gap-6 items-start">
              <div className="bg-white border border-gray-100 p-3 rounded-full shrink-0">
                <MapPin className="w-6 h-6 text-gray-800" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl font-serif mb-2 text-gray-900">Daegu</h3>
                <p className="text-gray-500 text-sm tracking-[0.15em] font-sans uppercase mb-3 text-wrap">Factory & Main Warehouse</p>
                <p className="text-gray-700 font-light leading-relaxed font-sans">
                  60년의 노하우가 담긴 대구에는 최신 설비의 제조 공장과 대규모 메인 보관 인프라가 갖추어져 있습니다.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
