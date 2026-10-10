import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["index.html", "src"];
const rules = [
  {
    test: (line) => /[—–]/.test(line),
    fix: "em dash and en dash are banned in visible copy: use a comma, a period, or a hyphen ('Mar 2026 - Present')",
  },
  {
    test: (line) => (line.match(/·/g) ?? []).length > 1,
    fix: "more than one middle dot on a line: separate list items with commas",
  },
];

const files = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => files(join(path, name)))
    : /\.(html|ts)$/.test(path)
      ? [path]
      : [];

const failures = roots
  .flatMap(files)
  .flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .flatMap((line, i) =>
        rules.filter((r) => r.test(line)).map((r) => `${file}:${i + 1}: ${r.fix}`),
      ),
  );

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
