import express, { type Request, type Response } from "express";
import db from "../config/db.ts";

const userRouter = express.Router();

const getAllStudentsStmt = db.prepare(
  "SELECT u.lastName, u.firstName, u.schoolId, s.userId, s.studentNumber, s.matriculationYear, s.englishClass, s.homeroom, sa.assessmentSessionId, sa.testId, sa.status, sa.questions, sa.answersArpabet, sa.score FROM students s LEFT JOIN studentAssessments sa ON s.userId = sa.userId LEFT JOIN users u ON u.id = s.userId WHERE u.schoolId = ?"
);
const getIndividualStudentStmt = db.prepare(
  "SELECT * FROM students s LEFT JOIN users u WHERE u.id = ? AND u.schoolId = ?"
);
// const insertStudentStmt = db.prepare(
//   "INSERT INTO students (lastName, firstName, schoolId, studentNumber, year) VALUES (?, ?, ?, ?, ?)"
// );
// const deleteIndividualStudentStmt = db.prepare(
//   "DELETE FROM students s JOIN users u WHERE u.id = ? AND u.schoolId = ?"
// );
const getAllTestingClassesStmt = db.prepare(
  "SELECT * FROM testingClasses WHERE schoolId = ?"
);
const getAllTeachersStmt = db.prepare(
  "SELECT t.userId, english FROM teachers t INNER JOIN users u ON u.id = t.userId WHERE u.schoolId = ?"
);
const getIndividualTeacherStmt = db.prepare(
  "SELECT t.userId, english FROM teachers t INNER JOIN users u ON u.id = t.userId WHERE u.schoolId = ? AND t.userId = ?"
);
// const insertTeacherStmt = db.prepare(
//   "INSERT INTO teachers (lastName, firstName, schoolId, english) VALUES (?, ?, ?, ?)"
// );
// const deleteIndividualTeacherStmt = db.prepare(
//   "DELETE FROM teachers WHERE id = ? AND schoolId = ?"
// );

userRouter.get("/students", (req: Request, res: Response) => {
  const rawRows = getAllStudentsStmt.all(1);
});
// userRouter.post("/students", (req: Request, res: Response) => {
//   const info = insertStudentStmt.run("Katayama", "Taro", 1, "00000", 2026);

//   try {
//     res.status(201).json({
//       success: true,
//       id: info.lastInsertRowid,
//       message: "Student successfully added"
//     });
//   } catch (err) {
//     res.status(500).json({ error: (err as Error).message });
//   }
// });

userRouter.get("/teachers", (req: Request, res: Response) => {
  const rawRows = getAllTeachersStmt.all(1);
});
userRouter.get("/testingClasses", (req: Request, res: Response) => {
  const rawRows = getAllTestingClassesStmt.all(1);
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
