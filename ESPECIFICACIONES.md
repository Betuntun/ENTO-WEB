# Especificaciones técnicas — ENTO Web

## 1. Resumen del proyecto

Sitio web de catálogo de productos para ENTO (Aislantes e Ingeniería) — accesorios y aislantes para equipos de media y baja tensión. Sitio **sin backend**, con productos organizados por **marca** y, en el caso de Chardón, también por **grupo**.

- **Arquitectura:** Angular
- **Presupuesto:** $5,000 MXN (anticipo de $2,500 MXN)
- **Plazo:** 4 semanas (la última semana se reserva para pruebas, validación y ajustes finales)
- **Entrega de avance:** demo el viernes siguiente a la reunión del 21-ago-2026

## 2. Arquitectura técnica

- **Angular** (última versión estable) con `@angular/ssr` en modo **prerender/SSG** para que el contenido sea indexable por buscadores sin necesitar backend en producción.
- **Sin backend:** los datos se sirven como **JSON estático** en `src/assets/data/` (`products.json`, `brands.json`, `groups.json`), cargados vía `HttpClient`.
- **Hosting:** build estático genérico, desplegable en cualquier proveedor de hosting estático (Netlify, Vercel, hosting compartido, etc.). El prerender resuelve el SEO sin depender de un servidor Node corriendo en producción.
- Diseño responsive (mobile-first), replicando el layout de las capturas: header con buscador y nav, hero, secciones de marca, carrusel de marcas, footer con contacto/ubicación.

## 3. Modelo de datos

```
Brand {
  id: string
  name: string
  logoUrl: string
  hasGroups: boolean       // true solo para Chardón
}

Group {
  id: string
  brandId: string          // solo existen grupos para Chardón
  name: string
}

Product {
  id: string
  name: string
  brandId: string
  groupIds: string[]       // vacío si la marca no usa grupos; puede tener más de un id
  imageUrl: string
  featured?: boolean        // para las secciones "más vendidas" del home
}
```

**Reglas de negocio:**
- Un producto de Chardón puede pertenecer a **varios grupos a la vez** (`groupIds.length > 1`).
- En el listado de Chardón, **cuando no hay filtro de grupo activo**, los productos que pertenecen a múltiples grupos se muestran primero; el resto conserva el orden original.

## 4. Páginas y componentes

### Home
- Header: logo, buscador, navegación ("Productos", "Contacto").
- Hero con imagen de producto y texto de posicionamiento.
- 3 secciones de marca destacada (grid de 4 productos + tarjeta "VER MÁS").
- Carrusel de "marcas destacadas" con **movimiento continuo, sin pausa al pasar el mouse**.
- Footer: contacto (WhatsApp/teléfonos con enlaces `tel:`/`wa.me`, correo), ubicación con enlace a mapa.

### Listado de productos
- Sidebar de filtros:
  - Filtro por **marca** (single-select).
  - Filtro por **grupo**, visible únicamente cuando la marca seleccionada es Chardón.
- Grid de resultados.
- **Scroll infinito** (ver sección 6) en lugar de paginador numerado, como primera prueba.

### Buscador
- Filtra dinámicamente conforme el usuario escribe (no depende de presionar Enter).
- Al navegar/enviar, lleva al listado de productos con el término ya aplicado como filtro (query param).

### Botones de contacto
- Botón de WhatsApp **fijo en pantalla durante el scroll** (sticky/floating).
- Botones "cotizar" y "contacto" redirigen a WhatsApp (`https://wa.me/...`).
- Botones "VER MÁS" de las 3 marcas destacadas del home navegan al listado con el filtro de esa marca ya aplicado.

## 5. Lógica de filtrado

- Filtro por marca: siempre visible.
- Filtro por grupo: solo aparece si la marca activa es Chardón (única marca con grupos).
- Búsqueda por texto combinable con los filtros de marca/grupo.
- Orden especial en Chardón sin filtro de grupo: productos multi-grupo primero (ver sección 3).

## 6. Scroll infinito (prueba inicial, reemplazo del paginador)

- No es scroll infinito indefinido: carga el listado filtrado **en lotes** (por ejemplo, 20 productos) a medida que el usuario se acerca al final del grid.
- Se **detiene al agotar el total real** de productos que cumplen el filtro activo — sin repetir productos ni generar contenido de más.
- Implementación sugerida: `IntersectionObserver` sobre un elemento sentinel al final del grid.

## 7. SEO

- Prerender de rutas (home, listado por marca/grupo) vía Angular SSG.
- `Title` y `Meta` service de Angular para title/description/OG por página.
- `sitemap.xml` y `robots.txt` estáticos generados en build.
- Datos estructurados (JSON-LD `Product` / `Organization`) donde aplique.
- Atributos `alt` descriptivos en imágenes de producto.

## 8. Diseño y assets

- Tipografías: **Inter** (texto general) y **Manrope** (secciones específicas, a definir por el PM). Self-hosted una vez se reciba el archivo fuente.
- Paleta: negro/rojo corporativo, consistente con las capturas entregadas.
- **113 imágenes de producto** con fondo removido (transparente) — pendientes de compartir vía Google Drive. Mientras tanto se usan las imágenes de las capturas como referencia/placeholder; el modelo de datos ya soporta el reemplazo sin cambios de código.
- Logos de marcas para el carrusel — pendientes, incluye actualización del logo "ENTO".
- Enlace de ubicación (Google Maps) — pendiente de URL corregida.

## 9. Fuera de alcance (fase 1)

- Panel de administración o autogestión de productos por el cliente (mejora futura, con costo adicional).
- Cualquier backend/API — todo el contenido es estático, generado en build time.

## 10. Plan de desarrollo por fases

Distribuido sobre las 4 semanas acordadas (semana 4 reservada para pruebas/ajustes finales).

### Fase 0 — Setup del proyecto (días 1-2)
- Crear el proyecto con `ng new ento-web` (standalone components, routing habilitado).
- Añadir `@angular/ssr` (`ng add @angular/ssr`) y configurar el modo prerender/SSG.
- Definir estructura de carpetas: `core/` (servicios, modelos), `features/home`, `features/products`, `shared/` (componentes reutilizables: card de producto, botón WhatsApp, buscador).
- Configurar linting/formato (ESLint + Prettier) y convenciones de nombres.
- Configurar fuentes Inter/Manrope self-hosted (con placeholders hasta recibir el archivo fuente de Manrope) y variables de diseño (colores, tipografía) en un archivo de estilos global.
- Dejar listo el repositorio Git con `.gitignore` y commit inicial.

### Fase 1 — Datos y modelos (días 2-3)
- Definir los `interfaces`/`types` de `Brand`, `Group`, `Product` (sección 3).
- Crear `products.json`, `brands.json`, `groups.json` en `src/assets/data/` con datos de ejemplo tomados de las capturas (mientras llegan las imágenes/datos reales del Drive).
- Crear `DataService` (o `ProductService`/`BrandService`) con métodos para cargar y consultar productos, marcas y grupos vía `HttpClient`.
- Implementar la regla de orden de Chardón (productos multi-grupo primero sin filtro activo).

### Fase 2 — Home (días 4-7)
- Header: logo, buscador (con lógica de filtrado dinámico), navegación.
- Hero con contenido estático del layout.
- Secciones de marca destacada (grid de 4 + "VER MÁS" enlazando al listado filtrado por esa marca).
- Carrusel de marcas destacadas con scroll continuo automático (sin pausa al hover).
- Footer con enlaces `tel:`/`wa.me`/correo y enlace de ubicación (placeholder hasta recibir URL corregida).
- Botón de WhatsApp flotante fijo, visible en toda la navegación.

### Fase 3 — Listado de productos y filtros (días 8-12)
- Página de listado con sidebar de filtros: marca (single-select) y grupo (condicional a Chardón).
- Grid de resultados reactivo a los filtros y a la búsqueda por texto.
- Scroll infinito por lotes sobre el listado filtrado (sección 6), con `IntersectionObserver`.
- Sincronización de filtros con query params (para que "VER MÁS" y el buscador del home naveguen con el filtro ya aplicado).

### Fase 4 — SEO y rendimiento (días 13-15)
- Configurar `Title`/`Meta` por ruta.
- Generar `sitemap.xml` y `robots.txt` en build.
- Añadir JSON-LD (`Organization`, `Product`) donde aplique.
- Revisar prerender de todas las rutas relevantes (home, listado por marca/grupo).
- Optimización de imágenes (lazy loading, `srcset` si aplica) y auditoría Lighthouse.

### Fase 5 — Integración de assets reales (cuando lleguen del Drive)
- Reemplazar imágenes placeholder por las 113 imágenes con fondo removido.
- Actualizar logos de marcas (incluye logo "ENTO" actualizado).
- Aplicar tipografía Manrope definitiva una vez llegue el archivo fuente y las secciones exactas donde se usa.
- Corregir enlace de ubicación con la URL de Maps que envíe el PM.

### Fase 6 — Pruebas, ajustes y entrega (semana 4)
- Pruebas manuales de navegación, filtros, búsqueda dinámica y scroll infinito en distintos dispositivos/breakpoints.
- Validación de SEO (metatags, sitemap, datos estructurados) y de los enlaces de contacto (WhatsApp, teléfono, mapa).
- Ajustes visuales finos de tipografía/espaciado según feedback del PM.
- Build final de producción y despliegue en el hosting estático elegido.
- Entrega y demo final.

## 11. Pendientes / dependencias externas

- [ ] Carpeta de Google Drive con las 113 imágenes de producto y logos.
- [ ] Archivo fuente de la tipografía Manrope.
- [ ] Nombres exactos de las fuentes/secciones donde aplica cada tipografía.
- [ ] URL corregida de ubicación (Google Maps).
- [ ] Confirmar si el filtro de grupo de Chardón es single-select o multi-select.
## git
https://github.com/Betuntun/ENTO-WEB.git