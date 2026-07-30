# -*- coding: utf-8 -*-
import io

path = 'index-final.html'
with io.open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# FAQ: el saldo se paga antes del 15 de octubre 2026 (1 mes antes del viaje)
content = content.replace(
    'antes del 15 de junio 2026',
    'antes del 15 de octubre 2026'
)
content = content.replace(
    'before June 15, 2026',
    'before October 15, 2026'
)

# 30 de junio / 30 de junio
content = content.replace(
    'antes del 30 de junio 2026',
    'antes del 30 de octubre 2026'
)
content = content.replace(
    'before June 30, 2026',
    'before October 30, 2026'
)

content = content.replace(
    'Cancelaciones posteriores al 30 de junio',
    'Cancelaciones posteriores al 30 de octubre'
)
content = content.replace(
    'Cancellations after June 30',
    'Cancellations after October 30'
)

with io.open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
print('FAQ meses actualizados')
