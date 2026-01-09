import OpenAI from 'openai';
import { Course, DidacticInstrumentation } from "./types";

const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'tu-api-key-aqui') {
    throw new Error('API_KEY_MISSING');
  }

  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('IA_TIMEOUT')), timeoutMs);
  });
}

function cleanAndParseJson(text: string): any {
  if (!text) return null;
  let trimmed = text.trim();
  trimmed = trimmed.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(trimmed);
  } catch (e) {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch {
        console.error('Error parseando JSON instrumentación:', trimmed.substring(0, 200));
        return null;
      }
    }
    return null;
  }
}

export const OPENAI_INSTRUMENTATION_PROMPT = (courseTitle: string, units: any[]) => `
Crea instrumentación didáctica completa para el curso: "${courseTitle}".

Genera un JSON válido y completo con esta estructura exacta:
{
  "characterization": "Descripción completa del curso, contexto educativo y perfil del estudiante",
  "didacticIntent": "Intencionalidad pedagógica, metodología de enseñanza y enfoque didáctico",
  "subjectCompetency": "Competencias principales de la asignatura que se desarrollarán durante el curso",
  "analysisByUnit": [
    {
      "unitTitle": "${units[0]?.title || 'Unidad 1'}",
      "competencyDescription": "Competencias específicas, objetivos de aprendizaje y resultados esperados de esta unidad",
      "indicatorsOfReach": "Indicadores de logro, evidencias de aprendizaje y criterios de evaluación formativa",
      "hours": "32 horas teóricas y 16 horas prácticas"
    }
  ],
  "evaluationMatrix": [
    {
      "evidence": "Trabajos prácticos individuales y en equipo",
      "percentage": 30,
      "indicators": "Calidad técnica, originalidad y cumplimiento de especificaciones",
      "evaluationType": "Evaluación formativa con retroalimentación continua"
    },
    {
      "evidence": "Proyecto integrador final",
      "percentage": 40,
      "indicators": "Aplicación práctica, documentación y presentación",
      "evaluationType": "Evaluación sumativa con rúbrica detallada"
    },
    {
      "evidence": "Exámenes escritos y pruebas objetivas",
      "percentage": 30,
      "indicators": "Dominio conceptual, resolución de problemas y precisión",
      "evaluationType": "Evaluación sumativa estandarizada"
    }
  ],
  "calendar": [
    {
      "week": 1,
      "planned": "Presentación del curso, diagnóstico inicial y fundamentos básicos"
    },
    {
      "week": 2,
      "planned": "Desarrollo de la Unidad 1: conceptos fundamentales y ejercicios introductorios"
    },
    {
      "week": 3,
      "planned": "Profundización en la Unidad 1: aplicaciones prácticas y resolución de casos"
    }
  ]
}

Instrucciones:
- Responde ÚNICAMENTE con el JSON solicitado
- Incluir contenido detallado y específico en cada campo
- Asegurar que todos los campos tengan información relevante y completa
- No omitir ninguna sección del JSON
- El JSON debe ser válido y parseable
`;

export async function generateInstrumentationOpenAI(course: Course): Promise<DidacticInstrumentation> {
  const openai = getOpenAIClient();
  const prompt = OPENAI_INSTRUMENTATION_PROMPT(course.title, course.units);

  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Eres un experto en instrumentación didáctica del TecNM. Genera documentos completos y detallados en formato JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
      createTimeoutPromise(60000) // Reducido a 60 segundos
    ]);

    const rawText = response.choices[0]?.message?.content || "";
    console.log("✅ Respuesta OpenAI (instrumentación):", rawText.substring(0, 200));

    const raw = cleanAndParseJson(rawText);
    if (!raw) {
      console.error("❌ Fallo al parsear instrumentación");
      return createFallbackInstrumentation();
    }

    const fullInstrumentation: DidacticInstrumentation = {
      characterization: raw.characterization || "Caracterización pendiente",
      didacticIntent: raw.didacticIntent || "Intencionalidad didáctica pendiente",
      subjectCompetency: raw.subjectCompetency || "Competencia de la asignatura pendiente",
      analysisByUnit: raw.analysisByUnit || [],
      evaluationMatrix: raw.evaluationMatrix || [],
      calendar: raw.calendar || []
    };

    console.log("✅ Instrumentación completa generada");
    return fullInstrumentation;

  } catch (error: any) {
    if (error.message === 'IA_TIMEOUT') {
      console.error('⏱️ Timeout generando instrumentación');
      return createFallbackInstrumentation();
    }
    if (error.message === 'API_KEY_MISSING') {
      console.error('🔑 API Key no configurada');
      throw new Error("API_KEY_MISSING");
    }
    console.error('❌ Error generando instrumentación:', error);
    return createFallbackInstrumentation();
  }
}

function createFallbackInstrumentation(): DidacticInstrumentation {
  return {
    characterization: "Error de timeout en generación. Por favor, intenta nuevamente.",
    didacticIntent: "Error de timeout en generación. Por favor, intenta nuevamente.",
    subjectCompetency: "Error de timeout en generación. Por favor, intenta nuevamente.",
    analysisByUnit: [],
    evaluationMatrix: [],
    calendar: []
  };
}

