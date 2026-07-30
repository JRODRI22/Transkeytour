# 🌴 Transkeytour Bocas Tours - Landing Page

Landing page profesional para paquetes turísticos de San Carlos a Bocas del Toro, Panamá.

## 📋 Contenido

- `index.html` - Estructura de la página
- `styles.css` - Estilos y diseño responsive optimizado
- `script.js` - Interactividad, galería lightbox y funcionalidades

## 🚀 Cómo usar

1. **Abrir la página:**
   - Simplemente abre `index.html` en tu navegador
   - No requiere servidor web

2. **Personalizar el número de WhatsApp:**
   - Abre `script.js`
   - En la línea 208 (aproximadamente), cambia el número:
     ```javascript
     const phoneNumber = '50612345678'; // CAMBIA ESTE NÚMERO
     ```
   - Formato: código de país + número sin espacios (ejemplo: `50689123456`)

## ✨ Características NUEVAS

### 🖼️ Galería de Imágenes
- ✅ **6 fotos profesionales** del tour (Unsplash API)
- ✅ **Lightbox modal** - Click para ver en tamaño completo
- ✅ **Navegación** - Flechas y teclas para cambiar imágenes
- ✅ **Responsive** - Optimizado para móvil y tablet
- ✅ **Lazy loading** - Carga rápida de imágenes

### 📱 Optimización Móvil
- ✅ **100% responsive** - Diseño mobile-first
- ✅ **Touch-friendly** - Botones y elementos táctiles optimizados
- ✅ **Grid adaptativo** - Layouts que se ajustan a cualquier pantalla
- ✅ **Textos legibles** - Tipografía escalada para móvil
- ✅ **Imágenes optimizadas** - Diferentes tamaños según dispositivo

### 🎨 Diseño Mejorado
- ✅ **Hero con imagen real** - Fondo de Bocas del Toro
- ✅ **Cards con fotos** - Destinos con imágenes de fondo reales
- ✅ **Animaciones suaves** - Efectos al scroll y hover
- ✅ **Colores vibrantes** - Paleta caribeña profesional

## 📱 Características de Diseño Responsive

### Desktop (>768px)
- Grid de 3 columnas para destinos
- Grid de 3 columnas para galería
- Navbar horizontal completo
- Hero con badges horizontales

### Tablet (768px - 480px)
- Grid de 2 columnas adaptativo
- Menú hamburguesa
- Badges en columna
- Galería en columnas adaptativas

### Móvil (<480px)
- Grid de 1 columna
- Todos los elementos apilados verticalmente
- Botones full-width
- Textos optimizados para lectura
- Galería a pantalla completa

## 🎯 Secciones

1. **Hero** - Banner con imagen de fondo real de Bocas del Toro
2. **Galería** - 6 fotos profesionales con lightbox interactivo
3. **Puntos de salida** - Rio Cuarto, Venecia, Aguas Zarcas, Pital
4. **Qué incluye** - 6 cards con íconos de servicios
5. **Destinos** - 6 lugares con fotos reales de fondo
6. **Precios** - Adultos y niños con call-to-action
7. **No incluye** - Información transparente
8. **Requisitos** - Documentos para ingresar a Panamá
9. **Contacto** - Formulario integrado con WhatsApp

## 🖼️ Imágenes Utilizadas

Todas las imágenes son de **Unsplash** (gratuitas, alta calidad):
- Playas de Bocas del Toro
- Snorkeling y vida marina
- Estrellas de mar
- Lanchas turísticas
- Atardeceres caribeños

### Reemplazar con tus propias fotos

Para usar tus propias imágenes:

```html
<!-- En index.html, cambiar URLs de Unsplash por rutas locales -->
<img src="images/mi-foto.jpg" alt="Descripción">
```

```css
/* En styles.css, cambiar URLs en background-image */
background-image: url('images/mi-foto.jpg');
```

## 🎨 Personalización

### Cambiar colores
Edita las variables CSS en `styles.css` (líneas 7-15):
```css
:root {
    --color-primary: #00B4D8;      /* Azul principal */
    --color-secondary: #F72585;    /* Rosa (botones) */
    --color-accent: #FFD60A;       /* Amarillo (destacados) */
}
```

### Modificar contenido
- **Fechas:** Edita el HTML en la sección `.hero-badges`
- **Precios:** Cambia los números en `.precio-card`
- **Destinos:** Agrega/elimina cards en `.destinos-grid`

### Agregar imágenes de fondo
Para el hero, agrega en `styles.css` (línea ~158):
```css
.hero {
    background-image: url('ruta/a/tu/imagen.jpg');
    background-size: cover;
    background-position: center;
}
```

## 📱 WhatsApp Integration

El formulario envía automáticamente a WhatsApp con formato:
```
*Nueva Solicitud - Transkeytour Bocas Tours*

👤 Nombre: [nombre del cliente]
📱 Teléfono: [teléfono]
📧 Email: [email]
👥 Personas: [cantidad]

💬 Mensaje: [mensaje opcional]

📅 Tour: Bocas del Toro 16-19 Julio 2026
```

## 🌐 Hosting Gratuito

Puedes publicar esta página gratis en:

1. **GitHub Pages**
   - Sube los archivos a un repositorio
   - Activa GitHub Pages en Settings
   - URL: `tuusuario.github.io/nombre-repo`

2. **Netlify**
   - Arrastra la carpeta a netlify.com/drop
   - URL personalizable gratis

3. **Vercel**
   - Conecta tu repositorio GitHub
   - Deploy automático

## 🔧 Mejoras futuras (opcionales)

- [ ] Agregar galería de fotos reales
- [ ] Integrar Google Maps para ubicaciones
- [ ] Sistema de reservas online con pasarela de pago
- [ ] Testimonios de clientes anteriores
- [ ] Blog con consejos de viaje
- [ ] Multilenguaje (inglés/español)

## 📄 Licencia

Uso libre para Transkeytour Bocas Tours.

---

**Desarrollado con ❤️ para conectar viajeros con el paraíso caribeño**
