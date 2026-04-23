// Minimal PDF 1.4 generator for plain text reports. Intentionally scoped to
// ASCII/Latin-1 safe text — characters outside WinAnsi are transliterated
// before being embedded so the PDF viewer doesn't render garbled glyphs.

function transliterateToLatin1(value: string): string {
  return value
    .normalize("NFKD")
    // Smart quotes and dashes -> ASCII equivalents
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    // Drop any remaining characters outside printable Latin-1
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

function escapePdfText(value: string): string {
  return transliterateToLatin1(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(value: string, maxChars: number): string[] {
  const normalized = transliterateToLatin1(value);
  const words = normalized.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length > maxChars) {
      for (let index = 0; index < word.length; index += maxChars) {
        lines.push(word.slice(index, index + maxChars));
      }
      current = "";
      continue;
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}

function buildPages(
  lines: readonly string[],
  pageHeight: number,
  lineHeight: number,
  maxChars: number
): string[][] {
  const pages: string[][] = [[]];
  let currentY = pageHeight - 56;

  for (const line of lines) {
    const wrapped = wrapLine(line, maxChars);

    for (const segment of wrapped) {
      if (currentY < 52) {
        pages.push([]);
        currentY = pageHeight - 56;
      }

      pages[pages.length - 1].push(
        `1 0 0 1 50 ${currentY} Tm (${escapePdfText(segment)}) Tj`
      );
      currentY -= lineHeight;
    }
  }

  return pages;
}

// Because all of the content we emit is WinAnsi-safe (see transliterate
// above), byte length equals string length. Compute via TextEncoder so the
// implementation stays correct if the transliteration rules ever widen.
function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function createPdfFromLines(lines: readonly string[]): Blob {
  const pageWidth = 612;
  const pageHeight = 792;
  const lineHeight = 14;
  const pages = buildPages(lines, pageHeight, lineHeight, 95);

  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");
  objects.push(""); // placeholder for Pages object, filled in below.

  const fontObjectId = 3;
  objects.push(
    `${fontObjectId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj`
  );

  let nextObjectId = 4;

  for (const pageCommands of pages) {
    const content = [`BT /F1 10 Tf`, ...pageCommands, "ET"].join("\n");
    const contentId = nextObjectId++;
    const pageId = nextObjectId++;

    objects.push(
      `${contentId} 0 obj << /Length ${byteLength(content)} >> stream\n${content}\nendstream\nendobj`
    );
    objects.push(
      `${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R >> endobj`
    );

    pageObjectIds.push(pageId);
  }

  objects[1] = `2 0 obj << /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageObjectIds.length} >> endobj`;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const write = (value: string) => {
    const encoded = encoder.encode(value);
    chunks.push(encoded);
    offset += encoded.length;
  };

  write("%PDF-1.4\n");
  // Binary comment helps tools identify the file as binary-safe.
  write("%\xE2\xE3\xCF\xD3\n");

  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(offset);
    write(`${obj}\n`);
  }

  const xrefOffset = offset;
  write(`xref\n0 ${objects.length + 1}\n`);
  write("0000000000 65535 f \n");

  for (const entryOffset of offsets.slice(1)) {
    write(`${String(entryOffset).padStart(10, "0")} 00000 n \n`);
  }

  write(
    `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  const buffer = new Uint8Array(offset);
  let cursor = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, cursor);
    cursor += chunk.length;
  }

  return new Blob([buffer], { type: "application/pdf" });
}
