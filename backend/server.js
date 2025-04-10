const express = require("express");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");

const app = express(); // Инициализация Express
app.use(cors()); // Настроим CORS для разрешения запросов с фронтенда
app.use(express.json()); // Парсим JSON-данные из запросов
app.use("/uploads", express.static("uploads")); // доступ к изображениям

// Хранилище для изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // папка для файлов
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Подключение к базе данных MySQL
const db = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root", // Ваше имя пользователя MySQL
  password: "SonyA", // Ваш пароль MySQL
  database: "music_shop_db", // Имя вашей базы данных
});

// Проверяем подключение к базе данных
db.connect((err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.stack);
    return;
  }
  console.log("Подключение к базе данных MySQL успешно");
});

// Reading part ---------------------------------------------------------------------------------------

// Маршрут для получения данных с базы
app.get("/api/brand", (req, res) => {
  db.query("SELECT * FROM brand", (err, results) => {
    // console.log(results);
    if (err) {
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      res.status(500).json({ message: "Ошибка получения бренда" });
      return;
    }
    res.json(results); // Отправляем данные на фронтенд
  });
});

app.get("/api/prodType", (req, res) => {
  db.query("SELECT * FROM product_type", (err, results) => {
    // console.log(results);
    if (err) {
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      res.status(500).json({ message: "Ошибка получения типа продукта" });
      return;
    }
    res.json(results); // Отправляем данные на фронтенд
  });
});

app.get("/api/prodStatus", (req, res) => {
  db.query("SELECT * FROM product_status", (err, results) => {
    // console.log(results);
    if (err) {
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      res.status(500).json({ message: "Ошибка получения статуса продукта" });
      return;
    }
    res.json(results); // Отправляем данные на фронтенд
  });
});

// Adding part ---------------------------------------------------------------------------------------

app.post("/api/addBrand", (req, res) => {
  const { brandName } = req.body;
  const query = "INSERT INTO brand (name) VALUES ( ?)";

  db.query(query, [brandName], (err, result) => {
    if (err) {
      console.log(req.body);
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      err.message.includes("Duplicate")
        ? res
            .status(500)
            .json({ message: "Ошибка добавления бренда", error: "Duplicate" })
        : res.status(500).json({ message: "Ошибка добавления бренда" });
      return;
    }
    res.status(201).json({ id: result.insertId, brandName });
  });
});

app.post("/api/addProdType", (req, res) => {
  const { productTypeName } = req.body;
  const query = "INSERT INTO product_type (name) VALUES ( ?)";

  db.query(query, [productTypeName], (err, result) => {
    if (err) {
      console.log(req.body);
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      err.message.includes("Duplicate")
        ? res.status(500).json({
            message: "Ошибка добавления типа продукта",
            error: "Duplicate",
          })
        : res.status(500).json({ message: "Ошибка добавления типа продукта" });
      return;
    }
    res.status(201).json({ id: result.insertId, productTypeName });
  });
});

app.post('/api/addProduct', upload.single('img'), (req, res) => {
  const { name, description, img, price ,brandId, statusId, typeId} = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const query = "INSERT INTO product (name, description, img, price, brand, status, type) VALUES ( ?, ?, ?, ?, ?, ?, ?)";

  db.query(
      query,
      [name, description, image_url, price ,brandId, statusId, typeId],
      (err, result) => {
          if (err) {
              console.log("\x1b[31m" + err.message + "\x1b[0m");
              res.status(500).json({ error: 'Ошибка сервера' });
          } else {
              res.json({ id: result.insertId, name, image_url });
          }
      }
  );
});

// Запуск сервера
const port = 5000;
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
