declare module "mammoth" {
  export interface ExtractRawTextResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function extractRawText(input: { buffer: Buffer }): Promise<ExtractRawTextResult>;

  const mammoth: {
    extractRawText: typeof extractRawText;
  };

  export default mammoth;
}

declare module "pdf-parse" {
  export interface PDFParseResult {
    text: string;
    total: number;
    info?: Record<string, unknown>;
    metadata?: unknown;
  }

  export class PDFParse {
    constructor(options: { data: Buffer });
    getText(options?: Record<string, unknown>): Promise<PDFParseResult>;
    destroy(): Promise<void>;
  }
}
