import { GoogleGenAI } from "@google/genai";
import { Course, DidacticInstrumentation } from "./types";

const getAiClient = () => {
  const apiKey = 'AIzaSyAoYtOEDRHxupQ_4_Itc1Ugh4Z6OrWM3kE';
  return new GoogleGenAI({ apiKey });
};

function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
  });
}

function cleanAndParseJson(text: string): any {
  if (!text) return null;
  let trimmed = text.trim();
  trimmed = trimmed.replace(/^```json/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed);
  } catch (e) {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch { return null; }
    }
    return null;
  }
}

export const INSTRUMENTATION_PROMPT = (courseTitle: string, units: any[]) => `
Crea instrumentación didáctica para el curso: "${courseTitle}".

Responde con este JSON exacto:
{
  "characterization": "Descripción general del curso",
  "didacticIntent": "Metodología y enfoque de enseñanza",
  "subjectCompetency": "Competencias a desarrollar",
  "analysisByUnit": [
    {
      "unitTitle": "${units[0]?.title || 'Unidad 1'}",
      "competencyDescription": "Objetivos y competencias de esta unidad",
      "indicatorsOfReach": "Indicadores de evaluación",
      "hours": "30 horas"
    }
  ],
  "evaluationMatrix": [
    {
      "evidence": "Trabajos y exámenes",
      "percentage": 50,
      "indicators": "Calidad y entrega",
      "evaluationType": "Sumativa"
    }
  ],
  "calendar": [
    {
      "week": 1,
      "planned": "Presentación y contenidos iniciales"
    }
  ]
}

Solo responde el JSON, nada más.
`;

export async function generateInstrumentation(course: Course): Promise<DidacticInstrumentation> {
  const ai = getAiClient();
  const prompt = INSTRUMENTATION_PROMPT(course.title, course.units);

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-pro",
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 1500,
        },
      }),
      createTimeoutPromise(60000) // 60 segundos timeout
    ]);

    console.log("Respuesta cruda del modelo AI:", response.text);

    const raw = cleanAndParseJson(response.text || "");
    if (!raw) {
      console.error("Fallo al parsear instrumentación:", response.text);
      return {
        characterization: "No se pudo generar la caracterización",
        didacticIntent: "No se pudo generar la intencionalidad",
        subjectCompetency: "No se pudo generar la competencia",
        analysisByUnit: [],
        evaluationMatrix: [],
        calendar: []
      };
    }

    return {
      characterization: raw.characterization || "Caracterización del curso",
      didacticIntent: raw.didacticIntent || "Intencionalidad didáctica",
      subjectCompetency: raw.subjectCompetency || "Competencias de la asignatura",
      analysisByUnit: raw.analysisByUnit || [],
      evaluationMatrix: raw.evaluationMatrix || [],
      calendar: raw.calendar || []
    };
  } catch (error: any) {
    if (error.message === 'TIMEOUT') {
      console.error('Timeout generando instrumentación');
      return {
        characterization: "Error de timeout en generación",
        didacticIntent: "Error de timeout en generación",
        subjectCompetency: "Error de timeout en generación",
        analysisByUnit: [],
        evaluationMatrix: [],
        calendar: []
      };
    }
    throw error;
  }
}
