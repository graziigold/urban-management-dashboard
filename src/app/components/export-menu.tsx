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

interface ExportMenuProps {
  markers: MapMarker[];
  siteData: any[];
  selectedRegion: string | null;
}

export function ExportMenu({ markers, siteData, selectedRegion }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Garante que o filtro não quebre caso a listagem venha vazia ou nula temporariamente
  const safeMarkers = Array.isArray(markers) ? markers : [];

  const filteredMarkers = selectedRegion
    ? safeMarkers.filter((m) => m && (m.region === selectedRegion || getRegionText(m.region) === selectedRegion))
    : safeMarkers;

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
    
    // Mapeamento idêntico ao banco do Supabase e ao arquivo de mapas regionais
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
      <DropdownMenuContent align="end" className="w-64 bg-slate-900/98 backdrop-blur-xl border-2 border-teal-500/30 shadow-2xl ring-1 ring-teal-400/20">
        <div className="px-3 py-2 border-b border-teal-500/20">
          <p className="text-xs text-slate-400 font-semibold">
            Exportar {filteredMarkers.length} {filteredMarkers.length === 1 ? 'local' : 'locais'}
            {regionText}
          </p>
        </div>

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
