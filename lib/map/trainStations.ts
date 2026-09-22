/**
 * Estaciones del Ferrocarril Roca dentro de la zona de cobertura de la
 * demo (Lanús, Banfield, Lomas de Zamora, Temperley, Turdera, Llavallol).
 * Coordenadas tomadas de Wikipedia (infobox "Ubicación" de cada
 * artículo, es.wikipedia.org/wiki/Estación_<nombre>) -- nunca
 * estimadas ni geocodificadas por aproximación, para no marcar una
 * estación en un lugar equivocado del mapa.
 *
 * Referencia visual únicamente (comparar cercanía a ojo) -- no calcula
 * distancia a ninguna propiedad todavía.
 */
export interface TrainStation {
  name: string;
  line: string;
  latitude: number;
  longitude: number;
}

export const ROCA_LINE_STATIONS: TrainStation[] = [
  { name: "Lanús", line: "Roca", latitude: -34.7074, longitude: -58.3907 },
  { name: "Banfield", line: "Roca", latitude: -34.7434, longitude: -58.3954 },
  { name: "Lomas de Zamora", line: "Roca", latitude: -34.7611, longitude: -58.3974 },
  { name: "Temperley", line: "Roca", latitude: -34.7761, longitude: -58.3963 },
  { name: "Turdera", line: "Roca", latitude: -34.7951, longitude: -58.4079 },
  { name: "Llavallol", line: "Roca", latitude: -34.7971, longitude: -58.43 },
];
