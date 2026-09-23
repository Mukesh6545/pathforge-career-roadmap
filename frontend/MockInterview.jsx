import { useState } from "react";

// Scores an answer against the tip's key points. Returns a 0 / 0.5 / 1 score
// (length of answer and keyword coverage each contribute half a point) plus a
// short human-readable note explaining the score.
function scoreAnswer(answer, tip) {
  if (!answer.trim()) {
    return { score: 0, notes: "No answer was given for this question." };
  }
  const tipWords = tip
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const answerLower = answer.toLowerCase();
  const covered = [...new Set(tipWords.filter((w) => answerLower.includes(w)))];
  const wordCount = answer.trim().split(/\s+/).length;

  let score = 0;
  const notes = [];
  if (wordCount >= 15) {
    score += 0.5;
  } else {
    notes.push("Your answer is quite short — interviewers usually expect 30-60 seconds of spoken detail.");
  }
  if (covered.length > 0) {
    score += 0.5;
    notes.push(`Good — your answer touches on: ${covered.slice(0, 4).join(", ")}.`);
  } else {
    notes.push("Try to explicitly touch on the points in the tip above.");
  }
  return { score, notes: notes.join(" ") };
}

const PILL_LABEL = { 1: "Strong", 0.5: "Partial", 0: "Not covered" };
function pillClass(score) {
  if (score === 1) return "full";
  if (score === 0.5) return "partial";
  return "none";
}

export default function MockInterview({ questions }) {
  const [index, setIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState(() => Array(questions.length).fill(null)); // { score, notes } | null
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  function next(dir) {
    setIndex((i) => Math.max(0, Math.min(questions.length - 1, i + dir)));
    setShowTip(false);
    setAnswer("");
    setFeedback(null);
  }

  function check() {
    const result = scoreAnswer(answer, q.tip);
    setFeedback(result.notes);
    setResults((prev) => {
      const updated = [...prev];
      updated[index] = result;
      return updated;
    });
  }

  function finishTest() {
    // Score any answered-but-unchecked question before finishing.
    setResults((prev) => {
      const updated = [...prev];
      if (!updated[index] && answer.trim()) updated[index] = scoreAnswer(answer, q.tip);
      return updated;
    });
    setFinished(true);
  }

  function retake() {
    setResults(Array(questions.length).fill(null));
    setFinished(false);
    setIndex(0);
    setShowTip(false);
    setAnswer("");
    setFeedback(null);
  }

  if (finished) {
    const totalScore = results.reduce((sum, r) => sum + (r ? r.score : 0), 0);
    const pct = Math.round((totalScore / questions.length) * 100);
    return (
      <div className="mock-interview">
        <div className="score-summary">
          <div className="score-big">{totalScore} / {questions.length}</div>
          <p className="score-sub">{pct}% — based on answer length and coverage of key points</p>
        </div>

        <div className="score-breakdown">
          {questions.map((question, i) => {
            const r = results[i];
            const score = r ? r.score : 0;
            return (
              <div className="score-row" key={i}>
                <span className={`score-pill ${pillClass(score)}`}>{PILL_LABEL[score]}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{question.question}</p>
                  {r && <p className="muted small" style={{ marginTop: 4 }}>{r.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mock-actions" style={{ justifyContent: "center" }}>
          <button type="button" onClick={retake}>Retake Test</button>
        </div>
        <p className="disclaimer">This self-check is a simple keyword heuristic, not real AI grading — use it as a nudge, and ideally practice out loud with a friend or mirror too.</p>
      </div>
    );
  }

  return (
    <div className="mock-interview">
      <p className="muted small">Question {index + 1} of {questions.length}</p>
      <h4>{q.question}</h4>

      <textarea
        rows={4}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type or practice saying your answer out loud, then paste a summary here..."
      />

      <div className="mock-actions">
        <button type="button" className="secondary" onClick={() => setShowTip((s) => !s)}>
          {showTip ? "Hide" : "Show"} what a strong answer covers
        </button>
        <button type="button" className="secondary" onClick={check}>Quick self-check</button>
      </div>

      {showTip && <p className="tip-box">{q.tip}</p>}
      {feedback && <p className="feedback-box">{feedback}</p>}

      <div className="mock-nav">
        <button type="button" className="secondary" onClick={() => next(-1)} disabled={index === 0}>← Previous</button>
        {index === questions.length - 1 ? (
          <button type="button" onClick={finishTest}>Finish & See Score</button>
        ) : (
          <button type="button" className="secondary" onClick={() => next(1)}>Next →</button>
        )}
      </div>
      <p className="tab-hint">
        Answered {results.filter((r) => r).length} of {questions.length} so far.{" "}
        {index !== questions.length - 1 && (
          <a href="#finish" onClick={(e) => { e.preventDefault(); finishTest(); }}>Finish early &amp; see score</a>
        )}
      </p>
      <p className="disclaimer">This self-check is a simple keyword heuristic, not real AI grading — use it as a nudge, and ideally practice out loud with a friend or mirror too.</p>
    </div>
  );
}
