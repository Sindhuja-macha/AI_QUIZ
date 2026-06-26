import React, { useState, useEffect, useRef, useCallback } from 'react';
import Analytics from "./components/Analytics";

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // File Context
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Configuration
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Medium');

  // Quiz State
  const [quiz, setQuiz] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('personal_quiz_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Timer management - fixed to avoid race conditions
  useEffect(() => {
    if (step === 3 && timeLeft > 0 && !isSubmittingRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [step]);
  
  // Auto-submit when timer hits 0
  useEffect(() => {
    if (step === 3 && timeLeft === 0 && quiz.length > 0 && !isSubmittingRef.current) {
      handleSubmitQuiz();
    }
  }, [timeLeft, step, quiz.length]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // File Handling
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile) => {
    const fileName = selectedFile.name.toLowerCase();
    const isPPT = fileName.endsWith(".pptx");
    const isPDF = fileName.endsWith(".pdf");

    if (!isPPT && !isPDF) {
      setError("Invalid format. Please upload a .pptx or .pdf file.");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("File too large. Maximum size is 25 MB.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setError("");
    setShowPreview(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const endpoint = isPDF
      ? "https://ai-quiz-backend-83u4.onrender.com/api/parse-pdf"
      : "https://ai-quiz-backend-83u4.onrender.com/api/parse-ppt";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setParsedData(data);
      } else {
        setError(data.error || "Failed to parse the uploaded file.");
      }
    } catch (err) {
      setError("Could not connect to the live production backend server.");
    } finally {
      setLoading(false);
    }
  };
 
  // Quiz Generation
  const handleGenerateQuiz = async () => {
    if (!parsedData || !parsedData.fullText) {
      setError('No content available. Please upload a valid presentation or document first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://ai-quiz-backend-83u4.onrender.com/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: parsedData.fullText,
          count: questionCount,
          difficulty: difficulty,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const quizData = Array.isArray(data) ? data : [];
        if (quizData.length === 0) {
          setError('AI returned no questions. Please try again with different settings.');
          return;
        }
        setQuiz(quizData);
        setAnswers({});
        setCurrentIdx(0);
        setTimeLeft(questionCount * 45);
        setStep(3);
      } else {
        setError(data.error || 'Quiz generation failed. Please try again.');
      }
    } catch (err) {
      setError('Communication with the AI server timed out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Scoring
  const calculateScore = useCallback(() => {
    let correct = 0;
    quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    return correct;
  }, [quiz, answers]);

  const handleSubmitQuiz = useCallback(() => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const correct = calculateScore();
    const total = quiz.length;
    const pct = Math.round((correct / total) * 100);

    if (pct >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }

    const newEntry = {
      date: new Date().toLocaleDateString(),
      score: pct,
      total: total,
      difficulty: difficulty,
    };

    const updatedHistory = [...history, newEntry];
    setHistory(updatedHistory);
    try {
      localStorage.setItem('personal_quiz_history', JSON.stringify(updatedHistory));
    } catch {
      // Catch storage capacity issues silently
    }

    setStep(4);
  }, [calculateScore, quiz.length, history, difficulty]);

  // Reset Actions
  const handleRetake = () => {
    isSubmittingRef.current = false;
    setAnswers({});
    setCurrentIdx(0);
    setTimeLeft(questionCount * 45);
    setStep(3);
  };

  const handleNewUpload = () => {
    isSubmittingRef.current = false;
    setFile(null);
    setParsedData(null);
    setQuiz([]);
    setAnswers({});
    setCurrentIdx(0);
    setShowPreview(false);
    setShowAnalytics(false);
    setStep(1);
  };

  const allAnswered = quiz.every((_, idx) => answers[idx] !== undefined);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h3 className="app-logo">⚡ AI Quiz Generator</h3>
        <span className="step-indicator">
          Step {step === 4 ? '3' : step} of 3
        </span>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ========== STEP 1: UPLOAD ========== */}
      {step === 1 && (
        <div className="card upload-card">
          <div
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pptx,.pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="dropzone-icon">☁️</div>
            <h3 className="dropzone-title">Drag & drop your .pptx or PDF here</h3>
            <p className="dropzone-subtitle">
              or click to browse files &bull; .pptx / .pdf &bull; max 25 MB
            </p>
          </div>

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Processing file and extracting content...</span>
            </div>
          )}

          {parsedData && file && (
            <div className="file-info">
              <div className="file-info-left">
                <span className="file-icon">✅</span>
                <div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    {file.name.toLowerCase().endsWith(".pdf")
                      ? `${parsedData.pageCount || 0} pages`
                      : `${parsedData.slideCount || 0} slides`}{' '}
                    &bull; {parsedData.wordCount || 0} words extracted
                  </div>
                </div>
              </div>
              <button
                className="btn-outline btn-sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
            </div>
          )}

          {showPreview && parsedData && parsedData.previewText && (
            <div className="content-preview">
              <h4 className="preview-title">📄 Content Preview</h4>
              <pre className="preview-text">{parsedData.previewText}</pre>
            </div>
          )}

          <div className="step-footer">
            <button
              className="btn-primary"
              onClick={() => setStep(2)}
              disabled={!parsedData}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ========== STEP 2: CONFIGURE ========== */}
      {step === 2 && parsedData && (
        <div className="card config-card">
          <h4 className="section-label">Source file</h4>
          <div className="source-file-info">
            {file?.name.toLowerCase().endsWith(".pdf")
               ? `${parsedData.pageCount || 0} pages`
               : `${parsedData.slideCount || 0} slides`}
            {" • "}{parsedData.wordCount || 0} words
          </div>

          {/* Question Count Slider */}
          <div className="config-section">
            <div className="config-header">
              <label className="config-label">Number of questions</label>
              <span className="config-value">{questionCount}</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="range-slider"
            />
            <div className="range-labels">
              <span>min 5</span>
              <span>max 30</span>
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="config-section">
            <label className="config-label">Difficulty level</label>
            <div className="difficulty-group">
              {[
                { key: 'Simple', icon: '🌱', desc: 'Balanced recall and foundational structural parsing exploration' },
                { key: 'Medium', icon: '⚡', desc: 'Balanced recall and scenario questions across total context context' },
                { key: 'Complex', icon: '🔥', desc: 'Deep conceptual application with high plausibility distractors' },
              ].map(({ key, icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`difficulty-btn ${difficulty === key ? 'active' : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  <span className="difficulty-icon">{icon}</span>
                  <span className="difficulty-text">{key}</span>
                  {difficulty === key && <span className="difficulty-check">✓</span>}
                </button>
              ))}
            </div>
            <p className="difficulty-desc">
              {difficulty === 'Simple' && '🌱 Simple — balanced recall and foundational slide text exploration questions.'}
              {difficulty === 'Medium' && '⚡ Medium — balanced recall and scenario questions across all sections.'}
              {difficulty === 'Complex' && '🔥 Complex — deep conceptual application, high plausibility distractors, evaluation questions.'}
            </p>
          </div>

          {/* Generate Button */}
          <button
            className="btn-primary btn-generate"
            onClick={handleGenerateQuiz}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-sm"></span>
                AI is generating your quiz...
              </span>
            ) : (
              '⚡ Generate Quiz'
            )}
          </button>
        </div>
      )}

      {/* ========== STEP 3: QUIZ ========== */}
      {step === 3 && quiz.length > 0 && (
        <div className="card quiz-card">
          <div className="quiz-header">
            <span className="quiz-progress">
              Question {currentIdx + 1} of {quiz.length}
            </span>
            <span className={`quiz-timer ${timeLeft <= 30 ? 'timer-warning' : ''}`}>
              ⏱️ {formatTime(timeLeft)}
            </span>
          </div>

          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentIdx + 1) / quiz.length) * 100}%` }}
            ></div>
          </div>

          <h2 className="question-text">{quiz[currentIdx].question}</h2>

          <div className="options-list">
            {quiz[currentIdx].options && Object.entries(quiz[currentIdx].options).map(([key, val]) => (
              <button
                key={key}
                className={`option-btn ${answers[currentIdx] === key ? 'selected' : ''}`}
                onClick={() => setAnswers({ ...answers, [currentIdx]: key })}
              >
                <span className="option-letter">{key}</span>
                <span className="option-text">{val}</span>
              </button>
            ))}
          </div>

          <div className="quiz-nav">
            <button
              className="btn-outline"
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
            >
              ← Previous
            </button>

            <div className="quiz-dots">
              {quiz.map((_, idx) => (
                <span
                  key={idx}
                  className={`dot ${idx === currentIdx ? 'active' : ''} ${answers[idx] ? 'answered' : ''}`}
                  onClick={() => setCurrentIdx(idx)}
                ></span>
              ))}
            </div>

            {currentIdx < quiz.length - 1 ? (
              <button
                className="btn-primary"
                onClick={() => setCurrentIdx((prev) => Math.min(quiz.length - 1, prev + 1))}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn-success"
                onClick={handleSubmitQuiz}
                disabled={!allAnswered}
              >
                Submit Quiz
              </button>
            )}
          </div>

          {currentIdx === quiz.length - 1 && !allAnswered && (
            <p className="warning-text">
              ⚠️ You haven't answered all questions. Unanswered questions will be marked as incorrect.
            </p>
          )}
        </div>
      )}

      {/* Confetti Celebration */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                backgroundColor: [
                  '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981',
                  '#fbbf24', '#ef4444', '#a78bfa', '#34d399', '#f472b6'
                ][Math.floor(Math.random() * 10)],
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}

      {/* ========== STEP 4: RESULTS ========== */}
      {step === 4 && quiz.length > 0 && (
        <div className="results-container">
          <div className="card score-card">
            <div className="score-ring">
              <div className="score-inner">
                <span className="score-fraction">
                  {calculateScore()}/{quiz.length}
                </span>
                <span className="score-percent">
                  {Math.round((calculateScore() / quiz.length) * 100)}%
                </span>
              </div>
            </div>
            <div className="score-details">
              <h2 className="score-title">
                {calculateScore() === quiz.length
                  ? '🎉 Perfect Score!'
                  : calculateScore() >= quiz.length * 0.7
                  ? '👏 Great work!'
                  : calculateScore() >= quiz.length * 0.4
                  ? '💪 Keep practicing!'
                  : '📚 Review the material and try again!'}
              </h2>
              <p className="score-subtitle">
                {calculateScore()} correct, {quiz.length - calculateScore()} to review
              </p>
              <p className="score-meta">
                {difficulty} difficulty &bull; {file ? file.name : 'Uploaded file'}
              </p>
            </div>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{ marginBottom: '20px', display: 'block', width: '100%' }}
          >
            {showAnalytics ? '📊 Hide Analytics' : '📊 View Analytics'}
          </button>

          {showAnalytics && (
             <Analytics
               quiz={quiz}
               selectedAnswers={answers}
               score={calculateScore()}
               difficulty={difficulty}
               fileName={file?.name}
             />
          )}

          {history.length > 1 && (
            <div className="history-track">
              <span className="history-label">📈 Progress Track:</span>
              <div className="history-badges">
                {history.map((h, i) => (
                  <span key={i} className="history-badge">
                    Run {i + 1}: <strong>{h.score}%</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          <h3 className="review-heading">Review & AI Feedback</h3>
          {quiz.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.correctAnswer;
            const isSkipped = userAnswer === undefined;

            return (
              <div
                key={idx}
                className={`card review-card ${isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="review-header">
                  <span className={`review-icon ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? '✓' : isSkipped ? '—' : '✗'}
                  </span>
                  <div className="review-content">
                    <h4 className="review-question">
                      Q{idx + 1}. {q.question}
                    </h4>
                    <div className="review-answers">
                      <span className="review-answer-label">
                        Your answer:{' '}
                        <span
                          className={
                            isCorrect
                              ? 'answer-correct'
                              : isSkipped
                              ? 'answer-skipped'
                              : 'answer-incorrect'
                          }
                        >
                          {isSkipped ? 'Skipped' : `${userAnswer}: ${q.options?.[userAnswer] || ''}`}
                        </span>
                      </span>
                      <span className="review-answer-label">
                        Correct answer:{' '}
                        <span className="answer-correct">
                          {q.correctAnswer}: {q.options?.[q.correctAnswer] || ''}
                        </span>
                      </span>
                    </div>
                    
                    <div className="explanation-box" style={{ marginTop: '12px', padding: '10px', background: '#f9f9f9', borderRadius: '6px' }}>
                      <strong>
                        {isCorrect ? "Why this answer is correct: " : "Why your answer is incorrect: "}
                      </strong>
                      {q.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="results-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button className="btn-primary" onClick={handleRetake}>
              🔄 Retake Quiz
            </button>
            <button className="btn-outline" onClick={handleNewUpload}>
              📂 Upload New File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}