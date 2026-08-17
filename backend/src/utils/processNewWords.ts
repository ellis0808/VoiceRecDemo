import db from "../config/db.js";
import { getPhonemes } from "./g2p.js";
const newWords: string[] = [];

const convertWords = async () => {
  for (const word in newWords) {
    await getPhonemes(word);
  }
};
