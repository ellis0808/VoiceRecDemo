import Database from "better-sqlite3";
import path from "node:path";

console.log("db.ts current path: ", process.cwd());

const dbPath: string = path.join(process.cwd(), "db", "data.db");

const db: Database.Database = new Database(dbPath, {
  fileMustExist: true,
  timeout: 5000,
  verbose: console.log
});
db.pragma("journal_mode = WAL");

export default db;
