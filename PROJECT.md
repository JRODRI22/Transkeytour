# PROJECT.md — Transkeytour Bocas Tours

## 1. Descripción general
Landing page profesional para paquetes turísticos desde San Carlos, Costa Rica a Bocas del Toro, Panamá.

**Tipo:** Static Website (HTML/CSS/JS puro)  
**Objetivo:** Captar reservas vía WhatsApp para tours del 16-19 Julio 2026

## 2. Componentes principales
- **Hero Section:** Banner con imagen de fondo de Bocas del Toro
- **Galería:** 6 fotos profesionales con lightbox interactivo
- **Información del Tour:** Qué incluye, destinos, precios, requisitos
- **Formulario de Contacto:** Integrado con WhatsApp
- **Responsive Design:** Mobile-first, 100% adaptable

## 3. Funcionalidades implementadas ✅
- [x] Landing page responsive (mobile, tablet, desktop)
- [x] Galería de imágenes con lightbox
- [x] Hero con imagen de fondo real
- [x] 6 destinos con fotos de fondo
- [x] Formulario que envía a WhatsApp
- [x] Menú móvil hamburguesa
- [x] Smooth scroll entre secciones
- [x] Animaciones al scroll
- [x] Botón scroll-to-top
- [ ] Configurar número de WhatsApp real
- [ ] Reemplazar fotos placeholder con del tour real
- [ ] Deploy a hosting (Netlify/GitHub Pages)

## 4. Información del tour
- **Destino:** Bocas del Toro, Panamá
- **Origen:** San Carlos (salidas desde Rio Cuarto, Venecia, Aguas Zarcas, Pital)
- **Fechas:** 16-19 Julio 2026 (4 días, 3 noches)
- **Precio adulto:** ₡150.000
- **Precio niño (5-10 años):** ₡120.000
- **Apartado:** ₡25.000

**Incluye:**
- Transporte terrestre (Hyundai County) y marítimo
- 3 noches en habitación privada
- 3 desayunos completos
- 2 días de tours (6 destinos)
- Guías certificados

**Destinos:**
1. Playa de las Estrellas
2. Bahía de los Delfines
3. Snorkeling en Cayo Coral
4. Hollywood Reef
5. Parque Marino Isla Zapatilla
6. Hotel Punta Caracol (avistamiento)

## 5. Configuración técnica
- **Stack:** HTML5 + CSS3 + Vanilla JavaScript
- **Fuentes:** Google Fonts (Poppins, Playfair Display)
- **Imágenes:** Unsplash API (placeholders - reemplazar con fotos reales)
- **WhatsApp:** Por configurar en `script.js` línea ~208
- **Hosting:** Por definir (Netlify recomendado)

## 6. Archivos del proyecto
```
Turismo/
├── index.html          # Estructura principal
├── styles.css          # Estilos responsive
├── script.js           # Interactividad + lightbox
├── README.md           # Documentación de uso
├── GUIA-CANVA.md      # Tutorial para crear/reemplazar imágenes
├── Idea.MD            # Especificación original
└── .claude/           # Sistema de agentes
```

## 7. Próximos pasos
1. **URGENTE:** Configurar número de WhatsApp en script.js
2. Crear carpeta `images/` y agregar fotos reales del tour
3. Reemplazar URLs de Unsplash con rutas locales
4. Comprimir imágenes (TinyPNG)
5. Deploy a Netlify o GitHub Pages
6. Probar en dispositivos móviles reales
7. SEO: meta tags, sitemap, analytics
