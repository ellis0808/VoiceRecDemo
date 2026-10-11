import "dotenv/config";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import authRouter from "./routes/authRoutes.ts";
import userRouter from "./routes/userRoutes.ts";
import teacherRouter from "./routes/teacherRoutes.ts";
import studentRouter from "./routes/studentRoutes.ts";

const app: Express = express();
const port = 5000;
app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/teacher", teacherRouter);
app.use("/student", studentRouter);

dotenv.config({ path: "./secrets.env" });
if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in env variables!");
}
const secret = process.env.JWT_SECRET as string;

export default interface CustomWebSocket extends WebSocket {
  userId?: number;
  classId?: number | undefined;
}

const wss = new WebSocketServer({ port: 8080 });
app.set("wss", wss);

wss.on("connection", (ws: CustomWebSocket, req) => {
  const requestUrl = new URL(req.url || "", "http://localhost");
  if (requestUrl) {
    const token = requestUrl.searchParams.get("token");
    console.log("token:", token);
    console.log("secret:", secret);

    const classId = requestUrl.searchParams.get("classId");
    console.log("english class id: ", classId);

    if (token) {
      try {
        const user = jwt.verify(token, secret);
        ws.classId = Number(classId) || undefined;
        console.log("user data: ", user);
        const payload = JSON.stringify({
          type: "student-connected",
          message: "Here we are~~~!"
        });
        ws.send(payload);
      } catch (err) {
        console.error(
          "There was an error establishing the ws connection: ",
          err
        );
        ws.close(4003, "Invalid token");
        return;
      }
    }
  }

  ws.on("error", console.error);
  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Up and running!");
});

const targetWordBank: string[] = ["bamf", "quaf", "glam"];
const targetWords: string[] = [];

// const getTargetPhonemes = async () => {
//   if (targetWords.length === 0) {
//     return;
//   } else {
//     for (let i = 0; i <= targetWords.length; ++i) {
//       const phonemeArray: string[] = await getPhonemes(targetWords[i] ?? "");
//       targetPhonemes.push(phonemeArray);
//     }
//     return targetPhonemes;
//   }
// };

const getRandomItem = (): string => {
  if (targetWordBank.length === 0) {
    return "";
  }
  const randomNumber: number = Math.floor(
    Math.random() * targetWordBank.length
  );
  return targetWordBank[randomNumber] ?? "";
};
// const getTargetWords = (amount: number): string[] => {
//   for (let i = 0; i <= amount; ++i) {
//     const target: string = getRandomItem();
//     targetWords.push(target);
//   }
//   return targetWords;
// };

// const clearAllArrays = () => {
//   targetWords.length = 0;
//   targetPhonemes.length = 0;
//   transcribedPhonemes.length = 0;
// };

// app.get("/api/words", async (req: Request, res: Response) => {
//   try {
//     const words: string[] = getTargetWords(2);

//     await getTargetPhonemes();

//     res.status(200).json({ data: words });
//   } catch (err) {
//     res.status(500).json({ error: "Unable to populate word bank." });
//   }
//   return targetPhonemes;
// });

// app.post("/api/words/clear", (req: Request, res: Response) => {
//   try {
//     clearAllArrays();
//     res.status(200).send();
//   } catch (err) {
//     console.error("Error clearing arrays: ", err);
//   }
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
