/**
 * Module BE-1: OCR/Parsing
 * Extracts text from a given PDF buffer and cleans it up.
 * 
 * @param {Buffer | ArrayBuffer} fileBuffer 
 * @returns {Promise<string>} Cleaned text from the PDF
 */
async function extractTextFromPdfBuffer(fileBuffer) {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Use Uint8Array as expected by pdfjs
    const data = new Uint8Array(fileBuffer);
    const loadingTask = pdfjsLib.getDocument({ data });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    const pagesText = [];

    // Iterate through all pages
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Join all items on the page
        const pageString = textContent.items.map(item => item.str).join(' ');
        pagesText.push(pageString);
    }

    // Join pages with newlines
    const rawText = pagesText.join('\n');

    // Clean the text: collapse multiple spaces and tabs, but keep newlines intact contextually
    const cleanedText = rawText
        .replace(/[ \t]+/g, ' ')      // Collapse horizontal spaces
        .replace(/\n\s*\n/g, '\n\n')    // Collapse multiple blank lines
        .trim();

    return cleanedText;
}

module.exports = { extractTextFromPdfBuffer };
