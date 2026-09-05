import * as Diff from 'diff';

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export type AxisChangeType = 'added' | 'deleted' | 'changed' | 'unchanged';

export interface AxisDiffResult {
  axisId: string;
  v1Text: string;
  v2Text: string;
  changeType: AxisChangeType;
  diffSegments: DiffSegment[];
  wordsAdded: number;
  wordsRemoved: number;
  wordsUnchanged: number;
  changeRatePercent: number;
}

const normalizeNfc = (value: string = '') => String(value).normalize('NFC');

export function computeTextDiff(v1: string = '', v2: string = ''): DiffSegment[] {
  const before = normalizeNfc(v1);
  const after = normalizeNfc(v2);
  const diffs = Diff.diffWordsWithSpace(before, after);
  return diffs.map(part => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
    value: part.value
  }));
}

export function computeAxisDiff(axisId: string, v1Text: string = '', v2Text: string = ''): AxisDiffResult {
  const before = normalizeNfc(v1Text);
  const after = normalizeNfc(v2Text);
  const segments = computeTextDiff(before, after);

  let wordsAdded = 0;
  let wordsRemoved = 0;
  let wordsUnchanged = 0;

  for (const segment of segments) {
    const count = segment.value.trim().split(/\s+/u).filter(Boolean).length;
    if (segment.type === 'added') wordsAdded += count;
    else if (segment.type === 'removed') wordsRemoved += count;
    else wordsUnchanged += count;
  }

  const beforeEmpty = before.trim().length === 0;
  const afterEmpty = after.trim().length === 0;
  const changeType: AxisChangeType = before === after
    ? 'unchanged'
    : beforeEmpty && !afterEmpty
      ? 'added'
      : !beforeEmpty && afterEmpty
        ? 'deleted'
        : 'changed';

  const beforeWords = wordsUnchanged + wordsRemoved;
  const afterWords = wordsUnchanged + wordsAdded;
  const denominator = Math.max(beforeWords, afterWords, 1);
  const changeRatePercent = changeType === 'unchanged'
    ? 0
    : Math.min(100, Math.round(((wordsAdded + wordsRemoved) / denominator) * 100));

  return {
    axisId,
    v1Text: before,
    v2Text: after,
    changeType,
    diffSegments: segments,
    wordsAdded,
    wordsRemoved,
    wordsUnchanged,
    changeRatePercent
  };
}
