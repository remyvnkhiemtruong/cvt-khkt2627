import * as Diff from 'diff';

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export interface AxisDiffResult {
  axisId: string;
  v1Text: string;
  v2Text: string;
  diffSegments: DiffSegment[];
  wordsAdded: number;
  wordsRemoved: number;
  wordsUnchanged: number;
  changeRatePercent: number; // Tỷ lệ thay đổi
}

export function computeTextDiff(v1: string = '', v2: string = ''): DiffSegment[] {
  const diffs = Diff.diffWordsWithSpace(v1, v2);
  return diffs.map(part => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
    value: part.value
  }));
}

export function computeAxisDiff(axisId: string, v1Text: string = '', v2Text: string = ''): AxisDiffResult {
  const segments = computeTextDiff(v1Text, v2Text);
  
  let wordsAdded = 0;
  let wordsRemoved = 0;
  let wordsUnchanged = 0;

  segments.forEach(seg => {
    const wordCount = seg.value.trim().split(/\s+/).filter(Boolean).length;
    if (seg.type === 'added') wordsAdded += wordCount;
    else if (seg.type === 'removed') wordsRemoved += wordCount;
    else wordsUnchanged += wordCount;
  });

  const totalWords = wordsAdded + wordsUnchanged;
  const changeRatePercent = totalWords > 0 
    ? Math.min(100, Math.round(((wordsAdded + wordsRemoved) / (totalWords + wordsRemoved || 1)) * 100))
    : 0;

  return {
    axisId,
    v1Text,
    v2Text,
    diffSegments: segments,
    wordsAdded,
    wordsRemoved,
    wordsUnchanged,
    changeRatePercent
  };
}
