import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { exportToCSV, exportToExcel, exportToJSON } from './export-utils';
import type { MapMarker } from './map-view';
import type { Location } from '../utils/api/locations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportMenuProps {
  markers: MapMarker[];
  siteData: Location[];
  selectedRegion: string | null;
}

export function ExportMenu({ markers, siteData, selectedRegion }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  const safeMarkers = Array.isArray(markers) ? markers : [];

  const filteredMarkers = selectedRegion
    ? safeMarkers.filter((m) => m && (m.region === selectedRegion || getRegionText(m.region) === selectedRegion))
    : safeMarkers;

  // ── GERADOR DE PDF PROFISSIONAL DE URGÊNCIAS ──
  const exportUrgentPDF = () => {
    // Pega apenas os locais marcados como urgentes na base de dados
    const urgentData = (siteData || []).filter(loc => loc && loc.isUrgent);

    if (urgentData.length === 0) {
      alert('Nenhuma demanda urgente cadastrada no momento! 🎉');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── CABEÇALHO INSTITUCIONAL ──
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('GEOPARQUES SM — SISTEMA DE GESTÃO URBANA', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Santa Maria - DF | Relatório Oficial de Demandas Urgentes', 14, 20);

    // ── SUMÁRIO EXECUTIVO ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text('SUMÁRIO EXECUTIVO DE ALERTAS', 14, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 44);
    doc.text(`Total de Ocorrências Críticas / Urgentes: ${urgentData.length}`, 14, 50);

    // ── TABELA DE DADOS ──
    const tableRows = urgentData.map((loc, index) => [
      index + 1,
      loc.title || 'Sem título',
      (loc.category || 'Outro').toUpperCase(),
      (loc.region || 'Geral').toUpperCase(),
      loc.address || 'Endereço não informado',
      loc.seiProcess || 'Não vinculado'
    ]);

    autoTable(doc, {
      startY: 56,
      head: [['#', 'Equipamento / Local', 'Categoria', 'Região', 'Endereço', 'Processo SEI']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 38, 38], // Vermelho de alerta
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 32 },
        3: { cellWidth: 28 },
        4: { cellWidth: 45 },
        5: { cellWidth: 33 }
      },
      alternateRowStyles: {
        fillColor: [254, 242, 242] // Vermelho clarinho alternado
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        textColor: [30, 41, 59]
      },
    });

    // ── RODAPÉ DAS PÁGINAS ──
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} — Gerado pelo Sistema GeoParques SM`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`Relatorio_Urgencias_GeoParques_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    setIsExporting(true);

    try {
      switch (format) {
        case 'csv':
          exportToCSV(filteredMarkers, siteData);
          break;
        case 'excel':
          exportToExcel(filteredMarkers, siteData);
          break;
        case 'json':
          exportToJSON(filteredMarkers, siteData);
          break;
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  function getRegionText(region: string | null | undefined): string {
    if (!region) return 'Geral';
    const names: Record<string, string> = {
      norte: 'Santa Maria Norte',
      'Santa Maria Norte': 'Santa Maria Norte',
      sul: 'Santa Maria Sul',
      'Santa Maria Sul': 'Santa Maria Sul',
      central: 'Santa Maria Central',
      'Santa Maria Central': 'Santa Maria Central',
      'santos-dumont': 'Santos Dumont',
      'Santos Dumont': 'Santos Dumont',
      'total-ville': 'Total Ville',
      'Total Ville': 'Total Ville',
      'porto-rico': 'Condomínio Porto Rico',
      'Condomínio Porto Rico': 'Condomínio Porto Rico',
      'polo-jk': 'Polo JK',
      'Polo JK': 'Polo JK',
    };
    return names[region] || region;
  }

  const regionText = selectedRegion ? ` - ${getRegionText(selectedRegion)}` : '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-slate-900/50 hover:bg-slate-800 border-2 border-teal-500/30 text-white hover:border-teal-400/50 hover:scale-105 transition-all ring-1 ring-teal-400/20"
          disabled={isExporting}
        >
          <Download className="size-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar'}
          <ChevronDown className="size-4 ml-2 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-68 bg-slate-900/98 backdrop-blur-xl border-2 border-teal-500/30 shadow-2xl ring-1 ring-teal-400/20 z-50">
        <div className="px-3 py-2 border-b border-teal-500/20">
          <p className="text-xs text-slate-400 font-semibold">
            Exportar {filteredMarkers.length} {filteredMarkers.length === 1 ? 'local' : 'locais'}
            {regionText}
          </p>
        </div>

        {/* 🚨 NOVO ITEM: RELATÓRIO DE URGÊNCIAS EM PDF */}
        <DropdownMenuItem
          onClick={exportUrgentPDF}
          className="cursor-pointer py-3 hover:bg-red-950/40 text-slate-200 focus:bg-red-950/40 focus:text-white border-b border-slate-800"
        >
          <FileText className="size-4 mr-3 text-red-500" />
          <div className="flex-1">
            <div className="font-semibold text-sm text-red-400">Relatório Urgentes (.pdf)</div>
            <div className="text-xs text-slate-400">Tabela estilizada com alertas críticos</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          className="cursor-pointer py-3 hover:bg-emerald-600/20 text-slate-200 focus:bg-emerald-600/20 focus:text-white"
        >
          <FileSpreadsheet className="size-4 mr-3 text-emerald-400" />
          <div className="flex-1">
            <div className="font-semibold text-sm">Excel (.xls)</div>
            <div className="text-xs text-slate-400">Abre no Microsoft Excel</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          className="cursor-pointer py-3 hover:bg-blue-600/20 text-slate-200 focus:bg-blue-600/20 focus:text-white"
        >
          <FileText className="size-4 mr-3 text-blue-400" />
          <div className="flex-1">
            <div className="font-semibold text-sm">CSV (.csv)</div>
            <div className="text-xs text-slate-400">Compatível com Google Sheets</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-teal-500/20" />

        <DropdownMenuItem
          onClick={() => handleExport('json')}
          className="cursor-pointer py-3 hover:bg-purple-600/20 text-slate-200 focus:bg-purple-600/20 focus:text-white"
        >
          <FileJson className="size-4 mr-3 text-purple-400" />
          <div className="flex-1">
            <div className="font-semibold text-sm">JSON (.json)</div>
            <div className="text-xs text-slate-400">Backup / Integração API</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
