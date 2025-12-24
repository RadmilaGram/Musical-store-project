const { execSync } = require("child_process");
const path = require("path");

// Конфиг БД
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "SonyA";
const DB_NAME = process.env.DB_NAME || "music_shop_db";

// Путь к mysqldump.
// 1) Если задан MYSQLDUMP_PATH — используем его.
// 2) Иначе — дефолтный путь под Windows.
// 3) Если хочешь использовать просто "mysqldump", задай MYSQLDUMP_PATH=mysqldump.
const DEFAULT_MYSQLDUMP_PATH = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"`;
const MYSQLDUMP = process.env.MYSQLDUMP_PATH || DEFAULT_MYSQLDUMP_PATH;

// Куда сохраняем файлы
const dbDir = path.join(__dirname, "..", "db");
const schemaPath = path.join(dbDir, "schema.sql");
const dataPath = path.join(dbDir, "data.sql");

function run(cmd) {
  console.log("RUN:", cmd);
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  console.log("=== Exporting DB ===");

  // Общие опции
  const baseOpts = [
    `-h ${DB_HOST}`,
    `-u ${DB_USER}`,
    DB_PASSWORD ? `--password=${DB_PASSWORD}` : "",
    DB_NAME,
  ]
    .filter(Boolean)
    .join(" ");

  // 1) Структура
  const dumpSchema = `${MYSQLDUMP} ${baseOpts} \
    --no-data \
    --skip-comments \
    --compact \
    > "${schemaPath}"`;

  // 2) Данные
  const dumpData = `${MYSQLDUMP} ${baseOpts} \
    --no-create-info \
    --skip-comments \
    > "${dataPath}"`;

  run(dumpSchema);
  run(dumpData);

  console.log("=== Done ===");
  console.log("Generated files:");
  console.log("  →", schemaPath);
  console.log("  →", dataPath);
}

main();
