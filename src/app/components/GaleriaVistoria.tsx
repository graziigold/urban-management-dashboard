import { useState } from 'react';
import { Trash2, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface GaleriaProps {
  images: string[];
  onRemoveImage: (index: number) => void;
}

export function GaleriaVistoria({ images, onRemoveImage }: GaleriaProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerIndex !== null && images.length > 0) {
      // Avança para a próxima ou volta para a primeira se chegar no fim
      setViewerIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerIndex !== null && images.length > 0) {
      // Volta para a anterior ou vai para a última se estiver na primeira
      setViewerIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0));
    }
  };

  return (
    <>
      {/* 1. GRADE DE MINIATURAS NO FORMULÁRIO */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, index) => (
          <div 
            key={index} 
            className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-slate-200"
            onClick={() => setViewerIndex(index)}
          >
            <img
              src={img}
              alt={`Preview ${index + 1}`}
              className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity size-6" />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(index);
              }}
              className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {/* 2. POPUP / CARROSSEL TELA CHEIA (LIGHTBOX) */}
      {viewerIndex !== null && images[viewerIndex] && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center backdrop-blur-sm select-none"
          onClick={() => setViewerIndex(null)}
        >
          {/* Botão Fechar */}
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewerIndex(null); }} 
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all z-10"
          >
            <X className="size-6 md:size-8" />
          </button>

          {/* Seta Esquerda */}
          {images.length > 1 && (
            <button 
              type="button"
              onClick={prevImage} 
              className="absolute left-2 md:left-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full transition-all z-10"
            >
              <ChevronLeft className="size-6 md:size-8" />
            </button>
          )}

          {/* Imagem Ampliada */}
          <img 
            src={images[viewerIndex]} 
            alt={`Ampliada ${viewerIndex + 1}`} 
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Seta Direita */}
          {images.length > 1 && (
            <button 
              type="button"
              onClick={nextImage} 
              className="absolute right-2 md:right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full transition-all z-10"
            >
              <ChevronRight className="size-6 md:size-8" />
            </button>
          )}

          {/* Contador de Fotos */}
          <div className="absolute bottom-4 md:bottom-8 text-white text-sm md:text-base font-medium bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            {viewerIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
