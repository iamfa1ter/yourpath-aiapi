function isBlank(value) {
  return value == null || String(value).trim() === "";
}

function isNumber(value) {
  return !isBlank(value) && Number.isFinite(Number(value));
}

function selectedOrCustom(selected, custom) {
  return selected === "Other" ? String(custom || "").trim() : String(selected || "").trim();
}

function arrayHasContent(items, custom) {
  return (Array.isArray(items) && items.length > 0) || !isBlank(custom);
}

export function validateStudent(data) {
  const errors = {};
  const desiredCountry = selectedOrCustom(data.desiredCountry, data.desiredCountryOther);
  const desiredMajor = selectedOrCustom(data.desiredMajor, data.desiredMajorOther);

  if (!isNumber(data.gpa)) errors.gpa = "GPA must be numeric.";
  if (!isNumber(data.entScore)) errors.entScore = "ENT score must be numeric.";
  if (!desiredCountry) errors.desiredCountry = "Choose or enter a desired country.";
  if (!desiredMajor) errors.desiredMajor = "Choose or enter a desired major.";
  if (!arrayHasContent(data.hobbies, data.hobbiesOther)) errors.hobbies = "Add at least one hobby or interest.";
  if (!arrayHasContent(data.olympiads, data.olympiadsOther)) errors.olympiads = "Add an achievement or write none yet.";
  if (isBlank(data.projects)) errors.projects = "Describe at least one project.";
  if (isBlank(data.portfolioText)) errors.portfolioText = "Portfolio text is required.";

  if (data.satTaken) {
    const score = Number(data.satScore);
    if (!isNumber(data.satScore) || score < 400 || score > 1600) errors.satScore = "SAT must be between 400 and 1600.";
  }

  if (data.ieltsTaken && isBlank(data.ieltsScore)) {
    errors.ieltsScore = "IELTS / TOEFL score is required.";
  }

  return errors;
}

export function validateGraduate(data) {
  const errors = {};
  const targetCountry = selectedOrCustom(data.targetCountry, data.targetCountryOther);
  const preferredField = selectedOrCustom(data.preferredField, data.preferredFieldOther);

  if (isBlank(data.currentUniversity)) errors.currentUniversity = "Current university is required.";
  if (isBlank(data.currentDegree)) errors.currentDegree = "Current degree is required.";
  if (!isNumber(data.gpa)) errors.gpa = "GPA must be numeric.";
  if (isBlank(data.thesisTopic)) errors.thesisTopic = "Thesis topic is required.";
  if (isBlank(data.researchInterests)) errors.researchInterests = "Research interests are required.";
  if (isBlank(data.publications)) errors.publications = "Publications field is required.";
  if (isBlank(data.academicAchievements)) errors.academicAchievements = "Academic achievements are required.";
  if (isBlank(data.ieltsToefl)) errors.ieltsToefl = "IELTS / TOEFL is required.";
  if (isBlank(data.greGmat)) errors.greGmat = "GRE / GMAT is required.";
  if (!targetCountry) errors.targetCountry = "Target country is required.";
  if (!["Master", "PhD"].includes(data.targetProgram)) errors.targetProgram = "Target program is required.";
  if (!preferredField) errors.preferredField = "Preferred field is required.";
  if (isBlank(data.recommendationLetters)) errors.recommendationLetters = "Recommendation letters are required.";
  if (isBlank(data.researchExperience)) errors.researchExperience = "Research experience is required.";

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
