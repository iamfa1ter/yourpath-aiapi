import { jsPDF } from "jspdf";

const margin = 16;
const pageWidth = 210;
const lineHeight = 6;
const contentWidth = pageWidth - margin * 2;

function addPageIfNeeded(doc, cursor, needed = 18) {
  if (cursor.y + needed < 290) return cursor;
  doc.addPage();
  return { x: margin, y: margin };
}

function writeTitle(doc, text, cursor) {
  cursor = addPageIfNeeded(doc, cursor, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(text, cursor.x, cursor.y);
  return { ...cursor, y: cursor.y + 10 };
}

function writeHeading(doc, text, cursor) {
  cursor = addPageIfNeeded(doc, cursor, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(text, cursor.x, cursor.y);
  return { ...cursor, y: cursor.y + 7 };
}

function writeParagraph(doc, text, cursor) {
  cursor = addPageIfNeeded(doc, cursor, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(String(text || ""), contentWidth);
  for (const line of lines) {
    cursor = addPageIfNeeded(doc, cursor, lineHeight);
    doc.text(line, cursor.x, cursor.y);
    cursor.y += lineHeight;
  }
  return { ...cursor, y: cursor.y + 2 };
}

function writeList(doc, items, cursor) {
  for (const item of items || []) cursor = writeParagraph(doc, `- ${item}`, cursor);
  return cursor;
}

function writeGaps(doc, gaps, cursor) {
  for (const gap of gaps || []) {
    cursor = writeHeading(doc, `${gap.gap} (${gap.impact})`, cursor);
    cursor = writeParagraph(doc, gap.action, cursor);
  }
  return cursor;
}

function writeRoadmap(doc, roadmap, cursor) {
  for (const step of roadmap || []) {
    cursor = writeHeading(doc, `${step.phase}: ${step.title}`, cursor);
    cursor = writeList(doc, step.tasks, cursor);
  }
  return cursor;
}

export function generateResultsPdf(mode, result) {
  const doc = new jsPDF();
  let cursor = { x: margin, y: margin };
  const isStudent = mode === "students";

  cursor = writeTitle(doc, isStudent ? "YourPath AI School Student Admission Plan" : "YourPath AI Graduate Admission Plan", cursor);
  cursor = writeHeading(doc, "Summary", cursor);
  cursor = writeParagraph(doc, result.profileSummary, cursor);

  cursor = writeHeading(doc, "Evaluation", cursor);
  cursor = writeParagraph(doc, `Evaluation score: ${result.evaluationScore}/100. Admission chance estimate: ${result.admissionChancePercentage}%.`, cursor);

  cursor = writeHeading(doc, "Recommendations", cursor);
  if (isStudent) {
    cursor = writeList(doc, (result.recommendedMajors || []).map((major) => `${major.name} (${major.fitScore}%): ${major.rationale}`), cursor);
    cursor = writeList(
      doc,
      (result.recommendedUniversities || []).map(
        (university) => `${university.category}: ${university.name}, ${university.country} (${university.admissionChancePercentage}%). ${university.rationale}`
      ),
      cursor
    );
  } else {
    cursor = writeParagraph(doc, result.researchFitSummary, cursor);
    cursor = writeList(
      doc,
      (result.programRecommendations || []).map(
        (program) =>
          `${program.category}: ${program.programName} at ${program.university}, ${program.country} (${program.admissionChancePercentage}%). ${program.researchFit}`
      ),
      cursor
    );
    cursor = writeHeading(doc, "Supervisor / Lab Search Strategy", cursor);
    cursor = writeList(doc, result.supervisorLabSearchStrategy, cursor);
  }

  cursor = writeHeading(doc, "Scholarships", cursor);
  cursor = writeList(
    doc,
    (result.scholarshipRecommendations || []).map((item) => `${item.name} (${item.fitPercentage}%): ${item.rationale}`),
    cursor
  );

  cursor = writeHeading(doc, "Gap Analysis", cursor);
  cursor = writeGaps(doc, result.gapAnalysis, cursor);

  cursor = writeHeading(doc, "Roadmap", cursor);
  cursor = writeRoadmap(doc, result.roadmap, cursor);

  cursor = writeHeading(doc, "Generated Documents", cursor);
  cursor = writeParagraph(doc, isStudent ? result.personalStatementDraft : result.statementOfPurposeDraft, cursor);
  if (!isStudent) cursor = writeParagraph(doc, result.researchStatementDraft, cursor);
  cursor = writeList(doc, result.recommendedNextSteps, cursor);

  doc.save(isStudent ? "yourpath-school-student-admission-plan.pdf" : "yourpath-graduate-admission-plan.pdf");
}
