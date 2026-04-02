import { useEffect, useState } from "react";

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  tier?: string;
  showTier?: boolean;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#6366F1";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

function getTierLabel(score: number): string {
  if (score >= 90) return "Legendary";
  if (score >= 80) return "Elite";
  if (score >= 70) return "Advanced";
  if (score >= 55) return "Proficient";
  return "Developing";
}

function getTierChipMeta(tierLabel: string): { emoji: string; color: string } {
  if (tierLabel === "Legendary") return { emoji: "👑", color: "#10B981" };
  if (tierLabel === "Elite") return { emoji: "⚡", color: "#6366F1" };
  if (tierLabel === "Advanced") return { emoji: "🚀", color: "#3178C6" };
  if (tierLabel === "Proficient") return { emoji: "🛠", color: "#F59E0B" };
  return { emoji: "🌱", color: "#EF4444" };
}

export function ScoreCircle({
  score,
  size = 160,
  strokeWidth = 9,
  label,
  tier,
  showTier = true,
}: ScoreCircleProps) {
  const [animScore, setAnimScore] = useState(0);
  const [animProgress, setAnimProgress] = useState(0);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);
  const tierLabel = tier || getTierLabel(score);
  const tierChip = getTierChipMeta(tierLabel);

  useEffect(() => {
    setAnimScore(0);
    setAnimProgress(0);
    const duration = 1800;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const raw = Math.min(elapsed / duration, 1);
      const progress = easeOutCubic(raw);
      setAnimScore(Math.round(score * progress));
      setAnimProgress(progress);
      if (raw >= 1) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  const offset = circumference - animProgress * (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow layer */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
            filter: "blur(16px)",
          }}
        />
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter="url(#glow)"
            style={{ transition: "stroke-dashoffset 0.016s linear" }}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ gap: 2 }}
        >
          <span
            className="font-mono text-white"
            style={{ fontSize: size * 0.225, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            {animScore}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: size * 0.1, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}
          >
            / 100
          </span>
        </div>
      </div>

      {showTier && (
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderLeft: `1px solid ${tierChip.color}`,
          }}
        >
          <span style={{ fontSize: 11 }}>{tierChip.emoji}</span>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: tierChip.color, fontWeight: 600, letterSpacing: "0.06em" }}
          >
            {tierLabel.toUpperCase()}
          </span>
        </div>
      )}

      {label && (
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
          {label}
        </span>
      )}
    </div>
  );
}
