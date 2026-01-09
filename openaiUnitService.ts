import OpenAI from 'openai';
import { Course, Unit, Lesson } from "./types";

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
        console.error('Error parseando JSON unidad:', trimmed.substring(0, 200));
        return null;
      }
    }
    return null;
  }
}

export const OPENAI_UNIT_PROMPT = (unitTitle: string, unitSummary: string) => `
Genera contenido educativo completo para la unidad: "${unitTitle}".

CONTEXT: ${unitSummary}

DEVUELVE JSON VÁLIDO:
{
  "lessonTitle": "Título específico de la sesión",
  "theory": "Explicación técnica detallada: 4-5 párrafos con conceptos clave, ejemplos prácticos y aplicaciones reales",
  "practice1": "Actividad práctica 1 (25 puntos) - Ejercicio fundamental con instrucciones detalladas",
  "practice2": "Actividad práctica 2 (25 puntos) - Trabajo de aplicación o investigación",
  "evaluation": "Evaluación escrita (50 puntos) - Examen completo con casos prácticos",
  "questions": [
    {"q": "Pregunta técnica directa con ejemplo práctico", "o": ["Opción A", "Opción B", "Opción C", "Opción D"], "a": 0, "f": "Retroalimentación con referencia al tema"},
    {"q": "Pregunta de aplicación con caso de uso real", "o": ["Opción A", "Opción B", "Opción C", "Opción D"], "a": 1, "f": "Retroalimentación constructiva"},
    {"q": "Pregunta de análisis con escenario complejo", "o": ["Opción A", "Opción B", "Opción C", "Opción D"], "a": 2, "f": "Retroalimentación detallada"},
    {"q": "Pregunta de diseño o implementación", "o": ["Opción A", "Opción B", "Opción C", "Opción D"], "a": 3, "f": "Retroalimentación técnica"}
  ]
}

REGLAS ESTRICTAS:
- JSON válido sin markdown
- Teoría con ejemplos concretos y aplicaciones industriales
- 2 prácticas de 25 puntos cada una (50 puntos totales)
- Evaluación de 50 puntos con 4 preguntas
- Total: 100 puntos por unidad (OBLIGATORIO)
- Máximo 2500 tokens para respuesta completa
`;

export async function generateUnitContentOpenAI(unit: Unit, level: string): Promise<Lesson[]> {
  const openai = getOpenAIClient();
  const prompt = OPENAI_UNIT_PROMPT(unit.title, unit.summary);

  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un experto en pedagogía técnica. Genera contenido educativo completo en formato JSON. Las ponderaciones DEBEN sumar exactamente 100 puntos."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      }),
      createTimeoutPromise(45000) // Reducido a 45 segundos
    ]);

    const rawText = response.choices[0]?.message?.content || "";
    console.log("✅ Respuesta OpenAI (unidad):", rawText.substring(0, 200));

    const raw = cleanAndParseJson(rawText);
    if (!raw) {
      console.error("❌ Fallo al parsear unidad");
      throw new Error("IA_INVALID_RESPONSE");
    }

    const lesson: Lesson = {
      id: `l_${Date.now()}`,
      title: raw.lessonTitle || unit.title,
      blocks: [
        {
          type: 'theory' as const,
          title: 'Fundamentos Teóricos',
          content: raw.theory || "Contenido no generado correctamente."
        },
        {
          type: 'activity' as const,
          title: 'Práctica 1 (25 puntos)',
          content: raw.practice1 || "Realiza un ejercicio fundamental del tema.",
          weight: 25
        },
        {
          type: 'activity' as const,
          title: 'Práctica 2 (25 puntos)',
          content: raw.practice2 || "Desarrolla una aplicación práctica.",
          weight: 25
        },
        {
          type: 'test' as const,
          title: 'Evaluación (50 puntos)',
          content: raw.evaluation || 'Responde basándote en la teoría y ejemplos.',
          weight: 50,
          testQuestions: (raw.questions || []).map((q: any) => ({
            question: q.q || "Pregunta de repaso",
            options: q.o || ["Opción A", "Opción B", "Opción C", "Opción D"],
            correctAnswerIndex: q.a ?? 0,
            feedback: q.f || "Revisa el contenido anterior."
          }))
        }
      ]
    };

    // Validar que las ponderaciones sumen 100
    const totalWeight = lesson.blocks.reduce((sum, block) => sum + (block.weight || 0), 0);
    if (totalWeight !== 100) {
      console.warn(`⚠️ Ponderación total: ${totalWeight} (esperado: 100)`);
    }

    return [lesson];
  } catch (error: any) {
    if (error.message === 'IA_TIMEOUT') {
      console.error('⏱️ Timeout generando unidad');
      throw new Error("IA_TIMEOUT");
    }
    if (error.message === 'API_KEY_MISSING') {
      console.error('🔑 API Key no configurada');
      throw new Error("API_KEY_MISSING");
    }
    console.error('❌ Error generando unidad:', error);
    throw error;
  }
}

