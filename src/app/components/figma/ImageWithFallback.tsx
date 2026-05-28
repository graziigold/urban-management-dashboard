"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContentCustom, DialogTitle } from '../ui/dialog'; // Importando seu componente customizado protegido

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className, ...rest } = props;

  // Fecha o modal ao pressionar a tecla Esc de forma manual e segura
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Imagem miniatura exibida dentro do formulário de Santa Maria */}
      <img
        src={src}
        alt={alt}
        className={`${className ?? ''} cursor-pointer hover:brightness-90 transition-all`}
        style={style}
        {...rest}
        onError={handleError}
        onClick={(e) => {
          e.stopPropagation(); // Evita que o clique feche ou submeta o card de edição pai
          e.preventDefault();
          setIsOpen(true);
        }}
      />

      {/* ── INTERFACE DE ZOOM VIA DIALOG CONTENT CUSTOM ── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
       
        <DialogContentCustom 
          className="!fixed !top-[50%] !left-[50%] !translate-x-[-50%] !translate-y-[-50%] !max-w-4xl p-2 bg-slate-950/95 border-slate-800 shadow-2xl flex items-center justify-center select-none !z-[999] [&>button]:text-white [&>button]:bg-slate-900/80 [&>button]:p-2 [&>button]:rounded-full [&>button]:hover:bg-red-600 [&>button]:transition-colors [&>button]:border [&>button]:border-white/10 [&>button]:cursor-pointer"
        >
          <DialogTitle className="sr-only">Visualização Expandida da Foto da Vistoria</DialogTitle>
          
          <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center p-2">
            <img 
              src={src} 
              alt={alt || "Foto ampliada"} 
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-200"
            />
          </div>
        </DialogContentCustom>
      </Dialog>
    </>
  );
}
