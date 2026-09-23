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
  WordTestsFEObject,
  UserTestDataObject
} from "../../../shared/types.ts";
import type { WebSocketServer } from "ws";

const assessmentRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10 }
});

interface TargetWordDbRow {
  word: string;
  arpabet: string;
  unit: string;
  test: string;
}
interface TargetTestDbRow {
  schoolId: number;
  name: string;
  testId: number;
  wordId: number;
  word: string;
  arpabet: string;
}

interface AudioRow {
  id: number;
  data: Buffer;
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
  "INSERT INTO targetWords (schoolId, word, arpabet, unit) VALUES (?, ?, ?, ?)"
);
const deleteIndividualWordStmt = db.prepare(
  "DELETE FROM targetWords WHERE id = ? AND schoolId = ?"
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
const addAssessmentSessionStmt = db.prepare(
  "INSERT INTO assessmentSessions (schoolId, userId, status, timeStarted) VALUES (?, ?, ?, ?)"
);
const finishAssessmentSessionStmt = db.prepare(
  "UPDATE assessmentSessions SET status = ?, timeEnded = ? WHERE id = ? AND userId = ? AND schoolId = ?"
);

const getSpecifiedWordTest = db.prepare(
  "SELECT tarw.id,tarw.word,tarw.arpabet, tw.testId FROM targetWords tarw LEFT JOIN testWords tw ON tarw.id = tw.wordId WHERE tw.testId = ?"
);
const getAllWordTestsStmt = db.prepare(
  "SELECT tw.schoolId, tw.testId, tw.wordId, tarw.word, tarw.arpabet FROM targetWords tarw LEFT JOIN testWords tw ON tarw.id = tw.wordId WHERE tw.schoolId = ? AND tw.testId NOT NULL ORDER BY tw.testId"
);

const getAllTestsStmt = db.prepare(
  "SELECT t.id AS testId, t.name, t.focus, t.schoolId, tw.wordId, tarw.word, tarw.arpabet FROM tests t LEFT JOIN testWords tw ON t.id = tw.testId LEFT JOIN targetWords tarw ON tw.wordId = tarw.id WHERE tw.schoolId = ? AND tw.testId NOT NULL ORDER BY t.id"
);

const addAudioDataStmt = db.prepare(
  "INSERT INTO userAudioData (audio, mimeType, schoolId, userId, studentAssessmentId, questionId) VALUES (?, ?, ?, ?, ?, ?)"
);

const getAllAudioDataStmt = db.prepare(
  "SELECT * FROM userAudioData WHERE schoolId = ? AND userId = ? AND studentAssessmentId = ?"
);

const getAllStudentAssessmentsStmt = db.prepare(
  "SELECT * FROM studentAssessments WHERE schoolId = ? AND userId = ? AND assessmentSessionID NOT NULL GROUP BY assessmentSessionId, testId"
);

assessmentRouter.get(
  "/tests/user/:schoolId/:userId",
  (req: Request, res: Response<ApiResponse<UserTestDataObject[], null>>) => {
    const { schoolId, userId } = req.params;
    console.log(schoolId);
    const rawRows = getAllStudentAssessmentsStmt.all(
      schoolId,
      userId
    ) as UserTestDataObject[];
    const safeParse = (val: unknown) => {
      if (typeof val !== "string") return val;
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
      } catch {
        return val;
      }
    };
    const preppedRows: UserTestDataObject[] = rawRows?.map((row) => ({
      ...row,
      questions: safeParse(row.questions),
      answersArpabet: safeParse(row.answersArpabet)
    }));
    res.status(200).json({
      success: true,
      data: [preppedRows ? preppedRows : [], null]
    });
  }
);

assessmentRouter.get(
  "/:schoolId/:userId/:assessmentId/audio",
  (req: Request, res: Response<ApiResponse<AudioRow[], null>>) => {
    const { schoolId, userId, assessmentId } = req.params;

    const rows = getAllAudioDataStmt.all(schoolId, userId, assessmentId) as
      | AudioRow[]
      | undefined;

    res.status(200).json({
      success: true,
      data: [rows ?? [], null]
    });
  }
);

assessmentRouter.get(
  "/tests/:schoolId",
  (req: Request, res: Response<ApiResponse<WordTestsFEObject[], null>>) => {
    const { schoolId } = req.params;
    console.log(schoolId);

    const rawRows = getAllTestsStmt.all(schoolId) as TargetTestDbRow[];

    const parsedData: WordTestsBEObject[] = rawRows.map((row) => ({
      ...row,
      word: JSON.parse(row.word),
      arpabet: JSON.parse(row.arpabet)
    }));

    res.status(200).json({
      success: true,
      data: [parsedData, null]
    });
  }
);
assessmentRouter.post(
  "/sessions",
  (req: Request, res: Response<ApiResponse<number, null>>) => {
    const { schoolId, user } = req.body;

    const startTime = Date.now();

    const info = addAssessmentSessionStmt.run(
      schoolId,
      user,
      "in progress",
      startTime
    );
    const wss = req.app.get("wss") as WebSocketServer;

    const payload = JSON.stringify({
      type: "session-started",
      data: "Session Live!"
    });

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });

    res.status(201).json({
      success: true,
      data: [Number(info.lastInsertRowid)]
    });
  }
);
assessmentRouter.patch(
  "/sessions",
  (req: Request, res: Response<ApiResponse<string, null>>) => {
    const { user, assessmentSessionId, status, schoolId } = req.body;
    const endTime = Date.now();
    finishAssessmentSessionStmt.run(
      status,
      endTime,
      assessmentSessionId,
      user,
      schoolId
    );

    const wss = req.app.get("wss") as WebSocketServer;

    const payload = JSON.stringify({
      type: "session-ended",
      data: "Session Ended!"
    });

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
    res.status(201).json({
      success: true,
      data: [
        `Assessment Session ${assessmentSessionId} was successfully eneded.`
      ]
    });
  }
);
assessmentRouter.post(
  "/studentassessments",
  (req: Request, res: Response<ApiResponse<number, null>>) => {
    const {
      schoolId,
      studentId,
      testId,
      status,
      currentAssessmentSessionID,
      payload
    } = req.body;
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
assessmentRouter.patch(
  "/studentassessments",
  (req: Request, res: Response<ApiResponse<null, null>>) => {
    const currentTime = Date.now();
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
  console.log(answer);

  return answer;
};

assessmentRouter.post(
  "/transcribe",
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

    const wordDataObject = JSON.parse(wordData) as WordTestsBEObject[];
    const wordIdData = wordDataObject.map((item) => item.wordId);
    console.log(wordIdData);

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
      const checkedResults = [];
      try {
        if (transcriptions) {
          for (let i = 0; i < transcriptions.length; ++i) {
            if (
              checkAnswer(
                transcriptions[i] ?? [],
                assessmentQuestions[i].arpabet[0]
              )
            ) {
              checkedResults.push({
                id: assessmentQuestions[i].id,
                listNumber: assessmentQuestions[i].listNumber,
                question: assessmentQuestions[i].arpabet[0],
                answer: transcriptions[i] ?? [],
                result: true
              });
            } else {
              checkedResults.push({
                listNumber: assessmentQuestions[i].listNumber,
                question: assessmentQuestions[i].arpabet[0],
                answer: transcriptions[i] ?? [],
                result: false
              });
            }
          }
        }
        console.log(checkedResults);
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
        data: { checkedResults }
      });
    } catch (err) {
      console.error("Error transcribing text:", err);
      res.status(500).json({ error: "Unable to transcribe audio." });
    }
  }
);

export default assessmentRouter;
