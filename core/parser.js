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
    let filePath = match[1].trim();
    // Skip empty paths and a bare "File:" label with no actual path.
    if (!filePath || filePath.toLowerCase() === 'file:') continue;
    const content = match[2];

    // Check if the first line of content is a file comment like <!-- index.html --> or /* style.css */ or // app.js
    const firstLineMatch = content.trim().match(/^(?:<!--|\/\*|\/\/)\s*([a-zA-Z0-9_./\\-]+\.[a-zA-Z0-9]+)\s*(?:-->|\*\/)?/);
    if (firstLineMatch) {
      filePath = firstLineMatch[1];
    } else {
      // If no inner file comment, verify that the header looks like a real filename/path
      // (has an extension or contains a slash, and does not have spaces)
      const isPathLike = /^[a-zA-Z0-9_./\\-]+\.[a-zA-Z0-9]+$/.test(filePath) || filePath.includes('/') || filePath.includes('\\');
      if (!isPathLike) {
        continue;
      }
    }

    if (content.trim()) {
      files.push({ path: filePath, content });
    }
  }

  if (files.length > 0) return files;

  // Pattern 3: Any code block that starts with a file comment on line 1:
  // ```html\n<!-- index.html -->\n...``` or ```css\n/* style.css */\n...```
  const commentBlock = /```[\w-]*\r?\n\s*(?:<!--|\/\*|\/\/)\s*([a-zA-Z0-9_./\\-]+\.[a-zA-Z0-9]+)\s*(?:-->|\*\/)?\r?\n([\s\S]*?)```/g;
  while ((match = commentBlock.exec(llmText)) !== null) {
    const filePath = match[1].trim();
    const content = match[2];
    if (filePath && content.trim()) {
      files.push({ path: filePath, content });
    }
  }

  return files;
}
