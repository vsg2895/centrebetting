/**
 * All user-facing and SEO-facing wording for this site.
 *
 * The KEY STRUCTURE is identical across every site in the network — same
 * groups, same keys, same order — so the apps stay interchangeable and a
 * component written for one works on all of them.
 *
 * The WORDS are deliberately unique to this site. That is not decoration: the
 * brands are separate domains serving the same catalogue, and if they shipped
 * the same titles, descriptions and headings, Google would treat them as
 * duplicate content and suppress all but one. Every string that reaches a
 * <title>, a meta description, an <h1>/<h2> or a JSON-LD field must therefore
 * read differently here than on the sibling sites.
 *
 * CentreBetting's angle: one central place for casino reviews, judged on fair
 * play — every operator measured against the same yardstick, so a reader
 * compares like with like. Taken from the brief in sites/centrebetting.html.
 *
 * That brief shares most of its sample wording with sites/netbetus.html; the
 * strings below are this site's own so the two domains never ship the same
 * headings or descriptions.
 *
 * ── One line this file does not cross ───────────────────────────────────────
 * The mockup shows an "Avg. payout time" per casino and says withdrawals are
 * timed ("log the hours to payout"). Nothing records a timed withdrawal per operator, so no wording here
 * promises a figure of that kind; the only score shown is `casino.rating`,
 * which is real.
 */
export const COPY = {
  // SEO identity. These three reach the <title>, the meta description and the
  // keywords tag on EVERY page that does not set its own — which is most of
  // them — so they are the strings most likely to be read as duplicate content
  // if a sibling domain ships the same words.
  site: {
    titleTail: 'Casino Reviews at the Centre of Fair Play',
    description:
      'is a central guide to online casinos, reviewing each one against the same fair-play yardstick: withdrawals, bonus terms, licensing and support.',
    keywords: [
      'online casino reviews',
      'fair play casinos',
      'casino comparison guide',
      'safe online betting',
      'casino bonus terms compared',
    ],
  },
  nav: {
    casinos: 'Casinos',
    // The page lists every visible bonus, flat and ungrouped, so the menu says
    // what is behind it. winpalack keeps "Special Offers": its page is the
    // grouped bonus-area view and is a different thing.
    specialOffers: 'Bonuses',
    categories: 'Categories',
    // First row inside the header and footer dropdowns: the parent's own page.
    allCasinos: 'All Casinos',
    allOffers: 'All Offers',
  },
  home: {
    bonus: 'Bonuses',
    seeMore: 'See more',
    seeAllBonuses: 'See All Bonuses',
    /**
     * The VISIBLE heading over the bonus-type row.
     *
     * The row used to carry no heading at all — the chips were taken to
     * speak for themselves. They do not: arriving mid-page at a band of
     * unlabelled buttons between the hero and the casino list, there is
     * nothing saying what the set IS, and nothing a screen reader can
     * announce for the landmark beyond a generic label nobody wrote for
     * this page.
     *
     * Worded differently on every domain, like every other <h2> here:
     * eleven sites serve one catalogue, and a shared heading is
     * duplicate content.
     */
    bonusTypesTitle: 'Find A Bonus By Type',
    heroEyebrow: 'Independent fair-play reviews',
    // Split in two so the JSX keeps its emphasised highlight while the words
    // change. The highlight is the brand's own phrase.
    heroHeadline: 'Every casino review,',
    heroHighlight: 'in one centre',
    heroSubtitle:
      'One yardstick for every operator: how it pays out, how fair its bonus terms are, who licenses it and how its support behaves — side by side, in one place.',
    topCasinosTitle: 'Casinos At The Centre',
    topCasinosSubtitle: 'Compared on withdrawals, fair terms and licensing. Pick a category to narrow it down.',
    featuredCasinos: 'Compare Casinos',
    specialOffers: 'View Bonus Offers',
    viewAll: 'View All',
    // Leads the home <title>; the year and brand are appended in page.tsx.
    homeTitle: 'Online Casino Reviews, All In One Centre',
    faqTitle: 'Fair Play, Explained',
    metaDescription:
      'CentreBetting reviews online casinos side by side on withdrawals, fair bonus terms and licensing — your central guide to safer betting.',
    // ── The "How we review" band ─────────────────────────────────────────
    // Three steps, numbered, because they ARE a sequence: each one happens
    // after the one before it. Numbering a set that is not ordered is
    // decoration; numbering this one is information.
    methodTitle: 'One yardstick, three checks',
    methodSubtitle: 'The same order of work for every casino we compare.',
    methodSteps: [
      {
        kicker: '01 — Join',
        title: 'Sign up like a player',
        body:
          'An ordinary account, an ordinary first deposit, and the welcome offer taken exactly as it is advertised to everyone else.',
      },
      {
        kicker: '02 — Compare',
        title: 'Read the small print',
        body:
          'Wagering, stake limits and game contributions set against the full terms, then compared with what other casinos ask for the same offer.',
      },
      {
        kicker: '03 — Cash out',
        title: 'Ask for the money',
        body:
          'A withdrawal request shows how verification, payout methods and limits work in practice. Casinos that make it hard sit lower.',
      },
    ],
  },
  casinos: {
    pageTitle: 'All Casinos, Side By Side',
    pageDescription:
      'Every casino CentreBetting reviews, compared on one yardstick: its current bonus, its terms, and where it sits in its category.',
    // H2 over the offers block on a casino page. The literal 'Special Offers'
    // was hardcoded in the component on all six sites — an identical H2 on
    // every review page in the network.
    offersHeading: 'Current Offers Here',
    // Tail of the summary-panel H2: `{casino.name} at a glance`.
    glanceHeadingTail: 'at a glance',
    reviewTitleTail: 'Review & Fair Play Check',
    reviewSignature: 'Measured on the same yardstick as every other casino here.',
    reviewSummary: 'compared on withdrawals, fair bonus terms, licensing and support.',
    visitCasino: 'Visit Casino',
    readReview: 'Full Review',
    rating: 'Centre Score',
    noResults: 'No casinos match this filter yet. Try another category.',
  },
  /**
   * The page behind one bonus type (/bonuses/[slug]).
   *
   * `metaSuffix` is appended to the type's name when the admin wrote no
   * description, so the meta line is still specific to the page rather than
   * boilerplate shared by eight of them.
   */
  bonusCategory: {
    metaSuffix: 'every current offer of this kind, compared on the terms attached to it.',
    countOne: 'bonus',
    countMany: 'bonuses',
  },

  specialOffers: {
    pageTitle: 'Bonus Offers Compared',
    pageDescription:
      'Current bonuses from the casinos we review, side by side, with wagering and minimum deposit wherever the operator publishes them.',
    // Appended to an offer's (shared) bonus text so the nine sites do not ship
    // an identical meta description for the same offer.
    offerMetaSuffix: 'Compared against the operator’s own terms by CentreBetting.',
    claim: 'Get Bonus',
    noResults: 'No bonus offers to compare right now.',
  },
  categories: {
    pageTitle: 'Browse By Category',
    pageDescription:
      'Every list uses the same fair-play yardstick — choose the kind of casino you are looking for.',
    // Meta-description tail for a single category page. Category records are
    // shared master data, so this is what keeps the nine sites distinct there.
    categoryMetaSuffix: 'compared by CentreBetting on withdrawals, fair terms and licensing.',
    noResults: 'No casinos in this category yet.',
  },
  newsletter: {
    title: 'The CentreBetting weekly brief.',
    subtitle: 'Fresh reviews, offers worth a look and who moved up or down — once a week, nothing more.',
    placeholder: 'Email address',
    button: 'Subscribe',
    // Shown while the address is being checked. The subscribe request waits on
    // a live address-validation call, so the button has to say so rather than
    // just dimming for a second or two.
    checking: 'Checking…',
    // The spam line is NOT optional wording. This is a double opt-in list: an
    // unconfirmed subscriber never receives anything again, and the verify mail
    // is the single most likely message to be filtered — new sender, one link,
    // no history. Telling people where to look is the difference between a
    // signup and a dead row.
    success:
      'Nearly there — check your inbox and confirm your address to finish. '
      + 'If nothing arrives, it may be sitting in spam or junk.',
    // Shown when the API reports email_sent=false — the site is still
    // collecting addresses but its sending is switched off in the admin.
    // Promising an inbox (and a spam folder to search) for mail that will
    // never arrive is worse than not collecting the address at all.
    successNoEmail:
      'You’re on the list. We are not sending confirmation emails from this site at the moment.',
    error: 'That did not send. Please try again.',
  },
  footer: {
    // Short brand blurb in the footer's first column. The mockup gives that
    // column 1.6fr of a four-track grid — roughly 360px — so this runs to two
    // or three lines there by design, unlike the two-column siblings where the
    // same string had to stay on one.
    tagline:
      'Your central guide to online casinos, reviewed on one fair-play yardstick. We may earn a commission from links on this site; it never changes a review.',
    // Registered postal address, shown under the copyright line, as supplied
    // by the operator — never invented. Keep it identical to the site's "Registered address"
    // setting in the admin, which feeds the legal pages and the Organization
    // JSON-LD, and to the postal address in this site's email templates.
    // Supplied by the operator 2026-11-09. The postcode's space is a NO-BREAK
    // space ( ): on a phone the line would otherwise wrap between "CV5"
    // and "7HN", splitting one postcode over two lines.
    postalAddress: '56 Maple Grove, Coventry, CV5 7HN, United Kingdom',
    disclaimer:
      'Betting is for adults 18+ only and can cost real money. Decide your limit before you play, take breaks, and never bet to win back losses.',
  },
  errors: {
    notFound: 'Off the map — this page does not exist.',
    apiError: 'Could not load this content. Please try again in a moment.',
  },
  reviews: {
    heading: 'What Players Say',
    empty: 'No player reviews yet — tell others how this casino treated you.',
    formTitle: 'Share Your Experience',
    formIntro: 'Deposits, bonuses, withdrawals — what was it really like?',
    nameLabel: 'Your name',
    emailLabel: 'Email (optional, never published)',
    ratingLabel: 'Rating',
    titleLabel: 'Headline (optional)',
    bodyLabel: 'Your review',
    bodyPlaceholder: 'What went well, what did not, and did you get paid?',
    submit: 'Share Review',
    // Two outcomes, because the site can run pre- or post-moderation
    // (Sites -> Publish reviews immediately). The API reports which one
    // applied; promising the wrong one is a promise the page then breaks.
    success: 'Thanks — your review is now live. Scroll up to see it.',
    successPending: 'Thanks — your review has been submitted and will appear once approved.',
    error: 'That did not send. Please check the form and try again.',
    ratingSummary: (avg: number, total: number) =>
      `${avg.toFixed(1)} out of 5 from ${total} ${total === 1 ? 'review' : 'reviews'}`,
  },
  // Labels on the phone-only hide / show toggle above each chip list.
  collapse: {
    casinoCategories: 'Casino categories',
    bonusTypes: 'Bonus types',
  },
} as const
