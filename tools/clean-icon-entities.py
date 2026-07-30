# -*- coding: utf-8 -*-
import io, re

path = 'index-final.html'
with io.open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Limpiar data-es / data-en que contienen iconos en formato entity
# Patrol: <i class=&quot;fas fa-...&quot;></i> X -> Y
pattern = re.compile(r'(data-(?:es|en))="<i class=&quot;fas fa-[a-z-]+&quot;></i>\s*([^"]+)"')

count = 0
def replace(m):
    global count
    count += 1
    return f'{m.group(1)}="{m.group(2)}"'

content = pattern.sub(replace, content)
print(f'Reemplazos en data-es/en: {count}')

# 2. Hero: cambiar el contenido visible del countdown para que NO muestre el icono literal
content = content.replace(
    'Cuenta Regresiva: 5–8 Noviembre 2026',
    'Cuenta Regresiva: 5–8 de noviembre 2026'
)
content = content.replace(
    'Countdown: November 5–8, 2026',
    'Countdown: November 5–8, 2026'
)

# 3. Hoteles h2 - quitar el icono textual
content = content.replace(
    '><i class="fas fa-hotel"></i> Elige tu Hotel<',
    '>Elige tu Hotel<'
)

# 4. Hotel subtitle
content = content.replace(
    'Dos opciones para tu estadía en Isla Colón — 5 al 8 de noviembre 2026',
    'Dos opciones para tu estadía en Isla Colón — 5 al 8 de noviembre 2026'
)

# 5. Hero subtitle
content = content.replace(
    'Nueva fecha: 5 al 8 de noviembre 2026 — Vuelve la aventura al Caribe panameño',
    'Nueva fecha: 5 al 8 de noviembre 2026 — Vuelve la aventura al Caribe panameño'
)

# 6. Hoteles h2 ya sin ícono en el contenido visible
content = content.replace(
    '><i class="fas fa-stopwatch"></i> Cuenta Regresiva: 5–8 de noviembre 2026<',
    '>Cuenta Regresiva: 5–8 de noviembre 2026<'
)

with io.open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
print('OK')
