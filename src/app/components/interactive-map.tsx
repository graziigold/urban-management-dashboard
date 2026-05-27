import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import type { MapMarker } from './map-view';
import { regionMaps, type RegionKey } from './region-maps';

interface InteractiveMapProps {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
  selectedRegion: string | null;
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
}

const statusColors = {
  critical: 'bg-red-500',
  warning: 'bg-yellow-500',
  success: 'bg-green-500',
};

export function InteractiveMap({ markers, onMarkerClick, selectedRegion, currentZoom, onZoomChange }: InteractiveMapProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Determina qual mapa mostrar baseado na região selecionada
  const currentMap = selectedRegion && selectedRegion in regionMaps
    ? regionMaps[selectedRegion as RegionKey]
    : regionMaps.complete;

  // Reseta posição e zoom quando muda de região
  useEffect(() => {
    setPosition({ x: 0, y: 0 });

    if (selectedRegion) {
      onZoomChange(1.8); // Zoom maior para mapas regionais
    } else {
      onZoomChange(1.5); // Zoom padrão para mapa completo
    }
  }, [selectedRegion, onZoomChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-200 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Map Image - Draggable */}
      <div
        className="absolute"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        }}
      >
        <img
          key={selectedRegion || 'complete'} // Force re-render ao trocar mapa
          src={currentMap}
          alt={selectedRegion ? `Mapa ${selectedRegion}` : 'Mapa Santa Maria-DF'}
          className="w-full h-auto min-w-[200%] transition-opacity duration-500"
          draggable={false}
        />
      </div>

      {/* Interactive Markers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {Array.isArray(markers) && markers.map((marker, index) => {
          // Garante que o ID exista para não quebrar a chave do React
          const markerId = marker?.id || `fallback-id-${index}`;
          // Evita crash se o status vier inválido ou traduzido do banco
          const currentStatus = marker?.status && marker.status in statusColors ? marker.status : 'success';
          const colorClass = statusColors[currentStatus as keyof typeof statusColors];

          return (
            <button
              key={markerId}
              onClick={(e) => {
                e.stopPropagation();
                if (marker) onMarkerClick(marker);
              }}
              className="absolute group z-50 pointer-events-auto"
              style={{
                left: `${marker?.lng || 0}%`,
                top: `${marker?.lat || 0}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
              }}
            >
              <div className="relative">
                {/* Animated Pulse Ring */}
                {currentStatus === 'critical' && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-500 opacity-50 animate-ping scale-150" />
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-pulse scale-12 Naz" />
                  </>
                )}

                {/* Pin Shadow */}
                <div className="absolute inset-0 rounded-full bg-black/30 blur-md scale-110" />

                {/* Pin Background Circle */}
                <div className={`relative ${colorClass} rounded-full p-3.5 shadow-2xl transition-all duration-200 group-hover:scale-125 group-hover:shadow-3xl border-4 border-white/90 backdrop-blur-sm`}>
                  <MapPin className="size-7 text-white drop-shadow-lg" strokeWidth={2.5} fill="currentColor" />
                </div>

                {/* Hover Tooltip */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white text-sm px-5 py-2.5 rounded-xl shadow-2xl whitespace-nowrap font-semibold border border-white/10 backdrop-blur-md">
                    {marker?.title || 'Sem título'}
                    {/* Tooltip Arrow */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-gray-900 to-gray-800 rotate-45 border-r border-b border-white/10" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
