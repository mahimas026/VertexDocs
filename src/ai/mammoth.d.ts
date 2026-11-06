declare module "mammoth" {
  export interface RawTextResult {
    value: string;
    messages: unknown[];
  }

  export function extractRawText(input: {
    arrayBuffer?: ArrayBuffer;
    buffer?: unknown;
    path?: string;
  }): Promise<RawTextResult>;

  export function convertToHtml(input: {
    arrayBuffer?: ArrayBuffer;
    buffer?: unknown;
    path?: string;
  }): Promise<{ value: string; messages: unknown[] }>;

  const mammoth: {
    extractRawText: typeof extractRawText;
    convertToHtml: typeof convertToHtml;
  };

  export default mammoth;
}

