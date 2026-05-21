import { MapPin } from 'lucide-react';
import type { MapMarker } from './map-view';

interface MapDisplayProps {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
  mapType: 'pdf' | 'schematic';
}

const statusColors = {
  critical: 'bg-red-500 hover:bg-red-600',
  warning: 'bg-yellow-500 hover:bg-yellow-600',
  success: 'bg-green-500 hover:bg-green-600',
};

export function MapDisplay({ markers, onMarkerClick, mapType }: MapDisplayProps) {
  if (mapType === 'pdf') {
    return (
      <div className="relative w-full h-full bg-gray-200">
        {/* Real Map Background Image */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <img
            src="/mapa-santa-maria.jpg"
            alt="Mapa de Santa Maria-DF"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Markers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {markers.map((marker) => (
            <button
              key={marker.id}
              onClick={() => onMarkerClick(marker)}
              className="absolute group pointer-events-auto z-50"
              style={{
                left: `${marker.lng}%`,
                top: `${marker.lat}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="relative">
                {/* Pin Icon */}
                <div className={`relative ${statusColors[marker.status]} rounded-full p-2 shadow-2xl transition-all group-hover:scale-125 border-3 border-white`}>
                  <MapPin className="size-6 text-white" strokeWidth={2.5} fill="white" />
                </div>

                {/* Pulse for critical */}
                {marker.status === 'critical' && (
                  <span className="absolute inset-0 rounded-full bg-red-500 opacity-60 animate-ping" />
                )}

                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-2 rounded-lg pointer-events-none shadow-xl font-medium z-50">
                  {marker.title}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 size-2 bg-gray-900" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Schematic view
  return (
    <div className="relative w-full h-full bg-[#E8EBF0]">
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CBD5E1" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Roads */}
        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#94A3B8" strokeWidth="2" opacity="0.3" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#94A3B8" strokeWidth="3" opacity="0.4" />
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#94A3B8" strokeWidth="2" opacity="0.3" />
        <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#94A3B8" strokeWidth="2" opacity="0.3" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#94A3B8" strokeWidth="3" opacity="0.4" />
        <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#94A3B8" strokeWidth="2" opacity="0.3" />
      </svg>

      {/* Markers */}
      {markers.map((marker) => (
        <button
          key={marker.id}
          onClick={() => onMarkerClick(marker)}
          className="absolute group"
          style={{
            left: `${marker.lng}%`,
            top: `${marker.lat}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative">
            <div className={`size-12 ${statusColors[marker.status]} rounded-full flex items-center justify-center shadow-xl transition-all group-hover:scale-125 border-3 border-white`}>
              <span className="text-white font-bold text-sm">
                {marker.title.match(/\d+/)?.[0] || '•'}
              </span>
            </div>
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-2 rounded-lg pointer-events-none shadow-xl">
              {marker.title}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
