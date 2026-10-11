import express, { type Request, type Response } from "express";
import db from "../config/db.ts";
import multer from "multer";
import OpenAI, { toFile } from "openai";
import { getPhonemes } from "../utils/g2p.ts";
import type {
  TargetWordBEObject,
  ApiResponse,
  AssessmentObject,
  WordTestsBEObject,
  TargetTestDbRow
} from "../../../shared/types.ts";
import { arpabetCheck } from "../utils/checker.ts";

const studentRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10 }
});

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

const insertWordStmt = db.prepare(
  "INSERT INTO targetWords (schoolId, word, arpabet, unit) VALUES (?, ?, ?, ?)"
);

const addAssessmentQuestionsStmt = db.prepare(
  "INSERT INTO studentAssessments (schoolId, userId, assessmentSessionId, testId, status, questions, timeStarted) VALUES (?, ?, ?, ?, ?, ?, ?)"
);
const updateAssessmentQuestionsStmt = db.prepare(
  "UPDATE studentAssessments SET status = ?, answersArpabet = ?, timeEnded = ? WHERE id = ? AND schoolId = ? AND userId = ? AND assessmentSessionId = ? AND testId = ?"
);
const getAssessmentQuestionsStmt = db.prepare(
  "SELECT * FROM studentAssessments WHERE id = ? AND schoolId = ? AND userId = ? AND assessmentSessionId = ? AND testId = ?"
);

const getSpecifiedTestStmt = db.prepare(
  "SELECT t.id AS testID, t.name, t.focus, t.schoolId, tw.wordId, tarw.word, tarw.arpabet FROM tests t LEFT JOIN testwords tw ON t.id = tw.testId LEFT JOIN targetWords tarw ON tw.wordId = tarw.id WHERE tw.schoolId = ? AND tw.testId = ? ORDER BY tarw.id"
);

const addAudioDataStmt = db.prepare(
  "INSERT INTO userAudioData (audio, mimeType, schoolId, userId, studentAssessmentId, questionId) VALUES (?, ?, ?, ?, ?, ?)"
);

const addStudentScoreStmt = db.prepare(
  "UPDATE studentAssessments SET score = ? WHERE schoolId = ? AND userId = ? AND assessmentSessionId = ? AND testId = ? AND id = ?"
);

studentRouter.post(
  "/assessment/studentassessments",
  (req: Request, res: Response<ApiResponse<number, null>>) => {
    const {
      schoolId,
      studentId,
      testId,
      status,
      currentAssessmentSessionID,
      payload
    } = req.body;
    console.log("save test info: ", req.body);

    const currentTime = Date.now();
    const info = addAssessmentQuestionsStmt.run(
      schoolId,
      studentId,
      currentAssessmentSessionID,
      testId,
      status,
      payload,
      currentTime
    );

    res.status(200).json({
      success: true,
      data: [Number(info.lastInsertRowid)]
    });
  }
);
studentRouter.patch(
  "/assessment/studentassessments",
  (req: Request, res: Response<ApiResponse<null, null>>) => {
    const currentTime = Date.now();
  }
);

studentRouter.post("/targetWords", (req: Request, res: Response) => {});

studentRouter.post("/targetWords/add", (req: Request, res: Response) => {
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

studentRouter.post(
  "/assessment/transcribe",
  upload.array("audio", 10),
  async (req: Request, res: Response) => {
    const {
      assessmentId,
      schoolId,
      userId,
      testId,
      assessmentSessionId,
      wordData
    } = req.body;
    console.log("req.body: ", req.body);

    const wordDataObject = JSON.parse(wordData) as WordTestsBEObject[];
    console.log("worddataobject: ", wordDataObject);

    const wordIdData = wordDataObject.map((item) => item.wordId);

    const endingTime = Date.now();
    let assessmentQuestions;
    let assessmentInfo;

    try {
      assessmentInfo = (await getAssessmentQuestionsStmt.get(
        assessmentId,
        schoolId,
        userId,
        assessmentSessionId,
        testId
      )) as AssessmentObject;

      assessmentQuestions = JSON.parse(assessmentInfo.questions);
    } catch (err) {
      console.error("Error retrieving assessment object: ", err);
      res
        .status(500)
        .json("There was an error retrieving the test data from the database.");
    }
    try {
      const files = req.files as Express.Multer.File[];
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No files provided" });
      }

      const transcriptionPromises = files.map(async (file, index) => {
        const audioFile = await toFile(file.buffer, file.originalname, {
          type: file.mimetype
        });

        addAudioDataStmt.run(
          file.buffer,
          file.mimetype,
          schoolId,
          userId,
          assessmentId,
          wordIdData[index]
        );
        return transcribeAudioArray(audioFile);
      });

      const results = await Promise.all(transcriptionPromises);

      const transcriptions = results.map((result) => result) as string[][];

      console.log("transcriptions: ", transcriptions);
      const correctAnswers = getSpecifiedTestStmt.all(
        schoolId,
        testId
      ) as TargetTestDbRow[];

      const parsedAnswers = correctAnswers.map((answer) => {
        const { arpabet, ...rest } = answer;
        return JSON.parse(arpabet);
      });
      console.log("parsedAnswers: ", parsedAnswers);
      let score = 0;
      try {
        for (let i = 0; i < transcriptions.length; ++i) {
          const preScore = arpabetCheck(
            transcriptions[i]!,
            parsedAnswers[i]?.[0]
          );
          console.log(
            "results: ",
            arpabetCheck(transcriptions[i]!, parsedAnswers[i]?.[0])
          );
          score += preScore === 1 ? preScore : 0;
        }
        addStudentScoreStmt.run(
          score,
          schoolId,
          userId,
          assessmentSessionId,
          testId,
          assessmentId
        );
      } catch (err) {
        console.error("Error checking user answer: ", err);
      }
      try {
        updateAssessmentQuestionsStmt.run(
          "finished",
          JSON.stringify(transcriptions),
          endingTime,
          assessmentId,
          schoolId,
          userId,
          assessmentSessionId,
          testId
        );
      } catch (err) {
        console.error(
          "There was an error saving the answers to this assessment: ",
          err
        );
      }
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (err) {
      console.error("Error transcribing text:", err);
      res.status(500).json({ error: "Unable to transcribe audio." });
    }
  }
);

export default studentRouter;
