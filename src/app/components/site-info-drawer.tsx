import { useState, useEffect } from 'react';
import { X, ExternalLink, MapPin as MapPinIcon, ImageIcon, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import type { MapMarker } from './map-view';

interface SiteData extends MapMarker {
  description?: string;
  images?: string[];
  seiProcess?: string;
  address?: string;
  lastUpdate?: string;
  createdAt?: string;
  region?: string;
}

interface SiteInfoDrawerProps {
  site: SiteData | null;
  onClose: () => void;
}

const statusLabels = {
  critical: { text: 'Crítico', color: 'bg-red-500' },
  warning: { text: 'Atenção', color: 'bg-yellow-500' },
  success: { text: 'Normal', color: 'bg-green-500' },
};

export function SiteInfoDrawer({ site, onClose }: SiteInfoDrawerProps) {
  // Guardamos o index da imagem ativa. Se for null, o lightbox está fechado.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const hasImages = Array.isArray(site?.images) && site.images.length > 0;
  const totalImages = site?.images?.length || 0;

  // Atalhos de teclado para navegação (Seta Esquerda e Direita)
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
      if (e.key === 'ArrowRight' && lightboxIndex < totalImages - 1) {
        setLightboxIndex(lightboxIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, totalImages]);

  if (!site) return null;

  const currentStatus = site.status && site.status in statusLabels ? site.status : 'success';
  const statusInfo = statusLabels[currentStatus as keyof typeof statusLabels];

  const openInGoogleMaps = () => {
    const lat = site?.lat || 0;
    const lng = site?.lng || 0;
    // ── 🛠️ CORREÇÃO DA URL DO GOOGLE MAPS PARA DIRECIONAR CORRETAMENTE ──
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-50 flex flex-col border-l-2 border-teal-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-teal-500/20 bg-slate-900/50 backdrop-blur-md">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{site.title || 'Sem título'}</h2>
              <Badge className={`${statusInfo.color} text-white border-0 shadow-lg shadow-black/30 px-3 py-1 ring-2 ring-white/20`}>
                {statusInfo.text}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPinIcon className="size-4 text-teal-400" />
              <span className="font-medium">{site.address || 'Endereço não informado'}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 hover:bg-red-500/20 hover:text-red-400 rounded-full ring-1 ring-teal-500/20 hover:ring-red-500/30 transition-all"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Image Gallery */}
            <div>
              <h3 className="text-sm font-bold text-teal-400 mb-3 uppercase tracking-wide">
                Galeria de Imagens (Clique para ampliar)
              </h3>
              {hasImages ? (
                <div className="grid grid-cols-3 gap-3">
                  {site.images!.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => setLightboxIndex(index)} // Abre salvando a posição correta da foto
                      className="aspect-square bg-slate-800 rounded-xl overflow-hidden ring-2 ring-teal-500/20 hover:ring-teal-400/60 transition-all hover:scale-105 shadow-lg cursor-pointer relative group/img"
                    >
                      <img
                        src={image}
                        alt={`${site.title || 'Local'} - Imagem ${index + 1}`}
                        className="size-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/600x600/1e293b/fff?text=Foto+Indisponivel";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="size-5 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-400 gap-2">
                  <ImageIcon className="size-6 text-slate-500" />
                  <span className="text-xs">Nenhuma foto registrada nesta vistoria</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-bold text-teal-400 mb-3 uppercase tracking-wide">
                Descrição
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-teal-500/20">
                {site.description || 'Nenhuma descrição detalhada foi inserida para este equipamento urbano.'}
              </p>
            </div>

            {/* SEI Process Info */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 blur-xl rounded-2xl group-hover:blur-2xl transition-all duration-300" />

              <div className="relative bg-gradient-to-br from-teal-600/20 via-emerald-600/20 to-teal-600/20 border border-teal-500/30 rounded-2xl p-5 shadow-xl ring-1 ring-teal-400/20">
                <h3 className="text-sm font-bold text-teal-300 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <div className="size-2 rounded-full bg-teal-400 animate-pulse shadow-lg shadow-teal-400/50" />
                  Processo SEI
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-teal-400 mb-2 font-bold">
                      Número do Processo
                    </div>
                    <div className="text-sm font-mono text-white bg-slate-800/60 px-4 py-2.5 rounded-lg ring-1 ring-teal-500/20">
                      {site.seiProcess || 'Não vinculado'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-teal-400 mb-2 font-bold">
                      Última Atualização
                    </div>
                    <div className="text-sm text-white font-semibold">
                      {site.lastUpdate || new Date(site.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Region Info */}
            <div className="flex items-center justify-between py-4 border-t border-b border-teal-500/20">
              <span className="text-sm text-slate-400 font-semibold">Região</span>
              <span className="text-sm font-bold text-white">
                {site.region === 'norte' && 'Santa Maria Norte'}
                {site.region === 'sul' && 'Santa Maria Sul'}
                {site.region === 'central' && 'Santa Maria Central'}
                {site.region === 'santos-dumont' && 'Santos Dumont'}
                {site.region === 'total-ville' && 'Total Ville'}
                {site.region === 'porto-rico' && 'Condomínio Porto Rico'}
                {site.region === 'polo-jk' && 'Polo JK'}
                {!['norte', 'sul', 'central', 'santos-dumont', 'total-ville', 'porto-rico', 'polo-jk'].includes(site.region || '') && 'Região Geral'}
              </span>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-teal-500/20">
              <span className="text-sm text-slate-400 font-semibold">Coordenadas</span>
              <span className="text-sm font-mono text-teal-300 font-bold">
                {site?.lat?.toFixed(4) || 0}, {site?.lng?.toFixed(4) || 0}
              </span>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-teal-500/20 bg-slate-900/80 backdrop-blur-md">
          <Button
            onClick={openInGoogleMaps}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-2xl shadow-teal-900/50 ring-2 ring-teal-400/30 hover:ring-teal-400/50 transition-all"
            size="lg"
          >
            <ExternalLink className="size-5 mr-2" />
            Abrir no Google Maps
          </Button>
        </div>
      </div>

      {/* ── 🔍 MODAL LIGHTBOX COM SUPORTE A CARROSSEL E DIALOG DO SHADCN ── */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => { if (!open) setLightboxIndex(null); }}>
        <DialogContent className="max-w-4xl p-1 bg-slate-900/95 border-slate-800 backdrop-blur-md overflow-hidden flex items-center justify-center select-none">
          <DialogTitle className="sr-only">Ampliação da Imagem da Vistoria</DialogTitle>
          
          {lightboxIndex !== null && hasImages && (
            <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center p-2">
              
              {/* Botão Voltar (Esquerda) */}
              {lightboxIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                  className="absolute left-4 z-20 text-white bg-slate-950/70 hover:bg-slate-800 p-3 rounded-full border border-white/10 transition-colors shadow-2xl"
                >
                  <ChevronLeft className="size-6" />
                </button>
              )}

              {/* Imagem Exibida no momento */}
              <img 
                src={site.images![lightboxIndex]} 
                alt={`Foto da vistoria ${lightboxIndex + 1}`} 
                className="w-full h-auto max-h-[78vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/1200x800/1e293b/fff?text=Foto+Indisponivel";
                }}
              />

              {/* Botão Avançar (Direita) */}
              {lightboxIndex < totalImages - 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                  className="absolute right-4 z-20 text-white bg-slate-950/70 hover:bg-slate-800 p-3 rounded-full border border-white/10 transition-colors shadow-2xl"
                >
                  <ChevronRight className="size-6" />
                </button>
              )}

              {/* Botão Fechar Customizado */}
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 z-20 bg-slate-950/80 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-xl border border-white/10"
              >
                <X className="size-5" />
              </button>

              {/* Contador Inferior centralizado */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono text-white/70 bg-slate-950/80 border border-teal-500/30 px-3 py-1 rounded-full backdrop-blur-sm">
                {lightboxIndex + 1} / {totalImages}
              </div>
              
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
