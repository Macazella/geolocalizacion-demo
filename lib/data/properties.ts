import type { PublicProperty, Location } from "@/types/property";
import rawProperties from "@/data/public_demo_dataset.json";
import rawLocations from "@/data/locations.json";

// El dataset es estático (generado offline por el repo privado --
// nunca se lee Golden ni ningún engine desde este runtime). Import
// directo de JSON: sin fetch, sin API, sin base de datos (P1, §0/§57).
const properties = rawProperties as PublicProperty[];
const locations = rawLocations as Location[];

export function getAllProperties(): PublicProperty[] {
  return properties;
}

export function getLocations(): Location[] {
  return locations;
}

export function getPropertyById(publicId: string): PublicProperty | undefined {
  return properties.find((p) => p.public_id === publicId);
}

export function getAllPublicIds(): string[] {
  return properties.map((p) => p.public_id);
}
