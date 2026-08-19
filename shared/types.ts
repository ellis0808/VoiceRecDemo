export interface TargetWordBEObject {
  word: string[];
  arpabet: string[][];
  unit: string;
  test: string;
  listNumber?: number;
}

export type TargetWordFEObject = Omit<TargetWordBEObject, "arpabet"> & {
  listNumber: number;
};
export interface AssessmentIdInfoObject {
  id: number | bigint;
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

interface AssessmentObject {}

export interface ApiResponse<T, U> {
  success: Boolean;
  data?: [T, U?];
  error?: string;
}

export enum CurrentTestingStatus {
  notTesting = "notTesting",
  inProgress = "inProgress",
  finished = "finished"
}
