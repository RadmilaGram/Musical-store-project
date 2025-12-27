const express = require("express");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const createBrandsRouter = require("./routes/brands.routes");
const createProductTypesRouter = require("./routes/productTypes.routes");
const createProductStatusesRouter = require("./routes/productStatuses.routes");
const createProductsRouter = require("./routes/products.routes");
const createSpecialFieldDatatypesRouter = require("./routes/specialFieldDatatypes.routes");
const createSpecialFieldsRouter = require("./routes/specialFields.routes");
const createTradeInConditionsRouter = require("./routes/tradeInConditions.routes");
const createTradeInCatalogRouter = require("./routes/tradeInCatalog.routes");

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const app = express(); // Инициализация Express
app.use(cors()); // Настроим CORS для разрешения запросов с фронтенда
app.use(express.json()); // Парсим JSON-данные из запросов
app.use(express.urlencoded({ extended: true })); // Поддержка form-data без файлов
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

app.use("/api/brands", createBrandsRouter(db));
app.use("/api/product-types", createProductTypesRouter(db));
app.use("/api/product-statuses", createProductStatusesRouter(db));
app.use("/api/products", createProductsRouter(db));
app.use("/api/special-field-datatypes", createSpecialFieldDatatypesRouter(db));
app.use("/api/special-fields", createSpecialFieldsRouter(db));
app.use("/api/trade-in-conditions", createTradeInConditionsRouter(db));
app.use("/api/trade-in-catalog", createTradeInCatalogRouter(db));

// /**
//  * Принимает «чистый» пароль пользователя,
//  * возвращает готовый к хранению хеш.
//  */
async function hashPassword(plainPassword) {
  try {
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hash;
  } catch (err) {
    console.error("Ошибка при хешировании пароля:", err);
    throw err;
  }
}

// app.post('/register', async (req, res) => {
//   const { username, password } = req.body;
//   const passwordHash = await hashPassword(password);
//   // Сохраняем в БД: username + passwordHash
//   await db.query('INSERT INTO users(username, password_hash) VALUES(?, ?)', [username, passwordHash]);
//   res.sendStatus(201);
// });

/**
 * Сравнивает введённый пароль и хеш из БД.
 * Возвращает true, если совпадают.
 */
async function verifyPassword(plainPassword, storedHash) {
  try {
    const isMatch = await bcrypt.compare(plainPassword, storedHash);
    return isMatch;
  } catch (err) {
    console.error("Ошибка при проверке пароля:", err);
    throw err;
  }
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, results) => {
    // console.log(results);
    if (err) {
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      res.status(500).json({ message: "Ошибка получения учетные данные" });
      return;
    }

    if (!results[0]) {
      return res.status(401).send("Неверные учетные данные");
    }

    const ok = await verifyPassword(password, results[0].password);
    if (!ok) {
      return res.status(401).send("Неверные учетные данные");
    }

    // console.log(results[0])

    res.json({ user: results[0], token: results[0].id }); // Отправляем данные на фронтенд
  });
});

// Reading part ---------------------------------------------------------------------------------------

// Маршрут для получения данных с базы

app.get("/api/SpecialFieldDT", (req, res) => {
  db.query("SELECT * FROM special_field_datatype", (err, results) => {
    // console.log(results);
    if (err) {
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      res
        .status(500)
        .json({ message: "Ошибка получения типа данных специальных полей" });
      return;
    }
    res.json(results); // Отправляем данные на фронтенд
  });
});

app.get("/api/SpecialField", (req, res) => {
  db.query("SELECT * FROM special_field", (err, results) => {
    // console.log(results);
    if (err) {
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      res.status(500).json({ message: "Ошибка получения специальных полей" });
      return;
    }
    res.json(results); // Отправляем данные на фронтенд
  });
});

app.get("/api/SpecialFieldWithDefaultValues", (req, res) => {
  db.query(
    "SELECT * FROM special_field where datatype = (select id from special_field_datatype where name = 'string')",
    (err, results) => {
      // console.log(results);
      if (err) {
        console.log("\x1b[31m" + err.message + "\x1b[0m");
        res.status(500).json({ message: "Ошибка получения специальных полей" });
        return;
      }
      res.json(results); // Отправляем данные на фронтенд
    }
  );
});

app.get("/api/SpecialFieldValues", (req, res) => {
  const { fieldID } = req.query;
  db.query(
    "SELECT * FROM special_field_values where field_id = '" + fieldID + "'",
    (err, results) => {
      // console.log(results);
      if (err) {
        console.log("\x1b[31m" + err.message + "\x1b[0m");
        res.status(500).json({ message: "Ошибка получения специальных полей" });
        return;
      }
      res.json(results); // Отправляем данные на фронтенд
    }
  );
});

app.get("/api/TypeSpecialFields", (req, res) => {
  const { typeID } = req.query;
  db.query(
    "SELECT * FROM product_type_special_fields where type_id = '" +
      typeID +
      "'",
    (err, results) => {
      // console.log(results);
      if (err) {
        console.log("\x1b[31m" + err.message + "\x1b[0m");
        res.status(500).json({ message: "Ошибка получения специальных полей" });
        return;
      }
      res.json(results); // Отправляем данные на фронтенд
    }
  );
});


// Adding part ---------------------------------------------------------------------------------------


app.post("/api/upload", upload.single("img"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Image file is required" });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ success: true, data: { image_url: imageUrl } });
});




app.post("/api/orders", (req, res) => {
  const { items } = req.body;
  console.log("New order received:", items);

  // TODO: insert into orders and order_items tables
  // e.g.:
  // const orderQuery = "INSERT INTO orders (user_id, total) VALUES (?, ?)";
  // db.query(orderQuery, [userId, total], (err, result) => { ... });

  // Stub response
  res.json({
    success: true,
    message: "Order received (stub).",
    order: { items },
  });
});

// Запуск сервера
const port = 5000;
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
