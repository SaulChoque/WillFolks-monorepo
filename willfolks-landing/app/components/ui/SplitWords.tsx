import { Fragment } from "react";

interface SplitWordsProps {
  text: string;
  /** Words to render as an inverted tag. Matched case-insensitively. */
  highlight?: string[];
}

/**
 * Renders each word in its own mask so it can rise into place. The markup is
 * produced by React (not by mutating the DOM), so it survives re-renders such
 * as a language switch. Line breaks in `text` are honoured.
 */
export function SplitWords({ text, highlight = [] }: SplitWordsProps) {
  const marked = highlight.map((word) => word.toLowerCase());
  return (
    <>
      {text.split("\n").map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {line.split(" ").map((word, wordIndex) => {
            const bare = word.replace(/[.,!?¿¡]/g, "").toLowerCase();
            const isMarked = marked.includes(bare);
            return (
              <Fragment key={wordIndex}>
                <span className="w">
                  <span className={`w__in ${isMarked ? "w__in--hl" : ""}`}>{word}</span>
                </span>{" "}
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </>
  );
}
