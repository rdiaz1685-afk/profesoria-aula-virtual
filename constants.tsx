import { Type } from "@google/genai";
import { UserPreferences } from "./types";

export const SKELETON_PROMPT = (prefs: UserPreferences) => `
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

export const SKELETON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subjectCode: { type: Type.STRING },
    units: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING }
        }
      }
    }
  },
  required: ["title", "units"]
};

export const UNIT_CONTENT_PROMPT = (unitTitle: string, unitSummary: string) => `
Genera contenido educativo para la unidad: "${unitTitle}".

CONTEXT: ${unitSummary}

DEVUELVE JSON VÁLIDO:
{
  "lessonTitle": "Título de la sesión",
  "theory": "Explicación técnica con conceptos clave y ejemplos",
  "practice1": "Actividad práctica 1 (25 puntos)",
  "practice2": "Actividad práctica 2 (25 puntos)",
  "evaluation": "Evaluación escrita (50 puntos)",
  "questions": [
    {"q": "Pregunta técnica", "o": ["A", "B", "C", "D"], "a": 0, "f": "Feedback"},
    {"q": "Pregunta aplicación", "o": ["A", "B", "C", "D"], "a": 1, "f": "Feedback"},
    {"q": "Pregunta análisis", "o": ["A", "B", "C", "D"], "a": 2, "f": "Feedback"},
    {"q": "Pregunta diseño", "o": ["A", "B", "C", "D"], "a": 3, "f": "Feedback"}
  ]
}

REGLAS:
- JSON sin markdown
- Total 100 puntos
- Respuesta directa
`;

export const GRADE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    aiFeedback: { type: Type.STRING }
  },
  required: ["score"]
};
