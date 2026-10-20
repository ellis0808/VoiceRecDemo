import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

console.log("db.ts current path: ", process.cwd());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath: string = path.resolve(__dirname, "..", "..", "db", "data.db");

const db: Database.Database = new Database(dbPath, {
  fileMustExist: true,
  timeout: 5000,
  verbose: console.log
});
db.defaultSafeIntegers(false);
db.pragma("journal_mode = WAL");
export default db;
