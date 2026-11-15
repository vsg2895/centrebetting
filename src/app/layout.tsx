import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Outfit } from 'next/font/google'
import Link from 'next/link'
import ScrollToTopOnNavigate from '@/components/ScrollToTopOnNavigate'
import NewsletterForm from '@/components/NewsletterForm'
import SocialIcons from '@/components/SocialIcons'
import CookieConsent from '@/components/CookieConsent'
import ToastProvider from '@/components/ToastProvider'
import CookieSettingsButton from '@/components/CookieSettingsButton'
import Logo from '@/components/Logo'
import { getSocialLinks, hasSpecialOffers, getCategories, getBonusArea } from '@/lib/api'
import { buildOrganizationSchema, buildWebSiteSchema, jsonLdScript, SHARE_IMAGES } from '@/lib/seo'
import { SITE_URL } from '@/lib/config'
import { COPY } from '@/constants/copy'
import NavDropdown from '@/components/NavDropdown'
import FooterNavGroup from '@/components/FooterNavGroup'
import MobileNav from '@/components/MobileNav'
import { resolveImageUrl } from '@/lib/images'
import { LEGAL_PAGES } from '@/constants/legalPages'
import type { SocialLink } from '@shared/types/socialLink'
import './globals.css'

// The mockup's two faces: Outfit for text (and the spaced-capital eyebrows),
// DM Serif Display for every heading and the wordmark. DM Serif Display ships
// one weight (400), set at that weight everywhere; its true italic is loaded
// for the green phrases (`<em>`), so they are never a slanted fake.
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const dmSerif = DM_Serif_Display({ variable: '--font-dm-serif', subsets: ['latin'], weight: '400', style: ['normal', 'italic'] })

/**
 * Subscribe capture: every entry point on this site — the newsletter form and,
 * where the site has one, the timed subscribe modal.
 *
 * The components, the /api/newsletter route and the backend double-opt-in flow
 * are never touched by this; it only decides whether they are rendered. That is
 * the point of a flag rather than deleted markup: turning capture off and back
 * on is one edit, and nothing has to be rebuilt from memory.
 */
const SUBSCRIBE_ENABLED = true

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'CentreBetting'

// Both strings live in COPY so this site's wording is defined in exactly one
// place — the same place the page-level titles and descriptions come from.
// The previous SITE_DESCRIPTION here was byte-identical to a sibling domain's,
// which made this site's default meta/og/twitter description duplicate content
// on every page that falls back to it.
const SITE_TITLE = `${SITE_NAME} — ${COPY.site.titleTail}`
const SITE_DESCRIPTION = `${SITE_NAME} ${COPY.site.description}`

export const metadata: Metadata = {
  // THE origin every relative canonical and og:url in the app resolves
  // against. `SITE_URL` is validated at module load (see lib/config), so the
  // old `|| 'https://…'` literal is gone: a second hardcoded host here is
  // exactly how the canonical and the sitemap drifted onto different hosts.
  metadataBase: new URL(SITE_URL),
  // Root default. Every page overrides it with its own path, so each URL
  // gets a SELF-referencing canonical rather than inheriting the homepage's.
  alternates: { canonical: '/' },
  title: {
    // Home & inner pages set their own; this is the SEO-friendly fallback title.
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Terms that describe what THIS site publishes. The generic set that was
  // here was shared with a sibling domain and described neither in particular.
  keywords: [...COPY.site.keywords, SITE_NAME],
  // Tab icon.
  //
  // This used to offer ONLY icon.svg. Browsers that do not take an SVG favicon
  // — Safari most visibly — then had nothing to fall back to, because
  // /favicon.ico 404'd, so they showed a placeholder or a stale cached icon
  // instead of this site's own mark. app/favicon.ico now holds 16/32/48 rasters
  // cut from that same artwork, and Next links it automatically from the file
  // convention, so it is deliberately NOT repeated here.
  //
  // `apple` DOES have to be listed: an explicit icons object suppresses the
  // apple-icon file convention, so app/apple-icon.tsx was generating a 180x180
  // PNG at /apple-icon that no page ever linked to.
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Relative on purpose: Next resolves it against metadataBase, so og:url
    // and the canonical can never disagree about the host.
    url: '/',
    images: SHARE_IMAGES,
  },
  // The card TYPE only. A title and description here were inherited by every
  // page that does not set `twitter` itself — nearly all of them — so a shared
  // /casinos or /about went out on X under the HOME page's title. With these
  // tags absent, X reads the page's own og:title, og:description and og:image.
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  manifest: '/manifest.webmanifest',
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Search-engine ownership verification, supplied per environment. Absent env
  // vars simply produce no tag, so nothing has to be committed to the repo.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_VERIFICATION
        ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION
        ? { 'p:domain_verify': process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION }
        : {}),
    },
  },
}

/**
 * Viewport + theme colour.
 *
 * Next 14 moved these out of `metadata` into their own export; leaving
 * themeColor in `metadata` is silently ignored, which is why the sites had no
 * theme-color at all. `viewport-fit=cover` is deliberately omitted — nothing
 * here draws into the notch area.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#261B15',
}

const NAV_LINKS = [
  { href: '/casinos', label: COPY.nav.casinos },
  { href: '/special-offers', label: COPY.nav.specialOffers },
  { href: '/categories', label: COPY.nav.categories },
]

/** A header link — the mockup's `nav.main a`: the raised panel on hover. */
const NAV_LINK = 'flex min-h-11 items-center whitespace-nowrap rounded-[10px] px-[13px] py-2 text-[15px] font-medium text-ink transition-colors hover:bg-surface'

/** A footer link on the cream paper; the arrow that slides in is `.fl` (globals.css). */
const FOOTER_LINK = 'fl inline-block -my-1.5 py-2.5 text-[15px] text-card-soft'

const FOOTER_HEAD = 'mb-2.5 font-display text-[22px] text-card-ink'

// The 11 legal pages split into the footer's three columns, as in the mockup.
// Every page in LEGAL_PAGES lands in exactly one of them.
const FOOTER_EXPLORE = ['about', 'contact']
const FOOTER_LEGAL = ['privacy-policy', 'terms', 'cookie-policy', 'disclaimer']
const FOOTER_POLICIES = ['responsible-gambling', 'affiliate-disclosure', 'editorial-policy', 'aml-policy', 'kyc-policy']

function footerPages(slugs: string[]) {
  return LEGAL_PAGES.filter(({ slug }) => slugs.includes(slug))
}

/** The safer-play reminders in the footer's 18+ panel. */
const SAFER_PLAY = ['Set a limit', 'Take breaks', 'Never chase losses']

/** The header dropdown panel, in this site's own palette. */
const NAV_PANEL = {
  panelClassName: 'bg-paper ring-1 ring-line',
  itemClassName: 'text-ink-soft hover:bg-surface hover:text-brand-dark',
  allItemClassName: 'text-ink hover:bg-surface hover:text-brand-dark',
  arrowClassName: 'text-brand',
}

/** The phone menu (below `md`), in this site's own palette. */
const NAV_MOBILE = {
  triggerClassName: 'text-ink hover:bg-surface hover:text-brand-dark',
  panelClassName: 'bg-paper border-line',
  rowClassName: 'text-ink hover:bg-surface hover:text-brand-dark',
  rowExpandedClassName: 'bg-surface text-brand-dark',
  allClassName: 'text-ink hover:bg-surface hover:text-brand-dark',
  childClassName: 'text-ink-soft hover:bg-surface hover:text-brand-dark',
  guideClassName: 'border-line',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  /*
   * Widened to `string` deliberately.
   *
   * COPY is `as const`, so this would otherwise carry the LITERAL type of
   * whatever address is written in copy.ts — and TypeScript then rejects
   * `!== ''` as a comparison that can never be true. The check is not
   * pointless: a freshly cloned site ships with this blank, and the footer has
   * to omit the whole <address> element rather than print an empty one.
   */
  const postalAddress: string = COPY.footer.postalAddress

  let socialLinks: SocialLink[] = []
  try {
    socialLinks = (await getSocialLinks()).data
  } catch {
    socialLinks = []
  }

  // "Special Offers" only earns its slot in the nav when this site actually has
  // a visible offer to show; with none, the link would lead to an empty page,
  // so both the header and the footer drop it.
  const showSpecialOffers = await hasSpecialOffers()
  const navLinks = NAV_LINKS.filter(({ href }) => href !== '/special-offers' || showSpecialOffers)

  // Children for the Casinos and Bonuses entries, header and footer
  // alike. Each carries the icon its chip shows, resolved here on the server so
  // the client menus never need the storage URL. A failed fetch yields no
  // items, and the entry then stays the plain link it always was.
  const categoryMenuItems = await getCategories()
    .then((res) => res.data.map((c) => ({ slug: c.slug, name: c.name, icon: resolveImageUrl(c.logo_path) })))
    .catch(() => [])
  // Bonus types with at least one visible offer on this site (the API drops
  // empty ones). getBonusArea already falls back to [] on failure.
  const bonusMenuItems = (await getBonusArea()).map((section) => ({
    slug: section.slug,
    name: section.name,
    icon: resolveImageUrl(section.icon_path),
  }))

  // Site-wide structured data, rendered once here so every page carries it.
  // Next.js manages the document <head> (manual <head> tags in a root layout are
  // discouraged), so per the framework's JSON-LD guide the <script> is rendered
  // in the layout body — crawlers read JSON-LD from anywhere in the document.
  // The `<` escaping keeps the payload XSS-safe.
  //
  // Two nodes, cross-referenced by @id: the publisher (Organization) and the
  // site (WebSite). socialLinks is already fetched above for the footer, so
  // `sameAs` costs no extra request.
  const siteGraph = [buildOrganizationSchema(socialLinks), buildWebSiteSchema()]

  return (
    <html lang="en" className={`${outfit.variable} ${dmSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {/* Opens every page at its top — see the component. */}
        <ScrollToTopOnNavigate />
        <ToastProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(siteGraph),
          }}
        />
        {/* Header — the mockup's `header.top`: translucent espresso over the
            page, blurred, closed by a hairline. */}
        <header className="sticky top-0 z-40 border-b border-line bg-cream/92 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3">
            <Logo />
            <nav aria-label="Main navigation" className="hidden md:block">
              <ul className="flex items-center gap-0.5" role="list">
                {navLinks.map(({ href, label }) =>
                  href === '/casinos' && categoryMenuItems.length > 0 ? (
                    <NavDropdown key={href} label={label} href={href} allLabel={COPY.nav.allCasinos} itemBasePath="/categories" items={categoryMenuItems} triggerClassName={NAV_LINK} {...NAV_PANEL} />
                  ) : href === '/special-offers' && bonusMenuItems.length > 0 ? (
                    <NavDropdown key={href} label={label} href={href} allLabel={COPY.nav.allOffers} itemBasePath="/bonuses" items={bonusMenuItems} triggerClassName={NAV_LINK} {...NAV_PANEL} />
                  ) : (
                    <li key={href}>
                      <Link href={href} className={NAV_LINK}>
                        {label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>
            {/* Below md the strip above is hidden and this menu replaces it. */}
            <MobileNav
              links={navLinks}
              groups={{
                '/casinos': { allLabel: COPY.nav.allCasinos, items: categoryMenuItems, itemBasePath: '/categories' },
                '/special-offers': { allLabel: COPY.nav.allOffers, items: bonusMenuItems, itemBasePath: '/bonuses' },
              }}
              theme={NAV_MOBILE}
            />
          </div>
        </header>

        {/* Newsletter strip — the mockup's `.news`, on the raised espresso.
            Rendered while SUBSCRIBE_ENABLED is true. */}
        {SUBSCRIBE_ENABLED && (
          <section className="border-b border-line bg-paper" aria-label="Newsletter">
            <div className="mx-auto max-w-[1200px] px-4 py-3.5">
              <NewsletterForm />
            </div>
          </section>
        )}

        <div className="flex-1">{children}</div>

        {/* Footer — the mockup's `footer.ft`: cream paper hung from a ruler,
            the closing line and the two ways in, the brand beside Explore /
            Legal / Policies, the 18+ panel, then the dark legal bar. */}
        <footer className="mt-14 bg-sand text-card-ink">
          <div aria-hidden className="ruler-sand" />
          <div className="mx-auto max-w-[1200px] px-4 pb-8 pt-10">
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-b-[1.5px] border-dashed border-card-line pb-8">
              <p className="font-display text-[clamp(34px,4.6vw,58px)] leading-none">
                Every casino, <em className="text-pine">one yardstick.</em>
              </p>
              {/* Never a two-line button: on a narrow phone the pair wraps to a row
                  each, both full width. */}
              <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
                <Link href="/casinos" className="btn-g min-h-12 flex-[1_1_auto] whitespace-nowrap px-[22px] text-[15px] sm:flex-none">
                  {COPY.home.featuredCasinos}
                </Link>
                {showSpecialOffers && (
                  <Link href="/special-offers" className="btn-l min-h-12 flex-[1_1_auto] whitespace-nowrap px-[22px] text-[15px] sm:flex-none">
                    {COPY.home.specialOffers}
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 py-9 min-[61.25rem]:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] min-[61.25rem]:gap-12">
              <div>
                {/* The Logo component itself, so the mark and wordmark here can
                    never drift from the header's. */}
                <Logo onCard />
                <p className="mt-4 max-w-[360px] text-[15px] leading-relaxed text-card-soft">{COPY.footer.tagline}</p>
                <p className="mt-3.5 max-w-[360px] rounded-[10px] border border-card-line bg-card px-3 py-2 text-[12.5px] leading-normal text-card-muted">
                  {COPY.footer.commission}
                </p>
                {socialLinks.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.16em] text-card-muted">Follow us</p>
                    <SocialIcons links={socialLinks} onCard />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div>
                  <p className={FOOTER_HEAD}>Explore</p>
                  <ul className="flex flex-col gap-1">
                    {navLinks.map(({ href, label }) =>
                      href === '/casinos' && categoryMenuItems.length > 0 ? (
                        <FooterNavGroup key={href} label={label} href={href} allLabel={COPY.nav.allCasinos} itemBasePath="/categories" items={categoryMenuItems} linkClassName={FOOTER_LINK} guideClassName="border-card-line" />
                      ) : href === '/special-offers' && bonusMenuItems.length > 0 ? (
                        <FooterNavGroup key={href} label={label} href={href} allLabel={COPY.nav.allOffers} itemBasePath="/bonuses" items={bonusMenuItems} linkClassName={FOOTER_LINK} guideClassName="border-card-line" />
                      ) : (
                        <li key={href}>
                          <Link href={href} className={FOOTER_LINK}>{label}</Link>
                        </li>
                      ),
                    )}
                    {footerPages(FOOTER_EXPLORE).map(({ slug, label }) => (
                      <li key={slug}><Link href={`/${slug}`} className={FOOTER_LINK}>{label}</Link></li>
                    ))}
                  </ul>
                </div>
                <nav aria-label="Legal">
                  <p className={FOOTER_HEAD}>Legal</p>
                  <ul className="flex flex-col gap-1">
                    {footerPages(FOOTER_LEGAL).map(({ slug, label }) => (
                      <li key={slug}><Link href={`/${slug}`} className={FOOTER_LINK}>{label}</Link></li>
                    ))}
                    <li>
                      <CookieSettingsButton className={`${FOOTER_LINK} text-left`} />
                    </li>
                  </ul>
                </nav>
                <nav aria-label="Policies">
                  <p className={FOOTER_HEAD}>Policies</p>
                  <ul className="flex flex-col gap-1">
                    {footerPages(FOOTER_POLICIES).map(({ slug, label }) => (
                      <li key={slug}><Link href={`/${slug}`} className={FOOTER_LINK}>{label}</Link></li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>

            {/* The 18+ panel. Not `aria-hidden`: the sentence beside it never
                says the age, so a screen reader needs the "18+" too. */}
            <div className="grid grid-cols-1 items-center gap-x-6 gap-y-[18px] rounded-[20px] border-[1.5px] border-card-line bg-card p-[18px] sm:grid-cols-[auto_minmax(0,1fr)] sm:px-6 sm:py-5 min-[61.25rem]:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-[17px] font-bold text-brand-ink">18+</span>
              <div>
                <p className="font-display text-[22px]">Gamble responsibly.</p>
                <p className="mt-1 text-sm leading-normal text-card-soft">{COPY.footer.disclaimer}</p>
              </div>
              <ul className="flex flex-wrap gap-2 sm:col-span-full min-[61.25rem]:col-auto" aria-label="Safer play">
                {SAFER_PLAY.map((tip) => (
                  <li key={tip} className="whitespace-nowrap rounded-full bg-mint px-3 py-[7px] text-[13px] font-semibold text-pine">{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-card-ink text-ink-soft">
            <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-x-5 gap-y-2 px-4 py-4 text-[13px]">
              <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
              {/* Rendered only when an address exists: a freshly cloned site
                  ships with this blank, and an empty <address> is worse than
                  none. `not-italic` is load-bearing — Preflight does not reset
                  the tag's italic default. */}
              {postalAddress !== '' && <address className="not-italic">{postalAddress}</address>}
            </div>
          </div>
        </footer>

        <CookieConsent />
        </ToastProvider>
      </body>
    </html>
  )
}
