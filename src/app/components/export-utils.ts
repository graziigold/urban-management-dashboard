import { CATEGORIES } from '../utils/categories'; // Ajuste o import se necessário para sua estrutura
import type { MapMarker } from './map-view';

interface SiteData extends MapMarker {
  description?: string;
  seiProcess?: string;
  address?: string;
  lastUpdate?: string;
  createdAt?: string;
}

// Auxiliar para limpar e escapar textos problemáticos em arquivos delimitados (CSV/TSV)
function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  // Remove quebras de linha e substitui aspas duplas internas por simples para não quebrar colunas
  return text.toString().replace(/[\n\r]+/g, ' ').replace(/"/g, "'").trim();
}

// Exportar para CSV (Garante proteção contra vírgulas e aspas no texto da descrição)
export function exportToCSV(markers: MapMarker[], siteData: SiteData[]) {
  const headers = [
    'ID',
    'Título',
    'Região',
    'Status',
    'Latitude',
    'Longitude',
    'Endereço',
    'Processo SEI',
    'Descrição',
    'Última Atualização',
  ];

  const validMarkers = Array.isArray(markers) ? markers : [];
  const validSiteData = Array.isArray(siteData) ? siteData : [];

  const rows = validMarkers.map((marker) => {
    if (!marker) return ['', '', '', '', '', '', '', '', '', ''];
    const site = validSiteData.find((s) => s && s.id === marker.id);
    
    const lat = marker.lat !== undefined ? Number(marker.lat).toFixed(6) : '0.000000';
    const lng = marker.lng !== undefined ? Number(marker.lng).toFixed(6) : '0.000000';

    return [
      marker.id || '',
      sanitizeText(marker.title || 'Sem título'),
      getRegionName(marker.region || ''),
      getStatusName(marker.status || ''),
      lat,
      lng,
      sanitizeText(site?.address),
      sanitizeText(site?.seiProcess),
      sanitizeText(site?.description),
      sanitizeText(site?.lastUpdate || site?.createdAt),
    ];
  });

  // Une as células envolvendo-as em aspas duplas reais, separadas por vírgula
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Adiciona o BOM do UTF-8 para o Excel abrir com acentuação correta em português automaticamente
  const BOM = '\uFEFF';
  downloadFile(BOM + csvContent, 'locais-santa-maria.csv', 'text/csv;charset=utf-8;');
}

// Exportar para Excel (formato TSV seguro com tabulações)
export function exportToExcel(markers: MapMarker[], siteData: SiteData[]) {
  const headers = [
    'ID',
    'Título',
    'Região',
    'Status',
    'Latitude',
    'Longitude',
    'Endereço',
    'Processo SEI',
    'Descrição',
    'Última Atualização',
  ];

  const validMarkers = Array.isArray(markers) ? markers : [];
  const validSiteData = Array.isArray(siteData) ? siteData : [];

  const rows = validMarkers.map((marker) => {
    if (!marker) return ['', '', '', '', '', '', '', '', '', ''];
    const site = validSiteData.find((s) => s && s.id === marker.id);

    const lat = marker.lat !== undefined ? Number(marker.lat).toFixed(6) : '0.000000';
    const lng = marker.lng !== undefined ? Number(marker.lng).toFixed(6) : '0.000000';

    return [
      marker.id || '',
      sanitizeText(marker.title || 'Sem título'),
      getRegionName(marker.region || ''),
      getStatusName(marker.status || ''),
      lat,
      lng,
      sanitizeText(site?.address),
      sanitizeText(site?.seiProcess),
      sanitizeText(site?.description),
      sanitizeText(site?.lastUpdate || site?.createdAt),
    ];
  });

  // TSV (Tab Separated Values) - abre direto no Excel sem misturar colunas
  const tsvContent = [
    headers.join('\t'),
    ...rows.map((row) => row.join('\t')),
  ].join('\n');

  const BOM = '\uFEFF';
  downloadFile(BOM + tsvContent, 'locais-santa-maria.xls', 'application/vnd.ms-excel;charset=utf-8;');
}

// Exportar JSON completo (backup perfeitamente higienizado)
export function exportToJSON(markers: MapMarker[], siteData: SiteData[]) {
  const validMarkers = Array.isArray(markers) ? markers : [];
  const validSiteData = Array.isArray(siteData) ? siteData : [];

  const data = {
    exportDate: new Date().toISOString(),
    totalLocations: validMarkers.length,
    locations: validMarkers.map((marker) => {
      if (!marker) return null;
      const site = validSiteData.find((s) => s && s.id === marker.id);
      return {
        id: marker.id || '',
        title: marker.title || 'Sem título',
        region: marker.region || 'central',
        status: marker.status || 'success',
        coordinates: {
          latitude: marker.lat !== undefined ? Number(marker.lat) : 0,
          longitude: marker.lng !== undefined ? Number(marker.lng) : 0,
        },
        address: site?.address || '',
        seiProcess: site?.seiProcess || '',
        description: site?.description || '',
        lastUpdate: site?.lastUpdate || site?.createdAt || new Date().toISOString(),
      };
    }).filter(Boolean),
  };

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, 'locais-santa-maria.json', 'application/json');
}

// Função auxiliar para download nativo no navegador
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helpers para exibição e nomes amigáveis no Excel
function getRegionName(region: string): string {
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
  return names[region] || region || 'Geral';
}

function getStatusName(status: string): string {
  const names: Record<string, string> = {
    critical: 'Crítico',
    warning: 'Atenção',
    success: 'Normal',
  };
  return names[status] || status || 'Normal';
}
