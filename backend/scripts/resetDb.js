const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "SonyA";
const DB_NAME = process.env.DB_NAME || "music_shop_db";

async function main() {
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const dataPath = path.join(__dirname, "..", "db", "data.sql");

  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const dataSql = fs.readFileSync(dataPath, "utf8");

  // подключаемся БЕЗ указания базы, чтобы иметь возможность её дропнуть/создать
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true, // важно для выполнения нескольких запросов подряд
  });

  console.log(`Dropping and creating database \`${DB_NAME}\`...`);
  await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\`;`);
  await conn.query(
    `CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );

  // переключаемся на новую БД
  await conn.changeUser({ database: DB_NAME });

  // --- Сначала структура ---
  console.log("Disabling foreign key checks for schema...");
  await conn.query("SET FOREIGN_KEY_CHECKS=0;");
  console.log("Applying schema.sql...");
  await conn.query(schemaSql);
  console.log("Enabling foreign key checks...");
  await conn.query("SET FOREIGN_KEY_CHECKS=1;");

  // --- Потом данные ---
  console.log("Disabling foreign key checks for data...");
  await conn.query("SET FOREIGN_KEY_CHECKS=0;");
  console.log("Applying data.sql...");
  await conn.query(dataSql);
  console.log("Enabling foreign key checks...");
  await conn.query("SET FOREIGN_KEY_CHECKS=1;");

  await conn.end();
  console.log("Done. Database recreated.");
}

main().catch((err) => {
  console.error("Error while resetting DB:", err);
  process.exit(1);
});
