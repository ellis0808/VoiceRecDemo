import { execFile } from "child_process";
import path from "path";

export const getPhonemes = (text: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      process.cwd(),
      "src",
      "utils",
      "g2p_helper.py"
    );

    const pythonPath = path.join(
      process.cwd(),
      "venv",
      "Scripts",
      "python.exe"
    );
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
