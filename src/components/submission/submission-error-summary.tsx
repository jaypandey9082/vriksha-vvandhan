import { AlertCircle } from "lucide-react";

export function SubmissionErrorSummary({
  title = "Please check your submission",
  messages,
  summaryRef,
}: {
  title?: string;
  messages: readonly string[];
  summaryRef?: React.RefObject<HTMLDivElement | null>;
}) {
  if (messages.length === 0) return null;
  return (
    <div className="submission-error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
      <AlertCircle aria-hidden="true" size={22} />
      <div><strong>{title}</strong><ul>{messages.map((message) => <li key={message}>{message}</li>)}</ul></div>
    </div>
  );
}

