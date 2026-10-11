import express, { type Request, type Response } from "express";
import db from "../config/db.ts";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
bcrypt;
import type {
  ApiResponse,
  SchoolClass,
  School,
  Student,
  Teacher
} from "../../../shared/types.ts";

dotenv.config({ path: "./secrets.env" });
if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in env variables!");
}
const secret = process.env.JWT_SECRET as string;
const expiresIn = process.env.JWT_EXPIRES_IN || "5h";

interface TeacherBE extends Teacher {
  password: string;
}
interface StudentBE extends Student {
  password: string;
}

const authRouter = express.Router();

const getAllSchoolsStmt = db.prepare("SELECT * FROM schools");
const getIndividualSchoolStmt = db.prepare(
  "SELECT * FROM schools WHERE id = ?"
);
const getAllSchoolClassesStmt = db.prepare(
  "SELECT * FROM testingClasses WHERE schoolId = ?"
);
const getTeacherUserStmt = db.prepare(
  "SELECT u.id, u.schoolId, u.username, u.password, u.lastName, u.firstName, u.email, u.role, u.dateAdded, t.english FROM users u LEFT JOIN teachers t ON t.userId = u.id WHERE (u.username = ? OR u.email = ?) AND u.role = ?"
);
const getClassStudents = db.prepare(
  "SELECT s.userId, s.englishClass, u.schoolId, u.username, u.lastName, u.firstName FROM students s LEFT JOIN users u ON s.userId = u.id WHERE u.schoolId = ? and s.englishClass = ?"
);
const getStudentUserStmt = db.prepare(
  "SELECT u.id, u.schoolId, u.username, u.password, u.lastName, u.firstName, u.role, u.dateAdded, s.studentNumber, s.matriculationYear, s.englishClass, s.homeroom FROM users u LEFT JOIN students s ON s.userId = u.id WHERE u.username = ? AND u.role = ?"
);

const loginAttemptStmt = db.prepare(
  "INSERT INTO logins (user, logintime, ipAddress, userDeviceAgentRaw) VALUES (?, ?, ?, ?)"
);

authRouter.get(
  "/schools/:schoolId",
  (req: Request, res: Response<ApiResponse<School | undefined, null>>) => {
    const { schoolId } = req.params;
    try {
      const row = getIndividualSchoolStmt.get(schoolId) as School;
      if (!row) return res.status(400).json({ success: false });
      res.status(200).json({ success: true, data: [row ?? [], null] });
    } catch (err) {
      console.error("There was an error getting the registered schools: ", err);
    }
  }
);
authRouter.get(
  "/schools",
  (req: Request, res: Response<ApiResponse<[] | undefined, null>>) => {
    try {
      const rows = getAllSchoolsStmt.all() as [];

      res.status(200).json({ success: true, data: [rows ?? [], null] });
    } catch (err) {
      console.error("There was an error getting the registered schools: ", err);
    }
  }
);

authRouter.get(
  "/schools/:schoolId/classes",
  (req: Request, res: Response<ApiResponse<SchoolClass[], null>>) => {
    const { schoolId } = req.params;
    try {
      const rows = getAllSchoolClassesStmt.all(schoolId) as SchoolClass[];

      res.status(200).json({ success: true, data: [rows, null] });
    } catch (error) {}
  }
);
authRouter.get(
  "/schools/:schoolId/classes/:classId/students",
  (req: Request, res: Response<ApiResponse<[], null>>) => {
    const { schoolId, classId } = req.params;
    try {
      const rows = getClassStudents.all(schoolId, classId) as [];
      if (!rows) return res.status(400).json({ success: false });
      res.status(200).json({ success: true, data: [rows, null] });
    } catch (error) {}
  }
);

authRouter.post(
  "/login",
  async (req: Request, res: Response<ApiResponse<string, null>>) => {
    const { usernameOrEmail, password, userRole } = req.body;
    console.log(userRole);

    const timestamp: number = Date.now();
    const ipAddress: string | undefined = req.ip;
    const userDeviceAgent: string | undefined = req.headers["user-agent"];

    if (!usernameOrEmail || !password)
      return res.status(400).json({ success: false });
    let logId;
    try {
      logId = loginAttemptStmt.run(
        usernameOrEmail,
        timestamp,
        ipAddress,
        userDeviceAgent
      );
    } catch (err) {
      console.error("There was an error logging the login attempt: ", err);
    }

    const user =
      userRole === "teacher"
        ? (getTeacherUserStmt.get(
            usernameOrEmail,
            usernameOrEmail,
            userRole
          ) as TeacherBE)
        : (getStudentUserStmt.get(usernameOrEmail, userRole) as StudentBE);
    console.log("user: ", user);

    const match = await bcrypt.compare(password, user.password);
    console.log("matching? ", match);

    if (!match) throw new Error("passwords do not match!");
    let token;
    try {
      if (match) {
        if ("english" in user) {
          token = jwt.sign(
            {
              id: user.id,
              schoolId: user.schoolId,
              email: user.email,
              username: user.username,
              lastName: user.lastName,
              firstName: user.firstName,
              role: user.role,
              english: user.english,
              dateAdded: user.dateAdded
            },
            secret,
            { expiresIn } as SignOptions
          );
        } else if ("homeroom" in user) {
          token = jwt.sign(
            {
              id: user.id,
              schoolId: user.schoolId,
              role: user.role,
              username: user.username,
              lastName: user.lastName,
              firstName: user.firstName,
              studentNumber: user.studentNumber,
              year: user.matriculationYear,
              englishClass: user.englishClass,
              homeroom: user.homeroom,
              dateAdded: user.dateAdded
            },
            secret,
            { expiresIn } as SignOptions
          );
        }
      }
    } catch (err) {
      console.error("Error signing token: ", err);
    }
    res.status(200).json({ success: true, data: [token ?? "", null] });
  }
);

export default authRouter;
