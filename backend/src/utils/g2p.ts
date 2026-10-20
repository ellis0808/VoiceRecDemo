import { execFile } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPhonemes = (text: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "g2p_helper.py");

    const path1 = path.join(process.cwd(), "venv", "Scripts", "python.exe");
    const path2 = path.resolve(
      __dirname,
      "..",
      "..",
      "venv",
      "Scripts",
      "python.exe"
    );
    const pythonPath = existsSync(path1) ? path1 : path2;
    execFile(pythonPath, [scriptPath, text], (err, stdout, stderr) => {
      if (err) {
        return reject(`G2P Execution Error: ${err.message}`);
      }

      if (stderr) {
        console.warn("G2P Python Stderr:", stderr);
      }
      try {
        const phonemes: string[] = JSON.parse(stdout.trim());
        resolve(phonemes);
      } catch (parseError) {
        console.error("G2P Raw Stdout:", stdout);
        reject(`Failed to parse G2P output: ${parseError}`);
      }
    });
  });
};
