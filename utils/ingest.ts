import { open, writeFile } from "node:fs/promises";
import { parse, Row } from "@fast-csv/parse";
import path from "node:path";

const ingest = async (filePath: string) => {
  const file = await open(path.join('./data', filePath))
  const fileName = path.basename(filePath, path.extname(filePath))
  const arr: object[] = []

  const parsed = file.createReadStream().pipe(parse({ headers: true, ignoreEmpty: true }))
      .transform((data: Row) => {
        const transformed = {}

        for (const key in data) {
          if (key === '') continue
          transformed[key.toLowerCase().replace(/\s+/g, '_')] = data[key]
        }

        return transformed
      })
      .on('error', error => console.error(error))
      .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows from ${filePath}`))

  for await (const row of parsed) {
    arr.push(row)
  }

  const processed = JSON.stringify(arr).replace(/\},/g, '}\n').replace(/[\[\]]/g, '')

  await writeFile(path.join('./data', `${fileName}.jsonl`), processed)
  console.log(`Processed ${arr.length} rows and saved to ${path.join('./data', `${fileName}.jsonl`)}`)

  return processed
};

export default ingest;