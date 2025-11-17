import { glob } from 'glob';
import * as path from 'path';

export interface PyProjectFile {
  path: string;           // python/package-a/pyproject.toml
  directory: string;      // python/package-a
  projectJsonPath: string; // python/package-a/project.json
  packageName: string;    // package-a
}

/**
 * Scans for all pyproject.toml files in the given root directory
 * @param rootDir - The absolute path of the root directory to scan
 * @returns Array of PyProjectFile objects
 */
export async function scanPyProjectFiles(rootDir: string): Promise<PyProjectFile[]> {
  // Find all pyproject.toml files, excluding node_modules and .venv
  const pattern = '**/pyproject.toml';
  const pyprojectPaths = await glob(pattern, {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/__pycache__/**']
  });

  // Transform each path into a PyProjectFile object
  const pyProjectFiles: PyProjectFile[] = pyprojectPaths.map((pyprojectPath) => {
    const directory = path.dirname(pyprojectPath);
    const packageName = path.basename(directory);
    const projectJsonPath = path.join(directory, 'project.json');

    return {
      path: pyprojectPath,
      directory,
      projectJsonPath,
      packageName
    };
  });

  return pyProjectFiles;
}
