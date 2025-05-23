import { readdir } from "node:fs/promises";
import select from "@inquirer/select";
import { ingest } from "./ingest";

const main = async () => {
    const files = await readdir("./data");
    const file = await select({
        message: "Select a file to ingest:",
        choices: files.filter((file) => file.endsWith(".csv")).map((file) => ({ name: file, value: file })),
    });
    await ingest(file);
};

main()