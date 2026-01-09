import { Course, UserPreferences, Unit } from "./types";

export function generateDemoSkeleton(prefs: UserPreferences): Course {
  const currentDate = Date.now();
  
  // Títulos específicos según el tema
  const getUnitTitles = (topic: string) => {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('matemática') || topicLower.includes('álgebra') || topicLower.includes('cálculo')) {
      return [
        "Unidad 1: Fundamentos Matemáticos y Números",
        "Unidad 2: Ecuaciones y Funciones",
        "Unidad 3: Cálculo Diferencial",
        "Unidad 4: Cálculo Integral",
        "Unidad 5: Aplicaciones y Problemas"
      ];
    }
    
    if (topicLower.includes('programación') || topicLower.includes('computación')) {
      return [
        "Unidad 1: Introducción a la Programación",
        "Unidad 2: Estructuras de Datos",
        "Unidad 3: Algoritmos y Complejidad",
        "Unidad 4: Programación Orientada a Objetos",
        "Unidad 5: Desarrollo de Software"
      ];
    }
    
    if (topicLower.includes('base') || topicLower.includes('datos')) {
      return [
        "Unidad 1: Fundamentos de Bases de Datos",
        "Unidad 2: Modelo Entidad-Relación",
        "Unidad 3: SQL y Consultas",
        "Unidad 4: Diseño de Base de Datos",
        "Unidad 5: Administración y Optimización"
      ];
    }
    
    if (topicLower.includes('red') || topicLower.includes('comunicación')) {
      return [
        "Unidad 1: Fundamentos de Redes",
        "Unidad 2: Protocolos de Comunicación",
        "Unidad 3: Redes LAN y WAN",
        "Unidad 4: Seguridad en Redes",
        "Unidad 5: Redes Inalámbricas y Móviles"
      ];
    }
    
    // Títulos genéricos por defecto
    return [
      "Unidad 1: Conceptos Fundamentales",
      "Unidad 2: Principios Básicos",
      "Unidad 3: Desarrollo y Aplicaciones",
      "Unidad 4: Temas Avanzados",
      "Unidad 5: Síntesis y Evaluación"
    ];
  };
  
  const unitTitles = getUnitTitles(prefs.topic);
  
  const units: Unit[] = unitTitles.map((title, index) => ({
    id: `unit_${index + 1}`,
    title,
    summary: `Desarrollo de los conceptos fundamentales de ${title.toLowerCase()}. Esta unidad cubre los principios teóricos y prácticos necesarios para comprender las aplicaciones básicas y prepararse para temas más avanzados. Incluye ejercicios prácticos y casos de estudio.`,
    lessons: []
  }));
  
  return {
    id: `course_${currentDate}`,
    createdAt: currentDate,
    title: `${prefs.topic} - ${prefs.level}`,
    duration: "64 horas",
    subjectCode: `${prefs.topic.substring(0, 3).toUpperCase()}${currentDate}`,
    description: `Curso de ${prefs.level} en ${prefs.topic} con duración de ${prefs.time}. Formato ${prefs.format} diseñado para estudiantes con perfil ${prefs.profile}. Objetivo: ${prefs.goal}.`,
    profile: prefs.profile,
    units,
    instrumentation: undefined,
    studentList: [],
    masterGrades: []
  };
}
