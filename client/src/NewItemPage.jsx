import { useState } from "react";
import { api } from "./api.js";

export default function NewItemPage() {
  const [form, setForm] = useState({
    title: '',
    car_model: '',
    description: '',
    visit_date: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function change(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setMessage('')
  }

  async function submit(event) {
    event.preventDefault()

    if (saving) return

    setSaving(true)
    setError('')
    setMessage('')
    
    try {
      const data = await api('/items', {
        method: 'POST',
        body: JSON.stringify(form)
      })

      setForm({
        title: '',
        car_model: '',
        description: '',
        visit_date: ''
      })
      setMessage(`${data.message}. Номер: ${data.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1>Новая запись</h1>
      <form className="card stack" onSubmit={submit}>
        <label className="field">
          <span>Услуга</span>
          <select
            name="title"
            value={form.title}
            onChange={change}
            required
            disabled={saving}
          >
            <option value="" disabled hidden>Выберите услугу</option>
            <option value="Диагностика">Диагностика</option>
            <option value="Техническое обслуживание">Техническое обслуживание</option>
            <option value="Шиномонтаж">Шиномонтаж</option>
            <option value="Ремонт тормозов">Ремонт тормозов</option>
          </select>
        </label>
        <label className="field">
          <span>Модель автомобиля</span>
          <input
            name="car_model"
            value={form.car_model}
            onChange={change}
            required
            maxLength={100}
            disabled={saving}
          />
        </label>
        <label className="field">
          <span>Описание</span>
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            required
            minLength={10}
            maxLength={300}
            disabled={saving}
          />
        </label>
        <label className="field">
          <span>Дата визита</span>
          <input
            name="visit_date"
            value={form.visit_date}
            placeholder="ДД.ММ.ГГГГ"
            onChange={change}
            required
            maxLength={10}
            disabled={saving}
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-message" role="status">{message} <a href="/account">Мои записи</a></p>}
        <button className="btn" disabled={saving}>
          {saving ? "Сохранение.." : "Добавить"}
        </button>
      </form>
    </>
  )
}