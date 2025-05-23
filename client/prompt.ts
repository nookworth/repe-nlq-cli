import { ingest } from "./ingest";
import { open, readdir, rm } from "node:fs/promises";
import path from "node:path";
import sqlite from 'sqlite3';
import select from "@inquirer/select";

/**@todo loading indicator for initializing db */
const dbPath = './server/migrations/rent_roll.db'
const db = new sqlite.Database(dbPath);
const sql = `
CREATE TABLE IF NOT EXISTS rent_roll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    sq_ft INTEGER,
    autobill DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    moved_in DATE,
    lease_ends DATE,
    status TEXT NOT NULL
)`

db.exec(sql, error => {
    if (error) console.error(error)
})

const insertPrompt = async () => {
    const files = await readdir("./data");
    const fileChoice = await select({
        message: "Select a file to insert:",
        choices: files.filter((file) => file.endsWith(".jsonl")).map((file) => ({ name: file, value: file })),
    });
    const file = await open(path.join("./data", fileChoice));

    for await (const line of file.readLines()) {
        const json = JSON.parse(line)
        db.run("INSERT INTO rent_roll (unit, name, type, sq_ft, autobill, deposit, moved_in, lease_ends, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [json.unit, json.name, json.type, json.sq_ft, json.autobill, json.deposit, json.moved_in, json.lease_ends, json.status], (err) => {
            if (err) {
                console.error(err);
            }
        });
    }
}

const ingestPrompt = async () => {
    const files = await readdir("./data");
    const file = await select({
        message: "Select a file to ingest:",
        choices: files.filter((file) => file.endsWith(".csv")).map((file) => ({ name: file, value: file })),
    });
    await ingest(file);
};

ingestPrompt().then(() => insertPrompt())
