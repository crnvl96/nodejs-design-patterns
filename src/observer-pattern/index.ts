import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";

class FindPattern extends EventEmitter {
  private files: string[] = [];

  constructor(private regex: RegExp) {
    super();
  }

  addFile(file: string): this {
    this.files.push(file);
    return this;
  }

  async find(): Promise<this> {
    const tasks = this.files.map(async (file) => {
      try {
        const content = await readFile(file, "utf8");
        this.emit("fileread", file);

        const matches = content.match(this.regex);
        if (matches) {
          matches.forEach((match) => this.emit("found", file, match));
        }
      } catch (err) {
        this.emit("error", err);
      }
    });

    await Promise.all(tasks);
    this.emit("end");
    return this;
  }
}

const finder = new FindPattern(/hello/g);

finder
  .on("fileread", (file) => console.log(`Reading: ${file}`))
  .on("found", (file, match) => console.log(`Matched "${match}" in ${file}`))
  .on("error", (err) => console.error(`Error: ${err.message}`))
  .on("end", () => console.log("All files processed"));

finder.addFile("config.txt").addFile("notes.md").find();
