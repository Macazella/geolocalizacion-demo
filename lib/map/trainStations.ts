/**
 * Estaciones del Ferrocarril Roca dentro de la zona de cobertura de la
 * demo (Lanús/Banfield/Lomas de Zamora/Temperley/Turdera/Llavallol +
 * Avellaneda/Gerli/Sarandí/Remedios de Escalada, agregadas 2026-09-27
 * cuando Maga notó que faltaban tras la ampliación de scope del
 * 2026-09-23 -- ver config/search_scope.yaml en GEOLOCALIZACCION).
 * Coordenadas tomadas de Wikipedia (infobox "Ubicación" de cada
 * artículo, es.wikipedia.org/wiki/Estación_<nombre>) -- nunca
 * estimadas ni geocodificadas por aproximación, para no marcar una
 * estación en un lugar equivocado del mapa.
 *
 * Referencia visual únicamente (comparar cercanía a ojo) -- no calcula
 * distancia a ninguna propiedad todavía.
 *
 * MANTENER EN SINCRO con GEOLOCALIZACCION/db/compute_train_station_distances.py
 * -- dos repos separados, no hay una fuente única compartida.
 */
export interface TrainStation {
  name: string;
  line: string;
  latitude: number;
  longitude: number;
}

export const ROCA_LINE_STATIONS: TrainStation[] = [
  // Avellaneda es el nombre historico/de la localidad -- el nombre
  // oficial actual de la estacion es "Dario Santillan y Maximiliano
  // Kosteki" (renombrada en homenaje, ver Wikipedia), tambien sirve a
  // Pineyro.
  { name: "Avellaneda (Santillán y Kosteki)", line: "Roca", latitude: -34.6619, longitude: -58.3767 },
  { name: "Gerli", line: "Roca", latitude: -34.6853, longitude: -58.3825 },
  { name: "Sarandí", line: "Roca", latitude: -34.6789, longitude: -58.345 },
  { name: "Remedios de Escalada", line: "Roca", latitude: -34.7269, longitude: -58.3942 },
  { name: "Lanús", line: "Roca", latitude: -34.7074, longitude: -58.3907 },
  { name: "Banfield", line: "Roca", latitude: -34.7434, longitude: -58.3954 },
  { name: "Lomas de Zamora", line: "Roca", latitude: -34.7611, longitude: -58.3974 },
  { name: "Temperley", line: "Roca", latitude: -34.7761, longitude: -58.3963 },
  { name: "Turdera", line: "Roca", latitude: -34.7951, longitude: -58.4079 },
  { name: "Llavallol", line: "Roca", latitude: -34.7971, longitude: -58.43 },
];
