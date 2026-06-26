# AI-Powered Quiz Generator

An intelligent application that transforms any PowerPoint (.pptx) file into an interactive, scored multiple-choice quiz powered by AI. Built for the Academic Year 2025-26 AI Application Development project.

## Features

- **📂 PPT/PPTX File Upload** - Drag-and-drop or browse to upload PowerPoint files
- **🔧 Quiz Configuration** - Choose number of questions (5-30) and difficulty level (Simple/Medium/Complex)
- **🤖 AI-Powered Generation** - Uses OpenRouter AI (Gemini 2.5 Flash) to generate contextual, well-formed MCQs
- **⏱️ Interactive Quiz Interface** - Timed quiz with progress tracking, question navigation, and visual feedback
- **📊 Scoring & Feedback** - Detailed results with correct/incorrect answer indicators and AI-generated explanations for wrong answers
- **📈 Progress Tracking** - Local history tracking to monitor improvement over multiple attempts
- **📱 Mobile-Responsive** - Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with Vite bundler
- Pure CSS with CSS custom properties
- Fully responsive design (mobile-first breakpoints)
- No external UI library dependencies

### Backend
- **Flask** (Python) REST API
- **python-pptx** for PowerPoint parsing
- **OpenAI SDK** for OpenRouter API integration
- **python-dotenv** for environment configuration

## Project Structure

```
ai_quiz/
├── backend/
│   ├── .env                  # API keys (OPENROUTER_API_KEY)
│   ├── app.py                # Flask server with API endpoints
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── index.html            # Entry HTML
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration (port 3000)
│   └── src/
│       ├── App.jsx           # Main React component
│       ├── main.jsx          # React entry point
│       └── index.css         # All styles
├── README.md
└── requirements.txt
```

## Installation & Setup

### Prerequisites
- **Python 3.8+** and **pip**
- **Node.js 16+** and **npm**
- An OpenRouter API key (free tier available)

### Step 1: Clone and navigate to project
```bash
cd ai_quiz
```

### Step 2: Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
```

### Step 4: Run the Application

Start the backend (Terminal 1):
```bash
cd backend
python app.py
```

Start the frontend (Terminal 2):
```bash
cd frontend
npm run dev
```

The frontend will open at `http://localhost:3000` and the backend runs on `http://localhost:5001`.

## Usage

1. **Upload PPT** - Drag-and-drop a .pptx file or click to browse
2. **Configure Quiz** - Set the number of questions (5-30) and difficulty level
3. **Generate Quiz** - Click "Generate Quiz" and wait for AI processing
4. **Take Quiz** - Answer questions within the time limit (45 seconds per question)
5. **Review Results** - See your score, correct answers, and AI explanations for wrong answers
6. **Retry or Upload New** - Retake the same quiz or upload a different presentation

## API Endpoints

### `POST /api/parse-ppt`
Uploads and parses a PowerPoint file.

**Request:** Multipart form data with `file` field (.pptx file)

**Response:**
```json
{
  "slideCount": 10,
  "wordCount": 1500,
  "previewText": "First 1000 chars...",
  "fullText": "Complete extracted text..."
}
```

### `POST /api/generate-quiz`
Generates MCQ quiz from extracted text.

**Request:**
```json
{
  "text": "Extracted slide content",
  "count": 10,
  "difficulty": "Medium"
}
```

**Response:**
```json
[
  {
    "id": 1,
    "question": "Question text?",
    "options": { "A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4" },
    "correctAnswer": "A",
    "explanation": "Detailed explanation of why this is correct"
  }
]
```

## Functional Requirements Coverage

| Requirement | Status |
|------------|--------|
| FR-01: PPT File Input | ✅ Accepts .pptx, extracts text, displays slide count & preview |
| FR-02: Quiz Configuration | ✅ Question count (5-30), difficulty dropdown, generate button |
| FR-03: MCQ Generation | ✅ AI-generated questions, 4 options, plausible distractors |
| FR-04: Quiz Interface | ✅ One question at a time, single-answer selection, next/submit buttons |
| FR-05: Scoring & Feedback | ✅ Final score, correct/incorrect highlighting, AI explanations |
| FR-06: UX Requirements | ✅ Responsive UI, loading indicators, retake/upload new options |

## Evaluation Criteria

| Area | Weight | Implementation |
|------|--------|---------------|
| PPT Parsing & Input | 15% | python-pptx with full text extraction |
| AI MCQ Generation | 25% | OpenRouter AI with prompt engineering for quality MCQs |
| Quiz UI / UX | 20% | Clean React SPA, animations, responsive design |
| Scoring Accuracy | 15% | Correct score computation with localStorage persistence |
| AI Feedback Quality | 15% | Detailed explanations for wrong answers |
| Code Quality & Docs | 10% | Clean code, inline comments, comprehensive README |

## License

Academic project for AI Application Development (2025-26).