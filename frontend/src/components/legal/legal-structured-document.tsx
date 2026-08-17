import {
  LegalContentBlock,
  LegalDocumentContent,
  LegalContentSection,
  LegalContentSubsection,
} from "@/components/legal/legal-content-types";
import { LEGAL_COMPANY_ADDRESS } from "@/constants/legal";
import {
  LegalEmailLink,
  LegalInlineHeading,
  LegalList,
  LegalOrderedList,
  LegalParagraph,
  LegalSection,
  LegalSubsection,
} from "@/components/legal/legal-document";

function resolveParagraphText(text: string): string {
  if (text === "LEGAL_COMPANY_ADDRESS") {
    return LEGAL_COMPANY_ADDRESS;
  }
  return text;
}

function RenderBlocks({ blocks }: { blocks: LegalContentBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === "paragraph") {
          return (
            <LegalParagraph key={`p-${index}`}>
              {resolveParagraphText(block.text)}
            </LegalParagraph>
          );
        }
        if (block.kind === "list") {
          return <LegalList key={`ul-${index}`} items={block.items} />;
        }
        if (block.kind === "orderedList") {
          return <LegalOrderedList key={`ol-${index}`} items={block.items} />;
        }
        if (block.kind === "heading") {
          return (
            <LegalInlineHeading key={`heading-${index}`}>
              {block.text}
            </LegalInlineHeading>
          );
        }
        if (block.kind === "email") {
          return (
            <LegalParagraph key={`email-${index}`}>
              {block.label} <LegalEmailLink />
            </LegalParagraph>
          );
        }
      })}
    </>
  );
}

function RenderSubsection({ subsection }: { subsection: LegalContentSubsection }) {
  return (
    <LegalSubsection title={subsection.title}>
      <RenderBlocks blocks={subsection.blocks} />
    </LegalSubsection>
  );
}

function RenderSection({ section }: { section: LegalContentSection }) {
  return (
    <LegalSection title={section.title}>
      {section.blocks?.length ? <RenderBlocks blocks={section.blocks} /> : null}
      {section.subsections?.map((subsection) => (
        <RenderSubsection key={subsection.title} subsection={subsection} />
      ))}
    </LegalSection>
  );
}

export function LegalStructuredDocument({ content }: { content: LegalDocumentContent }) {
  return (
    <>
      <RenderBlocks blocks={content.intro} />
      {content.sections.map((section) => (
        <RenderSection key={section.title} section={section} />
      ))}
    </>
  );
}
