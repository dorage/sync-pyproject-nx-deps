import * as path from 'path';
import * as fs from 'fs';
import { scanPyProjectFiles } from './scanner';
import { extractWorkspaceDependencies } from './parser';
import { buildPackageMapping } from './mapper';
import { updateProjectJson } from './updater';

/**
 * rootDir을 절대 경로로 변환합니다.
 * @param inputPath - 상대 또는 절대 경로
 * @returns 절대 경로
 */
function resolveRootDir(inputPath: string): string {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  return path.resolve(process.cwd(), inputPath);
}

/**
 * pyproject.toml의 workspace dependencies를 기반으로
 * 모든 project.json의 implicitDependencies를 동기화합니다.
 *
 * @param rootDir - 상대 또는 절대 경로
 * @returns Promise<void>
 */
export async function syncPyprojectDeps(rootDir: string): Promise<void> {
  // 1. rootDir을 절대 경로로 변환
  const absoluteRootDir = resolveRootDir(rootDir);

  // rootDir 존재 여부 확인
  if (!fs.existsSync(absoluteRootDir)) {
    throw new Error(`Root directory does not exist: ${absoluteRootDir}`);
  }

  // 2. scanPyProjectFiles(rootDir) → PyProjectFile[] 얻기
  const pyprojects = await scanPyProjectFiles(absoluteRootDir);

  // 3. buildPackageMapping(pyprojects) → PackageMapping 얻기
  const mapping = buildPackageMapping(pyprojects);

  // 4. for each pyproject:
  for (const pyproject of pyprojects) {
    try {
      // a. extractWorkspaceDependencies(pyproject.path) → 패키지명 배열 얻기
      const workspacePackages = extractWorkspaceDependencies(pyproject.path);

      // b. 패키지명 → Nx 프로젝트명 변환
      const nxProjectNames: string[] = [];

      for (const packageName of workspacePackages) {
        const nxProjectName = mapping[packageName];

        if (!nxProjectName) {
          console.warn(
            `Warning: Package "${packageName}" not found in mapping table (referenced in ${pyproject.path})`
          );
          continue;
        }

        nxProjectNames.push(nxProjectName);
      }

      // c. updateProjectJson(pyproject.projectJsonPath, nxProjectNames) → project.json 업데이트
      // project.json이 없는 경우 경고 로그 출력, 스킵
      if (!fs.existsSync(pyproject.projectJsonPath)) {
        console.warn(
          `Warning: project.json not found at ${pyproject.projectJsonPath}, skipping`
        );
        continue;
      }

      updateProjectJson(pyproject.projectJsonPath, nxProjectNames);

    } catch (error) {
      // pyproject.toml 파싱 실패 등의 에러는 로그 후 스킵
      console.error(
        `Error: Failed to process ${pyproject.path}:`,
        error instanceof Error ? error.message : error
      );
      continue;
    }
  }

  // 5. 완료
}
