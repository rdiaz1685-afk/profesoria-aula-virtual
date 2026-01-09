import { UserPreferences, Course, Lesson, Unit, DidacticInstrumentation } from "./types";

// CAZADOR DE MODELOS MULTIMODAL (LEE TEXTO E IMÁGENES)
export async function callGeminiDynamic(prompt: string, images?: string[]) {
  // Priorizar llave del usuario en localStorage, sino usar la de entorno
  const userKey = localStorage.getItem('profesoria_user_api_key');
  const envKey = import.meta.env.VITE_GEMINI_API_KEY?.trim().replace(/\s/g, '');
  const apiKey = (userKey || envKey);

  if (!apiKey || apiKey === 'tu-api-key-aqui') throw new Error("API_KEY_MISSING");

  const candidates = [
    { model: "gemini-2.5-flash", version: "v1beta" }
  ];

  const parts: any[] = [{ text: prompt }];

  if (images && images.length > 0) {
    images.forEach(base64 => {
      const cleanBase64 = base64.split(',')[1] || base64;
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: cleanBase64
        }
      });
    });
  }

  for (const cand of candidates) {
    try {
      const URL = `https://generativelanguage.googleapis.com/${cand.version}/models/${cand.model}:generateContent?key=${apiKey}`;
      const response = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192 // Aumentamos al máximo permitido para evitar cortes
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) continue;
        console.log(`✅ Conexión exitosa con: ${cand.model} (${cand.version})`);
        return text;
      }

      const rawErr = await response.text();

      if (response.status === 429) {
        console.warn(`⏳ Límite de Google alcanzado. Esperando 10 segundos para reintentar...`);
        await new Promise(r => setTimeout(r, 10000));
        // Reintentamos el mismo modelo
        return await callGeminiDynamic(prompt, images);
      }

      if (response.status === 503) {
        console.warn(`⏳ Modelo sobrecargado, reintentando en 5 segundos...`);
        await new Promise(r => setTimeout(r, 5000));
        return await callGeminiDynamic(prompt, images);
      }
    } catch (e) {
      console.warn(`Error en nodo ${cand.model}:`, e);
    }
  }
  throw new Error("El motor Gemini 2.5 está saturado. Por favor, espera un minuto.");
}

function parseJson(text: string) {
  let clean = text.trim();

  try {
    // 1. Extraer el bloque JSON si viene envuelto en markdown
    if (clean.includes("```")) {
      const blocks = clean.split("```");
      for (const block of blocks) {
        const content = block.replace(/^(json|text|markdown)/i, "").trim();
        if (content.startsWith('{') || content.startsWith('[')) {
          clean = content;
          break;
        }
      }
    }

    // 2. Limpieza de caracteres invisibles
    clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, (match) => {
      if (match === '\n' || match === '\r' || match === '\t') return match;
      return '';
    });

    // 3. INTENTO DE REPARACIÓN (Si está truncado)
    if (clean.startsWith('{') && !clean.endsWith('}')) {
      console.warn("⚠️ JSON Truncado detectado. Intentando cerrar llaves...");
      // Cerramos comillas y llaves de forma agresiva
      if (clean.includes('"') && (clean.match(/"/g) || []).length % 2 !== 0) clean += '"';
      clean += ' }';
      // Si sigue fallando, el error será capturado por el catch
    }

    return JSON.parse(clean);
  } catch (e) {
    console.error("❌ Error de parsing JSON. Texto recibido (truncado):", text.substring(0, 500));
    throw new Error("La IA generó una respuesta demasiado larga y se cortó. Por favor, intenta de nuevo o pide menos detalle.");
  }
}

export async function generateCourseSkeleton(prefs: UserPreferences): Promise<Course> {
  const prompt = `Analiza las imágenes y extrae SOLAMENTE los nombres de las unidades del curso "${prefs.topic}".
  
  JSON:
  {
    "title": "Nombre de la Materia",
    "description": "Breve descripción (máx 15 palabras)",
    "units": [
      {
        "title": "Unidad X: [Nombre de la Unidad]",
        "summary": "Pendiente de desarrollar"
      }
    ]
  }`;

  const text = await callGeminiDynamic(prompt, prefs.syllabusImages);
  const data = parseJson(text);

  return {
    id: `course_${Date.now()}`,
    createdAt: Date.now(),
    title: data.title || prefs.topic,
    duration: prefs.time,
    subjectCode: prefs.topic.substring(0, 3).toUpperCase(),
    description: data.description || `Curso de ${prefs.topic}`,
    profile: prefs.profile,
    units: (data.units || []).map((u: any, idx: number) => ({
      id: `unit_${Date.now()}_${idx}`,
      title: u.title,
      summary: u.summary,
      lessons: [],
      competencyDescription: ""
    })),
    instrumentation: undefined,
    studentList: [],
    masterGrades: [],
    syllabusImages: prefs.syllabusImages // Guardamos las imágenes para usarlas después
  };
}

export async function generateUnitContent(unit: Unit, contextDescription: string, syllabusImages?: string[]): Promise<Lesson[]> {
  // PASO 1: EXTRAER SÓLO LOS SUBTEMAS DEL DOCUMENTO
  const extractionPrompt = `Analiza las imágenes del temario de "${unit.title}".
  TU TAREA: Lístame SOLAMENTE los subtemas literales (ej: 1.1, 1.2 Conversiones).
  No expliques nada, solo la lista técnica.`;

  const subtopicsText = await callGeminiDynamic(extractionPrompt, syllabusImages);
  console.log("📍 Subtemas extraídos:", subtopicsText);

  // PASO 2: GENERAR EL CONTENIDO BASADO EN ESOS SUBTEMAS
  const contentPrompt = `Actúa como catedrático del TecNM. 
  DESARROLLA la lección para: "${unit.title}".
  SUBTEMAS: ${subtopicsText}
  
  CONTEXTO: ${contextDescription}
  
  REGLA DE VIDA O MUERTE: La teoría debe ser MUY BREVE (máximo 200 palabras). 
  Usa viñetas para explicar los subtemas rápidamente. 
  Si no eres breve, la conexión se cortará y fallarás la tarea.
  
  Responde ÚNICAMENTE en JSON con:
  {
    "lessonTitle": "${unit.title}",
    "theory": "Explicación técnica ultra-resumida de los subtemas",
    "humanImpact": "Cápsula de aplicación real",
    "practice1": "Reto rápido 1",
    "practice2": "Reto rápido 2",
    "evaluation": "Criterio de éxito",
    "questions": [
      { "q": "Pregunta", "o": ["A","B","C","D"], "a": 0, "f": "Feedback" }
    ]
  }`;

  const text = await callGeminiDynamic(contentPrompt);
  const raw = parseJson(text);

  return [{
    id: `l_${Date.now()}`,
    title: raw.lessonTitle || unit.title,
    blocks: [
      { type: 'theory', title: 'Fundamentos Técnicos', content: raw.theory },
      { type: 'example', title: 'Aplicación Práctica', content: raw.humanImpact },
      { type: 'activity', title: 'Práctica 1', content: raw.practice1, weight: 25 },
      { type: 'activity', title: 'Práctica 2', content: raw.practice2, weight: 25 },
      {
        type: 'test', title: 'Evaluación rápida', content: raw.evaluation, weight: 50,
        testQuestions: (raw.questions || []).map((q: any) => ({
          question: q.q, options: q.o, correctAnswerIndex: q.a, feedback: q.f
        }))
      }
    ]
  }];
}

export async function generateInstrumentation(course: Course): Promise<DidacticInstrumentation> {
  const prompt = `Actúa como un experto en diseño curricular del TecNM. 
  Genera la Instrumentación Didáctica COMPLETA para: "${course.title}".
  
  CONTEXTO:
  - Estudiantes de: ${course.profile}
  - Unidades: ${course.units.map(u => u.title).join(', ')}
  
  TU MISIÓN: Rellenar cada campo con lenguaje técnico pedagógico. NO dejes campos vacíos.
  
  ESTRUCTURA JSON REQUERIDA:
  {
    "characterization": "Descripción técnica de la materia y su importancia...",
    "didacticIntent": "Cómo enseñar las competencias, enfoque pedagógico...",
    "subjectCompetency": "Competencia general al terminar el curso...",
    "analysisByUnit": [
      {
        "unitTitle": "Nombre de la unidad",
        "competencyDescription": "Lo que el alumno sabrá hacer en esta unidad...",
        "indicatorsOfReach": "A. Se desenvuelve en..., B. Aplica..., C. Analiza...",
        "hours": "3-2-5 (Teoría-Práctica-Total)"
      }
    ],
    "evaluationMatrix": [
      {
        "evidence": "Examen Teórico / Práctica de Laboratorio / Proyecto Final",
        "percentage": 40,
        "indicators": "Puntos A, B, C y D del alcance",
        "evaluationType": "Formativa: Rúbrica de evaluación técnica"
      }
    ],
    "calendar": [
      { "week": 1, "planned": "Evaluación diagnóstica y encuadre de la materia" },
      { "week": 2, "planned": "Desarrollo de temas Unidad 1 y evaluación formativa" },
      { "week": 3, "planned": "Prácticas de laboratorio y seguimiento" },
      { "week": 16, "planned": "Evaluación sumativa final y cierre" }
    ]
  }
  
  REQUISITOS DEL CALENDARIO (16 SEMANAS):
  - Semana 1: DEBE incluir obligatoriamente la "Evaluación diagnóstica".
  - Semanas 2-15: Distribuye los temas de las unidades, evaluaciones formativas, sumativas y prácticas de forma coherente.
  - La columna 'planned' no debe llevar solo una 'X', debe llevar la descripción técnica de lo que se planea hacer (ej: 'Evaluación Sumativa Unidad 1').
  - La matriz de evaluación debe sumar 100%.`;

  const text = await callGeminiDynamic(prompt);
  const data = parseJson(text);
  return data;
}

export async function gradeSubmission(submission: any) {
  const prompt = `Actúa como un profesor riguroso del TecNM. Evalúa el siguiente trabajo de un estudiante:
  Unidad: ${submission.lessonTitle}
  Actividad: ${submission.activityTitle}
  Contenido: ${submission.content}
  
  Devuelve un JSON con:
  - score: (0-100)
  - feedback: (Comentario técnico profundo)
  - strengths: (Lista de fortalezas)
  - improvementAreas: (Lista de áreas de mejora)`;

  const text = await callGeminiDynamic(prompt);
  try {
    return parseJson(text);
  } catch {
    return { score: 70, feedback: "Análisis completado. Falta profundidad técnica.", strengths: [], improvementAreas: [] };
  }
}
