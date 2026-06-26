import os
import json
import fitz  # PyMuPDF
from flask import Flask, request, jsonify
from flask_cors import CORS
from pptx import Presentation
from dotenv import load_dotenv
from google import genai
from google.genai import types

# --------------------------------------------------
# Load Environment Variables
# --------------------------------------------------
base_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(base_dir, ".env"))

app = Flask(__name__)

# Configure CORS to accept requests from any deployed frontend link
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --------------------------------------------------
# Gemini Initialization
# --------------------------------------------------
gemini_key = os.getenv("GEMINI_API_KEY")

if not gemini_key or "your_" in gemini_key.lower():
    print("\n⚠️ GEMINI_API_KEY is missing in backend/.env")
else:
    print(f"✅ Gemini API Loaded Successfully.")

client = genai.Client(api_key=gemini_key)

# --------------------------------------------------
# Clean, Fixed Raw Schema Matching Frontend
# --------------------------------------------------
quiz_schema = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "id": {"type": "INTEGER"},
            "topic": {"type": "STRING"},
            "question": {"type": "STRING"},
            "options": {
                "type": "OBJECT",
                "properties": {
                    "A": {"type": "STRING"},
                    "B": {"type": "STRING"},
                    "C": {"type": "STRING"},
                    "D": {"type": "STRING"}
                },
                "required": ["A", "B", "C", "D"]
            },
            "correctAnswer": {"type": "STRING"},
            "explanation": {"type": "STRING"}
        },
        "required": ["id", "topic", "question", "options", "correctAnswer", "explanation"]
    }
}

# --------------------------------------------------
# PPT Parser API
# --------------------------------------------------
@app.route("/api/parse-ppt", methods=["POST"])
def parse_ppt():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]
    if not file.filename.endswith(".pptx"):
        return jsonify({"error": "Only .pptx files are allowed."}), 400

    try:
        prs = Presentation(file)
        extracted_text = []

        for i, slide in enumerate(prs.slides):
            slide_text = []
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text = shape.text.strip()
                    if text:
                        slide_text.append(text)

            if slide_text:
                extracted_text.append(f"Slide {i+1}:\n" + "\n".join(slide_text))

        full_text = "\n\n".join(extracted_text)

        return jsonify({
            "slideCount": len(prs.slides),
            "wordCount": len(full_text.split()),
            "previewText": full_text[:1000] + ("..." if len(full_text) > 1000 else ""),
            "fullText": full_text,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# PDF Parser API
# --------------------------------------------------
@app.route("/api/parse-pdf", methods=["POST"])
def parse_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]
    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files are allowed."}), 400

    try:
        pdf = fitz.open(stream=file.read(), filetype="pdf")
        extracted_text = ""

        for page in pdf:
            extracted_text += page.get_text()

        return jsonify({
            "pageCount": len(pdf),
            "wordCount": len(extracted_text.split()),
            "previewText": extracted_text[:1000] + ("..." if len(extracted_text) > 1000 else ""),
            "fullText": extracted_text,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# Quiz Generator API
# --------------------------------------------------
@app.route("/api/generate-quiz", methods=["POST"])
def generate_quiz():
    print("✅ Fixed generate_quiz API called")
    data = request.json or {}

    text_content = data.get("text", "")
    count = data.get("count", 10)
    difficulty = data.get("difficulty", "Medium")

    if not text_content:
        return jsonify({"error": "No study material found."}), 400

    prompt = f"""
You are an expert educator.
Analyze the study material and generate EXACTLY {count} multiple-choice questions based on it.
Difficulty Level to target: {difficulty}

Study Material:
{text_content}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
                response_schema=quiz_schema,
            ),
        )

        # Parse output directly into a clean list
        quiz_list = json.loads(response.text)
        return jsonify(quiz_list)

    except json.JSONDecodeError:
        return jsonify({"error": "Gemini returned invalid JSON structure."}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to generate structured quiz: {str(e)}"}), 500

if __name__ == "__main__":
    is_debug = os.getenv("FLASK_ENV") == "development" or os.getenv("DEBUG", "False").lower() in ("true", "1")
    port = int(os.getenv("PORT", 5001))
    
    print(f"\n🚀 Starting Flask Backend Engine...")
    print(f"🔗 Target: http://localhost:{port}")
    
    app.run(host="0.0.0.0", port=port, debug=is_debug, use_reloader=False)