
const footerLinks = [
  { label: "The World", href: "#world" },
  { label: "Pathways", href: "#pathways" },
  { label: "I Was Here", href: "#characters" },
  { label: "Tarot Reading", href: "#factions" },
];

function Footer() {
  return (
    
    <footer className="relative bg-void border-t border-gold-dim/20 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Ornate divider */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="w-44 h-px bg-gold-dim/50" />
          <span className="text-gold text-xl">✦</span>
          <div className="w-44 h-px bg-gold-dim/50" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-16">
          {/* Column 1: Brand */}
          <div>
            <h3 className="font-display text-gold text-xl mb-3">LOTM</h3>
            <p className="font-heading text-parchment/70 text-sm leading-relaxed">
              A fan tribute to the world of Lord of the Mysteries — where fog
              conceals both salvation and ruin.
            </p>
          </div>

          {/* Column 2: Navigate */}
          <div>
            <h4 className="font-heading text-gold text-xs tracking-[0.2em] uppercase mb-4">
              Navigate
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-heading text-parchment/70 text-sm hover:text-gold transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Disclaimer */}
          <div>
            <h4 className="font-heading text-gold text-xs tracking-[0.2em] uppercase mb-4">
              A Note
            </h4>
            <p className="font-heading text-parchment/70 text-sm leading-relaxed">
              Lord of the Mysteries and all related characters belong to their
              original author, Cuttlefish That Loves Diving. This is an
              unofficial fan project made with reverence for the source
              material.
            </p>
          </div>
        </div>

        {/* Bottom line */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-gold-dim/10">
  <div className="flex items-center gap-4">
    <p className="font-heading text-parchment/70 text-base sm:text-xs tracking-[0.10em] ">
      © {new Date().getFullYear()} Created by Nazat
    </p>

    {/* Social logos */}
    <div className="flex items-center gap-3">
      <a
        href="https://www.instagram.com/nxzxt._?igsh=eDVzZGphOGg1Z2sz"
        target="_blank"
        rel="noopener noreferrer"
        className="opacity-40 hover:opacity-100 transition-opacity duration-300"
        aria-label="Instagram"
      >
        <img src="/images/icons/instagram.svg" alt="Instagram" className="w-10 h-10 sm:w-5 sm:h-5" loading="lazy"/>
      </a>
      <a
        href="mailto:mnajat0508@gmail.com"
        className="opacity-40 hover:opacity-100 transition-opacity duration-300"
        aria-label="Email"
      >
        <img src="/images/icons/gmail.svg" alt="Email" className="w-10 h-10 sm:w-5 sm:h-5" loading="lazy"/>
      </a>
    </div>
  </div>

  <p className="font-heading italic text-gold text-base">
    "It was a happy smile"
  </p>
</div>
      </div>
    </footer>
  );
}

export default Footer;