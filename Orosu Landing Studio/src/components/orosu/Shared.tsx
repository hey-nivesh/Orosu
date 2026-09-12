import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && node.classList.add("is-visible"),
      { threshold: 0.14 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={`eyebrow ${dark ? "text-dark-muted" : "text-muted-foreground"}`}>
      <span className="eyebrow-dot" />{children}
    </div>
  );
}

export function SectionHeading({ children, dark = false, centered = false }: { children: ReactNode; dark?: boolean; centered?: boolean }) {
  return <h2 className={`section-heading ${dark ? "text-ink-foreground" : "text-foreground"} ${centered ? "text-center" : ""}`}>{children}</h2>;
}

export function ArrowButton({ children, variant = "brand", href = "#product" }: { children: ReactNode; variant?: "brand" | "ink" | "soft"; href?: string }) {
  return (
    <Button asChild variant={variant} size="pill">
      <a href={href}>{children}<ArrowUpRight aria-hidden="true" /></a>
    </Button>
  );
}