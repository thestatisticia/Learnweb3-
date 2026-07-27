"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LEARNING_PATHS,
  PASS_SCORE,
  lecturesByPath,
  upcomingByPath,
  type Lecture,
  type LearningPathId,
  type QuizQuestion,
} from "@/lib/lectures";
import {
  getLectureProgress,
  markLectureCompleted,
  type LectureProgressMap,
} from "@/lib/lecture-progress";
import { useMultichainWallets } from "@/hooks/use-multichain-wallets";
import { useProfile } from "@/context/profile-context";
import { BookIcon, CheckCircleIcon, LockIcon, SparklesIcon } from "@/components/icons";

type Mode = "list" | "read" | "quiz" | "result";

export function LecturesView({
  onAskInChat,
}: {
  onAskInChat?: (prompt: string) => void;
}) {
  const { evmWallet } = useMultichainWallets();
  const { refresh: refreshProfile } = useProfile();
  const walletKey = evmWallet?.address ?? "guest";

  const [mode, setMode] = useState<Mode>("list");
  const [active, setActive] = useState<Lecture | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [xpMessage, setXpMessage] = useState<string | null>(null);
  const [awarding, setAwarding] = useState(false);
  const [progress, setProgress] = useState<LectureProgressMap>({});

  useEffect(() => {
    setProgress(getLectureProgress(walletKey));
  }, [walletKey]);

  const score = useMemo(() => {
    if (!active) return 0;
    return answers.reduce((sum, ans, i) => {
      return sum + (ans === active.quiz[i].correctIndex ? 1 : 0);
    }, 0);
  }, [active, answers]);

  const foundations = lecturesByPath("foundations");
  const completedFoundations = foundations.filter((l) =>
    progress[l.id]?.completedAt,
  ).length;
  const foundationsTotal = foundations.length + upcomingByPath("foundations").length;
  const foundationsPct = Math.round(
    (completedFoundations / Math.max(foundationsTotal, 1)) * 100,
  );

  const openLecture = (lecture: Lecture) => {
    setActive(lecture);
    setMode("read");
    setQuestionIndex(0);
    setAnswers([]);
    setSelected(null);
    setShowExplain(false);
    setXpMessage(null);
  };

  const startQuiz = () => {
    setMode("quiz");
    setQuestionIndex(0);
    setAnswers([]);
    setSelected(null);
    setShowExplain(false);
    setXpMessage(null);
  };

  const currentQuestion: QuizQuestion | null =
    active && mode === "quiz" ? active.quiz[questionIndex] : null;

  const submitAnswer = () => {
    if (selected === null || !active || !currentQuestion) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    setShowExplain(true);
  };

  const nextQuestion = async () => {
    if (!active) return;
    setShowExplain(false);
    setSelected(null);

    if (questionIndex + 1 >= active.quiz.length) {
      setMode("result");
      const finalScore = [...answers].reduce((sum, ans, i) => {
        return sum + (ans === active.quiz[i].correctIndex ? 1 : 0);
      }, 0);

      if (finalScore >= PASS_SCORE) {
        const next = markLectureCompleted(walletKey, active.id, finalScore);
        setProgress(next);

        if (active.awardsQuizXp && evmWallet?.address) {
          setAwarding(true);
          try {
            const res = await fetch("/api/progress/award", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                address: evmWallet.address,
                action: "quiz",
              }),
            });
            const data = await res.json();
            if (res.status === 409) {
              setXpMessage("Quiz passed. Quiz XP was already claimed earlier.");
            } else if (res.ok) {
              setXpMessage(
                `+${data.xpEarned} XP on-chain · Badge: ${data.badge}`,
              );
              await refreshProfile();
            } else {
              setXpMessage("Quiz passed. Could not record XP right now.");
            }
          } catch {
            setXpMessage("Quiz passed. XP recording failed — try again later.");
          } finally {
            setAwarding(false);
          }
        }
      }
      return;
    }

    setQuestionIndex((i) => i + 1);
  };

  const isUnlocked = (lecture: Lecture) => {
    const pathLectures = lecturesByPath(lecture.pathId);
    const index = pathLectures.findIndex((l) => l.id === lecture.id);
    if (index <= 0) return true;
    return Boolean(progress[pathLectures[index - 1]?.id]?.completedAt);
  };

  const nextUpId = foundations.find((l) => !progress[l.id]?.completedAt)?.id;

  if (mode === "list") {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-400/80">
                Learning path
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                Web3 Foundations
              </h2>
              <p className="mt-2 text-sm text-white/45">
                Read a lesson, pass the quiz, then practice in Chat.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 px-3 py-2 text-center">
              <p className="text-lg font-bold text-amber-300">{foundationsPct}%</p>
              <p className="text-[10px] text-amber-400/70">complete</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-500"
              style={{ width: `${foundationsPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/40">
            {completedFoundations} / {foundationsTotal} lessons
          </p>
        </div>

        {LEARNING_PATHS.map((path) => (
          <PathSection
            key={path.id}
            pathId={path.id}
            title={path.title}
            description={path.description}
            progress={progress}
            nextUpId={nextUpId}
            isUnlocked={isUnlocked}
            onOpen={openLecture}
          />
        ))}
      </div>
    );
  }

  if (!active) return null;

  if (mode === "read") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => setMode("list")}
          className="text-xs font-medium text-amber-400 hover:text-amber-300"
        >
          ← All lectures
        </button>

        <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6">
          <p className="text-xs font-medium text-amber-400">
            Lesson {active.order} · {active.level} · {active.duration}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            {active.title}
          </h2>
          <p className="mt-2 text-sm text-white/50">{active.summary}</p>
          <p className="mt-3 text-xs font-medium text-amber-300/80">
            +{active.xpReward} XP
            {active.badgeHint ? ` · Earn ${active.badgeHint}` : ""}
          </p>

          <div className="mt-6 space-y-5">
            {active.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="text-sm font-semibold text-amber-200">
                  {section.heading}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
              Key takeaways
            </p>
            <ul className="mt-2 space-y-1.5">
              {active.takeaways.map((t) => (
                <li key={t} className="text-sm text-white/70">
                  • {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startQuiz}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black"
            >
              Take quiz ({active.quiz.length} questions)
            </button>
            {onAskInChat && (
              <button
                type="button"
                onClick={() =>
                  onAskInChat(`Explain the lecture "${active.title}" simply`)
                }
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:border-amber-400/40"
              >
                Ask in chat
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {active.chatHints.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => onAskInChat?.(hint)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 hover:text-amber-300"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "quiz" && currentQuestion) {
    const letters = ["A", "B", "C"] as const;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMode("read")}
            className="text-xs font-medium text-amber-400"
          >
            ← Back to lecture
          </button>
          <p className="text-xs text-white/40">
            Question {questionIndex + 1} / {active.quiz.length}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6">
          <h2 className="text-lg font-semibold text-white">
            {currentQuestion.prompt}
          </h2>

          <div className="mt-5 space-y-2">
            {currentQuestion.options.map((option, i) => {
              const isSelected = selected === i;
              const isCorrect = i === currentQuestion.correctIndex;
              let styles =
                "border-white/10 bg-[#05070d] hover:border-white/25 text-white";
              if (showExplain) {
                if (isCorrect)
                  styles = "border-emerald-500/40 bg-emerald-500/10 text-white";
                else if (isSelected)
                  styles = "border-red-500/40 bg-red-500/10 text-white";
                else styles = "border-white/5 bg-[#05070d] text-white/40";
              } else if (isSelected) {
                styles = "border-amber-400/50 bg-amber-500/10 text-white";
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={showExplain}
                  onClick={() => setSelected(i)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${styles}`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                    {letters[i]}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          {showExplain && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              {currentQuestion.explanation}
            </p>
          )}

          <div className="mt-6">
            {!showExplain ? (
              <button
                type="button"
                disabled={selected === null}
                onClick={submitAnswer}
                className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void nextQuestion()}
                className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black"
              >
                {questionIndex + 1 >= active.quiz.length
                  ? "See results"
                  : "Next question"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const passed = score >= PASS_SCORE;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#12182b] p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-400">
          Quiz complete
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {score}/{active.quiz.length}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {passed
            ? "Nice work — you passed this lecture quiz."
            : `You need ${PASS_SCORE}/${active.quiz.length} to pass. Review the lecture and try again.`}
        </p>

        {awarding && (
          <p className="mt-4 text-sm text-amber-300">Recording XP on-chain…</p>
        )}
        {xpMessage && (
          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {xpMessage}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setMode("read")}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white"
          >
            Review lecture
          </button>
          <button
            type="button"
            onClick={startQuiz}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white"
          >
            Retry quiz
          </button>
          <button
            type="button"
            onClick={() => setMode("list")}
            className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black"
          >
            More lectures
          </button>
        </div>
      </div>
    </div>
  );
}

function PathSection({
  pathId,
  title,
  description,
  progress,
  nextUpId,
  isUnlocked,
  onOpen,
}: {
  pathId: LearningPathId;
  title: string;
  description: string;
  progress: LectureProgressMap;
  nextUpId?: string;
  isUnlocked: (lecture: Lecture) => boolean;
  onOpen: (lecture: Lecture) => void;
}) {
  const live = lecturesByPath(pathId);
  const upcoming = upcomingByPath(pathId);
  const completed = live.filter((l) => progress[l.id]?.completedAt).length;
  const total = live.length + upcoming.length;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/40">{description}</p>
        </div>
        <p className="shrink-0 text-xs text-white/35">
          {completed}/{total}
        </p>
      </div>

      <div className="space-y-2.5">
        {live.map((lecture) => {
          const completedLesson = Boolean(progress[lecture.id]?.completedAt);
          const unlocked = isUnlocked(lecture);
          const isNext = lecture.id === nextUpId && unlocked && !completedLesson;

          return (
            <button
              key={lecture.id}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && onOpen(lecture)}
              className={`w-full rounded-2xl border p-4 text-left transition sm:p-5 ${
                completedLesson
                  ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                  : isNext
                    ? "border-amber-500/35 bg-amber-500/[0.08] hover:border-amber-400/50"
                    : unlocked
                      ? "border-white/10 bg-[#12182b] hover:border-amber-400/30"
                      : "cursor-not-allowed border-white/5 bg-[#0a0f1a] opacity-55"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    completedLesson
                      ? "bg-emerald-500/20 text-emerald-300"
                      : unlocked
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-white/5 text-white/30"
                  }`}
                >
                  {completedLesson ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : unlocked ? (
                    <BookIcon className="h-4 w-4" />
                  ) : (
                    <LockIcon className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-white/35">
                      Lesson {lecture.order}
                    </p>
                    {completedLesson && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        Completed
                      </span>
                    )}
                    {isNext && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        Up next
                      </span>
                    )}
                    {!unlocked && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/35">
                        Locked
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1 font-semibold text-white">{lecture.title}</h4>
                  <p className="mt-1 text-xs text-white/40">
                    {lecture.duration} · {lecture.level} · +{lecture.xpReward} XP
                  </p>
                  <p className="mt-2 text-sm text-white/50">{lecture.summary}</p>
                  {unlocked && !completedLesson && (
                    <span className="mt-3 inline-flex rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-semibold text-black">
                      {isNext ? "Continue" : "Start"}
                    </span>
                  )}
                  {!unlocked && (
                    <p className="mt-2 text-xs text-white/30">
                      Complete the previous lesson first
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {upcoming.map((lesson) => (
          <div
            key={lesson.id}
            className="rounded-2xl border border-white/5 bg-[#0a0f1a] p-4 opacity-55 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/30">
                <SparklesIcon className="h-4 w-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-white/30">
                    Upcoming
                  </p>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/30">
                    Locked
                  </span>
                </div>
                <h4 className="mt-1 font-semibold text-white/70">{lesson.title}</h4>
                <p className="mt-1 text-xs text-white/30">
                  {lesson.duration} · {lesson.level} · +{lesson.xpReward} XP
                </p>
                <p className="mt-2 text-xs text-white/25">{lesson.lockedReason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

