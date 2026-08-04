import type { CampaignMetric } from "@/types/campaign";

type PromiseTrackerProps = {
  metric: CampaignMetric;
};

const RADIUS = 68;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PromiseTracker({ metric }: PromiseTrackerProps) {
  const progress = Math.min(metric.current / metric.target, 1);
  const progressOffset = CIRCUMFERENCE * (1 - progress);
  const accessibleLabel = `${metric.current} of ${metric.target} ${metric.label}`;

  return (
    <div className="promise-tracker" aria-label={accessibleLabel} role="img">
      <svg className="promise-tracker__ring" viewBox="0 0 176 176" aria-hidden="true">
        <circle className="promise-tracker__track" cx="88" cy="88" r={RADIUS} />
        <circle
          className="promise-tracker__progress"
          cx="88"
          cy="88"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={progressOffset}
        />
        <circle className="promise-tracker__inner" cx="88" cy="88" r="55" />
      </svg>
      <span className="promise-tracker__copy">
        <strong>{metric.current}</strong>
        <span>of {metric.target}</span>
        <small>{metric.label}</small>
      </span>
    </div>
  );
}
