import React from "react";

const Analytics = ({
  quiz = [],
  selectedAnswers = {},
  score = 0,
  difficulty = "Medium",
  fileName = "Study Material",
}) => {

  const totalQuestions = quiz.length;

  const correctAnswers = score;

  const wrongAnswers = totalQuestions - correctAnswers;

  const accuracy =
    totalQuestions === 0
      ? 0
      : Math.round((correctAnswers / totalQuestions) * 100);

  // -----------------------------
  // Topic-wise Performance
  // -----------------------------

  const topicStats = {};

  quiz.forEach((question) => {

    const topic = question.topic || "General";

    if (!topicStats[topic]) {

      topicStats[topic] = {
        total: 0,
        correct: 0,
      };

    }

    topicStats[topic].total++;

    if (selectedAnswers[question.id] === question.correctAnswer) {
      topicStats[topic].correct++;
    }

  });

  // -----------------------------
  // Performance Rating
  // -----------------------------

  let rating = "";
  let ratingColor = "";

  if (accuracy >= 90) {
    rating = "Excellent";
    ratingColor = "#22c55e";
  } else if (accuracy >= 75) {
    rating = "Very Good";
    ratingColor = "#3b82f6";
  } else if (accuracy >= 60) {
    rating = "Good";
    ratingColor = "#f59e0b";
  } else if (accuracy >= 40) {
    rating = "Needs Improvement";
    ratingColor = "#ef4444";
  } else {
    rating = "Keep Practicing";
    ratingColor = "#dc2626";
  }

  return (

    <div className="analytics-container">

      <h1>📊 Performance Analytics</h1>

      <div className="analytics-grid">

        <div className="analytics-card">
          <h3>Score</h3>
          <p>{correctAnswers} / {totalQuestions}</p>
        </div>

        <div className="analytics-card">
          <h3>Accuracy</h3>
          <p>{accuracy}%</p>
        </div>

        <div className="analytics-card">
          <h3>Correct</h3>
          <p>{correctAnswers}</p>
        </div>

        <div className="analytics-card">
          <h3>Wrong</h3>
          <p>{wrongAnswers}</p>
        </div>

        <div className="analytics-card">
          <h3>Difficulty</h3>
          <p>{difficulty}</p>
        </div>

        <div className="analytics-card">
          <h3>Study Material</h3>
          <p>{fileName}</p>
        </div>

      </div>

      <div
        className="analytics-card"
        style={{ marginTop: "30px" }}
      >

        <h2>🏆 Performance Rating</h2>

        <h1 style={{ color: ratingColor }}>
          {rating}
        </h1>

      </div>

      <div
        className="analytics-card"
        style={{ marginTop: "30px" }}
      >

        <h2>📚 Topic-wise Performance</h2>

        <table className="topic-table">

          <thead>

            <tr>

              <th>Topic</th>

              <th>Correct</th>

              <th>Total</th>

              <th>Accuracy</th>

            </tr>

          </thead>

          <tbody>

            {

              Object.entries(topicStats).map(([topic, stats]) => (

                <tr key={topic}>

                  <td>{topic}</td>

                  <td>{stats.correct}</td>

                  <td>{stats.total}</td>

                  <td>

                    {

                      Math.round(
                        (stats.correct / stats.total) * 100
                      )

                    }%

                  </td>

                </tr>

              ))

            }

          </tbody>

        </table>

      </div>

      <div
        className="analytics-card"
        style={{ marginTop: "30px" }}
      >

        <h2>🧠 Learning Summary</h2>

        {

          accuracy >= 90 && (

            <p>

              Excellent work! You have mastered most of the concepts from this study material.

            </p>

          )

        }

        {

          accuracy >= 70 && accuracy < 90 && (

            <p>

              Good understanding of the concepts. Review the incorrect answers once to strengthen your knowledge.

            </p>

          )

        }

        {

          accuracy >= 50 && accuracy < 70 && (

            <p>

              Fair performance. Spend some more time revising the difficult topics before attempting another quiz.

            </p>

          )

        }

        {

          accuracy < 50 && (

            <p>

              More revision is recommended. Go through the study material carefully and retry the quiz to improve your understanding.

            </p>

          )

        }

      </div>

    </div>

  );

};

export default Analytics;