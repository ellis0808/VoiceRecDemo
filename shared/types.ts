export interface TargetWordBEObject {
  word: string[];
  arpabet: string[][]; // don't want this available in the FE... nullify before sending to FE
  unit: string;
  test: string;
  listNumber?: number;
}

export type TargetWordFEObject = Omit<TargetWordBEObject, "arpabet"> & {
  listNumber: number;
};

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
