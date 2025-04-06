const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// Инициализация Express
const app = express();

// Настроим CORS для разрешения запросов с фронтенда
app.use(cors());

// Парсим JSON-данные из запросов
app.use(express.json());

// Подключение к базе данных MySQL
const db = mysql.createConnection({
  host: 'localhost',
  port:'3306',
  user: 'root', // Ваше имя пользователя MySQL
  password: 'SonyA', // Ваш пароль MySQL
  database: 'music_shop_db', // Имя вашей базы данных
});

// Проверяем подключение к базе данных
db.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.stack);
    return;
  }
  console.log('Подключение к базе данных MySQL успешно');
});

// Маршрут для получения данных с базы
app.get('/api/brand', (req, res) => {
  db.query('SELECT * FROM brand', (err, results) => {
    // console.log(results);
    if (err) {
      console.log('\x1b[31m' + err.message +'\x1b[0m');
      res.status(500).json({ message: 'Ошибка получения бренда',  });
      return;
    }
    res.json(results); // Отправляем данные на фронтенд
  });
});

// Маршрут для добавления пользователя
// app.post('/api/users', (req, res) => {
//   const { name, age } = req.body;
//   const query = 'INSERT INTO users (name, age) VALUES (?, ?)';

//   db.query(query, [name, age], (err, result) => {
//     if (err) {
//       res.status(500).json({ message: 'Ошибка добавления пользователя' });
//       return;
//     }
//     res.status(201).json({ id: result.insertId, name, age });
//   });
// });

// Запуск сервера
const port = 5000;
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
