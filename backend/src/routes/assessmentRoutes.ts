import express, { type Request, type Response } from "express";
import db from "../config/db.ts";
import multer from "multer";
import OpenAI, { toFile } from "openai";
import { getPhonemes } from "../utils/g2p.ts";
import type { TargetWordObject, ApiResponse } from "../../../shared/types.ts";

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

const checkAnswer = (target: string[], answer: string[]): boolean => {
  if (JSON.stringify(target) === JSON.stringify(answer)) {
    return true;
  } else return false;
};

const targetPhonemes: string[][] = [];
const transcribedPhonemes: string[][] = [];

const wordVariations = ["quaf", "quaff"];
const phonemetizedWord = [["K", "W", "AE", "F"]];

const getAllWordsStmt = db.prepare("SELECT * FROM targetWords");
const insertWordStmt = db.prepare(
  "INSERT INTO targetWords (word, arpabet, unit, test) VALUES (?, ?, ?, ?)"
);
const deleteIndividualWordStmt = db.prepare(
  "DELETE FROM targetWords WHERE id = ?"
);

// const formatDataForFrontend = (data: TargetWordObject): TargetWordObject => {

//   const wordObject = asdf as TargetWordObject;
//   return wordObject;
// };

assessmentRouter.get(
  "/targetWords",
  (req: Request, res: Response<ApiResponse<TargetWordObject[]>>) => {
    const rawRows = getAllWordsStmt.all() as TargetWordDbRow[];

    const data: TargetWordObject[] = rawRows.map((row) => ({
      ...row,
      word: JSON.parse(row.word),
      arpabet: JSON.parse(row.arpabet)
    }));
    try {
      res.status(200).json({
        success: true,
        data: data
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
);

assessmentRouter.post("/targetWords", (req: Request, res: Response) => {
  targetPhonemes;
});

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

assessmentRouter.post(
  "/transcribe",
  upload.single("audio"),
  async (req: Request, res: Response) => {
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

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"]
      });
      transcribedPhonemes.length = 0;
      const answer = await getPhonemes(transcription.text);
      transcribedPhonemes.push(answer);
      let result: boolean = false;
      if (targetPhonemes[0] && transcribedPhonemes[0]) {
        result = checkAnswer(targetPhonemes[0], transcribedPhonemes[0]);
      }
      console.log(transcription, targetPhonemes, transcribedPhonemes, result);

      res.json({
        text: transcription.text,
        targetPhonemes,
        transcribedPhonemes,
        result
      });
    } catch (err) {
      console.error("Error transcribing text:", err);
      res.status(500).json({ error: "Unable to transcribe audio." });
    }
  }
);

export default assessmentRouter;
