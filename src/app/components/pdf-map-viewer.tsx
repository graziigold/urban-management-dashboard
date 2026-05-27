import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { MapMarker } from './map-view';

interface PdfMapViewerProps {
  pdfUrl: string;
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
}

// Mapeamento de cores para preenchimento e bordas limpas dentro do SVG do Lucide
const statusColors = {
  critical: 'text-red-500 hover:text-red-600 fill-red-500/20',
  warning: 'text-yellow-500 hover:text-yellow-600 fill-yellow-500/20',
  success: 'text-green-500 hover:text-green-600 fill-green-500/20',
};

export function PdfMapViewer({ pdfUrl, markers, onMarkerClick }: PdfMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-100">
      {/* PDF Background - Using object for better PDF rendering */}
      <div className="absolute inset-0 w-full h-full">
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full"
        >
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Santa Maria-DF Map"
          >
            <p className="p-8 text-center text-gray-600">
              O navegador não suporta visualização de PDF.
              <a href={pdfUrl} className="text-blue-600 hover:underline ml-1" download>
                Baixe o mapa aqui
              </a>
            </p>
          </footer>
        </object>
      </div>

      {/* Interactive Markers Overlay - TOTALMENTE BLINDADO */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.isArray(markers) && markers.map((marker, index) => {
          // Fallback seguro de identificação única para evitar crashes na renderização
          const markerId = marker?.id || `pdf-viewer-fallback-${index}`;
          // Fallback caso o status venha quebrado ou traduzido incorretamente pelo navegador
          const currentStatus = marker?.status && marker.status in statusColors ? marker.status : 'success';
          const colorClass = statusColors[currentStatus as keyof typeof statusColors];

          return (
            <button
              key={markerId}
              type="button"
              onClick={() => marker && onMarkerClick(marker)}
              className="absolute group pointer-events-auto z-50 transition-transform duration-200"
              style={{
                left: `${marker?.lng || 0}%`,
                top: `${marker?.lat || 0}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="relative flex items-center justify-center">
                {/* Pin Icon Customizado para SVG Nativo */}
                <div className="bg-white/90 p-1.5 rounded-full shadow-xl border border-gray-200/50 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <MapPin
                    className={`size-7 ${colorClass}`}
                    strokeWidth={2.5}
                  />
                </div>

                {/* Pulse animation for critical status */}
                {currentStatus === 'critical' && (
                  <span className="absolute inset-0 rounded-full bg-red-500 opacity-40 animate-ping scale-125 pointer-events-none" />
                )}

                {/* Tooltip Fluído */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap bg-gray-900/95 text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none shadow-2xl font-semibold border border-white/10">
                  {marker?.title || 'Sem título'}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 size-1.5 bg-gray-900 border-r border-b border-white/10" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
