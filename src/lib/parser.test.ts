import { describe, it, expect } from 'vitest';
import { extractWorkspaceDependencies } from './parser';
import * as path from 'path';

describe('extractWorkspaceDependencies', () => {
  const projectRoot = process.cwd();
  const referenceDir = path.join(projectRoot, 'reference', 'python');

  it('should extract workspace dependencies from package-a', () => {
    const pyprojectPath = path.join(referenceDir, 'package-a', 'pyproject.toml');
    const deps = extractWorkspaceDependencies(pyprojectPath);

    // package-c가 workspace = true로 설정되어 있음
    expect(deps).toEqual(['package-c']);
    expect(deps).toHaveLength(1);
  });

  it('should return empty array for package-b (no workspace dependencies)', () => {
    const pyprojectPath = path.join(referenceDir, 'package-b', 'pyproject.toml');
    const deps = extractWorkspaceDependencies(pyprojectPath);

    expect(deps).toEqual([]);
  });

  it('should extract workspace dependencies from package-c', () => {
    const pyprojectPath = path.join(referenceDir, 'package-c', 'pyproject.toml');
    const deps = extractWorkspaceDependencies(pyprojectPath);

    // package-b와 package-c가 workspace = true로 설정되어 있음
    expect(deps).toEqual(expect.arrayContaining(['package-b', 'package-c']));
    expect(deps).toHaveLength(2);
  });

  it('should handle pyproject.toml without [tool.uv.sources] section', () => {
    const pyprojectPath = path.join(referenceDir, 'package-b', 'pyproject.toml');
    const deps = extractWorkspaceDependencies(pyprojectPath);

    expect(deps).toEqual([]);
  });

  it('should extract workspace dependencies from package-d (with quoted dependency names)', () => {
    const pyprojectPath = path.join(referenceDir, 'package-d', 'pyproject.toml');
    const deps = extractWorkspaceDependencies(pyprojectPath);

    // package-a와 "quoted_package_name"(큰따옴표로 래핑됨)가 workspace = true로 설정되어 있음
    expect(deps).toEqual(expect.arrayContaining(['package-a', 'quoted_package_name']));
    expect(deps).toHaveLength(2);
  });
});
