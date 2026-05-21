import type { MapMarker } from './map-view';

interface SiteData extends MapMarker {
  description: string;
  seiProcess: string;
  address: string;
  lastUpdate: string;
}

// Exportar para CSV
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

  const rows = markers.map((marker) => {
    const site = siteData.find((s) => s.id === marker.id);
    return [
      marker.id,
      marker.title,
      getRegionName(marker.region),
      getStatusName(marker.status),
      marker.lat.toFixed(6),
      marker.lng.toFixed(6),
      site?.address || '',
      site?.seiProcess || '',
      site?.description || '',
      site?.lastUpdate || '',
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  downloadFile(csv, 'locais-santa-maria.csv', 'text/csv');
}

// Exportar para Excel (formato TSV para compatibilidade)
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

  const rows = markers.map((marker) => {
    const site = siteData.find((s) => s.id === marker.id);
    return [
      marker.id,
      marker.title,
      getRegionName(marker.region),
      getStatusName(marker.status),
      marker.lat.toFixed(6),
      marker.lng.toFixed(6),
      site?.address || '',
      site?.seiProcess || '',
      site?.description || '',
      site?.lastUpdate || '',
    ];
  });

  // TSV (Tab Separated Values) - abre direto no Excel
  const tsv = [
    headers.join('\t'),
    ...rows.map((row) => row.join('\t')),
  ].join('\n');

  downloadFile(tsv, 'locais-santa-maria.xls', 'application/vnd.ms-excel');
}

// Exportar JSON completo (backup/integração)
export function exportToJSON(markers: MapMarker[], siteData: SiteData[]) {
  const data = {
    exportDate: new Date().toISOString(),
    totalLocations: markers.length,
    locations: markers.map((marker) => {
      const site = siteData.find((s) => s.id === marker.id);
      return {
        id: marker.id,
        title: marker.title,
        region: marker.region,
        status: marker.status,
        coordinates: {
          latitude: marker.lat,
          longitude: marker.lng,
        },
        address: site?.address || '',
        seiProcess: site?.seiProcess || '',
        description: site?.description || '',
        lastUpdate: site?.lastUpdate || '',
      };
    }),
  };

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, 'locais-santa-maria.json', 'application/json');
}

// Função auxiliar para download
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

// Helper para nomes legíveis
function getRegionName(region: string): string {
  const names: Record<string, string> = {
    norte: 'Santa Maria Norte',
    sul: 'Santa Maria Sul',
    central: 'Santa Maria Central',
    'santos-dumont': 'Santos Dumont',
    'total-ville': 'Total Ville',
    'porto-rico': 'Condomínio Porto Rico',
    'polo-jk': 'Polo JK',
  };
  return names[region] || region;
}

function getStatusName(status: string): string {
  const names: Record<string, string> = {
    critical: 'Crítico',
    warning: 'Atenção',
    success: 'Normal',
  };
  return names[status] || status;
}
