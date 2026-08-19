import express, { type Request, type Response } from "express";
import db from "../config/db.ts";
import multer from "multer";
import OpenAI, { toFile } from "openai";
import { getPhonemes } from "../utils/g2p.ts";
import type {
  TargetWordBEObject,
  TargetWordFEObject,
  AssessmentIdInfoObject,
  ApiResponse
} from "../../../shared/types.ts";

const assessmentRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const upload = multer({ storage: multer.memoryStorage() });

interface TargetWordDbRow {
  word: string;
  arpabet: string;
  unit: string;
  test: string;
}

type PreppedTargetArray = Omit<TargetWordBEObject, "test" | "unit">[][];
// Utility Functions

const prepareTargetPhonemesArray = (targets: TargetWordBEObject[]) => {
  const array = targets.map((item) => {
    const { test, unit, ...rest } = item;
    return { ...rest };
  });
  return array;
};

const checkAnswer = (target: string[], userAnswer: string[]): boolean => {
  if (JSON.stringify(target) === JSON.stringify(userAnswer)) {
    return true;
  } else return false;
};

const shuffleItems = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j: number = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array;
};

const wordVariations = ["quaf", "quaff"];
const phonemetizedWord = [["K", "W", "AE", "F"]];

// Sqlite Statements
const getAllWordsStmt = db.prepare("SELECT * FROM targetWords");
const getWordsForAssessmentStmt = db.prepare(
  "SELECT * FROM targetWords ORDER BY RANDOM() LIMIT ?"
);
const insertWordStmt = db.prepare(
  "INSERT INTO targetWords (word, arpabet, unit, test) VALUES (?, ?, ?, ?)"
);
const deleteIndividualWordStmt = db.prepare(
  "DELETE FROM targetWords WHERE id = ?"
);
const addAssessmentQuestionsStmt = db.prepare(
  "INSERT INTO studentAssessments (studentId, testId, status, questions) VALUES (?, ?, ?, ?)"
);
const getAssessmentQuestionsStmt = db.prepare(
  "SELECT * FROM studentAssessments WHERE studentId = ? and testId = ?"
);

assessmentRouter.post(
  "/students/:studentId/:testId",
  (
    req: Request,
    res: Response<ApiResponse<TargetWordFEObject[], AssessmentIdInfoObject>>
  ) => {
    const { studentId, testId } = req.params;

    const maxTargetWords = req.body.numberOfQuestions;

    const rawRows = getWordsForAssessmentStmt.all(
      maxTargetWords
    ) as TargetWordDbRow[];

    const parsedAssessmentData: TargetWordBEObject[] = rawRows.map((row) => ({
      ...row,
      word: JSON.parse(row.word),
      arpabet: JSON.parse(row.arpabet)
    }));
    if (!parsedAssessmentData) {
      return res
        .status(404)
        .json({ success: false, error: "Target words not found" });
    }
    const shuffledAssessmentData = shuffleItems(parsedAssessmentData);
    const semiPreppedAssessmentData = shuffledAssessmentData.map(
      (item, index) => {
        const { ...rest } = item;
        return { ...rest, listNumber: index + 1 };
      }
    );

    console.log(semiPreppedAssessmentData);

    const info = addAssessmentQuestionsStmt.run(
      studentId,
      testId,
      "pending",
      JSON.stringify(semiPreppedAssessmentData)
    );
    const assessmentId = info.lastInsertRowid;
    console.log(assessmentId);

    const fullyPreppedData = semiPreppedAssessmentData.map((item) => {
      const { arpabet, ...rest } = item;
      return { ...rest };
    });
    res.status(200).json({
      success: true,
      data: [fullyPreppedData, { id: assessmentId }]
    });
  }
);
assessmentRouter.get(
  "/targetWords",
  (req: Request, res: Response<ApiResponse<TargetWordFEObject[], null>>) => {
    const rawRows = getAllWordsStmt.all() as TargetWordDbRow[];

    const data: TargetWordBEObject[] = rawRows.map((row) => ({
      ...row,
      word: JSON.parse(row.word),
      arpabet: JSON.parse(row.arpabet)
    }));

    prepareTargetPhonemesArray(data);
    shuffleItems(data);
    const preppedData = data.map((item, index) => {
      const { arpabet, ...rest } = item;
      return { ...rest, listNumber: index + 1 };
    });

    try {
      res.status(200).json({
        success: true,
        data: [preppedData, null]
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
);

assessmentRouter.post("/targetWords", (req: Request, res: Response) => {});

assessmentRouter.post("/targetWords/add", (req: Request, res: Response) => {
  const info = insertWordStmt.run(
    JSON.stringify(wordVariations),
    JSON.stringify(phonemetizedWord),
    null,
    null
  );

  try {
    res.status(201).json({
      success: true,
      id: info.lastInsertRowid,
      message: "Word successfully added"
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
const transcribeAudioArray = async (audioFile: File): Promise<string[]> => {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en",
    response_format: "verbose_json",
    timestamp_granularities: ["word"]
  });
  const answer = await getPhonemes(transcription.text);

  return answer;
};
assessmentRouter.post(
  "/transcribe/:assessmentId/:userId/:testId/:questionId",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    const { userId, testId, questionId } = req.params;
    try {
      const info = getAssessmentQuestionsStmt.get(userId, testId);
    } catch (error) {
      res
        .status(500)
        .json("There was an error retrieving the test data from the database.");
    }
    try {
      if (!req.file) {
        res.status(400).json({ error: "No audio file uploaded." });
        return;
      }
      console.log(`Processing file: ${req.file.originalname}`);

      const audioFile = await toFile(
        req.file.buffer,
        req.file.originalname || "audio.mp3"
      );

      console.log(
        `Received file: ${req.file.originalname} (${req.file.size} bytes)`
      );
      const transcribedPhonemes: string[][] = [];
      const processedAudioArray = transcribeAudioArray(audioFile);
      console.log(processedAudioArray);

      // transcribedPhonemes.push(processedAudioArray);
      let result: boolean = false;
      // if (targetPhonemes[0] && transcribedPhonemes[0]) {
      //   result = checkAnswer(targetPhonemes[0], transcribedPhonemes[0]);
      // }

      // console.log(
      //   transcription.text,
      //   targetPhonemes,
      //   transcribedPhonemes,
      //   result
      // );

      // res.json({
      //   text: transcription.text,
      //   targetPhonemes,
      //   transcribedPhonemes,
      //   result
      // });
    } catch (err) {
      console.error("Error transcribing text:", err);
      res.status(500).json({ error: "Unable to transcribe audio." });
    }
  }
);

export default assessmentRouter;
