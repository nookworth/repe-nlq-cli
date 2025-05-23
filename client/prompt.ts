import { open, readdir } from "node:fs/promises";
import agent from "../llm/agent.js";
import ingest from "../utils/ingest.js";
import path from "node:path";
import sqlite from 'sqlite3';
import select from "@inquirer/select";
import dotenv from "dotenv";

dotenv.config();

export const dbPath = './server/db/rent_roll.db'
export const db = new sqlite.Database(dbPath);

export const initializeDatabase = () => {
    const sql = `
    DROP TABLE IF EXISTS rent_roll;
    CREATE TABLE rent_roll (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit STRING NOT NULL,
        name STRING NOT NULL,
        type STRING NOT NULL,
        sq_ft STRING,
        autobill DECIMAL(10,2) NOT NULL,
        deposit DECIMAL(10,2) NOT NULL,
        moved_in DATE,
        lease_ends DATE,
        status STRING NOT NULL
    )`
    return new Promise((resolve, reject) => {
        db.exec(sql, error => {
            if (error) reject(error);
            else resolve(null);
        });
    });
}

const start = async (disabled: string[]) => {
    const choice = await select({
        message: "Select an option:",
        choices: [
            { name: "Initialize Database", value: "init", disabled: disabled.includes("init") },
            { name: "Ingest", value: "ingest", disabled: disabled.includes("ingest") },
            { name: "Query", value: "query", disabled: disabled.includes("query") },
            { name: "Exit", value: "exit" },
        ],
    })

    if (choice === "init") {
        await initializeDatabase();
        return await start(['init', 'query'])
    } else if (choice === "ingest") {
        await ingestPrompt();
        return await start(['init', 'ingest'])
    } else if (choice === "query") {
        await agent();
        return await start(['init', 'ingest'])
    } else if (choice === "exit") {
        return process.exit(0)
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
    } catch (error) {
        console.error('Error during data insertion:', error);
    }

    return await start(['init', 'ingest'])
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

start(['ingest', 'query'])
