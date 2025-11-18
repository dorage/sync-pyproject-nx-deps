import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildPackageMapping } from './mapper';
import { PyProjectFile } from './scanner';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('buildPackageMapping', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mapper-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should build mapping for packages with hyphenated names', () => {
    // Create test files
    const packageDir = path.join(tempDir, 'package-a');
    fs.mkdirSync(packageDir, { recursive: true });

    fs.writeFileSync(
      path.join(packageDir, 'pyproject.toml'),
      '[project]\nname = "package-a"'
    );
    fs.writeFileSync(
      path.join(packageDir, 'project.json'),
      '{"name": "python-package-a"}'
    );

    const pyprojects: PyProjectFile[] = [
      {
        path: path.join(packageDir, 'pyproject.toml'),
        directory: packageDir,
        projectJsonPath: path.join(packageDir, 'project.json'),
        packageName: 'package-a',
      },
    ];

    const mapping = buildPackageMapping(pyprojects);

    // Should create mapping for both hyphen and underscore variants
    expect(mapping['package-a']).toBe('python-package-a');
    expect(mapping['package_a']).toBe('python-package-a');
  });

  it('should build mapping for packages with underscore names', () => {
    // Create test files
    const packageDir = path.join(tempDir, 'shared_model');
    fs.mkdirSync(packageDir, { recursive: true });

    fs.writeFileSync(
      path.join(packageDir, 'pyproject.toml'),
      '[project]\nname = "shared_model"'
    );
    fs.writeFileSync(
      path.join(packageDir, 'project.json'),
      '{"name": "python-shared-model"}'
    );

    const pyprojects: PyProjectFile[] = [
      {
        path: path.join(packageDir, 'pyproject.toml'),
        directory: packageDir,
        projectJsonPath: path.join(packageDir, 'project.json'),
        packageName: 'shared_model',
      },
    ];

    const mapping = buildPackageMapping(pyprojects);

    // Should create mapping for both hyphen and underscore variants
    expect(mapping['shared_model']).toBe('python-shared-model');
    expect(mapping['shared-model']).toBe('python-shared-model');
  });

  it('should handle multiple packages with mixed naming conventions', () => {
    // Create package-a with hyphen
    const packageADir = path.join(tempDir, 'package-a');
    fs.mkdirSync(packageADir, { recursive: true });
    fs.writeFileSync(
      path.join(packageADir, 'pyproject.toml'),
      '[project]\nname = "package-a"'
    );
    fs.writeFileSync(
      path.join(packageADir, 'project.json'),
      '{"name": "python-package-a"}'
    );

    // Create shared_model with underscore
    const sharedModelDir = path.join(tempDir, 'shared_model');
    fs.mkdirSync(sharedModelDir, { recursive: true });
    fs.writeFileSync(
      path.join(sharedModelDir, 'pyproject.toml'),
      '[project]\nname = "shared_model"'
    );
    fs.writeFileSync(
      path.join(sharedModelDir, 'project.json'),
      '{"name": "python-shared-model"}'
    );

    const pyprojects: PyProjectFile[] = [
      {
        path: path.join(packageADir, 'pyproject.toml'),
        directory: packageADir,
        projectJsonPath: path.join(packageADir, 'project.json'),
        packageName: 'package-a',
      },
      {
        path: path.join(sharedModelDir, 'pyproject.toml'),
        directory: sharedModelDir,
        projectJsonPath: path.join(sharedModelDir, 'project.json'),
        packageName: 'shared_model',
      },
    ];

    const mapping = buildPackageMapping(pyprojects);

    // Verify all variants are mapped
    expect(mapping['package-a']).toBe('python-package-a');
    expect(mapping['package_a']).toBe('python-package-a');
    expect(mapping['shared_model']).toBe('python-shared-model');
    expect(mapping['shared-model']).toBe('python-shared-model');
  });

  it('should skip packages without valid project.json name', () => {
    const packageDir = path.join(tempDir, 'invalid-package');
    fs.mkdirSync(packageDir, { recursive: true });

    fs.writeFileSync(
      path.join(packageDir, 'pyproject.toml'),
      '[project]\nname = "invalid-package"'
    );
    fs.writeFileSync(path.join(packageDir, 'project.json'), '{}'); // No name field

    const pyprojects: PyProjectFile[] = [
      {
        path: path.join(packageDir, 'pyproject.toml'),
        directory: packageDir,
        projectJsonPath: path.join(packageDir, 'project.json'),
        packageName: 'invalid-package',
      },
    ];

    const mapping = buildPackageMapping(pyprojects);

    expect(mapping).toEqual({});
  });

  it('should skip packages without valid pyproject.toml name', () => {
    const packageDir = path.join(tempDir, 'invalid-package');
    fs.mkdirSync(packageDir, { recursive: true });

    fs.writeFileSync(path.join(packageDir, 'pyproject.toml'), '[project]'); // No name field
    fs.writeFileSync(
      path.join(packageDir, 'project.json'),
      '{"name": "python-invalid-package"}'
    );

    const pyprojects: PyProjectFile[] = [
      {
        path: path.join(packageDir, 'pyproject.toml'),
        directory: packageDir,
        projectJsonPath: path.join(packageDir, 'project.json'),
        packageName: 'invalid-package',
      },
    ];

    const mapping = buildPackageMapping(pyprojects);

    expect(mapping).toEqual({});
  });

  it('should handle packages with no underscores or hyphens', () => {
    const packageDir = path.join(tempDir, 'alante');
    fs.mkdirSync(packageDir, { recursive: true });

    fs.writeFileSync(
      path.join(packageDir, 'pyproject.toml'),
      '[project]\nname = "alante"'
    );
    fs.writeFileSync(
      path.join(packageDir, 'project.json'),
      '{"name": "python-alante"}'
    );

    const pyprojects: PyProjectFile[] = [
      {
        path: path.join(packageDir, 'pyproject.toml'),
        directory: packageDir,
        projectJsonPath: path.join(packageDir, 'project.json'),
        packageName: 'alante',
      },
    ];

    const mapping = buildPackageMapping(pyprojects);

    // Should only have the original name since no conversion is needed
    expect(mapping['alante']).toBe('python-alante');
    // No variants should be created
    expect(Object.keys(mapping)).toHaveLength(1);
  });
});
