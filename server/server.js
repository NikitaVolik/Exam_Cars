import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "./db.js"

const app = express()

app.use(express.json())

if (!process.env.JWT_SECRET) {
  throw new Error("Заполните токен")
}

const statuses = ['new', 'active', 'completed']
const positiveId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0

function publicUser(user) {
  return {
    id: user.id,
    login: user.login,
    role: user.role
  }
}

async function auth(req, res, next) {
  const header = req.headers.authorization || ''

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Войдите в систему" })
  }

  let decoded

  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)

    if (!positiveId(decoded.id)) {
      throw new Error("Неверный идентификатор")
    }
  } catch {
    return res.status(401).json({ message: "Войдите повторно: сеанс недействителен" })
  }

  const [rows] = await db.query(
    `SELECT id, login, role
    FROM users
    WHERE id = ?`,
    [decoded.id]
  )

  if (rows.length === 0) {
    return res.status(401).json({ message: "Пользователь не найден" })
  }

  req.user = rows[0]
  next()
}

function admin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Доступ только администратору" })
  }

  next()
}

app.post("/api/register", async (req, res) => {
  const body = req.body || {}

  const login = typeof body.login === "string" ? body.login.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : ""
  const phone_number = typeof body.phone_number === "string" ? body.phone_number : ""
  const email = typeof body.email === "string" ? body.email.trim() : ""
  const errors = {}

  if (!/^[A-Za-z0-9]{6,50}$/.test(login)) {
    errors.login = "Латиница и цифры, 6-50 символов"
  }

  if (password.length < 8) {
    errors.password = "Минимум 8 символов"
  } else if (bcrypt.truncates(password)) {
    errors.password = "Пароль должен занимать не более 72 байт в UTF-8"
  }

  if (!full_name) {
    errors.full_name = "Введите ФИО"
  }

  if (!phone_number) {
    errors.phone_number = "Введите телефон"
  }

  if (!email) {
    errors.email = "Введите email"
  } else if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Введите email в формате name@example.com"
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Проверьте поля", errors })
  }

  const hash = await bcrypt.hash(password, 10)

  try {
    await db.query(
      `
        INSERT INTO users (login, password_hash, full_name, phone_number, email)
        VALUES (?, ?, ?, ?, ?)
      `,
      [login, hash, full_name, phone_number, email]
    )
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Логин занят", errors: { login: "Логин уже используется" } })
    }
    throw error
  }

  res.status(201).json({ message: "Регистрация завершена. Теперь войдите" })
})

app.post("/api/login", async (req, res) => {
  const body = req.body || {}

  const login = typeof body.login === "string" ? body.login.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!login || login.length > 50 || !password) {
    return res.status(400).json({ message: "Проверьте логин и пароль" })
  }

  if (bcrypt.truncates(password)) {
    return res.status(400).json({ message: "Пароль должен занимать не более 72 байт в UTF-8" })
  }

  const [rows] = await db.query(
    `SELECT * FROM users WHERE login = ?`,
    [login]
  )

  const user = rows[0]

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return res.status(401).json({ message: "Неверный логин или пароль" })
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7h" })

  res.json({ token, user: publicUser(user) })
})

app.get("/api/me", auth, (req, res) => res.json(publicUser(req.user)))

app.get("/api/items", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT id, title, car_model, description, visit_date, status, created_at
        FROM items
        WHERE user_id = ? ORDER BY id DESC
      `,
      [req.user.id]
    )

    res.json(rows)
  } catch {
    res.status(500).json({ message: "Не удалось загрузить записи" })
  }
})

app.post("/api/items", auth, async (req, res) => {
  const body = req.body || {}

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const car_model = typeof body.car_model === "string" ? body.car_model.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const visit_date = typeof body.visit_date === "string" ? body.visit_date.trim() : ""
  const errors = {}

  const serviceTypes = ["Диагностика", "Техническое обслуживание", "Шиномонтаж", "Ремонт тормозов"]

  if (!serviceTypes.includes(title)) {
    errors.title = "Выберите услугу"
  }

  if (!car_model || car_model.length > 100) {
    errors.car_model = "Введите модель автомобиля до 100 символов"
  }

  if (!description || description.length < 10 || description.length > 300) {
    errors.description = "Введите от 10 до 300 символов"
  }

  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(visit_date)) {
    errors.visit_date = "Введите корректную дату визита"
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Проверьте поля", errors })
  }

  try {
    const [result] = await db.query(
      `
        INSERT INTO items (user_id, title, car_model, description, visit_date)
        VALUES (?, ?, ?, ?, ?)
      `,
      [req.user.id, title, car_model, description, visit_date]
    )

    res.status(201).json({
      id: result.insertId,
      title,
      car_model,
      description,
      visit_date,
      message: "Запись добавлена"
    })
  } catch {
    res.status(500).json({ message: "Не удалось сохранить запись" })
  }
})

app.get("/api/admin/items", auth, admin, async (req, res) => {
  const [rows] = await db.query(
    `
      SELECT i.id, i.title, i.car_model, i.description, i.visit_date, i.status, i.created_at, u.login
      FROM items i JOIN users u ON u.id = i.user_id ORDER BY i.id DESC
    `
  )

  res.json(rows)
})

app.patch("/api/admin/items/:id/status", auth, admin, async (req, res) => {
  const transitions = {
    new: ['confirmed', 'cancelled'],
    confirmed: ['active', 'cancelled'],
    active: ['completed'],
    completed: [],
    cancelled: []
  }
  
  const id = Number(req.params.id)
  const nextStatus = req.body?.status

  if (!Number.isSafeInteger(id) || id <= 0 || typeof nextStatus !== "string" || !Object.hasOwn(transitions, nextStatus)) {
    return res.status(400).json({ message: "Некорректная запись или статус" })
  }

  const [rows] = await db.query(
    `SELECT status FROM items WHERE id = ?`,
    [id]
  )

  if (rows.length === 0) {
    return res.status(404).json({ message: "Запись не найдена" })
  }

  const previous = rows[0].status

  if (nextStatus === previous) {
    return res.json({ message: "Статус уже сохранён" })
  }

  if (!transitions[previous]?.includes(nextStatus)) {
    return res.status(409).json({ message: "Недопустимый переход статуса" })
  }
  
  const [result] = await db.query(
    `UPDATE items SET status = ? WHERE id = ? AND status = ?`,
    [nextStatus, id, previous]
  )

  if (!result.affectedRows) {
    return res.status(409).json({ message: "Статус изменён. Обновите список." })
  }

  res.json({ message: "Статус сохранён" })
})

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Маршрут не найден" })
})

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: "Неверный JSON" })
  }

  console.error('Ошибка API:', error.code || error.name)
  res.status(500).json({ message: "Ошибка сервера. Попробуйте ещё раз." })
})

const port = Number(process.env.API_PORT || 5000)
app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`)
})
