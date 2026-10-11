import type { WordTestsBEObject } from "../../../shared/types.ts";

const convertAssessmentBEToFE = async (assessment: WordTestsBEObject[]) => {
  const targetTest = assessment.map((item, index) => {
    const { schoolId, testId, ...rest } = item;
    return { ...rest, listNumber: index + 1 };
  });

  return targetTest;
};

export default convertAssessmentBEToFE;
