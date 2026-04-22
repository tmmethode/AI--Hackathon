function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(value: string, maxChars: number) {
  const words = value.split(/\s+/).filter(Boolean);
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

function buildPages(lines: string[], pageHeight: number, lineHeight: number, maxChars: number) {
  const pages: string[][] = [[]];
  let currentY = pageHeight - 56;

  for (const line of lines) {
    const wrapped = wrapLine(line, maxChars);

    for (const segment of wrapped) {
      if (currentY < 52) {
        pages.push([]);
        currentY = pageHeight - 56;
      }

      pages[pages.length - 1].push(`${50} ${currentY} Td (${escapePdfText(segment)}) Tj`);
      currentY -= lineHeight;
    }
  }

  return pages;
}

export function createPdfFromLines(lines: string[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const lineHeight = 14;
  const pages = buildPages(lines, pageHeight, lineHeight, 95);

  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");
  objects.push("2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj");

  const fontObjectId = 3;
  objects.push(`${fontObjectId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  let nextObjectId = 4;

  for (const pageCommands of pages) {
    const content = [`BT /F1 10 Tf`, ...pageCommands, "ET"].join("\n");
    const contentId = nextObjectId++;
    const pageId = nextObjectId++;

    objects.push(`${contentId} 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`);
    objects.push(
      `${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R >> endobj`
    );

    pageObjectIds.push(pageId);
  }

  objects[1] = `2 0 obj << /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >> endobj`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
}
