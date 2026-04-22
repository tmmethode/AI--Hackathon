declare module "word-extractor" {
  export default class WordExtractor {
    public extract(path: string): Promise<{ getBody(): string }>;
  }
}
