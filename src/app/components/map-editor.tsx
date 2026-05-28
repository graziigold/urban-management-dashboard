import { useState } from 'react';
import { MapPin, Plus, Trash2, Edit2, Save, X, Link } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import type { MapMarker } from './map-view';
import type { LocationCategory } from '../../utils/api/locations';

interface MapEditorProps {
  initialMarkers: MapMarker[];
  onSave: (markers: MapMarker[]) => void;
  onClose: () => void;
}

const statusColors = {
  critical: 'bg-red-500',
  warning: 'bg-yellow-500',
  success: 'bg-green-500',
};

// ── Limites geográficos do mapa de Santa Maria-DF ──────────────────────────
const MAP_BOUNDS = {
  latMin: -16.075,
  latMax: -15.985,
  lngMin: -48.075,
  lngMax: -47.990,
};

function latLngToPercent(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * 100;
  const y = ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * 100;
  return {
    lngPercent: Math.max(0, Math.min(100, Math.round(x * 100) / 100)),
    latPercent: Math.max(0, Math.min(100, Math.round(y * 100) / 100)),
  };
}

function extractCoordsFromGoogleUrl(url: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /maps\.google\.com\/.*?(-?\d+\.\d+),(-?\d+\.\d+)/, // Suporte ao link corrigido do sistema
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
  }
  return null;
}

export function MapEditor({ initialMarkers, onSave, onClose }: MapEditorProps) {
  const [markers, setMarkers] = useState<MapMarker[]>(Array.isArray(initialMarkers) ? initialMarkers : []);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isEditingMarker, setIsEditingMarker] = useState(false);
  const [googleUrl, setGoogleUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [urlSuccess, setUrlSuccess] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    status: 'success' as 'critical' | 'warning' | 'success',
    region: 'central',
    category: 'outro' as LocationCategory,
  });

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditingMarker) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: MapMarker = {
      id: `marker-${Date.now()}`,
      lat: Math.round(y * 100) / 100,
      lng: Math.round(x * 100) / 100,
      status: editForm.status,
      title: editForm.title || `Novo Ponto ${markers.length + 1}`,
      region: editForm.region,
      category: editForm.category,
    };

    setMarkers([...markers, newMarker]);
    setEditForm({ ...editForm, title: '' });
  };

  const handleAddFromUrl = () => {
    setUrlError('');
    setUrlSuccess('');

    const coords = extractCoordsFromGoogleUrl(googleUrl);

    if (!coords) {
      setUrlError('URL inválida. Certifique-se de copiar o link completo contendo as coordenadas com @lat,lng.');
      return;
    }

    const { lngPercent, latPercent } = latLngToPercent(coords.lat, coords.lng);

    if (lngPercent <= 0 || lngPercent >= 100 || latPercent <= 0 || latPercent >= 100) {
      setUrlError(`As coordenadas extraídas (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}) ficam fora de Santa Maria-DF.`);
      return;
    }

    const newMarker: MapMarker = {
      id: `marker-${Date.now()}`,
      lat: latPercent,
      lng: lngPercent,
      status: editForm.status,
      title: editForm.title || `Novo Ponto ${markers.length + 1}`,
      region: editForm.region,
      category: editForm.category,
    };

    setMarkers([...markers, newMarker]);
    setUrlSuccess(`✅ Pin adicionado com sucesso!`);
    setGoogleUrl('');
    setEditForm({ ...editForm, title: '' });
  };

  const handleMarkerClick = (marker: MapMarker, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!marker) return;
    setSelectedMarker(marker);
    setEditForm({
      title: marker.title || 'Sem título',
      status: marker.status || 'success',
      region: marker.region || 'central',
      category: marker.category || 'outro',
    });
    setIsEditingMarker(true);
  };

  const handleUpdateMarker = () => {
    if (!selectedMarker) return;

    setMarkers(markers.map(m =>
      m && m.id === selectedMarker.id
        ? { ...m, title: editForm.title, status: editForm.status, region: editForm.region, category: editForm.category }
        : m
    ));
    setIsEditingMarker(false);
    setSelectedMarker(null);
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers(markers.filter(m => m && m.id !== id));
    setIsEditingMarker(false);
    setSelectedMarker(null);
  };

  const handleSave = () => {
    onSave(markers);
  };

  const exportCoordinates = () => {
    const data = JSON.stringify(markers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mapa-pins.json';
    a.click();
  };

  const categoryOptions: { value: LocationCategory; label: string }[] = [
    { value: 'parquinho', label: '🛝 Parquinho' },
    { value: 'pec', label: '🏋️ PEC' },
    { value: 'quadra', label: '🏀 Quadra' },
    { value: 'campo', label: '⚽ Campo' },
    { value: 'praca', label: '🌳 Praça' },
    { value: 'ponto-onibus', label: '🚌 Ponto de Ônibus' },
    { value: 'obra', label: '🚧 Obra' },
    { value: 'iluminacao', label: '💡 Iluminação' },
    { value: 'sinalizacao', label: '🚦 Sinalização' },
    { value: 'outro', label: '📍 Outro' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      {/* Sidebar */}
      <Card className="w-96 bg-white shadow-2xl overflow-y-auto z-10">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Editor de Pins</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Clique no mapa ou cole um link do Google Maps
          </p>
        </div>

        <div className="p-6 space-y-6">
          {!isEditingMarker && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="size-4" />
                Novo Pin
              </h3>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Nome do local"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value: LocationCategory) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Normal</SelectItem>
                    <SelectItem value="warning">⚠️ Atenção</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Região</Label>
                <Select
                  value={editForm.region}
                  onValueChange={(value) => setEditForm({ ...editForm, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="norte">Santa Maria Norte</SelectItem>
                    <SelectItem value="sul">Santa Maria Sul</SelectItem>
                    <SelectItem value="central">Santa Maria Central</SelectItem>
                    <SelectItem value="santos-dumont">Santos Dumont</SelectItem>
                    <SelectItem value="total-ville">Total Ville</SelectItem>
                    <SelectItem value="porto-rico">Condomínio Porto Rico</SelectItem>
                    <SelectItem value="polo-jk">Polo JK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-3 border-t">
                <Label htmlFor="google-url" className="flex items-center gap-1">
                  <Link className="size-3" />
                  Colar link do Google Maps
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="google-url"
                    placeholder="Cole a URL inteira do Maps aqui..."
                    value={googleUrl}
                    onChange={(e) => {
                      setGoogleUrl(e.target.value);
                      setUrlError('');
                      setUrlSuccess('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && googleUrl.trim() && handleAddFromUrl()}
                    className="text-xs"
                  />
                  <Button
                    onClick={handleAddFromUrl}
                    disabled={!googleUrl.trim()}
                    size="sm"
                    className="shrink-0"
                  >
                    Adicionar
                  </Button>
                </div>
                {urlError && <p className="text-xs text-red-500">{urlError}</p>}
                {urlSuccess && <p className="text-xs text-green-600">{urlSuccess}</p>}
              </div>
            </div>
          )}

          {isEditingMarker && selectedMarker && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Edit2 className="size-4" />
                Editar Pin
              </h3>

              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value: LocationCategory) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Normal</SelectItem>
                    <SelectItem value="warning">⚠️ Atenção</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Região</Label>
                <Select
                  value={editForm.region}
                  onValueChange={(value) => setEditForm({ ...editForm, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="norte">Santa Maria Norte</SelectItem>
                    <SelectItem value="sul">Santa Maria Sul</SelectItem>
                    <SelectItem value="central">Santa Maria Central</SelectItem>
                    <SelectItem value="santos-dumont">Santos Dumont</SelectItem>
                    <SelectItem value="total-ville">Total Ville</SelectItem>
                    <SelectItem value="porto-rico">Condomínio Porto Rico</SelectItem>
                    <SelectItem value="polo-jk">Polo JK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpdateMarker} className="flex-1">
                  Atualizar
                </Button>
                <Button variant="destructive" onClick={() => selectedMarker && handleDeleteMarker(selectedMarker.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => { setIsEditingMarker(false); setSelectedMarker(null); }}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3">Pins ({markers.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.isArray(markers) && markers.map((marker, index) => {
                if (!marker) return null;
                const markerId = marker.id || `sidebar-editor-fallback-${index}`;
                const currentStatus = marker.status && marker.status in statusColors ? marker.status : 'success';
                const colorClass = statusColors[currentStatus as keyof typeof statusColors];

                return (
                  <button
                    key={markerId}
                    type="button"
                    onClick={() => {
                      setSelectedMarker(marker);
                      setEditForm({
                        title: marker.title || 'Sem título',
                        status: currentStatus,
                        region: marker.region || 'central',
                        category: marker.category || 'outro',
                      });
                      setIsEditingMarker(true);
                    }}
                    className={`w-full p-3 rounded-lg border text-left transition-colors hover:bg-gray-50 ${
                      selectedMarker?.id === marker.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`size-3 rounded-full ${colorClass}`} />
                      <span className="text-sm font-medium flex-1">{marker.title || 'Sem título'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Button onClick={handleSave} className="w-full" size="lg">
              <Save className="size-4 mr-2" />
              Salvar Pins
            </Button>
            <Button onClick={exportCoordinates} variant="outline" className="w-full">
              Exportar Coordenadas
            </Button>
          </div>
        </div>
      </Card>

      {/* Área do Mapa */}
      <div className="flex-1 relative">
        <div onClick={handleMapClick} className="absolute inset-0 cursor-crosshair">
          {Array.isArray(markers) && markers.map((marker, index) => {
            if (!marker) return null;
            const markerId = marker.id || `overlay-editor-fallback-${index}`;
            const currentStatus = marker.status && marker.status in statusColors ? marker.status : 'success';
            const colorClass = statusColors[currentStatus as keyof typeof statusColors];

            return (
              <button
                key={markerId}
                type="button"
                onClick={(e) => handleMarkerClick(marker, e)}
                className="absolute group z-40"
                style={{
                  left: `${marker.lng || 0}%`,
                  top: `${marker.lat || 0}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative">
                  <div className={`${colorClass} rounded-full p-3 shadow-2xl transition-all duration-200 group-hover:scale-125 border-4 border-white ${
                    selectedMarker?.id === marker.id ? 'ring-4 ring-blue-500' : ''
                  }`}>
                    <MapPin className="size-6 text-white" strokeWidth={3} fill="currentColor" />
                  </div>
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                    <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-2xl whitespace-nowrap font-medium">
                      {marker.title || 'Sem título'}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {!isEditingMarker && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-10 pointer-events-none">
              <p className="text-sm font-medium">
                📍 Clique no mapa para adicionar um novo pin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
