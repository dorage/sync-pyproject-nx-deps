import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { updateProjectJson } from './updater';

describe('updateProjectJson', () => {
  const testDir = path.join(__dirname, 'test-fixtures-updater');
  const testProjectJsonPath = path.join(testDir, 'project.json');

  beforeEach(() => {
    // 테스트 디렉터리 생성
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // 테스트 디렉터리 삭제
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should update implicitDependencies when dependencies are different', () => {
    // Given: project.json with empty implicitDependencies
    const initialJson = {
      name: 'test-package',
      implicitDependencies: [],
    };
    fs.writeFileSync(testProjectJsonPath, JSON.stringify(initialJson, null, 2) + '\n', 'utf-8');

    // When: update with new dependencies
    const result = updateProjectJson(testProjectJsonPath, ['python-package-c']);

    // Then: should return true and update the file
    expect(result).toBe(true);
    const updatedJson = JSON.parse(fs.readFileSync(testProjectJsonPath, 'utf-8'));
    expect(updatedJson.implicitDependencies).toEqual(['python-package-c']);
  });

  it('should return false when dependencies are the same', () => {
    // Given: project.json with existing implicitDependencies
    const initialJson = {
      name: 'test-package',
      implicitDependencies: ['python-package-c'],
    };
    fs.writeFileSync(testProjectJsonPath, JSON.stringify(initialJson, null, 2) + '\n', 'utf-8');

    // When: update with same dependencies
    const result = updateProjectJson(testProjectJsonPath, ['python-package-c']);

    // Then: should return false and not modify the file
    expect(result).toBe(false);
    const updatedJson = JSON.parse(fs.readFileSync(testProjectJsonPath, 'utf-8'));
    expect(updatedJson.implicitDependencies).toEqual(['python-package-c']);
  });

  it('should sort dependencies alphabetically', () => {
    // Given: project.json with empty implicitDependencies
    const initialJson = {
      name: 'test-package',
      implicitDependencies: [],
    };
    fs.writeFileSync(testProjectJsonPath, JSON.stringify(initialJson, null, 2) + '\n', 'utf-8');

    // When: update with unsorted dependencies
    const result = updateProjectJson(testProjectJsonPath, ['python-package-c', 'python-package-a', 'python-package-b']);

    // Then: should return true and sort dependencies
    expect(result).toBe(true);
    const updatedJson = JSON.parse(fs.readFileSync(testProjectJsonPath, 'utf-8'));
    expect(updatedJson.implicitDependencies).toEqual(['python-package-a', 'python-package-b', 'python-package-c']);
  });

  it('should clear dependencies when empty array is provided', () => {
    // Given: project.json with existing dependencies
    const initialJson = {
      name: 'test-package',
      implicitDependencies: ['python-package-c'],
    };
    fs.writeFileSync(testProjectJsonPath, JSON.stringify(initialJson, null, 2) + '\n', 'utf-8');

    // When: update with empty array
    const result = updateProjectJson(testProjectJsonPath, []);

    // Then: should return true and clear dependencies
    expect(result).toBe(true);
    const updatedJson = JSON.parse(fs.readFileSync(testProjectJsonPath, 'utf-8'));
    expect(updatedJson.implicitDependencies).toEqual([]);
  });

  it('should maintain JSON formatting with 2-space indentation and trailing newline', () => {
    // Given: project.json
    const initialJson = {
      name: 'test-package',
      implicitDependencies: [],
    };
    fs.writeFileSync(testProjectJsonPath, JSON.stringify(initialJson, null, 2) + '\n', 'utf-8');

    // When: update dependencies
    updateProjectJson(testProjectJsonPath, ['python-package-c']);

    // Then: should maintain formatting
    const fileContent = fs.readFileSync(testProjectJsonPath, 'utf-8');
    expect(fileContent).toContain('  "name"'); // 2-space indentation
    expect(fileContent.endsWith('\n')).toBe(true); // trailing newline
  });

  it('should handle project.json without existing implicitDependencies field', () => {
    // Given: project.json without implicitDependencies field
    const initialJson = {
      name: 'test-package',
    };
    fs.writeFileSync(testProjectJsonPath, JSON.stringify(initialJson, null, 2) + '\n', 'utf-8');

    // When: update with dependencies
    const result = updateProjectJson(testProjectJsonPath, ['python-package-c']);

    // Then: should return true and add implicitDependencies field
    expect(result).toBe(true);
    const updatedJson = JSON.parse(fs.readFileSync(testProjectJsonPath, 'utf-8'));
    expect(updatedJson.implicitDependencies).toEqual(['python-package-c']);
  });
});
