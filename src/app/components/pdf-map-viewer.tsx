import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { MapMarker } from './map-view';

interface PdfMapViewerProps {
  pdfUrl: string;
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
}

const statusColors = {
  critical: 'bg-red-500 hover:bg-red-600',
  warning: 'bg-yellow-500 hover:bg-yellow-600',
  success: 'bg-green-500 hover:bg-green-600',
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
          </iframe>
        </object>
      </div>

      {/* Interactive Markers Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {markers.map((marker) => (
          <button
            key={marker.id}
            onClick={() => onMarkerClick(marker)}
            className="absolute group pointer-events-auto"
            style={{
              left: `${marker.lng}%`,
              top: `${marker.lat}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="relative">
              <MapPin
                className={`size-10 ${statusColors[marker.status]} text-white rounded-full p-2 shadow-xl transition-transform group-hover:scale-125 group-hover:shadow-2xl border-2 border-white`}
                strokeWidth={2.5}
              />
              {/* Pulse animation for critical status */}
              {marker.status === 'critical' && (
                <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping" />
              )}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg pointer-events-none shadow-lg font-medium">
                {marker.title}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
