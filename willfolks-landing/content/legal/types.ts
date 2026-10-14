/** A paragraph, or a bulleted list. */
export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  /** Stable anchor id, shared across languages so links survive a switch. */
  id: string;
  title: string;
  body: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  summary: string;
  sections: LegalSection[];
}
