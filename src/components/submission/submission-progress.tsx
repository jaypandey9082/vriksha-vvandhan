import { LoaderCircle } from "lucide-react";

export const submissionStages = [
  "Preparing photograph",
  "Reserving private submission",
  "Uploading securely",
  "Verifying photograph",
  "Finalising submission",
] as const;

export type SubmissionStage = (typeof submissionStages)[number];

export function SubmissionProgress({ stage }: { stage: SubmissionStage }) {
  const activeIndex = submissionStages.indexOf(stage);
  return (
    <section className="submission-progress" aria-live="polite" aria-label="Submission progress">
      <div className="submission-progress__current">
        <LoaderCircle className="submission-progress__spinner" aria-hidden="true" size={20} />
        <div><strong>{stage}</strong><span>Keep this tab open.</span></div>
      </div>
      <ol>
        {submissionStages.map((item, index) => (
          <li key={item} data-state={index < activeIndex ? "complete" : index === activeIndex ? "active" : "waiting"}>
            <span aria-hidden="true">{index + 1}</span>{item}
          </li>
        ))}
      </ol>
    </section>
  );
}

