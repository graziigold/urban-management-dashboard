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

  // ── GERADOR DE RELATÓRIO PDF EXECUTIVO (Nativo e Blindado contra Erros no Vercel) ──
  const exportUrgentPDF = () => {
    const urgentData = (siteData || []).filter(loc => loc && loc.isUrgent);

    if (urgentData.length === 0) {
      alert('Nenhuma demanda urgente cadastrada no momento! 🎉');
      return;
    }

    // Cria uma nova janela de impressão limpa e formatada como documento oficial
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permita pop-ups no seu navegador para gerar o relatório.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Urgências - GeoParques SM</title>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header { background-color: #0f172a; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 18px; letter-spacing: 0.5px; }
          .header p { margin: 5px 0 0 0; color: #94a3b8; font-size: 12px; }
          .summary { margin-bottom: 20px; font-size: 13px; color: #334155; }
          .summary p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #dc2626; color: white; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
          td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #1e293b; }
          tr:nth-child(even) { background-color: #fef2f2; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #64748b; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GEOPARQUES SM — SISTEMA DE GESTÃO URBANA</h1>
          <p>Santa Maria - DF | Relatório Oficial de Demandas Críticas e Urgentes</p>
        </div>

        <div class="summary">
          <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          <p><strong>Total de Ocorrências Urgentes:</strong> ${urgentData.length}</p>
          ${selectedRegion ? `<p><strong>Região Filtrada:</strong> ${getRegionText(selectedRegion)}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Equipamento / Local</th>
              <th>Categoria</th>
              <th>Região</th>
              <th>Endereço</th>
              <th>Processo SEI</th>
            </tr>
          </thead>
          <tbody>
            ${urgentData.map((loc, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${loc.title || 'Sem título'}</strong></td>
                <td>${(loc.category || 'Outro').toUpperCase()}</td>
                <td>${(loc.region || 'Geral').toUpperCase()}</td>
                <td>${loc.address || 'Não informado'}</td>
                <td>${loc.seiProcess || 'Não vinculado'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Gerado pelo Sistema GeoParques SM — Documento Oficial de Vistoria Urbana
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

        {/* RELATÓRIO DE URGÊNCIAS */}
        <DropdownMenuItem
          onClick={exportUrgentPDF}
          className="cursor-pointer py-3 hover:bg-red-950/40 text-slate-200 focus:bg-red-950/40 focus:text-white border-b border-slate-800"
        >
          <FileText className="size-4 mr-3 text-red-500" />
          <div className="flex-1">
            <div className="font-semibold text-sm text-red-400">Relatório Urgentes (.pdf)</div>
            <div className="text-xs text-slate-400">Gera visualização de impressão e PDF</div>
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
