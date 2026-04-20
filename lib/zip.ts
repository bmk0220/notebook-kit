import JSZip from 'jszip';

interface MarkdownFile {
  title: string;
  content: string;
}

/**
 * Creates a ZIP file containing markdown files.
 * @param files Array of MarkdownFile objects
 * @returns Promise<Uint8Array> The ZIP file as a Uint8Array
 */
export async function createNotebookZip(files: MarkdownFile[]): Promise<Uint8Array> {
  const zip = new JSZip();

  files.forEach((file) => {
    // Sanitize filename: replace spaces with underscores and remove non-alphanumeric chars
    const fileName = `${file.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.md`;
    zip.file(fileName, file.content);
  });

  return await zip.generateAsync({ type: 'uint8array' });
}
