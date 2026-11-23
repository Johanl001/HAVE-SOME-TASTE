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

// Write generated files to disk using a two-phase atomic write pattern.
//
// files: array of { path, content }
// options: { outputDir, force }
// Returns: array of written absolute file paths.
//
// Phase 1 validates every path and detects all conflicts without writing any
// bytes. If conflicts exist and --force is not set, FileConflictError is thrown
// with zero bytes written, so the workspace is never left partially corrupted.
// Phase 2 creates directories and commits all files to disk.
export function writeFiles(files, { outputDir = process.cwd(), force = false } = {}) {
  // Phase 1: Validate ALL files before writing ANY bytes.
  const planned = [];
  const conflicts = [];

  for (const file of files) {
    if (!file.path || typeof file.content !== 'string') {
      throw new Error(`Invalid file entry: ${JSON.stringify(file)}`);
    }

    if (!isSafePath(outputDir, file.path)) {
      throw new Error(`Unsafe file path (traversal detected): ${file.path}`);
    }

    const fullPath = resolve(normalize(join(outputDir, file.path)));
    planned.push({ fullPath, content: file.content, relativePath: file.path });

    try {
      statSync(fullPath);
      conflicts.push(file.path);
    } catch {
      // File does not exist — safe to write.
    }
  }

  // Abort before ANY disk mutation if conflicts exist.
  if (conflicts.length > 0 && !force) {
    throw new FileConflictError(conflicts);
  }

  // Phase 2: Commit all files (conflicts are overwritten when --force is set).
  const written = [];
  for (const item of planned) {
    mkdirSync(dirname(item.fullPath), { recursive: true });
    writeFileSync(item.fullPath, item.content, 'utf8');
    written.push(item.fullPath);
  }

  return written;
}

export default { writeFiles, FileConflictError };
