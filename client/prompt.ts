import { open, readdir } from "node:fs/promises";
import agent from "../llm/agent.js";
import ingest from "../utils/ingest.js";
import path from "node:path";
import sqlite from 'sqlite3';
import select from "@inquirer/select";
import dotenv from "dotenv";

dotenv.config();

/**@todo loading indicator for initializing db */
const dbPath = './server/db/rent_roll.db'
const db = new sqlite.Database(dbPath);
const sql = `
DROP TABLE IF EXISTS rent_roll;
CREATE TABLE rent_roll (
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

const start = async () => {
    const choice = await select({
        message: "Select an option:",
        choices: [
            { name: "Ingest", value: "ingest" },
            { name: "Query", value: "query" },
        ],
    })

    if (choice === "ingest") {
        await ingestPrompt();
    } else if (choice === "query") {
        await agent();
    }
}

const insertPrompt = async () => {
    const files = await readdir("./data");
    const fileChoice = await select({
        message: "Select a file to insert:",
        choices: files.filter((file) => file.endsWith(".jsonl")).map((file) => ({ name: file, value: file })),
    });
    const file = await open(path.join("./data", fileChoice));

    const insertRow = (json: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO rent_roll (unit, name, type, sq_ft, autobill, deposit, moved_in, lease_ends, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [json.unit, json.name, json.type, json.sq_ft, json.autobill, json.deposit, json.moved_in, json.lease_ends, json.status],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    };

    try {
        for await (const line of file.readLines()) {
            const json = JSON.parse(line);
            await insertRow(json);
        }

        // // Query the data after all inserts are complete
        // db.all("SELECT unit, name, type, sq_ft, autobill, deposit, moved_in, lease_ends, status FROM rent_roll", (err, rows) => {
        //     if (err) {
        //         console.error('Query error:', err);
        //     } else {
        //         console.log('Inserted data:');
        //         console.table(rows); // Using console.table for better formatted output
        //     }
        // });
    } catch (error) {
        console.error('Error during data insertion:', error);
    }
}

const ingestPrompt = async () => {
    const files = await readdir("./data");
    const file = await select({
        message: "Select a file to ingest:",
        choices: files.filter((file) => file.endsWith(".csv")).map((file) => ({ name: file, value: file })),
    });
    await ingest(file);
    await insertPrompt();
};

start()
