import * as fs from 'fs';

/**
 * project.json 파일의 implicitDependencies를 업데이트합니다.
 *
 * @param projectJsonPath - project.json 파일의 절대 경로
 * @param dependencies - Nx 프로젝트명 배열
 * @returns 파일이 실제로 업데이트되었는지 여부 (true: 업데이트됨, false: 변경사항 없음)
 */
export function updateProjectJson(
  projectJsonPath: string,
  dependencies: string[]
): boolean {
  // project.json 파일 읽기
  const content = fs.readFileSync(projectJsonPath, 'utf-8');
  const projectJson = JSON.parse(content);

  // dependencies 배열을 알파벳 순으로 정렬
  const sortedDependencies = [...dependencies].sort();

  // 기존 implicitDependencies와 비교하여 변경사항 감지
  const existingDeps = projectJson.implicitDependencies || [];
  const hasChanges =
    existingDeps.length !== sortedDependencies.length ||
    !existingDeps.every((dep: string, index: number) => dep === sortedDependencies[index]);

  // 변경사항이 없으면 파일을 쓰지 않고 false 반환
  if (!hasChanges) {
    return false;
  }

  // implicitDependencies 필드를 새로운 dependencies로 교체
  projectJson.implicitDependencies = sortedDependencies;

  // 파일 쓰기 (2칸 들여쓰기, 마지막 개행 포함)
  fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2) + '\n', 'utf-8');

  return true;
}
