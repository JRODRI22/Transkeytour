---
name: security-guard
enabled: true
event: file
action: warn
conditions:
  - field: new_text
    operator: regex_match
    pattern: eval\(|exec\(|os\.system\(|subprocess\.call\(|pickle\.loads\(|innerHTML\s*=|dangerouslySetInnerHTML|"[^"]*"\s*\+\s*[a-zA-Z]|'[^']*'\s*\+\s*[a-zA-Z]
---

🔐 **Patrón de seguridad potencialmente peligroso detectado**

Se detectó código que puede introducir vulnerabilidades OWASP. Verifica antes de continuar:

**Patrones detectados posibles:**
- `eval()` / `exec()` — ejecución de código dinámico (Code Injection)
- `os.system()` / `subprocess.call()` — ejecución de comandos del sistema (Command Injection)
- `pickle.loads()` — deserialización insegura
- `innerHTML =` / `dangerouslySetInnerHTML` — posible XSS
- Concatenación de strings con variables en queries — posible SQL Injection

**Acciones recomendadas:**
1. Si es `eval/exec`: ¿es posible evitarlo? En la mayoría de casos sí.
2. Si es concatenación de query: usar parámetros preparados (`@param` en SQL, `?` en PDO).
3. Si es `innerHTML`: usar `textContent` o sanitizar con DOMPurify.
4. Si es `subprocess`: validar y escapar todos los inputs antes de pasarlos.

El SecurityAgent hará una revisión completa OWASP Top 10 al finalizar el pipeline.
