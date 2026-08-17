export interface TargetWordObject {
  word: string[];
  arpabet: string[][];
  unit: string;
  test: string;
}

export interface TranscriptionResponse {
  text: string;
}

interface AssessmentObject {}

export interface ApiResponse<T> {
  success: Boolean;
  data?: T;
  error?: string;
}

export enum CurrentTestingStatus {
  notTesting = "notTesting",
  inProgress = "inProgress",
  finished = "finished"
}
