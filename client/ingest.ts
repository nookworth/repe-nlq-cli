import { open } from "node:fs/promises";
import { parse } from "@fast-csv/parse";

export const ingest = async (filePath: string) => {
  const file = await open(filePath)
  const arr: object[] = []
  const parsed = file.createReadStream().pipe(parse({ headers: true, ignoreEmpty: true }))
      .on('error', error => console.error(error))
      .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`))

  for await (const row of parsed) {
    arr.push(row)
  }

  const processed = JSON.stringify(arr).replace(/\},/g, '},\n')
  console.log(processed)
  return processed
};