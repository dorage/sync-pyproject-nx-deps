import * as fs from 'fs';
import * as toml from 'toml';
import { PyProjectFile } from './scanner';

/**
 * Package name mapping from pyproject.toml name to Nx project name
 * @example
 * {
 *   "package-a": "python-package-a",
 *   "package-b": "python-package-b"
 * }
 */
export interface PackageMapping {
  [packageName: string]: string; // "package-a" -> "python-package-a"
}

/**
 * Builds a mapping table from pyproject.toml package names to Nx project names
 * Automatically handles both underscore and hyphen variants of package names
 *
 * @param pyprojects - Array of PyProjectFile objects from scanner
 * @returns PackageMapping object with package names as keys and Nx project names as values
 *
 * @example
 * ```typescript
 * const pyprojects = await scanPyProjectFiles('/root');
 * const mapping = buildPackageMapping(pyprojects);
 * // {
 * //   "package-a": "python-package-a",
 * //   "package_a": "python-package-a",  // auto-generated variant
 * //   "shared-model": "python-shared-model",
 * //   "shared_model": "python-shared-model"  // auto-generated variant
 * // }
 * ```
 */
export function buildPackageMapping(pyprojects: PyProjectFile[]): PackageMapping {
  const mapping: PackageMapping = {};

  for (const pyproject of pyprojects) {
    try {
      // 1. Read project.json to get Nx project name
      const projectJsonContent = fs.readFileSync(pyproject.projectJsonPath, 'utf-8');
      const projectJson = JSON.parse(projectJsonContent);
      const nxProjectName = projectJson.name;

      if (!nxProjectName || typeof nxProjectName !== 'string') {
        console.warn(`Warning: No valid name found in ${pyproject.projectJsonPath}`);
        continue;
      }

      // 2. Read and parse pyproject.toml to get package name
      const pyprojectContent = fs.readFileSync(pyproject.path, 'utf-8');
      const pyprojectData = toml.parse(pyprojectContent);
      const packageName = pyprojectData?.project?.name;

      if (!packageName || typeof packageName !== 'string') {
        console.warn(`Warning: No valid [project].name found in ${pyproject.path}`);
        continue;
      }

      // 3. Add original package name to mapping table
      mapping[packageName] = nxProjectName;

      // 4. Add normalized variants to handle underscore/hyphen interchangeably
      // This allows both "shared-model" and "shared_model" to map to the same Nx project
      const hyphenVariant = packageName.replace(/_/g, '-');
      const underscoreVariant = packageName.replace(/-/g, '_');

      if (hyphenVariant !== packageName) {
        mapping[hyphenVariant] = nxProjectName;
      }

      if (underscoreVariant !== packageName) {
        mapping[underscoreVariant] = nxProjectName;
      }

    } catch (error) {
      console.warn(`Warning: Failed to process ${pyproject.path}:`, error);
      continue;
    }
  }

  return mapping;
}
