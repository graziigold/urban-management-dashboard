import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../../styles/mapbox-custom.css';
import type { MapMarker } from './map-view';
import { getCategoryInfo } from '../../utils/categories';

interface MapboxMapProps {
  markers: MapMarker[];
  onMarkerClick: (marker: MapMarker) => void;
  selectedRegion: string | null;
  editMode?: boolean;
  onAddMarker?: (lat: number, lng: number) => void;
}

const statusColors = {
  critical: '#EF4444', 
  warning: '#EAB308',  
  success: '#22C55E',  
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ2Q4MDQiLCJhIjoiY21wN3JzemY0MDBxdTJyb2d1aGNrcXhlYSJ9.oM7_NV696RQsvcLMzD1ucQ';
const defaultCenter: [number, number] = [-47.9942, -16.0061];

export function MapboxMap({ markers, onMarkerClick, selectedRegion, editMode = false, onAddMarker }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('satellite');

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: defaultCenter,
      zoom: 14,
    });
    newMap.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.current = newMap;
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      if (editMode && onAddMarker) onAddMarker(e.lngLat.lat, e.lngLat.lng);
    };
    map.current.on('click', clickHandler);
    return () => { map.current?.off('click', clickHandler); };
  }, [editMode, onAddMarker]);

  useEffect(() => {
    if (!map.current) return;
    const style = mapStyle === 'streets' ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12';
    map.current.setStyle(style);
  }, [mapStyle]);

  // Atualizar marcadores com o visual: Fundo Branco + Borda Colorida + Emoji
  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((m) => { if (m) m.remove(); });
    markersRef.current = [];

    if (!Array.isArray(markers)) return;

    markers.forEach((marker) => {
      if (!marker || marker.lat === undefined || marker.lng === undefined) return;

      const categoryInfo = getCategoryInfo(marker.category);
      const container = document.createElement('div');
      container.className = 'mapbox-custom-marker flex items-center justify-center';

      // Design do Pino: Bolinha branca
      container.style.width = '36px'; 
      container.style.height = '36px';
      container.style.borderRadius = '50%';
      container.style.backgroundColor = '#FFFFFF';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.fontSize = '20px'; 
      
      // Borda grossa com a cor da criticidade
      const currentStatus = marker.status && marker.status in statusColors ? marker.status : 'success';
      const statusHex = statusColors[currentStatus as keyof typeof statusColors];
      container.style.border = `4px solid ${statusHex}`;
      
      container.style.cursor = 'pointer';
      container.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
      
      // Inserir Emoji direto como texto (sem quebrar o React)
      container.innerText = categoryInfo.icon;

      container.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClick(marker);
      });

      try {
        const mapMarker = new mapboxgl.Marker({ element: container })
          .setLngLat([Number(marker.lng), Number(marker.lat)])
          .addTo(map.current!);
        markersRef.current.push(mapMarker);
      } catch (err) {
        console.error('Erro ao plotar marcador:', err);
      }
    });
  }, [markers, onMarkerClick]);

  useEffect(() => {
    if (!map.current) return;
    const validMarkers = Array.isArray(markers) ? markers.filter(m => m && m.lng !== undefined && m.lat !== undefined) : [];
    if (selectedRegion && validMarkers.length > 0) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        validMarkers.forEach((marker) => bounds.extend([Number(marker.lng), Number(marker.lat)]));
        map.current.fitBounds(bounds, { padding: 100, duration: 1000 });
      } catch (err) {
        console.error('Erro nos limites do mapa:', err);
      }
    } else {
      map.current.flyTo({ center: defaultCenter, zoom: 14, duration: 1000 });
    }
  }, [selectedRegion, markers]);

  return (
    <div className="relative w-full h-full">
      <button type="button" onClick={() => setMapStyle((prev) => prev === 'streets' ? 'satellite' : 'streets')} className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-white px-4 py-2 rounded font-medium shadow-md hover:bg-slate-900 transition-colors">
        {mapStyle === 'streets' ? 'Modo Satélite' : 'Modo Mapa'}
      </button>
      {editMode && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-teal-600 text-white px-4 py-2 rounded-full font-medium shadow-lg shadow-teal-900/50 animate-pulse border border-teal-400">📍 Clique no mapa para adicionar</div>}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
