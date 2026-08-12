export interface RankDetails {
  tier: "Beginner" | "Intermediate" | "Advanced" | "Grandmaster";
  level: number; // 1, 2, or 3 (Grandmaster only has 1)
  title: string; // e.g., "Beginner 2"
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressPercentage: number;
}

export function calculateRank(xp: number): RankDetails {
  if (xp < 500) return buildRank("Beginner", 1, xp, 0, 500);
  if (xp < 1000) return buildRank("Beginner", 2, xp, 500, 1000);
  if (xp < 1500) return buildRank("Beginner", 3, xp, 1000, 1500);

  if (xp < 2000) return buildRank("Intermediate", 1, xp, 1500, 2000);
  if (xp < 2500) return buildRank("Intermediate", 2, xp, 2000, 2500);
  if (xp < 3000) return buildRank("Intermediate", 3, xp, 2500, 3000);

  if (xp < 4000) return buildRank("Advanced", 1, xp, 3000, 4000);
  if (xp < 5000) return buildRank("Advanced", 2, xp, 4000, 5000);
  if (xp < 6000) return buildRank("Advanced", 3, xp, 5000, 6000);

  // Grandmaster
  return {
    tier: "Grandmaster",
    level: 1,
    title: "Grandmaster",
    xpInCurrentLevel: xp - 6000,
    xpRequiredForNextLevel: 1000000, // Effectively infinite, or max level
    progressPercentage: 100,
  };
}

function buildRank(
  tier: "Beginner" | "Intermediate" | "Advanced",
  level: number,
  totalXp: number,
  minXp: number,
  maxXp: number
): RankDetails {
  const xpInCurrentLevel = totalXp - minXp;
  const xpRequiredForNextLevel = maxXp - minXp;
  const progressPercentage = Math.min(100, Math.max(0, (xpInCurrentLevel / xpRequiredForNextLevel) * 100));

  return {
    tier,
    level,
    title: `${tier} ${level}`,
    xpInCurrentLevel,
    xpRequiredForNextLevel,
    progressPercentage,
  };
}
