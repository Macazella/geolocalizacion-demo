# Property Intelligence AR — Demo pública

Buscador inmobiliario que reúne publicaciones de múltiples fuentes,
identifica anuncios repetidos y ayuda a comparar opciones sobre un
mapa con ubicaciones verificadas.

Esta es la **demo pública** del producto — cubre dos zonas del Gran
Buenos Aires (Lomas de Zamora y Lanús) con un dataset sanitizado y
generado periódicamente. No requiere cuenta para buscar, guardar
favoritos o ver historial de precio.

## Qué hace

- **Un solo buscador** sobre publicaciones agregadas de varios
  portales inmobiliarios.
- **Detección de duplicados**: cuando la misma propiedad aparece en
  más de una fuente, se muestra como una sola ficha ("Publicado en N
  fuentes"), nunca como anuncios repetidos sin relacionar.
- **Mapa con ubicaciones verificadas**: solo se muestra un marker
  cuando la ubicación tiene evidencia suficiente (dirección exacta o
  aproximada) — nunca se pone un punto en el mapa a partir del
  centroide de una localidad como si fuera el domicilio real.
- **Historial de precio** por propiedad, cuando hay más de una
  observación registrada.
- **Favoritos** guardados en el navegador (sin necesidad de cuenta en
  esta demo).

## Arquitectura (frontend)

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**.
- **Leaflet** + clustering para el mapa (tiles de OpenStreetMap, sin
  API key).
- Dataset estático (`data/public_demo_dataset.json`), generado
  offline y sanitizado — esta app **no se conecta a ninguna base de
  datos ni servicio backend**. Es 100% estática, apta para desplegar
  en Vercel sin configuración adicional.
- Favoritos: `localStorage`, sin autenticación.

```
app/                rutas (landing, /buscar, /propiedad/[id], /favoritos)
components/         componentes de UI (search, filters, property, map, layout)
lib/                lógica de datos/filtros/formatters, sin dependencias externas
types/              contrato de datos público (PublicProperty)
data/               dataset estático sanitizado + catálogo de zonas
tests/              tests del contrato de datos, filtros, mapa y ficha
```

## Cómo correr localmente

```bash
npm install
npm run dev
```

```bash
npm run build   # build de producción
npm test        # suite de tests
npm run lint    # ESLint
```

## Sobre el dataset

El dataset que consume esta demo es un **export sanitizado**,
generado por un proceso separado (no público) a partir de una fuente
de datos privada. Contiene únicamente los campos necesarios para
mostrar cada propiedad — nunca metadatos internos de cómo se
recolectó, comparó o verificó cada dato. Se actualiza periódicamente,
no en tiempo real.

## Lo que esta demo NO es

No es un scraper, no expone ninguna lógica de recolección de datos ni
de identificación de duplicados — esas capacidades viven en una
plataforma privada separada. Esta demo es exclusivamente la capa de
producto orientada al usuario final.
