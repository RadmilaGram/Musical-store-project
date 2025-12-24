# Скрипты работы с БД (MySQL): экспорт и пересоздание

Эти скрипты помогают **хранить состояние БД в гите** и быстро разворачивать её.

Используются два файла:

- `backend/db/schema.sql` — структура БД (таблицы, индексы и т.п.)
- `backend/db/data.sql` — данные (INSERT’ы)

И два скрипта:

- `backend/scripts/exportDb.js` — сделать дамп текущей БД в `schema.sql` и `data.sql`
- `backend/scripts/resetDb.js` — пересоздать БД из `schema.sql` и `data.sql`

> ⚠️ Скрипты выполняют **полное пересоздание БД**. Все текущие данные в этой БД будут удалены.

В Windows (из \backend):
```bat
REM Запустить экспорт:
npm run db:export

REM Пересоздать БД:
npm run db:reset
```

---

## 1. Предварительные требования

1. **Node.js** установлен.
2. **MySQL сервер** установлен и запущен.
3. Установлен **MySQL Client** (утилиты `mysql.exe`, `mysqldump.exe`).
   - На Windows обычно лежит тут:  
     `C:\Program Files\MySQL\MySQL Server 8.0\bin\`
4. В проекте есть папки:
   - `backend/scripts/`
   - `backend/db/`

---

## 2. Настройка подключения к БД

Оба скрипта используют одинаковый набор параметров подключения:

- `DB_HOST` — хост БД (по умолчанию `localhost`)
- `DB_USER` — пользователь БД (по умолчанию `root`)
- `DB_PASSWORD` — пароль (по умолчанию пустой)
- `DB_NAME` — имя базы данных (по умолчанию `mydb`)

Настроить можно **двумя способами**:

---

### 2.1. Через переменные окружения 

#### Windows (cmd.exe)

```bat
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=мойПароль
set DB_NAME=my_project_db
```

### 2.2 Хардкод в скриптах (сейчас так)

```js
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "mydb";
```
