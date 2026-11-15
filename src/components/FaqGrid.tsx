/**
 * The home page FAQ — `.faq` in sites/centrebetting-redesign.html: two columns
 * of native `<details>` on the espresso page, each opening onto the cream
 * paper with its plus turned into a green minus (globals.css). One column
 * below 980px. The first is open.
 *
 * Native `<details>`, no client JavaScript: every answer is in the server HTML,
 * which the FAQPage schema built from the same array requires.
 */
export default function FaqGrid({ items }: { items: readonly { question: string; answer: string }[] }) {
  return (
    <div className="faq mt-[26px] grid grid-cols-1 items-start gap-3 min-[61.25rem]:grid-cols-2">
      {items.map((item, i) => (
        <details key={item.question} open={i === 0} className="rounded-2xl border-[1.5px] border-line bg-paper px-5">
          <summary className="flex min-h-[62px] cursor-pointer items-center justify-between gap-3 py-[18px] font-display text-[21px] leading-[1.25]">
            {item.question}
          </summary>
          <p className="mb-[18px] text-[15.5px] leading-[1.7] text-card-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
