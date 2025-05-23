import { db } from "../client/prompt.js";
import { tool, type DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import sqlite from "sqlite3";

const queryDatabaseSchema = z.object({
  sql: z.string().describe("The SQL query to execute")
})

const fetchAll = async (db: sqlite.Database, sql: string, params: any[]) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export const queryDatabase: DynamicStructuredTool<typeof queryDatabaseSchema> = tool(
  async ({ sql }: { sql: string }) => {
    const rows = await fetchAll(db, sql, [])
    return JSON.stringify(rows);
  }, {
    name: "queryDatabase",
    description: "Execute a SQL query against the database",
    schema: queryDatabaseSchema
  }
)