// Configuração dos mapas por região
// Importe os mapas conforme você adicionar na pasta src/imports/

import mapaCompleto from '../../imports/WhatsApp_Image_2026-05-13_at_14.53.38.jpeg';

// Mapeamento protegido aceitando tanto o formato interno (slug) quanto o formato real salvo no banco do Supabase
export const regionMaps = {
  complete: mapaCompleto,
  
  // Santa Maria Norte
  norte: mapaCompleto,
  'Santa Maria Norte': mapaCompleto,
  
  // Santa Maria Sul
  sul: mapaCompleto,
  'Santa Maria Sul': mapaCompleto,
  
  // Santa Maria Central / Central
  central: mapaCompleto,
  'Santa Maria Central': mapaCompleto,
  
  // Santos Dumont
  'santos-dumont': mapaCompleto,
  'Santos Dumont': mapaCompleto,
  
  // Total Ville
  'total-ville': mapaCompleto,
  'Total Ville': mapaCompleto,
  
  // Condomínio Porto Rico (Sincronizado exatamente com o seu print do banco!)
  'porto-rico': mapaCompleto,
  'Condomínio Porto Rico': mapaCompleto,
  'porto_rico': mapaCompleto,
  
  // Polo JK
  'polo-jk': mapaCompleto,
  'Polo JK': mapaCompleto,
};

export type RegionKey = keyof typeof regionMaps;
