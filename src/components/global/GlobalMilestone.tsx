"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { MilestoneModal } from "@/components/social/MilestoneModal";

export function GlobalMilestone() {
  const milestoneData = useAppStore((s) => s.milestoneData);
  const clearMilestone = useAppStore((s) => s.clearMilestone);

  if (!milestoneData) return null;

  return (
    <MilestoneModal
      isOpen={!!milestoneData}
      onClose={clearMilestone}
      data={milestoneData}
    />
  );
}
