const imageNames = new Map([
  ["Диагностика", "diagnostic.webp"],
  ["Техническое обслуживание", "maintenance.webp"],
  ["Шиномонтаж", "tires.webp"],
  ["Ремонт тормозов", "brakes.webp"]
])

export default function AutoCard({ item, children }) {
  const image = imageNames.get(item.title)
  
  return (
    <article className="card stack">
      {image && <img className="card-image" src={"/images/" + image} alt="" loading="lazy" />}
      {children}
    </article>
  )
}