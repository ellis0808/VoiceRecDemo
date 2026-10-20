export interface TargetWordBEObject {
  word: string[];
  arpabet: string[][];
  unit?: string;
  test?: string;
  listNumber?: number;
  name?: string;
}

export interface Test {
  id: number;
  schoolId: number;
  dateCreated: number;
  dateModified: number;
  type: string;
  gradeLevel: number;
  testData: TestData;
}
export interface NewTest {
  type: string;
  focus: string;
  testData: TestData;
}

export interface TestData {
  questions: string[];
  answers: string[];
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

export interface TargetTestDbRow {
  schoolId: number;
  name: string;
  testId: number;
  wordId: number;
  word: string;
  arpabet: string;
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
  assessmentSessionId: number;
  questions: WordTestsBEObject[];
  answersArpabet: string;
  answersAudio?: Blob[];
  score: number;
}

export interface UserLoadedAudio {
  id: number;
  schoolId: number;
  userId: number;
  studentAssessmentId: number;
  questionId: number;
  audio: { type: string; data: [] };
  audioUrl?: string;
  mimeType: string;
}

export interface School {
  id: number;
  name: string;
  shortName: string;
}

export interface SchoolClass {
  id: number;
  schoolId: number;
  name: string;
  teacherId: number;
}

export interface User {
  id: number;
  schoolId: number;
  email?: string;
  username: string;
  lastName: string;
  firstName: string;
  dateAdded: number;
  role: string;
}

export interface TestResults {
  id: number;
  listNumber: number;
  question: string;
  answer: string[];
  result?: boolean;
  score?: number;
}

export interface CheckResults {
  score: number;
  correct: string[];
  incorrect: string[];
}

export interface Teacher extends User {
  english: number;
}
export interface Student extends User {
  studentNumber: number;
  matriculationYear: number;
  englishClass: number;
  homeroom: number;
}

export interface ApiResponse<T, U> {
  success: Boolean;
  data?: [T, U?];
  error?: string;
}

export interface ImportedWord {
  word: string;
  alt1: string;
  alt2: string;
  unit: number;
  testSegment: string | null;
}

export interface ConvertedWord {
  word: string;
  arpabet: string;
  unit: number | null;
}

export interface NewTestUpload {
  name: string;
  focus?: string;
  data: ConvertedWord[];
}

export interface ImportedWordsForDisplay {}

export enum currentTestingStatus {
  notTesting = "notTesting",
  inProgress = "inProgress",
  finished = "finished"
}
