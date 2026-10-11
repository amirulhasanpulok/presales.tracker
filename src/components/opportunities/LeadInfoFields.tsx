import React from "react";
import { LeadInformation, OpportunityDocument } from "../../types";

export const emptyLeadInfo = (): LeadInformation => ({
  requestType: "Project",
  supportingDocumentsStatus: "NA",
  surveyStatus: "NA",
  surveyNumber: "",
  surveyCompleted: false,
  technicalContact: { name: "", phone: "", designation: "" },
  additionalInfo: "",
});
export const leadField =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm mt-1";
export function LeadInfoFields({
  value,
  onChange,
  published,
  submission,
  onPublished,
  onSubmission,
  onFiles,
}: {
  value: LeadInformation;
  onChange: (value: LeadInformation) => void;
  published: string;
  submission: string;
  onPublished: (v: string) => void;
  onSubmission: (v: string) => void;
  onFiles?: (files: File[], survey: boolean) => void;
}) {
  const update = (patch: Partial<LeadInformation>) =>
    onChange({ ...value, ...patch });
  return (
    <div className="space-y-4">
      <label className="block text-sm">
        Request type
        <select
          className={leadField}
          value={value.requestType}
          onChange={(e) =>
            update({
              requestType: e.target.value as LeadInformation["requestType"],
            })
          }
        >
          {["Project", "Tender", "RFP", "RFQ"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm">
          Published date
          <input
            type="date"
            className={leadField}
            value={published}
            onChange={(e) => onPublished(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Submission date
          <input
            type="date"
            className={leadField}
            min={published || undefined}
            value={submission}
            onChange={(e) => onSubmission(e.target.value)}
          />
        </label>
      </div>
      <label className="block text-sm">
        Supporting documents attached
        <select
          className={leadField}
          value={value.supportingDocumentsStatus}
          onChange={(e) =>
            update({
              supportingDocumentsStatus: e.target
                .value as LeadInformation["supportingDocumentsStatus"],
            })
          }
        >
          {["NA", "Yes", "No"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      {value.supportingDocumentsStatus === "Yes" && onFiles && (
        <label className="block text-sm">
          Attach supporting documents
          <input
            type="file"
            multiple
            className={leadField}
            onChange={(e) => onFiles(Array.from(e.target.files || []), false)}
          />
        </label>
      )}
      <label className="block text-sm">
        Survey initiated?
        <select
          className={leadField}
          value={value.surveyStatus}
          onChange={(e) =>
            update({
              surveyStatus: e.target.value as LeadInformation["surveyStatus"],
              ...(e.target.value !== "Yes"
                ? { surveyCompleted: false, surveyNumber: "" }
                : {}),
            })
          }
        >
          {["NA", "Yes", "No"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      {value.surveyStatus === "Yes" && (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <label className="block text-sm">
            Survey number
            <input
              required
              className={leadField}
              value={value.surveyNumber}
              onChange={(e) => update({ surveyNumber: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.surveyCompleted}
              onChange={(e) => update({ surveyCompleted: e.target.checked })}
            />
            Survey completed
          </label>
          {value.surveyCompleted && onFiles && (
            <label className="block text-sm">
              Attach survey report
              <input
                type="file"
                className={leadField}
                onChange={(e) =>
                  onFiles(Array.from(e.target.files || []), true)
                }
              />
            </label>
          )}
        </div>
      )}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium mb-2">
          Technical contact of customer
        </legend>
        {(["name", "phone", "designation"] as const).map((key) => (
          <label key={key} className="block text-sm">
            {key === "name"
              ? "Name"
              : key === "phone"
                ? "Phone"
                : "Designation"}
            <input
              type={key === "phone" ? "tel" : "text"}
              className={leadField}
              value={value.technicalContact[key]}
              onChange={(e) =>
                update({
                  technicalContact: {
                    ...value.technicalContact,
                    [key]: e.target.value,
                  },
                })
              }
            />
          </label>
        ))}
      </fieldset>
      <label className="block text-sm">
        Additional info (if any)
        <textarea
          rows={3}
          className={leadField}
          value={value.additionalInfo}
          onChange={(e) => update({ additionalInfo: e.target.value })}
        />
      </label>
    </div>
  );
}
export async function readLeadFiles(
  files: File[],
  survey: boolean,
): Promise<OpportunityDocument[]> {
  return Promise.all(
    files.map(async (file) => {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read attachment."));
        reader.readAsDataURL(file);
      });
      return {
        id: `doc-${crypto.randomUUID()}`,
        title: file.name,
        type: survey
          ? ("Survey Report" as const)
          : ("Supporting Document" as const),
        version: "v1",
        size: `${(file.size / 1024).toFixed(1)} KB`,
        fileName: file.name,
        fileData,
        uploadedBy: "",
        uploadedAt: "",
        status: "In Review" as const,
        description: survey ? "Lead survey report" : "Lead supporting document",
      };
    }),
  );
}
