import test from "node:test";
import assert from "node:assert/strict";
import { validateLeadIntake } from "./lead-intake.js";
const doc = () => ({
  contractValue: 100000,
  tender: { publishDate: "2026-10-11", submissionDeadline: "2026-10-20" },
  documents: [],
  leadInfo: {
    requestType: "RFQ",
    supportingDocumentsStatus: "No",
    surveyStatus: "No",
    surveyNumber: "",
    surveyCompleted: false,
    technicalContact: {
      name: "Customer engineer",
      phone: "0123456789",
      designation: "IT Manager",
    },
    additionalInfo: "Existing network upgrade",
  },
});
test("Existing opportunities without the intake template remain compatible", () =>
  assert.doesNotThrow(() => validateLeadIntake({})));
test("All RM template fields accept valid input without changing their values", () => {
  const d = doc();
  const before = structuredClone(d);
  validateLeadIntake(d);
  assert.deepEqual(d, before);
});
test("Submission cannot precede publication; invalid calendar dates are rejected", () => {
  for (const date of ["2026-10-01", "2026-02-30", "invalid"]) {
    const d = doc();
    d.tender.submissionDeadline = date;
    assert.throws(() => validateLeadIntake(d), { status: 422 });
  }
});
test("Supporting document Yes needs an attachment", () => {
  const d = doc();
  d.leadInfo.supportingDocumentsStatus = "Yes";
  assert.throws(() => validateLeadIntake(d));
  d.documents.push({
    id: "a",
    fileName: "rfq.pdf",
    fileData: "data:application/pdf;base64,YQ==",
    description: "Lead supporting document",
  });
  assert.doesNotThrow(() => validateLeadIntake(d));
});
test("Completed survey needs its number and report", () => {
  const d = doc();
  d.leadInfo.surveyStatus = "Yes";
  d.leadInfo.surveyCompleted = true;
  assert.throws(() => validateLeadIntake(d));
  d.leadInfo.surveyNumber = "SUR-42";
  assert.throws(() => validateLeadIntake(d));
  d.documents.push({
    id: "b",
    fileName: "survey.pdf",
    description: "Lead survey report",
    fileData: "data:application/pdf;base64,YQ==",
  });
  assert.doesNotThrow(() => validateLeadIntake(d));
});
test("Invalid status, malformed attachment and negative budget are rejected", () => {
  for (const mutate of [
    (d) => (d.leadInfo.surveyStatus = "Maybe"),
    (d) => (d.contractValue = -1),
    (d) =>
      d.documents.push({ fileName: "bad.pdf", fileData: "javascript:bad" }),
  ]) {
    const d = doc();
    mutate(d);
    assert.throws(() => validateLeadIntake(d));
  }
});
