const POETIC_AXIS_IDS = [
  'plot_situation',
  'character_detail',
  'narrator_pov',
  'space_time',
  'language_tone_symbol',
  'form_argument'
];

const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const unwrapAnalysisText = value => {
  let current = value;
  const seen = new Set();

  for (let depth = 0; depth < 6; depth += 1) {
    if (typeof current === 'string') return current;
    if (current === null || current === undefined) return '';
    if (!isPlainObject(current) || seen.has(current)) return '';
    seen.add(current);
    current = current.analysisText;
  }

  return typeof current === 'string' ? current : '';
};

const normalizeEvidenceQuotes = (value, axisId) => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((quote, index) => {
    if (typeof quote === 'string') {
      const text = quote.trim();
      return text ? [{ id: `${axisId}-${index + 1}`, text }] : [];
    }
    if (!isPlainObject(quote)) return [];
    const text = String(quote.text ?? '');
    return [{
      ...quote,
      id: String(quote.id || `${axisId}-${index + 1}`),
      text
    }];
  });
};

export function normalizePoeticContent(input) {
  const source = isPlainObject(input) ? input : {};
  const normalized = {};

  for (const axisId of POETIC_AXIS_IDS) {
    const raw = isPlainObject(source[axisId]) ? source[axisId] : {};
    const nested = isPlainObject(raw.analysisText) ? raw.analysisText : null;
    const outerQuotes = Array.isArray(raw.evidenceQuotes) ? raw.evidenceQuotes : [];
    const nestedQuotes = Array.isArray(nested?.evidenceQuotes) ? nested.evidenceQuotes : [];

    normalized[axisId] = {
      ...raw,
      axisId,
      analysisText: unwrapAnalysisText(raw.analysisText),
      evidenceQuotes: normalizeEvidenceQuotes(outerQuotes.length ? outerQuotes : nestedQuotes, axisId)
    };
  }

  return normalized;
}

export function normalizeAcademicActionInput(input) {
  if (!isPlainObject(input)) return input;
  const action = String(input.action || '');
  if (!['save_draft', 'create_version'].includes(action) || !isPlainObject(input.content)) return input;
  return { ...input, content: normalizePoeticContent(input.content) };
}

export function normalizeAcademicSnapshot(snapshot) {
  if (!isPlainObject(snapshot) || !isPlainObject(snapshot.portfolios)) return snapshot;

  const portfolios = Object.fromEntries(Object.entries(snapshot.portfolios).map(([key, portfolioValue]) => {
    if (!isPlainObject(portfolioValue)) return [key, portfolioValue];
    const versions = Array.isArray(portfolioValue.versions)
      ? portfolioValue.versions.map(version => isPlainObject(version)
        ? { ...version, responses: normalizePoeticContent(version.responses) }
        : version)
      : [];

    return [key, {
      ...portfolioValue,
      currentDraft: normalizePoeticContent(portfolioValue.currentDraft),
      versions
    }];
  }));

  return { ...snapshot, portfolios };
}
