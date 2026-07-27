"use client";

const STORAGE_KEY = "learnweb3.lectureProgress.v1";

export type LectureProgressMap = Record<
  string,
  { completedAt: string; score?: number }
>;

function readAll(): Record<string, LectureProgressMap> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LectureProgressMap>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, LectureProgressMap>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getLectureProgress(walletKey: string): LectureProgressMap {
  const all = readAll();
  return all[walletKey.toLowerCase()] ?? {};
}

export function isLectureCompleted(walletKey: string, lectureId: string) {
  return Boolean(getLectureProgress(walletKey)[lectureId]?.completedAt);
}

export function markLectureCompleted(
  walletKey: string,
  lectureId: string,
  score?: number,
) {
  const all = readAll();
  const key = walletKey.toLowerCase();
  const current = all[key] ?? {};
  all[key] = {
    ...current,
    [lectureId]: {
      completedAt: new Date().toISOString(),
      score,
    },
  };
  writeAll(all);
  return all[key];
}

export function countCompleted(
  walletKey: string,
  lectureIds: string[],
): number {
  const progress = getLectureProgress(walletKey);
  return lectureIds.filter((id) => progress[id]?.completedAt).length;
}
