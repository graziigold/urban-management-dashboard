import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../../styles/mapbox-custom.css';
import type { MapMarker } from './map-view';

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

// Seu token
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

  // Atualizar marcadores
  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    markers.forEach((marker) => {
      const container = document.createElement('div');

      container.style.width = '25px';
      container.style.height = '25px';
      container.style.borderRadius = '50%';
      container.style.backgroundColor =
        statusColors[marker.status];

      container.style.border = '3px solid white';
      container.style.cursor = 'pointer';
      container.style.boxShadow =
        '0 0 10px rgba(0,0,0,0.4)';

      container.addEventListener('click', () => {
        onMarkerClick(marker);
      });

      const mapMarker = new mapboxgl.Marker({
        element: container,
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current!);

      markersRef.current.push(mapMarker);
    });
  }, [markers, onMarkerClick]);

  // Zoom automático
  useEffect(() => {
    if (!map.current) return;

    if (selectedRegion && markers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      markers.forEach((marker) => {
        bounds.extend([marker.lng, marker.lat]);
      });

      map.current.fitBounds(bounds, {
        padding: 100,
        duration: 1000,
      });
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
        onClick={() =>
          setMapStyle((prev) =>
            prev === 'streets'
              ? 'satellite'
              : 'streets'
          )
        }
        className="absolute top-4 left-4 z-10 bg-black text-white px-4 py-2 rounded"
      >
        {mapStyle === 'streets'
          ? 'Satélite'
          : 'Mapa'}
      </button>

      {editMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-teal-600 text-white px-4 py-2 rounded">
          Clique no mapa para adicionar marcador
        </div>
      )}

      <div
        ref={mapContainer}
        className="w-full h-full"
      />
    </div>
  );
}