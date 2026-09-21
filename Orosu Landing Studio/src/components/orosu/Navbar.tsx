import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logoAsset from "@/assets/orosu-logo.png.asset.json";
import { Button } from "@/components/ui/button";

const nav = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Product");
  useEffect(() => {
    const sections = nav.map(({ href }) => document.querySelector(href)).filter(Boolean) as Element[];
    const observer = new IntersectionObserver((entries) => {
      const current = entries.find((entry) => entry.isIntersecting);
      const label = nav.find(({ href }) => href === `#${current?.target.id}`)?.label;
      if (label) setActive(label);
    }, { rootMargin: "-30% 0px -60%" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="nav-shell">
      <nav className="nav-pill" aria-label="Primary navigation">
        <a href="#top" className="brand-link" aria-label="Orosu home">
          <img src={logoAsset.url} alt="" className="brand-mark" /><span>orosu</span>
        </a>
        <div className="nav-links">
          {nav.map(({ label, href }) => <a key={label} className={active === label ? "active" : ""} href={href}>{label}</a>)}
        </div>
        <div className="nav-actions">
          <a href="https://orosu-72g3.vercel.app" className="login-link">Log in</a>
          <Button asChild variant="brand" size="sm"><a href="https://orosu-72g3.vercel.app">Get Started</a></Button>
          <Button variant="ghost" size="icon" className="menu-trigger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        {nav.map(({ label, href }) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}<span>↗</span></a>)}
        <a href="#footer" onClick={() => setOpen(false)}>Log in<span>↗</span></a>
      </div>
    </header>
  );
}