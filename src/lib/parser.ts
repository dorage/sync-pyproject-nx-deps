import * as fs from 'fs';
import * as toml from 'toml';

/**
 * pyproject.toml 파일에서 workspace dependencies를 추출합니다.
 *
 * @param pyprojectPath - pyproject.toml 파일의 절대 경로
 * @returns workspace dependency 패키지명 배열
 *
 * @example
 * ```typescript
 * const deps = extractWorkspaceDependencies('/path/to/pyproject.toml');
 * // ['package-c']
 * ```
 */
export function extractWorkspaceDependencies(pyprojectPath: string): string[] {
  // 파일 읽기
  const content = fs.readFileSync(pyprojectPath, 'utf-8');

  // TOML 파싱
  const parsed = toml.parse(content);

  // [tool.uv.sources] 섹션 확인
  const sources = parsed?.tool?.uv?.sources;

  // 섹션이 없는 경우 빈 배열 반환
  if (!sources || typeof sources !== 'object') {
    return [];
  }

  // workspace = true인 항목만 추출
  const workspaceDeps: string[] = [];

  for (const [packageName, config] of Object.entries(sources)) {
    // config가 객체이고 workspace 속성이 true인 경우만 추가
    if (
      config &&
      typeof config === 'object' &&
      'workspace' in config &&
      config.workspace === true
    ) {
      workspaceDeps.push(packageName);
    }
  }

  return workspaceDeps;
}
