---
name: free-llm-apis
description: >
  Selección y configuración de proveedores LLM con free tier, todos compatibles con el SDK de OpenAI.
  Usar cuando se necesite un modelo de lenguaje gratuito, alternativa a Claude/GPT, o cuando el
  APIDiscoveryAgent detecte keywords de inferencia libre.
triggers:
  - "LLM gratuito"
  - "modelo gratis"
  - "free tier LLM"
  - "alternativa a Claude"
  - "Groq"
  - "Mistral gratis"
  - "OpenRouter"
  - "inferencia libre"
  - "sin costo LLM"
  - "Llama API"
  - "free model"
tags:
  - ai
  - llm
  - free-tier
  - openai-compatible
---

# Skill: free-llm-apis

Todos los proveedores son **100% compatibles con el SDK de OpenAI** — solo cambiar `base_url` + `api_key`.

## Tabla de proveedores

| Proveedor | Base URL | Key Models | RPM | RPD | Notas |
|---|---|---|---|---|---|
| **Groq** | `https://api.groq.com/openai/v1/` | Llama 3.3 70B, Llama 4 Scout | 30 | 14,400 | Más rápido; reemplaza Haiku tier |
| **Mistral AI** | `https://api.mistral.ai/v1/` | Mistral Large 3, Small 3.1 | ~60 | ~1B tok/mes | EU-based; excelente para código |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai/` | Gemini 2.5 Pro, Flash | 5-15 | 1,000 | ❌ EU/UK/CH · ✅ Costa Rica OK |
| **OpenRouter** | `https://openrouter.ai/api/v1/` | 32+ free models | 20 | 50 (1K con $10) | Mejor fallback router |
| **SiliconFlow** | `https://cloud.siliconflow.cn/v1/` | Qwen3, DeepSeek-R1-Distill | 1,000 | ~50K TPM | Mayor throughput libre |
| **Cerebras** | `https://api.cerebras.ai/v1/` | Llama 3.1 70B, 8B | 30 | 900 | WSE chips; ultra-rápido |
| **GitHub Models** | `https://models.inference.ai.azure.com/` | Llama, Phi-4, Mistral | 15 | 150 | Requiere GitHub token |
| **LLM7.io** | `https://api.llm7.io/v1/` | GPT-4.1-nano, DeepSeek-R1, Mistral, Llama-4 | N/A | N/A | Sin registro · muchos modelos |
| **pollinations.ai** | `https://text.pollinations.ai/openai/` | claude-haiku-4.5, claude-sonnet-4.5, claude-opus-4.5 | 20/día | 20/día | ⭐ Modelos Claude GRATIS · sin registro |
| **uncloseai.com** | `https://api.uncloseai.com/v1/` | Hermes AI, Qwen3-Coder, TTS | Unlimited | Unlimited | Sin registro · OpenAI-compatible · TTS incluido |
| **g4f.dev** | `https://api.g4f.dev/v1/` | 200+ modelos | Unlimited | Unlimited | Sin registro · catálogo más amplio gratuito |

## Flujo de selección

```
¿Necesita máxima velocidad?
  → Groq (llama-3.1-8b-instant) — 750 tok/s

¿Necesita máximo throughput (bulk)?
  → SiliconFlow (1K RPM / 50K TPM)

¿Necesita fallback si Claude falla?
  → OpenRouter (openrouter/auto)

¿Sin API key requerida (prototipo rápido)?
  → LLM7.io (sin registro) o g4f.dev (200+ modelos) o uncloseai.com (unlimited)

¿Necesito modelos Claude sin cuenta Anthropic?
  → pollinations.ai (claude-haiku/sonnet/opus-4.5 gratis, 20 req/día)

¿Generación de texto ilimitada sin registro?
  → g4f.dev (unlimited, 200+ modelos)

¿TTS gratis?
  → uncloseai.com (TTS incluido, sin registro)

¿Razonamiento complejo?
  → Groq (llama-3.3-70b-versatile) o Mistral Large 3
```

## Quick Test — Python

```python
from openai import OpenAI
import os

# Probar Groq (cambiar base_url + api_key + model para otro proveedor)
client = OpenAI(
    base_url="https://api.groq.com/openai/v1/",
    api_key=os.environ.get("GROQ_API_KEY"),
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "Responde en español."},
        {"role": "user", "content": "¿Cuál es la capital de Costa Rica?"}
    ]
)
print(response.choices[0].message.content)
```

## Quick Test — .NET

```csharp
using System.Net.Http.Json;

var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Add("Authorization",
    $"Bearer {Environment.GetEnvironmentVariable("GROQ_API_KEY")}");

var payload = new {
    model = "llama-3.3-70b-versatile",
    messages = new[] {
        new { role = "user", content = "¿Cuál es la capital de Costa Rica?" }
    }
};

var response = await httpClient.PostAsJsonAsync(
    "https://api.groq.com/openai/v1/chat/completions", payload);
var result = await response.Content.ReadAsStringAsync();
Console.WriteLine(result);
```

## Variables de entorno por proveedor

| Proveedor | Variable |
|---|---|
| Groq | `GROQ_API_KEY` → https://console.groq.com |
| Mistral AI | `MISTRAL_API_KEY` → https://console.mistral.ai |
| Google Gemini | `GEMINI_API_KEY` → https://aistudio.google.com |
| OpenRouter | `OPENROUTER_API_KEY` → https://openrouter.ai/keys |
| SiliconFlow | `SILICONFLOW_API_KEY` → https://cloud.siliconflow.cn |
| Cerebras | `CEREBRAS_API_KEY` → https://cloud.cerebras.ai |
| GitHub Models | `GITHUB_TOKEN` → Settings → Developer settings |
| LLM7.io | No requerida | — |
| pollinations.ai | No requerida | `https://text.pollinations.ai/openai/` |
| uncloseai.com | No requerida | `https://api.uncloseai.com/v1/` |
| g4f.dev | No requerida | `https://api.g4f.dev/v1/` |

## Integración en model routing del sistema

Para ModelRoutingAgent y Orchestrator:
- **Haiku tier** → reemplazar con Groq `llama-3.1-8b-instant`
- **Pipeline fallback** → OpenRouter `openrouter/auto` como safety net
- **Bulk tasks** → SiliconFlow `Qwen/Qwen3-7B` (EvolutionAgent, DocsAgent)
- **Prototipos sin registro** → g4f.dev o uncloseai.com (0 setup, unlimited)
- **Claude gratis (max 20/día)** → pollinations.ai `claude-haiku-4.5` para tareas puntuales

Fuente de la skill: https://github.com/mnfst/awesome-free-llm-apis (CC0)  
APIs sin registro: compilación propia vía zebbern/no-cost-ai
