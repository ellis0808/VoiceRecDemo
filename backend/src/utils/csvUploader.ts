import csvParser from "csv-parser";
import stripBomStream from "strip-bom-stream";
import { getPhonemes } from "./g2p.ts";
import type { ConvertedWord, ImportedWord } from "../../../shared/types.ts";
import { Readable } from "node:stream";

const processWords = async (
  file: Express.Multer.File
): Promise<ConvertedWord[][]> => {
  const results: ImportedWord[] = [];
  const parser = Readable.from(file.buffer)
    .pipe(stripBomStream())
    .pipe(csvParser());

  for await (const data of parser) {
    results.push(data as ImportedWord);
  }

  const wordsPromises = results.map((item) => getPhonemes(item.word));

  console.log(wordsPromises);

  const words = await Promise.all(wordsPromises);
  const uploadWords: ConvertedWord[][] = [];
  let segmentWords: ConvertedWord[] = [];
  let newEntry: ConvertedWord;
  const arpabet = words.map((item) => item) as string[][];

  console.log("results: ", results.length);
  arpabet.forEach((item, index) => {
    if (results[index] && arpabet[index]) {
      newEntry = {
        word: JSON.stringify([
          results[index]?.word,
          results[index]?.alt1 ? results[index].alt1 : "",
          results[index]?.alt2 ? results[index].alt2 : ""
        ]),
        arpabet: JSON.stringify([arpabet[index]]),
        unit: results[index].unit ? results[index].unit : null
      };

      if (results[index].testSegment === "n") {
        if (segmentWords.length > 0) {
          uploadWords.push(segmentWords);
        }
        segmentWords = [];
        segmentWords.push(newEntry);
      } else {
        segmentWords.push(newEntry);
      }
      if (results.length - 1 === index) {
        uploadWords.push(segmentWords);
      }
    }
  });

  return uploadWords;
};

export const csvUploader = async (file: Express.Multer.File) => {
  console.log("File: ", file);

  try {
    const words = await processWords(file);
    return words;
  } catch (err) {
    console.error(err);
  }
};

export default csvUploader;
