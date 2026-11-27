export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container grid cols-3">
        <div className="stack">
          <strong>АвтоРитм</strong>
          <small>Учебный портал записи в автосервис.</small>
        </div>
        <nav className="stack" aria-label="Навигация в подвале">
          <a href="/">Главная</a>
          <a href="/account">Личный кабинет</a>
          <a href="/new">Новая запись</a>
        </nav>
        <div className="stack">
          <p>Учебные контакты</p>
          <p>Екатеринбург, ул. Учебная, д. 20</p>
          <p>Пн–Сб, 09:00–19:00</p>
          <a href="mailto:hello@autoritm.example">hello@autoritm.example</a>
        </div>
      </div>
    </footer>
  )
}