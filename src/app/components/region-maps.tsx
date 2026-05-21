// Configuração dos mapas por região
// Importe os mapas conforme você adicionar na pasta src/imports/

import mapaCompleto from '../../imports/WhatsApp_Image_2026-05-13_at_14.53.38.jpeg';

// Temporariamente usando o mapa completo - será substituído quando você enviar os mapas
export const regionMaps = {
  complete: mapaCompleto,
  norte: mapaCompleto, // Substituir com mapa Santa Maria Norte
  sul: mapaCompleto,   // Substituir com mapa Santa Maria Sul
  central: mapaCompleto, // Substituir com mapa Santa Maria Central
  'santos-dumont': mapaCompleto, // Substituir com mapa Santos Dumont
  'total-ville': mapaCompleto, // Substituir com mapa Total Ville
  'porto-rico': mapaCompleto, // Substituir com mapa Condomínio Porto Rico
  'polo-jk': mapaCompleto, // Substituir com mapa Polo JK
};

export type RegionKey = keyof typeof regionMaps;
