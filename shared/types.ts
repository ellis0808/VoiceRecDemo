export interface TargetWordBEObject {
  word: string[];
  arpabet: string[][];
  unit?: string;
  test?: string;
  listNumber?: number;
  name?: string;
}

export type TargetWordFEObject = Omit<TargetWordBEObject, "arpabet"> & {
  listNumber: number;
};
export interface AssessmentIdInfoObject {
  id: number;
}

export interface AssessmentInfoObject {
  schoolId: number;
  testId: number;
  testName: string;
}
// export interface TargerWordListBEObject extends TargetWordObject {
//   listNumber: number;
// }

// export interface TargetWordListFEObject {
//   listNumber: number;
//   word: string;
// }

export interface TranscriptionResponse {
  text: string;
}

export interface AssessmentObject {
  id: number;
  schoolId: number;
  studentId: number;
  assessmentSessionId: number;
  testId: number;
  status: string;
  questions: string;
  answers: string | null;
  score: number | null;
}

export interface WordTestsArray {
  schoolId: number;
  testId: number;
  name: string;
  assessmentData: [];
}

export interface TestItems {
  testItems: WordTestsBEObject[];
}
export interface WordTestsBEObject {
  schoolId: number;
  testId: number;
  name: string;
  wordId: number;
  word: string[];
  arpabet: string[][];
}
export interface WordTestsFEObject {
  wordId: number;
  word: string[];
  arpabet: string[][];
}

export interface UserTestDataObject {
  id: number;
  schoolId: number;
  userId: number;
  testId: number;
  questions: WordTestsBEObject[];
  answersArpabet: string;
  answersAudio?: Blob[];
}

export interface UserLoadedAudio {
  id: number;
  schoolId: number;
  userId: number;
  studentAssessmentId: number;
  questionId: number;
  audio: { type: string; data: [] };
  audioUrl: string;
  mimeType: string;
}

export interface ApiResponse<T, U> {
  success: Boolean;
  data?: [T, U?];
  error?: string;
}

export enum currentTestingStatus {
  notTesting = "notTesting",
  inProgress = "inProgress",
  finished = "finished"
}
