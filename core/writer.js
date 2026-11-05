import { mkdirSync, statSync, writeFileSync } from 'fs';
import { dirname, join, normalize, resolve, sep } from 'path';

// Error thrown when a file already exists and --force is not set.
export class FileConflictError extends Error {
  constructor(paths) {
    super(`File(s) already exist. Use --force to overwrite: ${paths.join(', ')}`);
    this.name = 'FileConflictError';
    this.paths = paths;
  }
}

// Ensure a path does not escape the output directory (path traversal safety).
function isSafePath(outputDir, targetPath) {
  const outputDirResolved = resolve(normalize(outputDir));
  const targetResolved = resolve(normalize(join(outputDirResolved, targetPath)));
  return targetResolved.startsWith(outputDirResolved + sep) || targetResolved === outputDirResolved;
}

// Write generated files to disk.
//
// files: array of { path, content }
// options: { outputDir, force }
// Returns: array of written absolute file paths.
export function writeFiles(files, { outputDir = process.cwd(), force = false } = {}) {
  const written = [];
  const conflicts = [];

  for (const file of files) {
    if (!file.path || typeof file.content !== 'string') {
      throw new Error(`Invalid file entry: ${JSON.stringify(file)}`);
    }

    if (!isSafePath(outputDir, file.path)) {
      throw new Error(`Unsafe file path (traversal detected): ${file.path}`);
    }

    const fullPath = resolve(normalize(join(outputDir, file.path)));

    try {
      mkdirSync(dirname(fullPath), { recursive: true });
    } catch {
      // parent dir may already exist; ignore.
    }

    // Check for existing file conflict.
    try {
      statSync(fullPath);
      conflicts.push(file.path);
      continue;
    } catch {
      // file does not exist; safe to write.
    }

    writeFileSync(fullPath, file.content, 'utf8');
    written.push(fullPath);
  }

  if (conflicts.length > 0 && !force) {
    throw new FileConflictError(conflicts);
  }

  // If --force, overwrite the conflicting files.
  if (conflicts.length > 0 && force) {
    for (const file of files) {
      if (!conflicts.includes(file.path)) continue;
      const fullPath = resolve(normalize(join(outputDir, file.path)));
      writeFileSync(fullPath, file.content, 'utf8');
      written.push(fullPath);
    }
  }

  return written;
}

export default { writeFiles, FileConflictError };
