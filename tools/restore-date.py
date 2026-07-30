# -*- coding: utf-8 -*-
import io

path = 'index-final.html'
with io.open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Hero fecha y subtitulo
content = content.replace(
    "📅 16-19 JULIO 2026",
    "📅 5-8 NOVIEMBRE 2026"
)
content = content.replace(
    "📅 JULY 16-19, 2026",
    "📅 NOVEMBER 5-8, 2026"
)

# 2. Hero subtitle
content = content.replace(
    "Descubre las playas más hermosas de Panamá en una aventura inolvidable",
    "Nueva fecha: 5 al 8 de noviembre 2026 — Vuelve la aventura al Caribe panameño"
)
content = content.replace(
    "Discover Panama's most beautiful beaches in an unforgettable adventure",
    "New date: November 5-8, 2026 - The Panamanian Caribbean adventure returns"
)

# 3. Hero subtitle data-es y data-en
content = content.replace(
    'data-es="Descubre las playas más hermosas de Panamá en una aventura inolvidable"',
    'data-es="Nueva fecha: 5 al 8 de noviembre 2026 — Vuelve la aventura al Caribe panameño"'
)
content = content.replace(
    'data-en="Discover Panama\'s most beautiful beaches in an unforgettable adventure"',
    'data-en="New date: November 5-8, 2026 - The Panamanian Caribbean adventure returns"'
)

# 4. WhatsApp links header
content = content.replace(
    "16-19%20Julio%202026",
    "5-8%20Noviembre%202026"
)
content = content.replace(
    "16-19%20Julio%202026%20%F0%9F%87%B5%F0%9F%87%A6",
    "5-8%20Noviembre%202026%20%F0%9F%87%B5%F0%9F%87%A6"
)

# 5. WhatsApp share text
content = content.replace(
    "16-19 Julio 2026",
    "5-8 Noviembre 2026"
)

# 6. Countdown date
content = content.replace(
    "2026-07-16T06:00:00",
    "2026-11-05T06:00:00"
)

# 7. Blog texto
content = content.replace(
    "Julio 2026 está perfectamente timed para aprovechar el verano con ambiente vibrante",
    "5-8 Noviembre 2026 aprovecha el final de la temporada seca con ambiente vibrante"
)
content = content.replace(
    "July 2026 tour is perfectly timed to enjoy summer with a vibrant atmosphere",
    "November 5-8, 2026 tour takes advantage of the end of the dry season with a vibrant atmosphere"
)

with io.open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
print('Restauración de fecha completa')
