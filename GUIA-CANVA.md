# 🎨 Guía para Crear Imágenes en Canva

> **ACTUALIZACIÓN:** Lee también [GUIA-IMAGENES.md](GUIA-IMAGENES.md) para ver la comparación Canva vs Figma y URLs de imágenes reales de Bocas del Toro.

Si quieres personalizar las imágenes con tus propias fotos del tour, sigue esta guía.

## 📐 Dimensiones Recomendadas

### Para la Galería (6 imágenes)
- **Tamaño:** 800 x 600 px (ratio 4:3)
- **Formato:** JPG o PNG
- **Calidad:** Alta (mínimo 90%)

### Para el Hero (fondo principal)
- **Tamaño:** 1920 x 1080 px (Full HD)
- **Formato:** JPG
- **Calidad:** Alta

### Para Cards de Destinos (6 imágenes de fondo)
- **Tamaño:** 600 x 400 px
- **Formato:** JPG
- **Calidad:** Media-Alta (80-90%)

## 🚀 Cómo Crear en Canva

### Opción 1: Diseño Personalizado

1. **Ir a Canva.com** y crear cuenta gratis
2. **Crear diseño personalizado:**
   - Click en "Crear un diseño"
   - Seleccionar "Tamaño personalizado"
   - Ingresar: **800 x 600 px** (para galería)

3. **Agregar tus fotos:**
   - Click en "Cargas" → "Subir archivos"
   - Seleccionar fotos del tour
   - Arrastrar a la página

4. **Opcional - Agregar overlay:**
   - Agregar capa de color semitransparente
   - Agregar texto descriptivo
   - Usar filtros para mejorar

5. **Descargar:**
   - Click en "Compartir" → "Descargar"
   - Formato: JPG
   - Calidad: Alta

### Opción 2: Usar Plantillas de Canva

1. **Buscar plantillas:**
   - Escribir "travel" o "turismo" en buscador
   - Filtrar por tamaño: "Publicación de Instagram" (1080x1080)
   - Seleccionar una plantilla que te guste

2. **Personalizar:**
   - Reemplazar imágenes con las tuyas
   - Cambiar textos a español
   - Ajustar colores a tu marca

3. **Redimensionar:**
   - Click en "Cambiar tamaño" (Plan Pro)
   - O crear nuevos diseños en tamaños específicos

## 📂 Estructura de Carpetas Recomendada

```
Turismo/
├── index.html
├── styles.css
├── script.js
├── images/
│   ├── galeria/
│   │   ├── playa-estrellas.jpg
│   │   ├── snorkeling.jpg
│   │   ├── estrellas-mar.jpg
│   │   ├── lancha.jpg
│   │   ├── atardecer.jpg
│   │   └── vida-marina.jpg
│   ├── destinos/
│   │   ├── playa-estrellas-bg.jpg
│   │   ├── bahia-delfines-bg.jpg
│   │   ├── cayo-coral-bg.jpg
│   │   ├── hollywood-reef-bg.jpg
│   │   ├── isla-zapatilla-bg.jpg
│   │   └── punta-caracol-bg.jpg
│   └── hero-bg.jpg
└── README.md
```

## 🔄 Reemplazar Imágenes en el Código

### En `index.html` (Galería):

```html
<!-- ANTES (Unsplash) -->
<img src="https://images.unsplash.com/photo-..." alt="...">

<!-- DESPUÉS (Tus fotos) -->
<img src="images/galeria/playa-estrellas.jpg" alt="Playa de las Estrellas">
```

### En `styles.css` (Hero):

```css
/* ANTES */
background: 
    linear-gradient(135deg, rgba(0,180,216,0.85), rgba(0,150,199,0.85)),
    url('https://images.unsplash.com/photo-...');

/* DESPUÉS */
background: 
    linear-gradient(135deg, rgba(0,180,216,0.85), rgba(0,150,199,0.85)),
    url('images/hero-bg.jpg');
```

### En `script.js` (Lightbox):

```javascript
// ANTES
const lightboxImages = [
    {
        src: 'https://images.unsplash.com/...',
        caption: 'Playas Paradisíacas'
    },
    // ...
];

// DESPUÉS
const lightboxImages = [
    {
        src: 'images/galeria/playa-estrellas.jpg',
        caption: 'Playa de las Estrellas - Bocas del Toro'
    },
    {
        src: 'images/galeria/snorkeling.jpg',
        caption: 'Snorkeling en Aguas Cristalinas'
    },
    // ... resto de imágenes
];
```

## 🎨 Paleta de Colores del Sitio

Para mantener coherencia visual al crear imágenes:

- **Azul Primario:** `#00B4D8`
- **Azul Oscuro:** `#0096C7`
- **Rosa/Fucsia:** `#F72585`
- **Amarillo:** `#FFD60A`
- **Gris Oscuro:** `#023047`

## 📸 Tips para Fotos de Tours

### Qué fotografiar:
1. **Playas y paisajes** - Tomas amplias del destino
2. **Actividades** - Snorkeling, lanchas, tours
3. **Vida marina** - Estrellas de mar, peces, corales
4. **Personas felices** - Turistas disfrutando
5. **Atardeceres** - Momentos mágicos
6. **Detalles únicos** - Elementos que destacan el tour

### Mejores prácticas:
- ✅ Usa luz natural (golden hour: amanecer/atardecer)
- ✅ Mantén horizonte recto
- ✅ Usa regla de tercios
- ✅ Captura emociones genuinas
- ✅ Variedad de ángulos (aéreos, bajo agua, nivel del ojo)
- ✅ Alta resolución (mínimo 1080p)

## 🎯 Ejemplos de Diseños en Canva

### Para Galería de Tour:
```
Plantilla recomendada: "Travel Instagram Post"
- Agregar overlay azul semitransparente (60% opacidad)
- Texto blanco con sombra
- Ícono de ubicación
- Logo de Transkeytour en esquina
```

### Para Hero Banner:
```
Plantilla recomendada: "Website Header"
- Imagen panorámica de playa
- Overlay degradado (azul a transparente)
- Texto grande centrado
- Botón de CTA destacado
```

## 🔧 Optimización de Imágenes

Antes de subir tus imágenes:

1. **Comprimir:** Usa [TinyPNG.com](https://tinypng.com)
2. **Formato correcto:**
   - JPG para fotos (menor tamaño)
   - PNG solo si necesitas transparencia
3. **Nombres descriptivos:**
   - ✅ `playa-estrellas.jpg`
   - ❌ `IMG_3847.jpg`

## 📱 Test Responsive

Después de cambiar imágenes, prueba en:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768px)
- [ ] Móvil (375px - iPhone)
- [ ] Móvil (360px - Android)

## 🆘 Ayuda Rápida

**Problema:** Imágenes muy pesadas
- **Solución:** Comprimir en TinyPNG antes de usar

**Problema:** Imagen se ve pixelada
- **Solución:** Usar imagen de mayor resolución

**Problema:** Imagen no se ve en móvil
- **Solución:** Verificar ruta del archivo

**Problema:** Colores se ven apagados
- **Solución:** Ajustar brillo/contraste en Canva antes de exportar

---

**¿Necesitas ayuda?** 
Las imágenes actuales de Unsplash son placeholders profesionales. 
Funcionan perfectamente mientras consigues tus propias fotos del tour.
