import "dotenv/config";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import userRouter from "./routes/userRoutes.ts";
import assessmentRouter from "./routes/assessmentRoutes.ts";

const app: Express = express();
const port = 5000;

app.use(cors());

app.use("/users", userRouter);
app.use("/assessment", assessmentRouter);

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
