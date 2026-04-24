interface GoalMilestone {
  label: string;
  shortLabel: string;
  target: number;
  progress: number;
}

interface GoalProgressBarProps {
  currentSavings: number;
  milestones: GoalMilestone[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function GoalProgressBar({ currentSavings, milestones }: GoalProgressBarProps) {
  const validMilestones = milestones.filter((milestone) => Number.isFinite(milestone.target) && milestone.target > 0);
  const farthestTarget = validMilestones[validMilestones.length - 1]?.target ?? 1;
  const totalFill = Math.min((currentSavings / farthestTarget) * 100, 100);
  const nextMilestone = validMilestones.find((milestone) => milestone.progress < 100) ?? validMilestones[validMilestones.length - 1];

  return (
    <section className="goal-progress-shell panel">
      <div className="goal-progress-top">
        <div>
          <p className="eyebrow">FIRE Milestones</p>
          <h2>Progress across Coast, Classic, and Fat FIRE</h2>
        </div>
        <div className="goal-progress-summary">
          <span>Current invested assets</span>
          <strong>{formatCurrency(currentSavings)}</strong>
          {nextMilestone ? (
            <small>
              Next target: {nextMilestone.label} at {formatCurrency(nextMilestone.target)}
            </small>
          ) : null}
        </div>
      </div>

      <div className="goal-track">
        <div className="goal-track-fill" style={{ width: `${totalFill}%` }} />
        {validMilestones.map((milestone) => {
          const left = Math.min((milestone.target / farthestTarget) * 100, 100);
          const markerEdgeClass = left <= 4 ? "is-start" : left >= 96 ? "is-end" : "";
          return (
            <div className={`goal-track-marker ${markerEdgeClass}`} key={milestone.label} style={{ left: `${left}%` }}>
              <span className="goal-track-dot" />
              <div className="goal-track-tooltip">
                <strong>{milestone.shortLabel}</strong>
                <small>{formatCurrency(milestone.target)}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="goal-progress-grid">
        {validMilestones.map((milestone) => (
          <article className="goal-progress-card" key={milestone.label}>
            <span>{milestone.label}</span>
            <strong>{Math.min(milestone.progress, 100).toFixed(1)}%</strong>
            <small>{formatCurrency(milestone.target)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
