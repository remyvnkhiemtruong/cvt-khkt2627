import assert from 'node:assert/strict';
import {
  normalizeAcademicActionInput,
  normalizeAcademicSnapshot,
  normalizePoeticContent
} from '../../api/_lib/content-compat.js';

const malformed = {
  plot_situation: {
    axisId: 'plot_situation',
    analysisText: 'Tình huống hiển thị bình thường.',
    evidenceQuotes: []
  },
  character_detail: {
    axisId: 'character_detail',
    analysisText: {
      axisId: 'character_detail',
      analysisText: 'Bát cháo hành đánh thức phần người trong Chí.',
      evidenceQuotes: []
    },
    evidenceQuotes: []
  },
  narrator_pov: {
    axisId: 'narrator_pov',
    analysisText: {
      axisId: 'narrator_pov',
      analysisText: 'Điểm nhìn dịch chuyển vào nội tâm nhân vật.',
      evidenceQuotes: []
    },
    evidenceQuotes: []
  },
  space_time: {
    axisId: 'space_time',
    analysisText: {
      axisId: 'space_time',
      analysisText: 'Làng Vũ Đại vừa là không gian sống vừa là không gian định kiến.',
      evidenceQuotes: []
    },
    evidenceQuotes: []
  },
  language_tone_symbol: {
    axisId: 'language_tone_symbol',
    analysisText: {
      axisId: 'language_tone_symbol',
      analysisText: 'Tiếng chửi và bát cháo hành tạo sắc thái chua chát, xót xa.',
      evidenceQuotes: []
    },
    evidenceQuotes: []
  },
  form_argument: {
    axisId: 'form_argument',
    analysisText: 'Lập luận tổng hợp.',
    evidenceQuotes: []
  }
};

const normalized = normalizePoeticContent(malformed);
for (const response of Object.values(normalized)) {
  assert.equal(typeof response.analysisText, 'string', 'analysisText phải luôn là chuỗi sau chuẩn hóa');
  assert.ok(Array.isArray(response.evidenceQuotes), 'evidenceQuotes phải luôn là mảng sau chuẩn hóa');
}
assert.equal(normalized.character_detail.analysisText, 'Bát cháo hành đánh thức phần người trong Chí.');
assert.equal(normalized.narrator_pov.analysisText, 'Điểm nhìn dịch chuyển vào nội tâm nhân vật.');
assert.equal(normalized.space_time.analysisText, 'Làng Vũ Đại vừa là không gian sống vừa là không gian định kiến.');

const action = normalizeAcademicActionInput({ action: 'save_draft', assignmentId: '10a1-chi-pheo', content: malformed });
assert.equal(typeof action.content.character_detail.analysisText, 'string', 'save_draft phải sửa dữ liệu lồng trước khi ghi');

const snapshot = normalizeAcademicSnapshot({
  portfolios: {
    demo: {
      currentDraft: malformed,
      versions: [{ versionNumber: 'V2', responses: malformed }]
    }
  }
});
assert.equal(typeof snapshot.portfolios.demo.currentDraft.space_time.analysisText, 'string', 'draft trả về client phải an toàn');
assert.equal(typeof snapshot.portfolios.demo.versions[0].responses.character_detail.analysisText, 'string', 'immutable version trả về client phải an toàn');
assert.equal(snapshot.portfolios.demo.versions[0].responses.character_detail.analysisText, 'Bát cháo hành đánh thức phần người trong Chí.');

console.log('✓ content compatibility: nested analysisText is normalized without mutating stored versions');
