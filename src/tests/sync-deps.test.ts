import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { syncPyprojectDeps } from '../lib/sync';

describe('syncPyprojectDeps', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const pythonDir = path.join(fixturesDir, 'python');

  beforeEach(() => {
    // reference/ 디렉터리를 test fixtures로 복사
    const projectRoot = process.cwd();
    const referenceDir = path.join(projectRoot, 'reference');

    // 기존 fixtures 디렉터리가 있다면 삭제
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }

    // reference/python을 fixtures/python으로 복사
    fs.mkdirSync(fixturesDir, { recursive: true });
    copyDirectory(path.join(referenceDir, 'python'), pythonDir);
  });

  afterEach(() => {
    // fixtures 디렉터리 삭제
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  it('should update package-a project.json with workspace dependencies to package-b and package-c', async () => {
    // Given: package-a has workspace dependencies on package-b and package-c in pyproject.toml
    const projectJsonPath = path.join(pythonDir, 'package-a', 'project.json');

    // Before: implicitDependencies is empty
    const beforeContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(beforeContent.implicitDependencies).toEqual([]);

    // When: sync dependencies
    await syncPyprojectDeps(pythonDir);

    // Then: implicitDependencies should include python-package-b and python-package-c (sorted)
    const afterContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(afterContent.implicitDependencies).toEqual(['python-package-b', 'python-package-c']);
  });

  it('should clear package-b project.json as it has no workspace dependencies', async () => {
    // Given: package-b has no workspace dependencies
    const projectJsonPath = path.join(pythonDir, 'package-b', 'project.json');

    // Before: implicitDependencies has incorrect value
    const beforeContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(beforeContent.implicitDependencies).toEqual(['not-exist-module']);

    // When: sync dependencies
    await syncPyprojectDeps(pythonDir);

    // Then: implicitDependencies should be empty
    const afterContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(afterContent.implicitDependencies).toEqual([]);
  });

  it('should update package-c project.json with multiple workspace dependencies including self-reference', async () => {
    // Given: package-c has workspace dependencies on package-b and package-c (self-reference) in pyproject.toml
    const projectJsonPath = path.join(pythonDir, 'package-c', 'project.json');

    // Before: implicitDependencies has incorrect value
    const beforeContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(beforeContent.implicitDependencies).toEqual(['not-exist-module']);

    // When: sync dependencies
    await syncPyprojectDeps(pythonDir);

    // Then: implicitDependencies should include both python-package-b and python-package-c (sorted)
    const afterContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(afterContent.implicitDependencies).toEqual(['python-package-b', 'python-package-c']);
  });

  it('should update package-d project.json with quoted dependency names', async () => {
    // Given: package-d has workspace dependencies with quoted names ("quoted_package_name")
    const projectJsonPath = path.join(pythonDir, 'package-d', 'project.json');

    // Before: implicitDependencies has incorrect value
    const beforeContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(beforeContent.implicitDependencies).toEqual(['not-exist-module']);

    // When: sync dependencies
    await syncPyprojectDeps(pythonDir);

    // Then: implicitDependencies should include python-package-a and python-quoted_package_name (sorted)
    const afterContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(afterContent.implicitDependencies).toEqual(['python-package-a', 'python-quoted_package_name']);
  });

  it('should update package-f with dependency when package name differs from directory name', async () => {
    // Given: package-f depends on package-e, but directory is named package-ee
    // package-ee/pyproject.toml has name="package-e" and project.json has name="python-package-e"
    const packageFJsonPath = path.join(pythonDir, 'package-f', 'project.json');
    const packageEJsonPath = path.join(pythonDir, 'package-ee', 'project.json');

    // Before: implicitDependencies has incorrect value
    const beforeFContent = JSON.parse(fs.readFileSync(packageFJsonPath, 'utf-8'));
    const beforeEContent = JSON.parse(fs.readFileSync(packageEJsonPath, 'utf-8'));
    expect(beforeFContent.implicitDependencies).toEqual(['not-exist-module']);
    expect(beforeEContent.implicitDependencies).toEqual(['not-exist-module']);

    // When: sync dependencies
    await syncPyprojectDeps(pythonDir);

    // Then: package-f should correctly resolve package-e to python-package-e
    const afterFContent = JSON.parse(fs.readFileSync(packageFJsonPath, 'utf-8'));
    expect(afterFContent.implicitDependencies).toEqual(['python-package-e']);

    // And: package-e (in package-ee directory) should have its dependencies synced
    const afterEContent = JSON.parse(fs.readFileSync(packageEJsonPath, 'utf-8'));
    expect(afterEContent.implicitDependencies).toEqual(['python-package-a', 'python-quoted_package_name']);
  });

  it('should update all packages correctly in one run', async () => {
    // When: sync all dependencies
    await syncPyprojectDeps(pythonDir);

    // Then: all project.json files should be updated correctly
    const packageAJson = JSON.parse(
      fs.readFileSync(path.join(pythonDir, 'package-a', 'project.json'), 'utf-8')
    );
    const packageBJson = JSON.parse(
      fs.readFileSync(path.join(pythonDir, 'package-b', 'project.json'), 'utf-8')
    );
    const packageCJson = JSON.parse(
      fs.readFileSync(path.join(pythonDir, 'package-c', 'project.json'), 'utf-8')
    );
    const packageDJson = JSON.parse(
      fs.readFileSync(path.join(pythonDir, 'package-d', 'project.json'), 'utf-8')
    );
    const packageEJson = JSON.parse(
      fs.readFileSync(path.join(pythonDir, 'package-ee', 'project.json'), 'utf-8')
    );
    const packageFJson = JSON.parse(
      fs.readFileSync(path.join(pythonDir, 'package-f', 'project.json'), 'utf-8')
    );

    expect(packageAJson.implicitDependencies).toEqual(['python-package-b', 'python-package-c']);
    expect(packageBJson.implicitDependencies).toEqual([]);
    expect(packageCJson.implicitDependencies).toEqual(['python-package-b', 'python-package-c']);
    expect(packageDJson.implicitDependencies).toEqual(['python-package-a', 'python-quoted_package_name']);
    expect(packageEJson.implicitDependencies).toEqual(['python-package-a', 'python-quoted_package_name']);
    expect(packageFJson.implicitDependencies).toEqual(['python-package-e']);
  });
});

/**
 * Helper function: 디렉터리 재귀적 복사
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
