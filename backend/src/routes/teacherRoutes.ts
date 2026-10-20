import express, { type Request, type Response } from "express";
import db from "../config/db.ts";
import multer, { memoryStorage } from "multer";
import OpenAI, { toFile } from "openai";
import { getPhonemes } from "../utils/g2p.ts";
import type {
  TargetWordBEObject,
  ApiResponse,
  AssessmentObject,
  WordTestsBEObject,
  WordTestsFEObject,
  UserTestDataObject,
  TargetTestDbRow,
  Student,
  ConvertedWord,
  NewTestUpload
} from "../../../shared/types.ts";
import type { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import type CustomWebSocket from "../server.ts";
import convertAssessmentBEToFE from "../utils/convertor.ts";
import csvUploader from "../utils/csvUploader.ts";

const teacherRouter = express.Router();

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
  "INSERT INTO assessmentSessions (schoolId, userId, status, classesAssigned, timeStarted) VALUES (?, ?, ?, ?, ?)"
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

const getAllAudioDataStmt = db.prepare(
  "SELECT * FROM userAudioData WHERE schoolId = ? AND userId = ? AND studentAssessmentId = ?"
);

const getAllStudentAssessmentsStmt = db.prepare(
  "SELECT * FROM studentAssessments WHERE schoolId = ? AND userId = ? AND assessmentSessionID NOT NULL GROUP BY assessmentSessionId, testId"
);

const getAllStudentsStmt = db.prepare(
  "SELECT s.userId, s.studentNumber, s.matriculationYear, s.englishClass, s.homeroom, u.id, username, lastName, firstName, role, dateAdded FROM students s LEFT JOIN users u ON s.userId = u.id WHERE schoolId = ?"
);

const addTargetWordsStmt = db.prepare(
  "INSERT INTO targetWords (schoolId, word, arpabet, unit) VALUES (?, ?, ?, ?)"
); // needs to be updated to not allow duplicates? if a value is already present, then return the one already in the db

const findHighestTestIdStmt = db.prepare("SELECT MAX(id) AS maxVal FROM tests");

const addNewTestStmt = db.prepare(
  "INSERT INTO tests (name, focus) VALUES (?, ?)"
);

const addNewTestWordsStmt = db.prepare(
  "INSERT INTO testWords (schoolId, testId, wordId) VALUES (?, ?, ?)"
);

teacherRouter.post(
  "/assessment/upload/save",
  async (req: Request, res: Response<ApiResponse<null, null>>) => {
    const { schoolId, userId, newTests } = req.body;
    // console.log(newTests);

    // const newTests = [
    //   {
    //     name: "new test",
    //     data: [
    //       {
    //         word: ["domf", "", ""],
    //         arpabet: [["D", "AH", "M", "F"]],
    //         unit: null
    //       }
    //     ]
    //   }
    // ];
    if (!schoolId)
      return res
        .status(400)
        .json({ success: false, error: "No new test(s) provided." });
    if (!newTests)
      return res
        .status(400)
        .json({ success: false, error: "No new test(s) provided." });
    const newTestsObject = newTests as NewTestUpload[];

    const newTestNumbersArray: number[] = [];

    interface MaxResult {
      maxVal: number | null;
    }
    const result = findHighestTestIdStmt.get() as MaxResult;
    for (let i = 1; i < newTestsObject.length + 1; ++i) {
      if (typeof result.maxVal === "number") {
        const num = result.maxVal + i;

        newTestNumbersArray.push(num);
      }
    }

    const newWordsIdArray: number[][] = [];
    let addedWord;
    const individualWords = newTestsObject.map((testGroup, index) => {
      newWordsIdArray.push([]);
      testGroup.data.map((item, itemIndex) => {
        addedWord = addTargetWordsStmt.run(
          schoolId,
          JSON.stringify(item.word),
          JSON.stringify(item.arpabet),
          item.unit
        );
        console.log("word rowid: ", addedWord.lastInsertRowid);
        newWordsIdArray[index]?.push(Number(addedWord.lastInsertRowid));
      });
    });
    const wordUploadResults = await Promise.all(individualWords);

    const individualTests = newTestsObject.map((group) =>
      addNewTestStmt.run(group.name, null)
    );

    const testUploadResults = await Promise.all(individualTests);
    console.log("words: ", wordUploadResults);
    console.log("tests: ", testUploadResults);
    console.log("new words id array: ", newWordsIdArray);
    console.log("new tests id array: ", newTestNumbersArray);

    const testWordsAssociation = newWordsIdArray.map((wordArray, index) => {
      wordArray.map((word) => {
        addNewTestWordsStmt.run(schoolId, newTestNumbersArray[index], word);
      });
    });

    const newTestWords = await Promise.all(testWordsAssociation);

    res.status(200).json({ success: true });
  }
);

teacherRouter.post(
  "/assessment/upload/new",
  upload.single("csv_file"),
  async (req: Request, res: Response<ApiResponse<ConvertedWord[][], null>>) => {
    const { schoolId, userId } = req.body;
    try {
      // const storage = multer.memoryStorage()
      // const upload = multer({storage: storage})

      // const fileBuffer = req.file?.buffer
      // const textContent = fileBuffer?.toString('utf-8')
      const file = req.file as Express.Multer.File;
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No file provided" });
      }
      // console.log("File: ", file);

      const newWords = (await csvUploader(file)) as ConvertedWord[][];
      // console.log("New Words: ", newWords);
      res.status(200).json({ success: true, data: [newWords, null] });
    } catch (err) {
      console.error("Error getting file from Multer: ", err);
    }
  }
);

teacherRouter.get(
  "/students/:schoolId",
  (req: Request, res: Response<ApiResponse<Student[], null>>) => {
    const { schoolId } = req.params;
    try {
      const rows = getAllStudentsStmt.all(schoolId) as Student[];

      res.status(200).json({ success: true, data: [rows, null] });
    } catch (err) {
      console.error(
        "There was an error retreiving the students' records: ",
        err
      );
      res.status(400).json({
        success: false,
        error: "There was an error retreiving the students' records."
      });
    }
  }
);

teacherRouter.get(
  "/assessment/tests/user/:schoolId/:userId",
  (req: Request, res: Response<ApiResponse<UserTestDataObject[], null>>) => {
    const { schoolId, userId } = req.params;
    const rawRows = getAllStudentAssessmentsStmt.all(
      schoolId,
      userId
    ) as UserTestDataObject[];
    const safeParse = (value: unknown) => {
      if (typeof value !== "string") return value;
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
      } catch {
        return value;
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

teacherRouter.get(
  "/assessment/:schoolId/:userId/:assessmentId/audio",
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

teacherRouter.get(
  "/assessment/tests/:schoolId",
  (req: Request, res: Response<ApiResponse<WordTestsFEObject[], null>>) => {
    const { schoolId } = req.params;

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
teacherRouter.post(
  "/assessment/sessions",
  async (req: Request, res: Response<ApiResponse<number, null>>) => {
    const { schoolId, userId, selectedClasses, assessmentData } = req.body;

    if (!schoolId || !userId || !selectedClasses)
      res.status(400).json({
        success: false,
        error:
          "Missing required fields: school id, user id, selected classes, or assessment data"
      });
    const frontendAssessmentData =
      await convertAssessmentBEToFE(assessmentData);

    const startTime = Date.now();
    let info;

    try {
      info = addAssessmentSessionStmt.run(
        schoolId,
        Number(userId),
        "in progress",
        JSON.stringify(selectedClasses),
        startTime
      );
      console.log(
        "schoolid ",
        schoolId,
        "userid ",
        userId,
        "classes ",
        selectedClasses
      );
    } catch (err) {
      console.error("problem posting to the db: ", err);
    }

    console.log("session number: ", info?.lastInsertRowid);

    const wss = req.app.get("wss") as WebSocketServer;

    const payload = JSON.stringify({
      type: "session-started",
      message: "Session Live!",
      data: {
        sessionId: info?.lastInsertRowid,
        assessmentData: frontendAssessmentData
      }
    });

    console.log(payload);

    wss.clients.forEach((client) => {
      const studentSocket = client as CustomWebSocket;

      if (
        client.readyState === 1 &&
        studentSocket.classId !== undefined &&
        selectedClasses.includes(studentSocket.classId)
      ) {
        console.log("test 2");

        studentSocket.send(payload);
      }
    });

    res.status(201).json({
      success: true,
      data: [Number(info?.lastInsertRowid)]
    });
  }
);
teacherRouter.patch(
  "/assessment/sessions",
  (req: Request, res: Response<ApiResponse<string, null>>) => {
    const { user, assessmentSessionId, status, schoolId } = req.body;
    console.log("req.body: ", req.body);

    const endTime = Date.now();
    const patch = finishAssessmentSessionStmt.run(
      status,
      endTime,
      assessmentSessionId,
      user,
      schoolId
    );
    console.log(patch);

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

teacherRouter.post(
  "/assessment/targetWords",
  (req: Request, res: Response) => {}
);

teacherRouter.post(
  "/assessment/targetWords/add",
  (req: Request, res: Response) => {
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
  }
);

export default teacherRouter;
