/** Extracts the embedded text layer from a PDF, entirely in the browser (no server, no AI).
 * Returns "" for a scanned/image-only PDF with no text layer — there's nothing to extract.
 *
 * pdfjs-dist is a large library, so it's dynamically imported here rather than at module
 * scope — it only loads (as a separate chunk) when someone actually uploads a file, instead
 * of adding to every visitor's initial page weight. */
export async function extractPdfText(file: File): Promise<string> {
  const [pdfjsLib, { default: pdfWorkerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(pageText);
  }
  return pageTexts.join("\n");
}
