# 📸 Guía de Imágenes para Transkeytour Bocas del Toro

## 🎯 Canva vs Figma - ¿Cuál usar?

### 🎨 **Canva** (RECOMENDADO para este proyecto)
✅ **Úsalo para:**
- Crear/editar fotos del tour
- Agregar filtros y efectos a tus fotos
- Crear collages de destinos
- Redimensionar imágenes para web
- Agregar texto sobre fotos
- Exportar JPG/PNG optimizados

**Por qué es mejor para este caso:**
- Fácil de usar (sin curva de aprendizaje)
- Templates de turismo/viajes
- Exporta imágenes optimizadas para web
- Gratis para uso básico
- Puedes editar desde el celular

### 🎨 **Figma** (NO recomendado para imágenes)
❌ **NO lo uses para:**
- Crear fotos de productos/tours
- Editar fotografías

✅ **Sí úsalo para:**
- Diseñar la UI de una app móvil
- Crear wireframes del sitio web
- Prototipos interactivos
- Rediseño completo de la página

**Por qué NO es ideal aquí:**
- Figma es para diseño UI/UX (interfaces)
- No es editor de fotos (usa Photoshop/Canva para eso)
- No exporta fotos con la calidad de Canva
- Requiere más tiempo de aprendizaje

---

## 🌴 Opciones de Imágenes REALES de Bocas del Toro

### Opción 1: Tomar tus propias fotos (MEJOR)
Durante el tour, toma fotos de:
- ⭐ Playa de las Estrellas con estrellas de mar
- 🐬 Bahía de los Delfines (si ves delfines)
- 🤿 Snorkeling en Cayo Coral
- 🏖️ Isla Zapatilla (arena blanca + agua turquesa)
- 🌅 Atardeceres desde el hotel
- 🛥️ Lanchas durante los tours
- 🌴 Hotel Punta Caracol sobre palafitos

**Consejos para fotos:**
- Modo HDR activado (mejora colores del agua)
- Hora dorada: 6-7am y 5-6pm
- Enfocar el agua cristalina (lo más impresionante)
- Incluir personas para dar escala

### Opción 2: Usar Pexels (alternativa gratis a Unsplash)

**URLs actualizadas de Pexels - Bocas del Toro, Panamá:**

```
Hero Background:
https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1920

Galería:
1. Playa Caribe: https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800
2. Snorkeling: https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=800
3. Estrellas de Mar: https://images.pexels.com/photos/1007427/pexels-photo-1007427.jpeg?auto=compress&cs=tinysrgb&w=800
4. Lancha: https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=800
5. Atardecer: https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?auto=compress&cs=tinysrgb&w=800
6. Vida Marina: https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?auto=compress&cs=tinysrgb&w=800
```

### Opción 3: Pixabay (100% libre de derechos)

```
https://pixabay.com/es/photos/search/bocas%20del%20toro/
https://pixabay.com/es/photos/search/panama%20beach/
https://pixabay.com/es/photos/search/caribbean%20snorkeling/
```

### Opción 4: Comprar fotos profesionales

**Getty Images / Shutterstock:**
- Buscar: "Bocas del Toro Panama"
- Precio: ~$10-30 USD por foto
- Calidad profesional garantizada

---

## 🛠️ Proceso Completo con Canva

### Paso 1: Recopilar Fotos
- Transferir fotos del celular a PC
- Seleccionar las 12 mejores (6 galería + 6 destinos + 1 hero)

### Paso 2: Editar en Canva (5 min por foto)

1. **Ir a:** https://www.canva.com
2. **Crear diseño:** 800 x 600 px
3. **Subir foto:** Click en "Cargas"
4. **Ajustar foto:** Llenar todo el canvas
5. **Aplicar filtro (opcional):**
   - "Brillante" para playas
   - "Cálido" para atardeceres
   - "Saturado" para agua turquesa
6. **Agregar overlay sutil (opcional):**
   - Capa de color #00B4D8 al 10% de opacidad
7. **Descargar:** JPG, calidad 90%

### Paso 3: Optimizar para Web

**Opción A: TinyPNG (recomendado)**
1. Ir a https://tinypng.com
2. Subir las 12 imágenes
3. Descargar comprimidas (reduce 60-70% sin pérdida visual)

**Opción B: Canva Pro**
- Al descargar, seleccionar "Comprimir archivo"
- Reduce automáticamente el peso

### Paso 4: Renombrar Archivos

```
Antes:                    Después:
IMG_1234.jpg       →      hero-bocas-del-toro.jpg
IMG_1235.jpg       →      galeria-playa-estrellas.jpg
IMG_1236.jpg       →      galeria-snorkeling.jpg
IMG_1237.jpg       →      galeria-estrellas-mar.jpg
...
```

### Paso 5: Subir a las Carpetas

```
images/
├── hero-bocas-del-toro.jpg          (1920x1080)
├── galeria/
│   ├── playa-estrellas.jpg          (800x600)
│   ├── snorkeling.jpg               (800x600)
│   ├── estrellas-mar.jpg            (800x600)
│   ├── lancha-tour.jpg              (800x600)
│   ├── atardecer.jpg                (800x600)
│   └── vida-marina.jpg              (800x600)
└── destinos/
    ├── playa-estrellas-bg.jpg       (600x400)
    ├── bahia-delfines-bg.jpg        (600x400)
    ├── cayo-coral-bg.jpg            (600x400)
    ├── hollywood-reef-bg.jpg        (600x400)
    ├── isla-zapatilla-bg.jpg        (600x400)
    └── punta-caracol-bg.jpg         (600x400)
```

---

## 🔄 Actualizar el Código HTML

### Hero Background (styles.css línea ~158)

```css
/* ANTES */
background-image: 
    linear-gradient(135deg, rgba(0,180,216,0.85), rgba(0,150,199,0.85)),
    url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=90');

/* DESPUÉS */
background-image: 
    linear-gradient(135deg, rgba(0,180,216,0.85), rgba(0,150,199,0.85)),
    url('images/hero-bocas-del-toro.jpg');
```

### Galería (index.html línea ~96-136)

```html
<!-- ANTES -->
<img src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80" 
     alt="Bocas del Toro" loading="lazy">

<!-- DESPUÉS -->
<img src="images/galeria/playa-estrellas.jpg" 
     alt="Playa de las Estrellas, Bocas del Toro" 
     loading="lazy">
```

### Destinos (index.html línea ~200-238)

```html
<!-- ANTES -->
style="background-image: linear-gradient(...), url('https://images.unsplash.com/...');"

<!-- DESPUÉS -->
style="background-image: linear-gradient(...), url('images/destinos/playa-estrellas-bg.jpg');"
```

---

## ⚡ Quick Fix (Sin Canva)

Si necesitas mejorar las imágenes YA sin editar:

### URLs de Stock Específicas de Panamá/Caribe:

**Pexels (mejores que Unsplash para Bocas del Toro):**
```html
Hero:
https://images.pexels.com/photos/1007427/pexels-photo-1007427.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080

Galería:
https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?w=800&h=600
https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?w=800&h=600
https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?w=800&h=600
https://images.pexels.com/photos/1630039/pexels-photo-1630039.jpeg?w=800&h=600
https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=800&h=600
https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?w=800&h=600
```

---

## 📱 Crear Imágenes desde el Celular

### Canva App (iOS/Android)

1. **Descargar app:** Canva (gratis)
2. **Crear diseño:** 800 x 600 px
3. **Agregar foto desde galería**
4. **Aplicar filtro "Brillante"**
5. **Compartir → Descargar JPG**
6. **Transferir a PC:** Google Drive / WhatsApp Web

---

## 🎯 Checklist Final

- [ ] 1 foto para hero (1920x1080)
- [ ] 6 fotos para galería (800x600)
- [ ] 6 fotos para destinos (600x400)
- [ ] Todas optimizadas con TinyPNG
- [ ] Nombres descriptivos en español
- [ ] Subidas a carpeta `images/`
- [ ] Código HTML/CSS actualizado
- [ ] Probado en celular (responsive)

---

## 💡 Consejo Pro

**Para landing pages de tours, las fotos reales del cliente venden 3x más que stock photos.**

Haz el tour primero, toma fotos profesionales con celular (modo HDR), edítalas en Canva, y actualiza la página. La inversión de 30 minutos en fotos reales puede aumentar conversiones significativamente.
