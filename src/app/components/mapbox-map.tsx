import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../../styles/mapbox-custom.css';
import type { MapMarker } from './map-view';
import { getCategoryInfo } from '../../utils/categories';
import { createRoot, type Root } from 'react-dom/client';

interface MapboxMapProps {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
  selectedRegion: string | null;
  editMode?: boolean;
  onAddMarker?: (lat: number, lng: number) => void;
}

const statusColors = {
  critical: '#EF4444', // Vermelho (Crítico)
  warning: '#EAB308',  // Amarelo (Atenção)
  success: '#22C55E',  // Verde (Normal)
};

// Token Mapbox
const MAPBOX_TOKEN =
  'pk.eyJ1IjoiZ2Q4MDQiLCJhIjoiY21wN3JzemY0MDBxdTJyb2d1aGNrcXhlYSJ9.oM7_NV696RQsvcLMzD1ucQ';

// Centro Santa Maria
const defaultCenter: [number, number] = [-47.9942, -16.0061];

export function MapboxMap({
  markers,
  onMarkerClick,
  selectedRegion,
  editMode = false,
  onAddMarker,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  // Guardamos as instâncias do React Root para limpar a memória depois
  const reactRootsRef = useRef<Root[]>([]);
  
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>(
    'satellite'
  );

  // Inicialização do mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: defaultCenter,
      zoom: 14,
    });

    newMap.on('load', () => {
      console.log('Mapa carregado');
    });

    newMap.addControl(
      new mapboxgl.NavigationControl(),
      'bottom-right'
    );

    map.current = newMap;

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Clique para adicionar marcador
  useEffect(() => {
    if (!map.current) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      if (editMode && onAddMarker) {
        onAddMarker(e.lngLat.lat, e.lngLat.lng);
      }
    };

    map.current.on('click', clickHandler);

    return () => {
      map.current?.off('click', clickHandler);
    };
  }, [editMode, onAddMarker]);

  // Alterar estilo
  useEffect(() => {
    if (!map.current) return;

    const style =
      mapStyle === 'streets'
        ? 'mapbox://styles/mapbox/streets-v12'
        : 'mapbox://styles/mapbox/satellite-streets-v12';

    map.current.setStyle(style);
  }, [mapStyle]);

  // Atualizar marcadores com ÍCONES BRANCOS da Lucide
  useEffect(() => {
    if (!map.current) return;

    // Limpa marcadores anteriores e desmonta as raízes do React
    markersRef.current.forEach((m) => {
      if (m) m.remove();
    });
    markersRef.current = [];

    reactRootsRef.current.forEach((root) => { root.unmount(); });
    reactRootsRef.current = [];

    if (!Array.isArray(markers)) return;

    markers.forEach((marker) => {
      if (!marker || marker.lat === undefined || marker.lng === undefined) return;

      const categoryInfo = getCategoryInfo(marker.category);
      const IconComponent = categoryInfo.icon; // Puxa o componente da Lucide (ou nosso escorregador)

      const container = document.createElement('div');
      container.className = 'mapbox-custom-marker flex items-center justify-center';

      container.style.width = '32px'; 
      container.style.height = '32px';
      container.style.borderRadius = '50%';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      
      const currentStatus = marker.status && marker.status in statusColors ? marker.status : 'success';
      container.style.backgroundColor = statusColors[currentStatus as keyof typeof statusColors];

      container.style.border = '2.5px solid white';
      container.style.cursor = 'pointer';
      container.style.boxShadow = '0 3px 8px rgba(0,0,0,0.5)';
      
      // Injeta o ícone usando o React, passando a cor BRANCA!
      const root = createRoot(container);
      root.render(<IconComponent size={18} color="white" strokeWidth={2.5} />);
      reactRootsRef.current.push(root);

      container.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClick(marker);
      });

      try {
        const mapMarker = new mapboxgl.Marker({
          element: container,
        })
          .setLngLat([Number(marker.lng), Number(marker.lat)])
          .addTo(map.current!);

        markersRef.current.push(mapMarker);
      } catch (err) {
        console.error('Erro ao plotar marcador no Mapbox:', err);
      }
    });
  }, [markers, onMarkerClick]);

  // Zoom automático blindado
  useEffect(() => {
    if (!map.current) return;

    const validMarkers = Array.isArray(markers) 
      ? markers.filter(m => m && m.lng !== undefined && m.lat !== undefined) 
      : [];

    if (selectedRegion && validMarkers.length > 0) {
      try {
        const bounds = new mapboxgl.LngLatBounds();

        validMarkers.forEach((marker) => {
          bounds.extend([Number(marker.lng), Number(marker.lat)]);
        });

        map.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000,
        });
      } catch (err) {
        console.error('Erro ao ajustar limites do mapa:', err);
      }
    } else {
      map.current.flyTo({
        center: defaultCenter,
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedRegion, markers]);

  return (
    <div className="relative w-full h-full">
      <button
        type="button"
        onClick={() =>
          setMapStyle((prev) =>
            prev === 'streets' ? 'satellite' : 'streets'
          )
        }
        className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-white px-4 py-2 rounded font-medium shadow-md hover:bg-slate-900 transition-colors"
      >
        {mapStyle === 'streets' ? 'Modo Satélite' : 'Modo Mapa'}
      </button>

      {editMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-teal-600 text-white px-4 py-2 rounded-full font-medium shadow-lg shadow-teal-900/50 animate-pulse border border-teal-400">
          📍 Clique no mapa para adicionar
        </div>
      )}

      <div
        ref={mapContainer}
        className="w-full h-full"
      />
    </div>
  );
}
