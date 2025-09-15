// Subject equivalence mappings for grouping similar subjects from different schools
export interface SubjectEquivalence {
  groupName: string;
  equivalentNames: string[];
}

export const SUBJECT_EQUIVALENCES: SubjectEquivalence[] = [
  {
    groupName: "MATEMÁTICA",
    equivalentNames: ["MATEMÁTICA", "MATEMÁTICA Y ANÁLISIS MATEMÁTICO"]
  },
  {
    groupName: "QUÍMICA", 
    equivalentNames: ["QUÍMICA", "QUIMICA Y QUIMICA APLICADA"]
  },
  {
    groupName: "FÍSICA",
    equivalentNames: ["FÍSICA"]
  },
  {
    groupName: "BIOLOGÍA", 
    equivalentNames: ["BIOLOGÍA"]
  },
  {
    groupName: "INGLÉS",
    equivalentNames: ["INGLÉS"]
  },
  {
    groupName: "HISTORIA",
    equivalentNames: ["HISTORIA"]
  },
  {
    groupName: "GEOGRAFÍA", 
    equivalentNames: ["GEOGRAFÍA"]
  },
  {
    groupName: "LENGUA Y LITERATURA",
    equivalentNames: ["LENGUA Y LITERATURA"]
  },
  {
    groupName: "FORMACIÓN ÉTICA Y CIUDADANA",
    equivalentNames: ["FORMACIÓN ÉTICA Y CIUDADANA"]
  }
];

/**
 * Get the equivalence group for a given subject name
 * @param subjectName The name of the subject
 * @returns The equivalence group or null if not found
 */
export const getEquivalenceGroup = (subjectName: string): SubjectEquivalence | null => {
  return SUBJECT_EQUIVALENCES.find(group => 
    group.equivalentNames.includes(subjectName)
  ) || null;
};

/**
 * Get the group name for a subject (either its equivalence group name or its own name)
 * @param subjectName The name of the subject
 * @returns The group name to use for display
 */
export const getSubjectGroupName = (subjectName: string): string => {
  const equivalenceGroup = getEquivalenceGroup(subjectName);
  return equivalenceGroup ? equivalenceGroup.groupName : subjectName;
};

/**
 * Check if two subjects are equivalent
 * @param subjectName1 First subject name
 * @param subjectName2 Second subject name  
 * @returns True if subjects are equivalent
 */
export const areSubjectsEquivalent = (subjectName1: string, subjectName2: string): boolean => {
  if (subjectName1 === subjectName2) return true;
  
  const group1 = getEquivalenceGroup(subjectName1);
  const group2 = getEquivalenceGroup(subjectName2);
  
  return group1 !== null && group2 !== null && group1.groupName === group2.groupName;
};