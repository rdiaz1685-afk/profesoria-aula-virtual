# 🎓 Profesoría - Aula Virtual con IA

Sistema de generación automática de contenido educativo usando Inteligencia Artificial.

## ✨ Características

- 📄 **Extracción de temario desde PDF** - Sube tu programa y la IA extrae las unidades
- 🤖 **Generación automática de contenido** - Material didáctico, actividades y evaluaciones
- 📊 **Ponderaciones automáticas** - Cada unidad suma exactamente 100 puntos (25+25+50)
- 📋 **Instrumentación didáctica** - Documento completo generado por IA
- 💾 **Exportación de aulas** - Genera HTML para estudiantes
- 🔄 **Sistema robusto** - Timeouts optimizados y manejo de errores

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar API Key de OpenAI

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_OPENAI_API_KEY=tu-api-key-de-openai-aqui
```

> **Importante**: Obtén tu API key en https://platform.openai.com/api-keys

### 3. Ejecutar el proyecto
```bash
npm run dev
```

## 📖 Cómo Usar

### Paso 1: Crear Nueva Materia
1. Haz clic en **"+ Nueva Materia"**
2. Llena el formulario:
   - Nombre de la materia
   - Nivel (Principiante/Intermedio/Avanzado)
   - Carrera destino
   - Duración estimada
3. **Sube el PDF del programa** (opcional pero recomendado)
4. Clic en **"GENERAR ESTRUCTURA ACADÉMICA"**

### Paso 2: Diseñar Unidades
1. Selecciona una unidad del menú lateral
2. Clic en **"DISEÑAR ESTA UNIDAD"**
3. Espera 30-45 segundos mientras la IA genera:
   - Teoría detallada con ejemplos
   - Práctica 1 (25 puntos)
   - Práctica 2 (25 puntos)
   - Evaluación con 4 preguntas (50 puntos)

### Paso 3: Generar Instrumentación Didáctica
1. Clic en el botón **"📄 Instrumentación"**
2. Clic en **"Generar"**
3. La IA creará:
   - Caracterización del curso
   - Intencionalidad didáctica
   - Competencias de la asignatura
   - Análisis por unidad
   - Matriz de evaluación
   - Calendario

### Paso 4: Exportar Aula para Estudiantes
1. Clic en **"GENERAR AULA ALUMNO"**
2. Se descargará un archivo HTML
3. Los estudiantes pueden abrir ese archivo en cualquier navegador

## ⚙️ Optimizaciones Implementadas

### Timeouts Reducidos
- **Esqueleto de curso**: 30 segundos (antes 60s)
- **Contenido de unidad**: 45 segundos (antes 90s)
- **Instrumentación**: 60 segundos (antes 90s)

### Validaciones Robustas
- ✅ Verifica que las ponderaciones sumen 100 puntos
- ✅ Valida estructura de JSON antes de procesar
- ✅ Genera contenido de fallback si la IA falla
- ✅ Completa unidades faltantes automáticamente

### Manejo de Errores
- 🔄 Reintentos automáticos en caso de timeout
- 📝 Logs detallados en consola para debugging
- ⚠️ Mensajes claros al usuario sobre errores
- 🛡️ Fallbacks locales si OpenAI no responde

## 🔧 Solución de Problemas

### Error: "API Key no configurada"
- Verifica que creaste el archivo `.env.local`
- Asegúrate de que la API key sea válida
- Reinicia el servidor de desarrollo

### La IA tarda mucho o da timeout
- Verifica tu conexión a internet
- Revisa que tu API key tenga créditos disponibles
- Intenta con un tema más específico y corto

### Las ponderaciones no suman 100
- El sistema ahora valida automáticamente
- Si ves una advertencia en consola, regenera la unidad

### El PDF no se procesa
- Asegúrate de que sea un PDF válido
- Máximo 6 páginas se procesan para evitar saturación
- Alternativamente, sube imágenes del programa

## 📁 Estructura del Proyecto

```
profesoria---aula-virtual/
├── components/
│   ├── CourseForm.tsx          # Formulario de creación
│   ├── CourseViewer.tsx        # Visor principal
│   ├── LessonContent.tsx       # Contenido de lecciones
│   ├── UnitPortfolio.tsx       # Portafolio de entregas
│   └── DidacticInstrumentationView.tsx
├── openaiSkeletonService.ts    # Generación de esqueleto
├── openaiUnitService.ts        # Generación de unidades
├── openaiService.ts            # Instrumentación didáctica
├── types.ts                    # Definiciones TypeScript
├── App.tsx                     # Componente principal
└── .env.local                  # Configuración (crear)
```

## 🎯 Flujo de Trabajo Recomendado

1. **Preparación** (5 min)
   - Tener el programa de la materia en PDF
   - Conocer el nivel y perfil de estudiantes

2. **Generación de Estructura** (30 seg)
   - Crear materia con formulario
   - Subir PDF del programa
   - Generar esqueleto automático

3. **Diseño de Contenido** (45 seg por unidad)
   - Diseñar cada unidad una por una
   - Revisar y ajustar contenido generado
   - Verificar ponderaciones

4. **Instrumentación** (60 seg)
   - Generar documento de instrumentación
   - Revisar y exportar si es necesario

5. **Distribución** (1 min)
   - Exportar aula para estudiantes
   - Compartir archivo HTML

## 💡 Consejos

- **Sé específico**: Mientras más detallado el programa PDF, mejor el contenido
- **Revisa siempre**: La IA es una herramienta, tú eres el experto
- **Guarda respaldos**: Usa el botón "Respaldar" regularmente
- **Limpia caché**: Si hay problemas de memoria, usa "Limpiar Caché"

## 🔐 Seguridad

- ⚠️ **NUNCA** compartas tu archivo `.env.local`
- ⚠️ **NUNCA** subas tu API key a GitHub
- ✅ El archivo `.gitignore` ya protege `.env.local`
- ✅ Regenera tu API key si la expusiste accidentalmente

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los logs con emojis (✅ ❌ ⚠️ ⏱️)
3. Intenta regenerar el contenido
4. Limpia el caché del navegador

---

**Versión**: 3.0-optimized  
**Motor IA**: OpenAI GPT-3.5-turbo / GPT-4  
**Última actualización**: Enero 2026
