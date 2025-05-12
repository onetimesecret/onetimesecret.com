// src/utils/loadJsonLocale.js
import fs from "fs";
import path from "path";

export function loadJsonLocale(locale) {
  const filePath = path.resolve(`./src/locales/${locale}.json`);
  const fileContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContent);
}
