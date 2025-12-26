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

app.get("/api/product-view", async (req, res) => {
  // console.log("get products");
  const query = `
    SELECT 
      *
    FROM product_view 
  `;

  // const passwordHash = await hashPassword("Boss Just");
  // console.log("passwordHash", passwordHash)

  // const passwordHash = await hashPassword("Lonely Klay");
  // console.log("passwordHash", passwordHash);

  db.query(query, (err, results) => {
    if (err) {
      console.error("\x1b[31m%s\x1b[0m", err.message);
      return res.status(500).json({ message: "Ошибка получения товаров" });
    }

    res.json(results);
  });
});

app.get("/api/tradein", (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      img,
      brand_name,
      type_name,
      discount
    FROM tradein_product_view
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Ошибка при получении trade-in товаров:", err);
      return res.status(500).json({ error: "Ошибка сервера" });
    }
    res.json(results);
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

app.post("/api/upload", upload.single("img"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Image file is required" });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ success: true, data: { image_url: imageUrl } });
});

app.post("/api/addProduct", upload.single("img"), (req, res) => {
  const {
    name,
    description,
    img,
    price,
    brandId,
    statusId,
    typeId,
    special_fields,
  } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const query =
    "INSERT INTO product (name, description, img, price, brand, status, type, special_filds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(
    query,
    [
      name,
      description,
      image_url,
      price,
      brandId,
      statusId,
      typeId,
      special_fields,
    ],
    (err, result) => {
      if (err) {
        console.log("\x1b[31m" + err.message + "\x1b[0m");
        res.status(500).json({ error: "Ошибка сервера" });
      } else {
        res.json({ id: result.insertId, name, image_url });
      }
    }
  );
});

app.post("/api/addSpecialField", (req, res) => {
  const { specialFieldName, specialFieldDT } = req.body;
  const query = "INSERT INTO special_field (name, datatype) VALUES ( ?, ? )";

  db.query(query, [specialFieldName, specialFieldDT], (err, result) => {
    if (err) {
      console.log(req.body);
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      err.message.includes("Duplicate")
        ? res.status(500).json({
            message: "Ошибка добавления специальных полей",
            error: "Duplicate",
          })
        : res
            .status(500)
            .json({ message: "Ошибка добавления специальных полей" });
      return;
    }
    res.status(201).json({ id: result.insertId, specialFieldName });
  });
});

app.post("/api/addSpecialFieldValue", (req, res) => {
  const { value, specialFieldSTR } = req.body;
  const query =
    "INSERT INTO special_field_values ( value, field_id) VALUES ( ?, ? )";

  db.query(query, [value, specialFieldSTR], (err, result) => {
    if (err) {
      console.log(req.body);
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      err.message.includes("Duplicate")
        ? res.status(500).json({
            message: "Ошибка добавления специальных полей",
            error: "Duplicate",
          })
        : res
            .status(500)
            .json({ message: "Ошибка добавления специальных полей" });
      return;
    }
    res.status(201).json({ id: result.insertId, specialFieldName: value });
  });
});

app.post("/api/addSpecialFieldToProductType", (req, res) => {
  const { productTypeSF, specialFieldPT } = req.body;
  const query =
    "INSERT INTO product_type_special_field ( type_id, spec_fild_id) VALUES ( ?, ? )";

  db.query(query, [productTypeSF, specialFieldPT], (err, result) => {
    if (err) {
      console.log(req.body);
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      err.message.includes("Duplicate")
        ? res.status(500).json({
            message: "Ошибка добавления специальных полей",
            error: "Duplicate",
          })
        : res
            .status(500)
            .json({ message: "Ошибка добавления специальных полей" });
      return;
    }
    res.status(201).json({ id: result.insertId });
  });
});

app.post("/api/tradein", (req, res) => {
  const { product_id, reference_price, base_discount_amount } = req.body;
  const query = "INSERT INTO trade_in_catalog ( product_id, reference_price, base_discount_amount) VALUES ( ?, ?, ? )";

  db.query(query, [product_id, reference_price, base_discount_amount], (err, result) => {
    if (err) {
      console.log(req.body);
      console.log("\x1b[31m" + err.message + "\x1b[0m");
      err.message.includes("Duplicate")
        ? res.status(500).json({
            message: "Ошибка добавления трейд-ин",
            error: "Duplicate",
          })
        : res.status(500).json({ message: "Ошибка добавления трейд-ин" });
      return;
    }
    res.status(201).json({ id: result.insertId });
  });
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
