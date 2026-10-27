type Props = { step: number; items: string[] }

// Carte provisoire : dit ce que l'écran contiendra et à quelle étape de docs/07-feuille-de-route.md.
export function ComingSoon({ step, items }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <span className="self-start rounded-full bg-accent-tint px-2.5 py-1 text-xs font-bold text-accent-ink">
        Arrive à l’étape {step}
      </span>
      <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[15px]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
