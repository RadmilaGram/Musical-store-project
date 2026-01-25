const express = require("express");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const createBrandsRouter = require("./routes/brands.routes");
const createProductTypesRouter = require("./routes/productTypes.routes");
const createProductStatusesRouter = require("./routes/productStatuses.routes");
const createProductsRouter = require("./routes/products.routes");
const createSpecialFieldDatatypesRouter = require("./routes/specialFieldDatatypes.routes");
const createSpecialFieldsRouter = require("./routes/specialFields.routes");
const createTradeInConditionsRouter = require("./routes/tradeInConditions.routes");
const createTradeInCatalogRouter = require("./routes/tradeInCatalog.routes");
const createOrdersRouter = require("./routes/orders.routes");
const createAuthRouter = require("./routes/auth.routes");

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const app = express(); // Инициализация Express
app.use(cors({ origin: true, credentials: true })); // Настроим CORS для разрешения запросов с фронтенда
app.use(express.json()); // Парсим JSON-данные из запросов
app.use(express.urlencoded({ extended: true })); // Поддержка form-data без файлов
app.use("/uploads", express.static("uploads")); // доступ к изображениям
app.use(cookieParser());
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: false },
  })
);

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
app.use("/api/orders", createOrdersRouter(db));
app.use("/api/auth", createAuthRouter(db));

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

    req.session.userId = results[0].id;
    const { password: _password, password_hash: _passwordHash, ...safeUser } =
      results[0];
    res.json({ user: safeUser }); // Отправляем данные на фронтенд
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
    "SELECT pt.name AS type_name, sf.name AS field_name, pt.id AS type_id, sf.id AS field_id, sf.datatype AS field_dt " +
      "FROM product_type pt " +
      "JOIN product_type_special_field pt_sf ON pt.id = pt_sf.type_id " +
      "JOIN special_field sf ON sf.id = pt_sf.spec_fild_id " +
      "WHERE pt.id = '" +
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





// Запуск сервера
const port = 5000;
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
