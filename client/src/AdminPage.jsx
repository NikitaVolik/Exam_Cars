import { useEffect, useState } from "react";
import { api } from "./api.js";
import { statuses, transitions } from "./statuses.js";
import AutoCard from "./AutoCard.jsx";

export default function AdminPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('desc')
  const [page, setPage] = useState(1)
  const [savingId, setSavingId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true

    api('/admin/items').then(data => { if (active) setItems(data) })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    
    return () => {
      active = false
    }
  }, [])

  const query = search.trim().toLowerCase()
  const filtered = items.filter(item => (!status || item.status === status) && item.car_model.toLowerCase().includes(query)).sort((a, b) => {
    const order = sort.startsWith('model-') ? a.car_model.localeCompare(b.car_model, 'ru', { sensitivity: 'base' }) || a.id - b.id : a.created_at.localeCompare(b.created_at) || a.id - b.id
    return sort === 'asc' || sort === 'model-asc' ? order : -order
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / 4))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * 4, currentPage * 4)

  async function saveStatus(id, nextStatus) {
    if (savingId !== null) return

    setSavingId(id)
    setError('')
    setMessage('')
    
    try {
      await api(`/admin/items/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      })

      setItems(current => current.map(item => item.id == id ? { ...item, status: nextStatus } : item))
      setMessage(`Статус записи № ${id} сохранён`)
    } catch (err) {
      setError(err.message)
      if (err.status == 409) {
        try {
          const freshItems = await api('/admin/items')
          setItems(freshItems)
        } catch (loadError) {
          setError(loadError.message)
        }
      }
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <h1>Администратор</h1>
      <div className="card row">
        <label className="field">
          <span>Фильтр по статусу</span>
          <select
            value={status}
            onChange={event => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">Все статусы</option>
            {statuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Поиск по модели</span>
          <input
            type="search"
            value={search}
            onChange={event => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Введите модель или её часть"
          />
        </label>
        <label className="field">
          <span>Порядок записей</span>
          <select
            value={sort}
            onChange={event => {
              setSort(event.target.value)
              setPage(1)
            }}
          >
            <option value="desc">Сначала новые</option>
            <option value="asc">Сначала старые</option>
            <option value="model-desc">Модель Я–А</option>
            <option value="model-asc">Модель А–Я</option>
          </select>
        </label>
        <a href="/admin">Обновить список</a>
      </div>

      {loading && <p>Загрузка...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && 
        <div className="notice row" role="status">
          <span>{message}</span>
          <button type="button" className="btn" onClick={() => setMessage('')}>
            Закрыть
          </button>
        </div>
      }

      {!loading && !error && filtered.length === 0 && (
        <p>Записей не найдено</p>
      )}

      <div className="grid cols-2">
        {visible.map(item => (
          <AutoCard key={item.id} item={item}>
            <h2>Запись № {item.id}</h2>
            <h3>{item.title}</h3>
            <p>{item.car_model}</p>
            <p>{item.description}</p>
            <p>{item.visit_date}</p>
            <p>Пользователь: {item.login}</p>
            <label className="field">
              <span>Статус (сохраняется сразу)</span>
              <select
                value={item.status}
                disabled={savingId !== null || !transitions[item.status]?.length}
                onChange={event => saveStatus(item.id, event.target.value)}
              >
                {statuses.filter(option => option.value === item.status || transitions[item.status]?.includes(option.value)).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </AutoCard>
        ))}
      </div>

      <nav className="row" aria-label="Страницы записей">
        <button className="btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
          Назад
        </button>

        <span>{currentPage} / {totalPages}</span>

        <button className="btn" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
          Вперёд
        </button>
      </nav>
    </>
  )
}