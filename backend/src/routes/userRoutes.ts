import express, { type Request, type Response } from "express";
import db from "../config/db.ts";

const userRouter = express.Router();

const getAllStudentsStmt = db.prepare("SELECT * FROM students");
const getIndividualStudentStmt = db.prepare(
  "SELECT * FROM students WHERE id = ?"
);
const insertStudentStmt = db.prepare(
  "INSERT INTO students (lastName, firstName, studentNumber, year) VALUES (?, ?, ?, ?)"
);
const deleteIndividualStudentStmt = db.prepare(
  "DELETE FROM students WHERE id = ?"
);
const getAllTeachersStmt = db.prepare("SELECT * FROM teachers");
const getIndividualTeacherStmt = db.prepare(
  "SELECT * FROM teachers WHERE id = ?"
);
const insertTeacherStmt = db.prepare(
  "INSERT INTO teachers (lastName, firstName, english) VALUES (?, ?, ?)"
);
const deleteIndividualTeacherStmt = db.prepare(
  "DELETE FROM teachers WHERE id = ?"
);

userRouter.post("/students", (req: Request, res: Response) => {
  const info = insertStudentStmt.run("Katayama", "Taro", "00000", 2026);

  try {
    res.status(201).json({
      success: true,
      id: info.lastInsertRowid,
      message: "Student successfully added"
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
userRouter.post("/teachers", (req: Request, res: Response) => {
  //   const info = insertTeacherStmt.run("Katayama", "Taro", "00000", 2026);

  try {
    res.status(201).json({
      success: true,
      //   id: info.lastInsertRowid,
      message: "Teacher successfully added"
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default userRouter;
