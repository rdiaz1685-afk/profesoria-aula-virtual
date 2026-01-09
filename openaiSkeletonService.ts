import OpenAI from 'openai';
import { Course, UserPreferences, Unit } from "./types";

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

  // Remover bloques de código markdown
  trimmed = trimmed.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(trimmed);
  } catch (e) {
    // Intento de rescate: buscar el primer objeto JSON válido
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch {
        console.error('Error parseando JSON:', trimmed.substring(0, 200));
        return null;
      }
    }
    return null;
  }
}

export const OPENAI_SKELETON_PROMPT = (prefs: UserPreferences) => `
Genera estructura de curso para: ${prefs.topic}

Nivel: ${prefs.level}
Formato: ${prefs.format}
Duración: ${prefs.time}

DEVUELVE JSON VÁLIDO:
{
  "title": "Título del curso",
  "units": [
    {
      "title": "Unidad 1: Conceptos Fundamentales",
      "summary": "Introducción a los principios básicos y aplicaciones iniciales"
    },
    {
      "title": "Unidad 2: Desarrollo y Aplicaciones",
      "summary": "Profundización en conceptos avanzados y casos prácticos"
    },
    {
      "title": "Unidad 3: Temas Especializados",
      "summary": "Aplicaciones específicas y proyectos integradores"
    },
    {
      "title": "Unidad 4: Prácticas Avanzadas",
      "summary": "Ejercicios complejos y resolución de problemas"
    },
    {
      "title": "Unidad 5: Evaluación y Síntesis",
      "summary": "Repaso general y preparación para evaluación final"
    }
  ]
}

REGLAS:
- Solo responde el JSON
- 5 unidades exactas
- Títulos específicos
- Resúmenes concisos
`;

export async function generateCourseSkeletonOpenAI(prefs: UserPreferences): Promise<Course> {
  const openai = getOpenAIClient();
  const prompt = OPENAI_SKELETON_PROMPT(prefs);

  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un experto en diseño curricular. Responde ÚNICAMENTE con JSON válido, sin texto adicional."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }),
      createTimeoutPromise(30000) // Reducido a 30 segundos
    ]);

    const rawText = response.choices[0]?.message?.content || "";
    console.log("✅ Respuesta OpenAI (esqueleto):", rawText.substring(0, 200));

    const raw = cleanAndParseJson(rawText);
    if (!raw || !raw.units || !Array.isArray(raw.units)) {
      console.error("❌ Estructura inválida:", raw);
      throw new Error("IA_INVALID_RESPONSE");
    }

    // Validar que tenga al menos 3 unidades
    if (raw.units.length < 3) {
      console.warn("⚠️ Pocas unidades generadas, completando...");
      while (raw.units.length < 5) {
        raw.units.push({
          title: `Unidad ${raw.units.length + 1}: Contenido Adicional`,
          summary: "Temas complementarios y aplicaciones prácticas"
        });
      }
    }

    // Asignar IDs a las unidades
    const unitsWithIds = raw.units.map((u: any, idx: number) => ({
      id: `unit_${Date.now()}_${idx}`,
      title: u.title || `Unidad ${idx + 1}`,
      summary: u.summary || "Descripción pendiente",
      lessons: [],
      competencyDescription: u.competencyDescription || ""
    }));

    return {
      id: `course_${Date.now()}`,
      createdAt: Date.now(),
      title: raw.title || prefs.topic,
      duration: raw.duration || "64 horas",
      subjectCode: raw.subjectCode || prefs.topic.substring(0, 3).toUpperCase(),
      description: raw.description || `Curso de ${prefs.level} en ${prefs.topic}`,
      profile: prefs.profile,
      units: unitsWithIds,
      instrumentation: undefined,
      studentList: [],
      masterGrades: []
    };
  } catch (error: any) {
    if (error.message === 'IA_TIMEOUT') {
      console.error('⏱️ Timeout generando esqueleto');
      throw new Error("IA_TIMEOUT");
    }
    if (error.message === 'API_KEY_MISSING') {
      console.error('🔑 API Key no configurada');
      throw new Error("API_KEY_MISSING");
    }
    console.error('❌ Error generando esqueleto:', error);
    throw error;
  }
}

