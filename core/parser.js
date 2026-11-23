// core/parser.js — Extract file blocks from LLM output

/**
 * Parse LLM-generated text to extract code blocks with file paths.
 *
 * Supports formats like:
 *   ```html file=index.html
 *   ```html:index.html
 *   ### File: src/App.jsx
 *   ### src/App.jsx
 *
 * Returns array of { path, content } or empty array if no parseable files found.
 */
export function extractFilesFromLLM(llmText) {
  const files = [];

  // Pattern 1: ```lang:filepath or ```lang file=filepath
  const annotatedBlock = /```[\w-]*(?:[:]\s*|\s+file=)([^\n\r]+)\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = annotatedBlock.exec(llmText)) !== null) {
    const filePath = match[1].trim();
    const content = match[2];
    if (filePath && content.trim()) {
      files.push({ path: filePath, content });
    }
  }

  if (files.length > 0) return files;

  // Pattern 2: ### File: filepath followed by a code block
  const headerBlock = /###?\s+(?:File:\s*)?([^\n\r]+)\r?\n\s*```[\w-]*\r?\n([\s\S]*?)```/g;
  while ((match = headerBlock.exec(llmText)) !== null) {
    const filePath = match[1].trim();
    const content = match[2];
    if (filePath && content.trim()) {
      files.push({ path: filePath, content });
    }
  }

  return files;
}
