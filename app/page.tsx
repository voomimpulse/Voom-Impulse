function MarquePulse() {
  return (
    <svg width="96" height="26" viewBox="0 0 72 20" fill="none" aria-hidden="true">
      <path
        d="M0 10 H20 L26 2 L32 18 L38 6 L42 10 H72"
        stroke="#C8963E"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Accueil() {
  return (
    <div>
      <header className="px-8 py-6 flex items-center justify-between border-b border-ardoise/10">
        <div className="flex items-center gap-3">
          <MarquePulse />
          <span className="font-display text-lg text-encre">Voom Impulse</span>
        </div>
      </header>

      <section className="px-8 py-20 max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-ocre mb-4">Marketing opérationnel</p>
        <h1 className="font-display text-4xl md:text-5xl leading-tight text-encre">
          Des commerciaux formés, suivis, et prêts à représenter votre marque.
        </h1>
        <p className="mt-6 text-ardoise/70 text-lg leading-relaxed">
          Voom Impulse recrute, forme et déploie des commerciaux sur le terrain — en mise à
          disposition pour renforcer vos équipes, ou en gestion complète de votre prospection,
          du recrutement jusqu'au résultat.
        </p>
      </section>

      <section className="px-8 pb-20 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        <div className="border border-ardoise/10 bg-white rounded-sm p-8">
          <p className="text-xs uppercase tracking-wide text-ardoise/50">Pour les entreprises</p>
          <h2 className="font-display text-2xl text-encre mt-2">Renforcez votre force de vente</h2>
          <ul className="mt-5 space-y-2 text-sm text-ardoise/70">
            <li>Mise à disposition de commerciaux qualifiés, suivis via tableau de bord</li>
            <li>Ou prise en charge complète de votre prospection commerciale</li>
            <li>Remplacement assuré en cas d'absence</li>
          </ul>
          <a href="mailto:contact@voomimpulse.com" className="inline-block mt-6 bg-encre text-ivoire text-sm px-5 py-2.5 rounded-sm hover:bg-ardoise transition-colors">
            Discuter de vos besoins
          </a>
        </div>

        <div className="border border-ardoise/10 bg-white rounded-sm p-8">
          <p className="text-xs uppercase tracking-wide text-ardoise/50">Pour les commerciaux</p>
          <h2 className="font-display text-2xl text-encre mt-2">Rejoignez le vivier</h2>
          <ul className="mt-5 space-y-2 text-sm text-ardoise/70">
            <li>Missions terrain, événementiel, promotion, digital, télévente</li>
            <li>Suivi de vos performances et de votre progression</li>
            <li>Plusieurs types de contrats selon la mission</li>
          </ul>
          <a href="mailto:contact@voomimpulse.com" className="inline-block mt-6 border border-ocre text-ocre text-sm px-5 py-2.5 rounded-sm hover:bg-ocre hover:text-ivoire transition-colors">
            Postuler
          </a>
        </div>
      </section>

      <footer className="px-8 py-8 border-t border-ardoise/10 text-xs text-ardoise/40">
        Voom Impulse — Abidjan, Côte d'Ivoire
      </footer>
    </div>
  );
}
