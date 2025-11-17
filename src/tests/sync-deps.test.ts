import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mock function: 단일 진입점으로 pyproject.toml을 파싱하고 project.json을 업데이트
 * 실제 구현은 나중에 진행
 */
async function syncPyprojectDeps(rootDir: string): Promise<void> {
  // TODO: 실제 구현
  // 1. rootDir에서 모든 pyproject.toml 찾기
  // 2. 각 pyproject.toml에서 [tool.uv.sources]의 workspace dependencies 추출
  // 3. 패키지명 -> Nx 프로젝트명 변환
  // 4. project.json의 implicitDependencies 업데이트
  throw new Error('Not implemented yet');
}

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

  it('should update package-a project.json with workspace dependency to package-c', async () => {
    // Given: package-a has workspace dependency on package-c in pyproject.toml
    const projectJsonPath = path.join(pythonDir, 'package-a', 'project.json');

    // Before: implicitDependencies is empty
    const beforeContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(beforeContent.implicitDependencies).toEqual([]);

    // When: sync dependencies
    await syncPyprojectDeps(pythonDir);

    // Then: implicitDependencies should include python-package-c
    const afterContent = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
    expect(afterContent.implicitDependencies).toEqual(['python-package-c']);
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

  it('should update package-c project.json with multiple workspace dependencies', async () => {
    // Given: package-c has workspace dependencies on package-b and package-c in pyproject.toml
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

    expect(packageAJson.implicitDependencies).toEqual(['python-package-c']);
    expect(packageBJson.implicitDependencies).toEqual([]);
    expect(packageCJson.implicitDependencies).toEqual(['python-package-b', 'python-package-c']);
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
