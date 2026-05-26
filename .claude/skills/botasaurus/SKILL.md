---
name: botasaurus
description: Web scraping y extracción de datos con Botasaurus (Python). Usar cuando el usuario necesite extraer información de páginas web, hacer web scraping, bypass de Cloudflare, automatización de navegador humanizada, parsear HTML, extraer sitemaps, scraping en paralelo, o cualquier tarea de recolección de datos desde internet. Keywords: "scraping", "extraer datos", "web scraping", "extraer información de una página", "botasaurus", "bypass cloudflare", "scraper", "sitemap", "parsear HTML", "crawling", "datos de un sitio web", "extraer tabla", "automatizar navegador".
allowed-tools: Bash(python*), Bash(pip*), Bash(C:/Users/jrodr/AppData/Local/Programs/Python/Python312/python.exe*)
---

# Botasaurus — Web Scraping Framework (Python)

**Botasaurus** es el framework anti-detección más completo para scraping en Python.
Instalado en: `C:/Users/jrodr/AppData/Local/Programs/Python/Python312/python.exe`

## Instalación

```bash
pip install botasaurus botasaurus-requests botasaurus-driver
```

## Tres modos de scraping

### 1. `@browser` — Chromium humanizado (para sitios con JS o protección)

```python
from botasaurus.browser import browser, Driver

@browser
def scrape_sitio(driver: Driver, data):
    driver.get("https://ejemplo.com")
    titulo = driver.get_text("h1")
    return {"titulo": titulo}

if __name__ == "__main__":
    result = scrape_sitio()
    print(result)
    # Output guardado en output/scrape_sitio.json
```

### 2. `@request` — HTTP liviano tipo navegador (sin JS, más rápido)

```python
from botasaurus.request import request, Request
from botasaurus import soupify

@request
def scrape_liviano(request: Request, data):
    response = request.get("https://ejemplo.com")
    soup = soupify(response)
    items = soup.select("h2.titulo")
    return [{"texto": i.get_text(strip=True)} for i in items]

if __name__ == "__main__":
    scrape_liviano()
```

### 3. `@task` — Tarea genérica (sin browser ni request)

```python
from botasaurus.task import task

@task
def procesar_datos(data):
    return {"procesado": data}
```

---

## Bypass de Cloudflare

```python
@browser
def scrape_protegido(driver: Driver, data):
    # Navega como Google para bypasear Cloudflare
    driver.google_get("https://sitio-protegido.com", bypass_cloudflare=True)
    
    # Modo humano: movimientos de mouse naturales
    driver.enable_human_mode()
    driver.click("button#accept-cookies")
    
    return driver.get_text("main")
```

---

## Scraping en paralelo y con cache

```python
@browser(
    parallel=3,        # 3 navegadores simultáneos
    cache=True,        # Guarda resultados en disco (no re-scraping)
    headless=False,    # Ver navegador (debug). True para producción
    reuse_driver=True  # Reutilizar driver entre llamadas
)
def scrape_productos(driver: Driver, data):
    driver.get(data["url"])
    nombre = driver.get_text(".product-name")
    precio = driver.get_text(".price")
    return {"nombre": nombre, "precio": precio, "url": data["url"]}

urls = [{"url": f"https://tienda.com/producto/{i}"} for i in range(1, 20)]
resultados = scrape_productos(urls)
```

---

## Patrón producción: separar descarga de extracción

```python
from botasaurus.browser import browser, Driver
from botasaurus.request import request, Request
from botasaurus import soupify

# Paso 1: Descargar HTML (con cache para no re-descargar)
@browser(cache=True, reuse_driver=True)
def descargar_html(driver: Driver, data):
    driver.get(data["url"])
    return driver.page_html

# Paso 2: Extraer datos del HTML (rápido, sin browser)
@task(cache=True)
def extraer_datos(data):
    html = data["html"]
    soup = soupify(html)
    return {
        "titulo": soup.select_one("h1").get_text(strip=True),
        "descripcion": soup.select_one(".description").get_text(strip=True),
    }

if __name__ == "__main__":
    urls = [{"url": "https://ejemplo.com/pagina-1"}]
    htmls = descargar_html(urls)
    datos = extraer_datos(htmls)
    print(datos)
```

---

## Extracción de Sitemap

```python
from botasaurus.sitemap import Sitemap

# Obtener todas las URLs de un sitio
Sitemap("https://ejemplo.com") \
    .filter(lambda url: "/blog/" in url) \
    .extract() \
    .write_links("output/blog_urls.csv")

# Con regex
Sitemap("https://ejemplo.com") \
    .filter(r"/product/\d+") \
    .extract() \
    .write_links("output/product_urls.csv")
```

---

## Métodos clave del Driver

```python
# Navegación
driver.get("https://url.com")
driver.google_get("https://url.com", bypass_cloudflare=True)
driver.get_via("https://url.com", referer="https://google.com")

# Extracción de texto/HTML
driver.get_text("selector CSS")          # Texto de un elemento
driver.get_texts("selector CSS")         # Lista de textos
driver.get_element_or_none("selector")   # Elemento o None
driver.select("selector")                # Primer elemento
driver.select_all("selector")            # Lista de elementos
driver.page_html                         # HTML completo de la página

# Interacción humanizada
driver.click("button selector")
driver.type("input selector", "texto")
driver.scroll_to_bottom()
driver.wait_for_element("selector", timeout=10)

# Utilitarios
driver.sleep(2)                          # Pausa (segundos)
driver.get_cookies_dict()                # Cookies actuales
driver.save_screenshot("screenshot.png")
```

---

## BeautifulSoup con botasaurus

```python
from botasaurus import soupify

# Con @request
@request
def scrape(request: Request, data):
    resp = request.get("https://quotes.toscrape.com")
    soup = soupify(resp)
    
    quotes = []
    for q in soup.select("div.quote"):
        quotes.append({
            "texto": q.select_one("span.text").get_text(strip=True),
            "autor": q.select_one("small.author").get_text(strip=True),
            "tags": [t.get_text() for t in q.select("a.tag")]
        })
    return quotes
```

---

## Estructura de proyecto recomendada

```
mi-scraper/
├── scraper.py          ← funciones @browser / @request
├── run.py              ← punto de entrada
└── output/             ← JSONs generados automáticamente
    └── scrape_*.json
```

**Output automático:** Botasaurus guarda cada resultado en `output/{nombre_funcion}.json` automáticamente.

---

## Cerrar browsers colgados

```bash
python -m close_chrome
```

---

## Casos de uso comunes

| Necesidad | Decorador | Notas |
|-----------|-----------|-------|
| Página con JavaScript | `@browser` | Chromium completo |
| Página HTML simple | `@request` | 10x más rápido |
| Cloudflare / protección | `@browser` + `google_get` | bypass automático |
| Scraping masivo | `@browser(parallel=N)` | N instancias paralelas |
| Re-run sin re-descargar | `@browser(cache=True)` | Cache en disco |
| Extraer URLs sitio | `Sitemap()` | Sin browser necesario |
| Parsear HTML | `soupify()` | BeautifulSoup wrapper |
