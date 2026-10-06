"use client";

import { useEffect, useState } from "react";

interface LegalTocProps {
  label: string;
  items: { id: string; title: string }[];
}

/** Table of contents that highlights the section currently being read. */
export function LegalToc({ label, items }: LegalTocProps) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setCurrent(visible[0].target.id);
      },
      // A band near the top of the viewport decides which section is "current".
      { rootMargin: "-18% 0px -70% 0px" },
    );
    items.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="legal__toc mono" aria-label={label}>
      <p className="legal__toc-label">{label}</p>
      <ol>
        {items.map(({ id, title }, i) => (
          <li key={id}>
            <a href={`#${id}`} aria-current={current === id ? "location" : undefined}>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              {title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
