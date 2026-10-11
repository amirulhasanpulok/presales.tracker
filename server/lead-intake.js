export function validateLeadIntake(doc, previous = {}) {
  const info = doc.leadInfo;
  if (!info) return;
  const fail = (message) => {
    throw Object.assign(new Error(message), { status: 422 });
  };
  if (!["Project", "Tender", "RFP", "RFQ"].includes(info.requestType))
    fail("Choose a valid request type.");
  for (const field of ["supportingDocumentsStatus", "surveyStatus"])
    if (!["Yes", "No", "NA"].includes(info[field]))
      fail("Choose Yes, No or NA for documents and survey.");
  if (info.surveyStatus === "Yes" && !String(info.surveyNumber || "").trim())
    fail("Enter the survey number.");
  if (info.surveyCompleted && info.surveyStatus !== "Yes")
    fail("Only an initiated survey can be completed.");
  const docs = doc.documents || [];
  if (!Array.isArray(docs)) fail("Invalid documents.");
  if (
    info.supportingDocumentsStatus === "Yes" &&
    !docs.some((d) => d.fileName && d.description !== "Lead survey report")
  )
    fail("Attach supporting documents or choose No / NA.");
  if (
    info.surveyCompleted &&
    !docs.some((d) => d.fileName && d.description === "Lead survey report")
  )
    fail("Attach the completed survey report.");
  let bytes = 0;
  const existing = new Set((previous.documents || []).map((d) => d.id));
  for (const d of docs)
    if (d.fileData && !existing.has(d.id)) {
      if (
        !/^data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/.test(
          String(d.fileData),
        )
      )
        fail("Invalid attachment.");
      bytes += String(d.fileData).length;
    }
  if (bytes > 5_650_000)
    fail(
      "Combined attachments are too large. Use Documents to upload separately.",
    );
  const published = doc.tender?.publishDate;
  const submission = doc.tender?.submissionDeadline;
  for (const v of [published, submission])
    if (
      v &&
      (!Number.isFinite(Date.parse(v)) ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          new Date(v).toISOString().slice(0, 10) !== v))
    )
      fail("Enter valid published and submission dates.");
  if (published && submission && Date.parse(submission) < Date.parse(published))
    fail("Submission date cannot be before published date.");
  if (
    !Number.isFinite(Number(doc.contractValue)) ||
    Number(doc.contractValue) < 0
  )
    fail("Budget must be zero or greater.");
}
