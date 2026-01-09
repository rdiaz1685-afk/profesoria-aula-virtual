import { Course, DidacticInstrumentation, Lesson } from "./types";

export function generateDemoInstrumentation(course: Course): DidacticInstrumentation {
  return {
    characterization: `El curso "${course.title}" es una asignatura fundamental en el área de ingeniería que proporciona a los estudiantes los conocimientos teóricos y prácticos necesarios para comprender los principios básicos y aplicaciones avanzadas en este campo. El curso está diseñado para estudiantes de nivel ${course.description.includes('básico') ? 'inicial' : 'intermedio'} con interés en desarrollar competencias técnicas y analíticas.`,
    didacticIntent: "Este curso utiliza un enfoque metodológico constructivista donde los estudiantes construyen su conocimiento a través de actividades prácticas, resolución de problemas y trabajo colaborativo. Se combina la teoría con la práctica mediante ejemplos reales, proyectos integradores y uso de herramientas tecnológicas actuales.",
    subjectCompetency: "Desarrollar competencias en análisis, diseño e implementación de soluciones técnicas; capacidad para resolver problemas complejos; habilidad para trabajar en equipo y comunicar resultados técnicos de manera efectiva.",
    analysisByUnit: course.units.map((unit, index) => ({
      unitTitle: unit.title,
      competencyDescription: `Comprender los fundamentos teóricos y prácticos de ${unit.title.toLowerCase()}, aplicando conceptos a situaciones reales y desarrollando habilidades de análisis y resolución de problemas.`,
      indicatorsOfReach: "Participación activa en clases, calidad de trabajos prácticos, capacidad de aplicar conceptos a nuevos problemas, colaboración efectiva en equipos de trabajo.",
      hours: "32 horas teóricas y 16 horas prácticas"
    })),
    evaluationMatrix: [
      {
        evidence: "Trabajos prácticos individuales y en equipo",
        percentage: 30,
        indicators: "Calidad técnica, originalidad, cumplimiento de especificaciones, documentación apropiada",
        evaluationType: "Evaluación formativa con retroalimentación continua"
      },
      {
        evidence: "Proyecto integrador final",
        percentage: 40,
        indicators: "Aplicación práctica, documentación completa, presentación clara, innovación en solución",
        evaluationType: "Evaluación sumativa con rúbrica detallada"
      },
      {
        evidence: "Exámenes escritos y pruebas objetivas",
        percentage: 30,
        indicators: "Dominio conceptual, precisión en cálculos, capacidad de análisis, tiempo de respuesta",
        evaluationType: "Evaluación sumativa estandarizada"
      }
    ],
    calendar: Array.from({ length: 16 }, (_, i) => ({
      week: i + 1,
      planned: i < course.units.length * 3 
        ? `Semana ${i + 1}: Desarrollo de la Unidad ${Math.floor(i / 3) + 1} - ${i % 3 === 0 ? 'Introducción y conceptos básicos' : i % 3 === 1 ? 'Aplicaciones prácticas' : 'Evaluación y consolidación'}`
        : `Semana ${i + 1}: Repaso general y preparación para evaluación final`
    }))
  };
}

export function generateDemoLesson(unitTitle: string): Lesson {
  return {
    id: `l_${Date.now()}`,
    title: `Introducción a ${unitTitle}`,
    blocks: [
      {
        type: 'theory',
        title: 'Fundamentos Teóricos',
        content: `${unitTitle} es un área fundamental que estudia los principios básicos y aplicaciones prácticas. En esta unidad exploraremos los conceptos esenciales que nos permitirán comprender cómo funcionan los sistemas y cómo aplicar estos conocimientos en situaciones reales. Los temas principales incluyen definiciones, clasificaciones, propiedades fundamentales y metodologías de análisis.`
      },
      {
        type: 'activity',
        title: 'Práctica 1 (25 puntos)',
        content: `Investiga y documenta un caso real donde se apliquen los conceptos de ${unitTitle}. Elabora un reporte de 3 páginas que incluya: descripción del caso, análisis teórico, identificación de variables principales y propuestas de mejora. Debes incluir al menos 3 referencias bibliográficas actuales.`,
        weight: 25
      },
      {
        type: 'activity',
        title: 'Práctica 2 (25 puntos)',
        content: `Desarrolla un pequeño proyecto práctico que demuestre tu comprensión de ${unitTitle}. El proyecto debe incluir: objetivos claros, metodología implementada, resultados obtenidos, análisis crítico y conclusiones. Presenta tu trabajo en formato digital con diagramas y tablas explicativas.`,
        weight: 25
      },
      {
        type: 'test',
        title: 'Evaluación (50 puntos)',
        content: 'Responde basándote en la teoría, ejemplos y prácticas realizadas. Cada pregunta vale 12.5 puntos.',
        weight: 50,
        testQuestions: [
          {
            question: `¿Cuál es el principio fundamental de ${unitTitle} y por qué es importante en la práctica?`,
            options: [
              "Principio de conservación de energía",
              "Principio de causalidad y efecto",
              "Principio de equilibrio dinámico",
              "Principio de optimalidad"
            ],
            correctAnswerIndex: 1,
            feedback: "Correcto. El principio de causalidad y efecto es fundamental porque nos permite entender las relaciones causa-efecto en los sistemas."
          },
          {
            question: `En un escenario práctico de ${unitTitle}, ¿qué método sería más adecuado para analizar el problema?`,
            options: [
              "Método cualitativo puro",
              "Método cuantitativo con datos",
              "Método intuitivo sin análisis",
              "Método teórico sin aplicación"
            ],
            correctAnswerIndex: 1,
            feedback: "Excelente. El método cuantitativo con datos es el más adecuado porque proporciona base objetiva para el análisis."
          },
          {
            question: `¿Cuál sería la mejor estrategia para implementar una solución en ${unitTitle}?`,
            options: [
              "Implementación directa sin planificación",
              "Planificación gradual con pruebas iterativas",
              "Implementación masiva simultánea",
              "Solución teórica sin práctica"
            ],
            correctAnswerIndex: 1,
            feedback: "Correcto. La planificación gradual con pruebas iterativas permite identificar y corregir problemas temprano."
          },
          {
            question: `¿Qué factores deben considerarse al evaluar la efectividad en ${unitTitle}?`,
            options: [
              "Solo el costo inicial",
              "Solo la velocidad de implementación",
              "Múltiples criterios: eficiencia, costo, mantenibilidad",
              "Solo la opinión del experto"
            ],
            correctAnswerIndex: 2,
            feedback: "Perfecto. La evaluación debe considerar múltiples criterios para asegurar una solución completa y sostenible."
          }
        ]
      }
    ]
  };
}
