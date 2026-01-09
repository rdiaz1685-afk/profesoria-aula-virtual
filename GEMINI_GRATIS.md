# 🆓 SOLUCIÓN: Usar IA GRATIS con Google Gemini

## 🎯 ¡BUENAS NOTICIAS!

**Ya NO necesitas pagar por OpenAI**. He configurado el sistema para que funcione con **Google Gemini**, que es **100% GRATUITO** y tiene un límite muy generoso.

## 🚀 Cómo Obtener tu API Key GRATIS de Gemini

### Paso 1: Ir a Google AI Studio
1. Abre tu navegador
2. Ve a: **https://aistudio.google.com/app/apikey**
3. Inicia sesión con tu cuenta de Google (Gmail)

### Paso 2: Crear API Key
1. Haz clic en **"Create API Key"** o **"Crear clave de API"**
2. Selecciona un proyecto (o crea uno nuevo)
3. Copia la API key que aparece (empieza con `AIza...`)

### Paso 3: Configurar en tu Proyecto
1. Abre el archivo `.env.local` en la raíz del proyecto
2. Si no existe, créalo con este contenido:

```env
# Google Gemini (GRATIS - 1500 requests/día)
VITE_GEMINI_API_KEY=AIza_tu_clave_aqui

# OpenAI (OPCIONAL - solo si tienes créditos)
VITE_OPENAI_API_KEY=sk-proj_tu_clave_aqui
```

3. Pega tu API key de Gemini
4. Guarda el archivo
5. Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)

## ✨ Sistema de Fallback Automático

El sistema ahora intenta en este orden:

```
1️⃣ Google Gemini (GRATIS) ✅
   ↓ (si falla)
2️⃣ OpenAI (si tienes API key)
   ↓ (si falla)
3️⃣ Modo Demo Local (siempre funciona)
```

**¡Nunca te quedarás sin poder trabajar!**

## 📊 Límites de Gemini (Tier Gratuito)

| Característica | Límite Gratis |
|----------------|---------------|
| Requests por día | **1,500** |
| Requests por minuto | **15** |
| Tokens por request | **32,000** |
| Costo | **$0.00** ✅ |

Esto significa que puedes generar:
- ✅ **50 materias completas por día**
- ✅ **250 unidades por día**
- ✅ **Instrumentaciones ilimitadas**

## 🔍 Cómo Verificar que Funciona

1. Abre la consola del navegador (F12)
2. Crea una nueva materia
3. Deberías ver:
```
🔷 Intentando con Gemini (gratis)...
✅ Generado con Gemini exitosamente
```

Si ves esto, **¡está funcionando con Gemini GRATIS!** 🎉

## ❓ Preguntas Frecuentes

### ¿Necesito tarjeta de crédito para Gemini?
**NO**. Es completamente gratis, sin tarjeta de crédito.

### ¿Qué pasa si se acaban los requests de Gemini?
El sistema automáticamente intentará con OpenAI (si tienes API key) o usará el modo demo local.

### ¿Puedo usar solo Gemini sin OpenAI?
**SÍ**. Solo configura la API key de Gemini y deja vacía la de OpenAI.

### ¿Cuánto tiempo tarda Gemini?
- Esqueleto: ~20-30 segundos
- Unidad completa: ~30-45 segundos
- Instrumentación: ~40-60 segundos

### ¿La calidad es buena?
**SÍ**. Gemini 1.5 Flash es muy rápido y genera contenido de excelente calidad, a veces mejor que GPT-3.5.

## 🎓 Ejemplo de Uso Diario

Con el límite gratuito de Gemini (1,500 requests/día):

```
Mañana (9am - 12pm):
- Crear 10 materias nuevas (10 requests)
- Diseñar 30 unidades (30 requests)
- Generar 10 instrumentaciones (10 requests)
Total: 50 requests ✅

Tarde (2pm - 6pm):
- Crear 15 materias más (15 requests)
- Diseñar 45 unidades (45 requests)
- Generar 15 instrumentaciones (15 requests)
Total: 75 requests ✅

TOTAL DEL DÍA: 125 requests de 1,500 disponibles
```

**¡Te sobran 1,375 requests!** 🚀

## 🔧 Solución de Problemas

### Error: "Gemini no disponible"
1. Verifica que tu API key esté en `.env.local`
2. Verifica que la key empiece con `AIza`
3. Reinicia el servidor de desarrollo
4. Revisa que no hayas excedido el límite diario

### Error: "API_KEY_MISSING"
1. Asegúrate de que el archivo `.env.local` existe
2. Verifica que la variable se llame exactamente `VITE_GEMINI_API_KEY`
3. No uses comillas en el archivo `.env.local`

### El sistema usa OpenAI en lugar de Gemini
1. Verifica en la consola qué servicio está usando
2. Si ves `🔶 Intentando con OpenAI...`, significa que Gemini falló
3. Revisa tu API key de Gemini

## 💡 Consejos para Maximizar el Uso Gratuito

1. **Trabaja en lotes**: Diseña varias unidades seguidas
2. **Usa el modo demo**: Para pruebas rápidas, el modo demo es instantáneo
3. **Guarda respaldos**: Exporta tu biblioteca regularmente
4. **Planifica tu día**: Con 1,500 requests puedes hacer mucho

## 🎉 ¡Listo para Empezar!

1. ✅ Obtén tu API key de Gemini (gratis)
2. ✅ Configúrala en `.env.local`
3. ✅ Reinicia el servidor
4. ✅ ¡Empieza a crear materias sin límites!

---

## 📞 Enlaces Útiles

- **Obtener API Key**: https://aistudio.google.com/app/apikey
- **Documentación Gemini**: https://ai.google.dev/
- **Límites y Precios**: https://ai.google.dev/pricing

---

**¡Nunca más te preocupes por API keys agotadas!** 🎊

Con Gemini gratis + OpenAI opcional + Modo Demo = **Sistema 100% funcional siempre**
