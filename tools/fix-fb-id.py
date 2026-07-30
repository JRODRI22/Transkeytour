# -*- coding: utf-8 -*-
import io

path = 'index-final.html'
with io.open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Facebook ID
content = content.replace(
    'profile.php?id=61590098459318',
    'profile.php?id=61590176020082'
)

# 2. Share button Facebook - abrir perfil en pestaña nueva
content = content.replace(
    '<button class="share-btn facebook" onclick="shareOnFacebook()" title="Compartir en Facebook" aria-label="Compartir en Facebook">',
    '<button class="share-btn facebook" onclick="window.open(\'https://www.facebook.com/profile.php?id=61590176020082\', \'_blank\')" title="Visitar Facebook" aria-label="Visitar Facebook">'
)

# 3. Footer Facebook link (era "#")
content = content.replace(
    '<a href="#">Facebook</a>',
    '<a href="https://www.facebook.com/profile.php?id=61590176020082" target="_blank" rel="noopener">Facebook</a>'
)

with io.open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
print('Facebook links actualizados')
