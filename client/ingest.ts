import { open, writeFile } from "node:fs/promises";
import { parse } from "@fast-csv/parse";
import path from "node:path";

export const ingest = async (filePath: string) => {
  const file = await open(filePath)
  const fileName = path.basename(filePath, path.extname(filePath))
  const arr: object[] = []

  const parsed = file.createReadStream().pipe(parse({ headers: true, ignoreEmpty: true }))
      .on('error', error => console.error(error))
      .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows from ${filePath}`))

  for await (const row of parsed) {
    arr.push(row)
  }

  arr.forEach(row => {
    if (row.hasOwnProperty('')) {
      delete row[''];
    }
  });
  
  const processed = JSON.stringify(arr).replace(/\},/g, '},\n')

  await writeFile(path.join(path.dirname(filePath), `${fileName}.jsonl`), processed)
  console.log(`Processed ${arr.length} rows and saved to ${path.join(path.dirname(filePath), `${fileName}.jsonl`)}`)

  return processed
};