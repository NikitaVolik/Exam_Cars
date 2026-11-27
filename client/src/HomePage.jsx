const services = [
  ["Диагностика", "diagnostic.webp"],
  ["Техническое обслуживание", "maintenance.webp"],
  ["Шиномонтаж", "tires.webp"],
  ["Ремонт тормозов", "brakes.webp"]
]

export default function HomePage({ user }) {
  return (
    <>
      <section className="grid cols-2 home-hero">
        <div className="stack">
          <h1>АвтоРитм</h1>
          <p>Запись автомобиля в сервис и отслеживание статуса работ.</p>
          <a className="btn" href={user ? "/new" : "/login"}>
            Записать автомобиль
          </a>
        </div>
        <img src="/images/home-workshop.webp" alt="Оборудование и работа в автосервисе" />
      </section>
      <section className="stack">
        <h2>Услуги сервиса</h2>
        <div className="grid cols-2">
          {services.map(([name, image]) => (
            <article className="card stack" key={name}>
              <img className="card-image" src={"/images/" + image} alt="" />
              <h3>{name}</h3>
              <a href={user ? "/new" : "/login"}>Записаться</a>
            </article>
          ))}
        </div>
      </section>
      <section className="stack">
        <h2>Контакты</h2>
        <p>Екатеринбург, ул. Учебная, д. 20</p>
        <p>Пн–Сб, 09:00–19:00. Почта — hello@autoritm.example</p>
      </section>
    </>
  )
}