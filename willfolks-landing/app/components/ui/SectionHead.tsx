interface SectionHeadProps {
  index: string;
  tag: string;
  meta?: string;
}

/** "— 02 [TAG] ........ (meta)" strip that opens every section. */
export function SectionHead({ index, tag, meta }: SectionHeadProps) {
  return (
    <header className="sec-head mono">
      <span className="sec-head__idx" aria-hidden="true">
        — {index}
      </span>
      <span className="tag">{tag}</span>
      <span className="sec-head__rule" aria-hidden="true" />
      {meta ? <span className="sec-head__meta">{meta}</span> : null}
    </header>
  );
}
