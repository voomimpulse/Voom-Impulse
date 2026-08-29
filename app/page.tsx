export default function Accueil() {
  return (
    <div>
      <header className="px-5 py-4 flex items-center justify-between">
        <img src="/logo.png" alt="Voom Impulse" className="h-10 w-auto" />
        <a href="/login" className="border border-ardoise text-ardoise text-sm font-medium px-4 py-1.5 rounded-full">
          Connexion
        </a>
      </header>

      <section className="relative h-72 overflow-hidden">
        <img src="/cover.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10" />
        <div className="relative px-5 pt-4 max-w-[68%]">
          <h1 className="font-display text-2xl leading-snug text-encre font-semibold">
            Des commerciaux formés, suivis et prêts pour votre marque.
          </h1>
          <p className="mt-3 text-sm text-encre/75 leading-relaxed">
            Voom Impulse accompagne les entreprises dans le recrutement et la gestion de leurs
            commerciaux, tout en proposant aux professionnels des missions adaptées à leur profil.
          </p>
        </div>
        <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 400 40" preserveAspectRatio="none">
          <path d="M0,20 C100,40 300,0 400,20 L400,40 L0,40 Z" fill="#F0A22E" opacity="0.9" />
          <path d="M0,28 C120,45 280,10 400,28 L400,40 L0,40 Z" fill="#123A5C" />
        </svg>
      </section>

      <main className="px-5 py-6 space-y-4 bg-white">
        <a href="/espace-entreprise" className="block bg-encre rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white font-display text-xl leading-tight">ESPACE ENTREPRISE</p>
              <p className="text-ocre text-sm font-medium mt-1">Créez votre compte entreprise</p>
            </div>
            <span className="text-white text-xl shrink-0">›</span>
          </div>
          <p className="text-white/80 text-xs mt-4">
            Commerciaux qualifiés • Gestion de votre prospection • Remplacement assuré
          </p>
        </a>

        <a href="/espace-commercial" className="block bg-ocre rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white font-display text-xl leading-tight">ESPACE COMMERCIAL</p>
              <p className="text-encre text-sm font-medium mt-1">Créez votre profil</p>
            </div>
            <span className="text-white text-xl shrink-0">›</span>
          </div>
          <p className="text-white/85 text-xs mt-4">
            Mission terrain • Événementiel • Digital • Télévente — Suivi de vos performances
          </p>
        </a>
      </main>

      <footer className="px-5 py-6 text-xs text-ardoise/40 bg-white">Voom Impulse — Abidjan</footer>
    </div>
  );
}
