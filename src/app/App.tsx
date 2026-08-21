import { useState, useEffect, useMemo } from 'react';
import { Edit, Menu, X, MapPin, Save, Camera, Trash2, Loader2, Search } from 'lucide-react';
import { Menu, X, Search } from 'lucide-react';
import { DashboardSidebar } from './components/dashboard-sidebar';
import { MapView, MapMarker } from './components/map-view';
import { ExportMenu } from './components/export-menu';
@@ -10,45 +10,14 @@
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { getAllLocations, createLocation, updateLocation, deleteLocation, type Location, type LocationCategory } from '../utils/api/locations';
import { CATEGORIES } from '../utils/categories';
import { getAllLocations, type Location, type LocationCategory } from '../utils/api/locations';
import { CATEGORIES } from './utils/categories';
import { GaleriaVistoria } from './components/GaleriaVistoria';

// ── CONFIGURAÇÃO AUTENTICADA E SINCRONIZADA DO GEOPARQUES SM ──
const SUPABASE_PROJECT_ID = "kqrmsxhmbjzwjnxhfnap";
const ANON_KEY = "sb_publishable_DQm7g2O-m4BohGzHD3npfQ_NJd6SBxj";

// Ponte leve ajustada para o Storage funcionar perfeitamente via rota de API dedicada
const supabase = {
  storage: {
    from: (bucketName: string) => ({
      upload: async (fileName: string, file: File) => {
        try {
          // Utiliza o subdomínio dedicado de storage que o servidor do Supabase espera receber
          const response = await fetch(
            `https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/object/${bucketName}/${fileName}`,
            {
              method: 'POST',
              headers: {
                'ApiKey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`
              },
              body: file
            }
          );
          if (!response.ok) return { data: null, error: await response.json() };
          return { data: await response.json(), error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      },
      getPublicUrl: (fileName: string) => ({
        data: { publicUrl: `https://${SUPABASE_PROJECT_ID}.storage.supabase.co/storage/v1/object/public/${bucketName}/${fileName}` }
      })
    })
  }
};

// Converter Location (backend) para MapMarker (frontend) - BLINDADO
function locationToMarker(location: Location): MapMarker {
if (!location) {
@@ -68,17 +37,19 @@
export default function App() {
const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const [mapEditMode, setMapEditMode] = useState(false);
  const [newMarkerCoords, setNewMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'mock'>('checking');
const [locations, setLocations] = useState<Location[]>([]);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
const [searchQuery, setSearchQuery] = useState('');

  // Estado para apenas VISUALIZAR os detalhes do pino (sem permissão de alteração)
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState<LocationCategory>('outro');
  const [formStatus, setFormStatus] = useState<'critical' | 'warning' | 'success'>('success');
  const [formRegion, setFormRegion] = useState<string>('central');

// ── FILTRO DA BUSCA COMPLETAMENTE BLINDADO CONTRA TELA BRANCA (COM COORDENADAS) ──
const markers = useMemo(() => {
if (!locations || !Array.isArray(locations)) return [];
@@ -109,11 +80,6 @@
.filter(marker => marker.id !== 'erro');
}, [locations, searchQuery]);

  const [formCategory, setFormCategory] = useState<LocationCategory>('outro');
  const [formStatus, setFormStatus] = useState<'critical' | 'warning' | 'success'>('success');
  const [formRegion, setFormRegion] = useState<string>('central');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

useEffect(() => {
console.log('🚀 App montado - carregando locais...');
loadLocations();
@@ -135,156 +101,18 @@
}
}

  // Ao clicar no pino, apenas abre os dados para leitura e visualização da galeria
const handleMarkerClick = (marker: MapMarker) => {
const location = locations.find((l) => l.id === marker.id);
if (location) {
      setEditingLocation(location);
      setViewingLocation(location);
setFormCategory(location.category);
setFormStatus(location.status);
setFormRegion(location.region);
setUploadedImages(location.images || []);
}
};

  const handleMapClick = (lat: number, lng: number) => {
    setNewMarkerCoords({ lat, lng });
    setUploadedImages([]); 
    setFormCategory('outro');
    setFormStatus('success');
    setFormRegion('central');
  };

  // ── SNAP-UPLOAD PARA O STORAGE (PROTEGIDO CONTRA TRAVAMENTOS) ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fotos-locais')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fotos-locais')
          .getPublicUrl(fileName);

        newUrls.push(publicUrlData.publicUrl);
      }

      setUploadedImages(prev => [...prev, ...newUrls]);
    } catch (error: any) {
      console.error('Erro no upload para o Storage:', error);
      alert('Não conseguimos salvar a foto no servidor de arquivos (verifique as regras de RLS do bucket fotos-locais), mas você ainda pode preencher os dados e salvar o formulário normalmente!');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveNewMarker = async (formData: {
    title: string;
    description: string;
    address: string;
    seiProcess: string;
    status: 'critical' | 'warning' | 'success';
    region: string;
    category: LocationCategory;
  }) => {
    if (!newMarkerCoords) return;

    try {
      const newLocation = await createLocation({
        title: formData.title,
        latitude: newMarkerCoords.lat,
        longitude: newMarkerCoords.lng,
        status: formData.status,
        region: formData.region,
        category: formData.category,
        description: formData.description,
        address: formData.address,
        seiProcess: formData.seiProcess,
        images: uploadedImages,
      });

      setLocations(prev => [...prev, newLocation]);
      setNewMarkerCoords(null);
      setMapEditMode(false);
      setUploadedImages([]);
      setFormCategory('outro');
      setFormStatus('success');
      setFormRegion('central');
    } catch (error) {
      console.error('Erro ao salvar local:', error);
      alert('Erro ao salvar o local. Tente novamente.');
    }
  };

  const handleUpdateMarker = async (formData: {
    title: string;
    description: string;
    address: string;
    seiProcess: string;
  }) => {
    if (!editingLocation) return;

    try {
      const updatedLocation = await updateLocation(editingLocation.id, {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        seiProcess: formData.seiProcess,
        status: formStatus,
        region: formRegion,
        category: formCategory,
        images: uploadedImages,
      });

      setLocations(prev => prev.map(l => l.id === updatedLocation.id ? updatedLocation : l));
      setEditingLocation(null);
      setUploadedImages([]);
      setFormCategory('outro');
      setFormStatus('success');
      setFormRegion('central');
    } catch (error) {
      console.error('Erro ao atualizar local:', error);
      alert('Erro ao atualizar o local. Tente novamente.');
    }
  };

  const handleDeleteMarker = async () => {
    if (!editingLocation) return;

    if (!confirm(`Tem certeza que deseja deletar o local "${editingLocation.title}"?`)) {
      return;
    }

    try {
      await deleteLocation(editingLocation.id);
      setLocations(prev => prev.filter(l => l.id !== editingLocation.id));
      setEditingLocation(null);
      setUploadedImages([]);
      setFormCategory('outro');
      setFormStatus('success');
      setFormRegion('central');
    } catch (error) {
      console.error('Erro ao deletar local:', error);
      alert('Erro ao deletar o local. Tente novamente.');
    }
  };

if (isLoading && markers.length === 0) {
return (
<div className="h-screen w-full flex items-center justify-center bg-gray-50 overflow-hidden">
@@ -349,28 +177,17 @@
</div>
)}

        {/* Menu Superior Direito (Apenas Exportação - Botão de Adicionar Pins Removido) */}
<div className="absolute top-6 right-6 z-20 flex gap-2 md:gap-3" style={{ marginTop: dbStatus === 'mock' ? '40px' : '0' }}>
<div className="hidden md:block">
<ExportMenu markers={markers} siteData={locations} selectedRegion={selectedRegion} />
</div>
          <Button
            onClick={() => setMapEditMode(!mapEditMode)}
            className={`${
              mapEditMode
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'
            } text-white transition-all shadow-lg`}
            size="lg"
          >
            {mapEditMode ? <X className="size-4 md:mr-2" /> : <MapPin className="size-4 md:mr-2" />}
            <span className="hidden md:inline">{mapEditMode ? 'Cancelar' : 'Adicionar Pins'}</span>
          </Button>
</div>

{/* Container do Mapa com Barra de Pesquisa */}
<div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-xl md:rounded-2xl overflow-hidden shadow-xl mt-16 md:mt-0 relative flex flex-col">

          {/* 🔍 BARRA DE PESQUISA FLUTUANTE (DARK GLASSMORPHISM + FILTRO DE LAT/LONG ATIVO) */}
          {/* 🔍 BARRA DE PESQUISA FLUTUANTE */}
<div className="absolute top-4 left-4 z-20 w-72 md:w-85 max-w-[calc(100%-2rem)]">
<div className="relative shadow-xl rounded-xl overflow-hidden border border-slate-700/40 bg-slate-900/85 backdrop-blur-md transition-all duration-300 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30">
<span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
@@ -400,285 +217,95 @@
onMarkerClick={handleMarkerClick}
selectedRegion={selectedRegion}
selectedCategory={selectedCategory}
            editMode={mapEditMode}
            onAddMarker={handleMapClick}
            editMode={false} // Sempre false para desativar criação de pins por clique no mapa
/>
</div>
</div>

      {/* New Marker Dialog */}
      <Dialog open={!!newMarkerCoords} onOpenChange={(open) => {
        if (!open) {
          setNewMarkerCoords(null);
          setMapEditMode(false);
          setUploadedImages([]);
          setFormCategory('outro');
          setFormStatus('success');
          setFormRegion('central');
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
      {/* Modal de Visualização do Local (Somente Leitura) */}
      <Dialog open={!!viewingLocation} onOpenChange={(open) => { if (!open) setViewingLocation(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
<DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-teal-600" /> Adicionar Novo Local
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              📍 Detalhes do Local
</DialogTitle>
<DialogDescription>
              Coordenadas: {newMarkerCoords?.lat.toFixed(6)}, {newMarkerCoords?.lng.toFixed(6)}
              Informações e registro fotográfico da vistoria
</DialogDescription>
</DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveNewMarker({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                address: formData.get('address') as string,
                seiProcess: formData.get('seiProcess') as string,
                status: formStatus,
                region: formRegion,
                category: formCategory,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" placeholder="Ex: Parquinho Central" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Tipo de Equipamento *</Label>
              <Select value={formCategory} onValueChange={(value) => setFormCategory(value as LocationCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2"><span>{cat.icon}</span><span>{cat.label}</span></span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Normal</SelectItem>
                    <SelectItem value="warning">⚠️ Atenção</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Região *</Label>
                <Select value={formRegion} onValueChange={setFormRegion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="norte">Santa Maria Norte</SelectItem>
                    <SelectItem value="sul">Santa Maria Sul</SelectItem>
                    <SelectItem value="central">Santa Maria Central</SelectItem>
                    <SelectItem value="santos-dumont">Santos Dumont</SelectItem>
                    <SelectItem value="total-ville">Total Ville</SelectItem>
                    <SelectItem value="porto-rico">Porto Rico</SelectItem>
                    <SelectItem value="polo-jk">Polo JK</SelectItem>
                  </SelectContent>
                </Select>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Título</Label>
              <div className="text-base font-bold text-slate-900 bg-slate-100 p-2.5 rounded-lg border">
                {viewingLocation?.title}
</div>
</div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" placeholder="Ex: Quadra 10, Lote 5" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seiProcess">Processo SEI</Label>
              <Input id="seiProcess" name="seiProcess" placeholder="Ex: 00123.456789/2026-01" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Descreva o local..." rows={3} />
            </div>

            {/* Upload de Fotos com o componente Galeria */}
            <div className="space-y-2">
              <Label>Fotos da Vistoria</Label>
              
              {uploadedImages.length > 0 && (
                <div className="mb-3">
                  <GaleriaVistoria 
                    images={uploadedImages} 
                    onRemoveImage={handleRemoveImage} 
                  />
                </div>
              )}

              <label
                htmlFor="images"
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploadingImage ? 'bg-slate-50 border-slate-300 pointer-events-none' : 'hover:border-teal-500 hover:bg-teal-50'
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="size-5 text-teal-600 animate-spin" />
                    <span className="text-sm text-teal-600 font-medium">Subindo foto para o servidor...</span>
                  </>
                ) : (
                  <>
                    <Camera className="size-5 text-slate-500" />
                    <span className="text-sm text-slate-600 font-medium">
                      {uploadedImages.length > 0 ? `${uploadedImages.length} foto(s) - Adicionar mais` : 'Adicionar fotos da vistoria'}
                    </span>
                  </>
                )}
              </label>
              <input id="images" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setNewMarkerCoords(null)} disabled={isUploadingImage}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white" disabled={isUploadingImage}>
                <Save className="size-4 mr-2" /> Salvar Local
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Marker Dialog 1 */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => { if (!open) setEditingLocation(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="size-5 text-teal-600" /> Editar Local</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateMarker({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                address: formData.get('address') as string,
                seiProcess: formData.get('seiProcess') as string,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input id="edit-title" name="title" defaultValue={editingLocation?.title} required />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Equipamento *</Label>
              <Select value={formCategory} onValueChange={(value) => setFormCategory(value as LocationCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (<SelectItem key={cat.id} value={cat.id}><span className="flex items-center gap-2"><span>{cat.icon}</span><span>{cat.label}</span></span></SelectItem>))}
                </SelectContent>
              </Select>
            </div>

<div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formStatus} onValueChange={(value) => setFormStatus(value as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Normal</SelectItem>
                    <SelectItem value="warning">⚠️ Atenção</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase">Status</Label>
                <div className="text-sm font-medium bg-slate-100 p-2.5 rounded-lg border">
                  {formStatus === 'success' && '✅ Normal'}
                  {formStatus === 'warning' && '⚠️ Atenção'}
                  {formStatus === 'critical' && '🚨 Crítico'}
                </div>
</div>

              <div className="space-y-2">
                <Label>Região *</Label>
                <Select value={formRegion} onValueChange={setFormRegion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="norte">Santa Maria Norte</SelectItem>
                    <SelectItem value="sul">Santa Maria Sul</SelectItem>
                    <SelectItem value="central">Santa Maria Central</SelectItem>
                    <SelectItem value="santos-dumont">Santos Dumont</SelectItem>
                    <SelectItem value="total-ville">Total Ville</SelectItem>
                    <SelectItem value="porto-rico">Porto Rico</SelectItem>
                    <SelectItem value="polo-jk">Polo JK</SelectItem>
                  </SelectContent>
                </Select>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase">Região</Label>
                <div className="text-sm font-medium bg-slate-100 p-2.5 rounded-lg border capitalize">
                  {viewingLocation?.region}
                </div>
</div>
</div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input id="edit-address" name="address" defaultValue={editingLocation?.address} />
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Endereço</Label>
              <div className="text-sm text-slate-800 bg-slate-100 p-2.5 rounded-lg border">
                {viewingLocation?.address || 'Não informado'}
              </div>
</div>

            <div className="space-y-2">
              <Label htmlFor="edit-seiProcess">Processo SEI</Label>
              <Input id="edit-seiProcess" name="seiProcess" defaultValue={editingLocation?.seiProcess} />
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Processo SEI</Label>
              <div className="text-sm text-slate-800 bg-slate-100 p-2.5 rounded-lg border font-mono">
                {viewingLocation?.seiProcess || 'Não informado'}
              </div>
</div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea id="edit-description" name="description" defaultValue={editingLocation?.description} rows={3} />
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Descrição</Label>
              <div className="text-sm text-slate-800 bg-slate-100 p-2.5 rounded-lg border min-h-[70px] whitespace-pre-wrap">
                {viewingLocation?.description || 'Nenhuma descrição informada.'}
              </div>
</div>

            {/* Upload de Fotos na Edição com o componente Galeria */}
            <div className="space-y-2">
              <Label>Fotos da Vistoria</Label>
              
              {uploadedImages.length > 0 && (
                <div className="mb-3">
            {/* Galeria de Fotos em modo leitura (sem botão de lixeira) */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Fotos da Vistoria</Label>
              {uploadedImages.length > 0 ? (
                <div className="bg-slate-50 p-3 rounded-xl border">
<GaleriaVistoria 
images={uploadedImages} 
                    onRemoveImage={handleRemoveImage} 
                    onRemoveImage={() => {}} // Função vazia para desabilitar exclusão de fotos no modo público
/>
</div>
              ) : (
                <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border text-center">
                  Nenhuma foto cadastrada para este local.
                </div>
)}

              <label
                htmlFor="edit-images"
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploadingImage ? 'bg-slate-50 border-slate-300 pointer-events-none' : 'hover:border-teal-500 hover:bg-teal-50'
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="size-5 text-teal-600 animate-spin" />
                    <span className="text-sm text-teal-600 font-medium">Subindo foto para o servidor...</span>
                  </>
                ) : (
                  <>
                    <Camera className="size-5 text-slate-500" />
                    <span className="text-sm text-slate-600 font-medium">
                      {uploadedImages.length > 0 ? `${uploadedImages.length} foto(s) - Adicionar mais` : 'Adicionar fotos da vistoria'}
                    </span>
                  </>
                )}
              </label>
              <input id="edit-images" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
</div>

            <div className="flex gap-2 justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleDeleteMarker} className="border-red-300 text-red-600 hover:bg-red-50" disabled={isUploadingImage}><Trash2 className="size-4 mr-2" /> Deletar</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingLocation(null)} disabled={isUploadingImage}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white" disabled={isUploadingImage}><Save className="size-4 mr-2" /> Salvar Alterações</Button>
              </div>
            <div className="flex justify-end pt-4">
              <Button type="button" onClick={() => setViewingLocation(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                Fechar
              </Button>
</div>
          </form>
          </div>
</DialogContent>
</Dialog>
</div>
);
}
