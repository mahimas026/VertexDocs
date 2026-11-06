import React from "react";

function renderInline(text: string): React.ReactNode {
  // Regex to match code blocks, bold, and italic
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={index} className="ai-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentListType: "ul" | "ol" | null = null;
  let listItems: React.ReactNode[] = [];

  const flushList = (keyPrefix: string) => {
    if (currentListType && listItems.length > 0) {
      if (currentListType === "ul") {
        elements.push(
          <ul key={`${keyPrefix}-ul`} className="ai-md-list">
            {listItems}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`${keyPrefix}-ol`} className="ai-md-ordered-list">
            {listItems}
          </ol>
        );
      }
      currentListType = null;
      listItems = [];
    }
  };

  const flushCodeBlock = (keyPrefix: string) => {
    if (codeBlockLines.length > 0) {
      elements.push(
        <pre key={`${keyPrefix}-pre`} className="ai-code-block">
          <code>{codeBlockLines.join("\n")}</code>
        </pre>
      );
      codeBlockLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code blocks
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock(`cb-${i}`);
        inCodeBlock = false;
      } else {
        flushList(`cb-list-${i}`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Blank lines
    if (!trimmed) {
      flushList(`blank-${i}`);
      continue;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      flushList(`h3-${i}`);
      elements.push(
        <h4 key={`h3-${i}`} className="ai-md-h4">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList(`h2-${i}`);
      elements.push(
        <h3 key={`h2-${i}`} className="ai-md-h3">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushList(`h1-${i}`);
      elements.push(
        <h2 key={`h1-${i}`} className="ai-md-h2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Unordered list items: -, *, •
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (currentListType && currentListType !== "ul") {
        flushList(`switch-ul-${i}`);
      }
      currentListType = "ul";
      listItems.push(
        <li key={`li-${i}`}>{renderInline(bulletMatch[1])}</li>
      );
      continue;
    }

    // Ordered list items: 1. , 2. , etc.
    const orderedMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (orderedMatch) {
      if (currentListType && currentListType !== "ol") {
        flushList(`switch-ol-${i}`);
      }
      currentListType = "ol";
      listItems.push(
        <li key={`oli-${i}`}>{renderInline(orderedMatch[1])}</li>
      );
      continue;
    }

    // Normal paragraph line
    flushList(`para-${i}`);
    elements.push(
      <p key={`p-${i}`} className="ai-md-p">
        {renderInline(trimmed)}
      </p>
    );
  }

  if (inCodeBlock) {
    flushCodeBlock("final-cb");
  }
  flushList("final-list");

  return <div className="ai-markdown-content">{elements}</div>;
}

