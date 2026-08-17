export type LegalContentBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "orderedList"; items: string[] }
  | { kind: "heading"; text: string }
  | { kind: "email"; label: string };

export type LegalDocumentMetadata = {
  operatedBy: string;
  registeredBusinessAddress: string;
  effectiveDate: string;
  lastUpdated: string;
};

export type LegalContentSubsection = {
  title: string;
  blocks: LegalContentBlock[];
};

export type LegalContentSection = {
  title: string;
  blocks?: LegalContentBlock[];
  subsections?: LegalContentSubsection[];
};

export type LegalDocumentContent = {
  title: string;
  metadata?: LegalDocumentMetadata;
  intro: LegalContentBlock[];
  sections: LegalContentSection[];
};
