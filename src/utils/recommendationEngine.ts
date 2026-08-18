import type { PoeticAxisId, TaskRecommendation, RubricAssessmentSubmission, Assignment } from '../types';

const AXIS_TITLE_MAP: Record<PoeticAxisId, string> = {
  plot_situation: 'Tình huống – Cốt truyện',
  character_detail: 'Nhân vật – Chi tiết nghệ thuật',
  narrator_pov: 'Người kể chuyện – Điểm nhìn',
  space_time: 'Không gian – Thời gian nghệ thuật',
  language_tone_symbol: 'Ngôn ngữ – Giọng điệu – Biểu tượng',
  form_argument: 'Tính chỉnh thể & Lập luận'
};

export function getExplainableRecommendation(
  latestRubric: RubricAssessmentSubmission | undefined,
  availableAssignments: Assignment[],
  currentAssignmentId: string
): TaskRecommendation {
  // Lấy các bài tập khác với bài hiện tại
  const candidates = availableAssignments.filter(a => a.id !== currentAssignmentId);
  const fallback = candidates[0] || availableAssignments[0];

  if (!latestRubric || !latestRubric.criterionScores) {
    return {
      nextAssignmentId: fallback.id,
      assignmentTitle: fallback.title,
      targetAxisId: 'plot_situation',
      targetAxisTitle: AXIS_TITLE_MAP['plot_situation'],
      rationale: 'Quy tắc khởi tạo: Hệ thống đề xuất bắt đầu khám phá thế giới nghệ thuật từ việc nhận diện Tình huống truyện và xung đột cốt lõi.',
      expectedGain: 'Phát triển năng lực phát hiện bước ngoặt nghệ thuật và xung đột kịch tính.'
    };
  }

  // Tìm tiêu chí có điểm thấp nhất hoặc cần trau dồi thêm (score <= 3.0)
  const scoresByAxis: { axisId: PoeticAxisId; score: number }[] = [
    { axisId: 'plot_situation', score: latestRubric.criterionScores['crit-plot']?.score ?? 3 },
    { axisId: 'character_detail', score: latestRubric.criterionScores['crit-char']?.score ?? 3 },
    { axisId: 'narrator_pov', score: latestRubric.criterionScores['crit-pov']?.score ?? 3 },
    { axisId: 'space_time', score: latestRubric.criterionScores['crit-spacetime']?.score ?? 3 },
    { axisId: 'language_tone_symbol', score: latestRubric.criterionScores['crit-lang']?.score ?? 3 },
    { axisId: 'form_argument', score: latestRubric.criterionScores['crit-synthesis']?.score ?? 3 },
  ];

  // Sắp xếp tăng dần theo điểm số để tìm trục cần cải thiện nhất
  scoresByAxis.sort((a, b) => a.score - b.score);
  const weakest = scoresByAxis[0];

  // Tìm bài tập tập trung vào trục yếu này
  const matchedAssignment = candidates.find(a => a.targetAxes.includes(weakest.axisId)) || fallback;

  let ruleRationale = `Dựa trên kết quả Rubric đánh giá phiên bản gần nhất (${latestRubric.versionNumber}), trục thi pháp [${AXIS_TITLE_MAP[weakest.axisId]}] đạt mức ${weakest.score}/4.0 điểm. `;
  
  if (weakest.axisId === 'narrator_pov') {
    ruleRationale += `Học sinh cần tăng cường kỹ năng nhận diện sự chuyển dịch điểm nhìn đa thanh và lời nửa trực tiếp.`;
  } else if (weakest.axisId === 'space_time') {
    ruleRationale += `Học sinh cần rèn luyện khả năng phát hiện quy luật tương phản không gian và thời gian tâm trạng.`;
  } else if (weakest.axisId === 'language_tone_symbol') {
    ruleRationale += `Học sinh cần nâng cao năng lực giải mã các lớp biểu tượng văn học và phân tích nhạc tính/giọng điệu.`;
  } else if (weakest.axisId === 'character_detail') {
    ruleRationale += `Học sinh cần đào sâu các chi tiết nghệ thuật mang tính bước ngoặt và diễn biến tâm lý nhân vật.`;
  } else if (weakest.axisId === 'plot_situation') {
    ruleRationale += `Học sinh cần nắm vững các dạng tình huống nhận thức và cách thức thắt nút - mở nút trong truyện ngắn.`;
  } else {
    ruleRationale += `Học sinh cần trau dồi tính liên kết chỉnh thể giữa các phương thức biểu đạt và thông điệp nhân văn.`;
  }

  return {
    nextAssignmentId: matchedAssignment.id,
    assignmentTitle: matchedAssignment.title,
    targetAxisId: weakest.axisId,
    targetAxisTitle: AXIS_TITLE_MAP[weakest.axisId],
    rationale: ruleRationale,
    expectedGain: `Gia tăng độ thuần thục ở trục [${AXIS_TITLE_MAP[weakest.axisId]}] từ mức ${weakest.score} lên mức ${Math.min(4, weakest.score + 1)}/4.0.`
  };
}
