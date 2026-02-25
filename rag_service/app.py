import os
import shutil
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

from langchain_classic.chains import (
    create_history_aware_retriever,
    create_retrieval_chain
)
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = "uploads"
DB_DIR = "db/chroma_db"

os.makedirs(UPLOAD_DIR, exist_ok=True)

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

# Store per-session pipelines: { session_id: { rag_chain, chat_history } }
sessions = {}


def build_rag_pipeline(file_path, session_id):
    """Ingest a PDF and build a RAG chain for it."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

    loader = PyPDFLoader(file_path)
    data = loader.load()
    for d in data:
        d.metadata["source"] = os.path.basename(file_path)
    chunks = text_splitter.split_documents(data)

    if not chunks:
        return None

    # Each session gets its own chroma collection so PDFs don't mix
    session_db_dir = os.path.join(DB_DIR, session_id)
    if os.path.exists(session_db_dir):
        shutil.rmtree(session_db_dir)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=session_db_dir
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

    contextualize_q_system_prompt = (
        "Given the chat history and a request for questions, formulate a standalone "
        "search query to retrieve relevant document sections."
    )
    contextualize_q_prompt = ChatPromptTemplate.from_messages([
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )

    gen_system_prompt = (
        "You are an expert educator. Based ONLY on the provided context, "
        "generate {count} questions of type '{question_type}' about the topic: {topic}. "
        "Rules:\n"
        "1. If type is 'Multiple Choice', provide 4 options (A,B,C,D) and the correct answer.\n"
        "2. If type is 'True/False', provide the statement and the correct answer.\n"
        "3. If type is 'Short Answer', provide a concise question.\n"
        "4. If type is 'Essay', provide a complex question requiring a detailed answer.\n"
        "5. If type is 'Fill in the Blanks', provide sentences with blanks and the answer.\n"
        "6. Ensure questions are challenging and directly related to the text.\n\n"
        "IMPORTANT: Return your response as a valid JSON array. Each object must have:\n"
        '  {{"questionText": "...", "type": "<mcq|short|essay|truefalse|fillblank>", '
        '   "options": ["A","B","C","D"] (only for mcq), '
        '   "correctAnswer": "...", "marks": 1}}\n\n'
        "Return ONLY the JSON array, no extra text.\n\n"
        "Context:\n{context}"
    )
    gen_prompt = ChatPromptTemplate.from_messages([
        ("system", gen_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])

    question_gen_chain = create_stuff_documents_chain(llm, gen_prompt)
    rag_chain = create_retrieval_chain(
        history_aware_retriever, question_gen_chain
    )
    return rag_chain


@app.route("/upload", methods=["POST"])
def upload_pdf():
    """Upload a PDF and build the RAG pipeline for it."""
    if "file" not in request.files:
        return jsonify({"message": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "Empty filename"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"message": "Only PDF files are supported"}), 400

    # Use a simple session id based on filename + timestamp
    import time
    session_id = f"{file.filename.replace(' ', '_')}_{int(time.time())}"

    save_path = os.path.join(UPLOAD_DIR, file.filename)
    file.save(save_path)

    try:
        rag_chain = build_rag_pipeline(save_path, session_id)
        if not rag_chain:
            return jsonify({"message": "Could not extract text from PDF"}), 400

        sessions[session_id] = {
            "rag_chain": rag_chain,
            "chat_history": [],
            "filename": file.filename
        }

        return jsonify({
            "message": "PDF uploaded and processed successfully",
            "session_id": session_id,
            "filename": file.filename
        })

    except Exception as e:
        return jsonify({"message": f"Error processing PDF: {str(e)}"}), 500


@app.route("/generate", methods=["POST"])
def generate_questions():
    """Generate questions from the uploaded PDF using RAG."""
    data = request.json
    session_id = data.get("session_id")
    topic = data.get("topic", "general")
    count = data.get("count", 5)
    question_type = data.get("question_type", "Short Answer")

    if not session_id or session_id not in sessions:
        return jsonify({"message": "No PDF uploaded or invalid session. Please upload a PDF first."}), 400

    session = sessions[session_id]
    rag_chain = session["rag_chain"]
    chat_history = session["chat_history"]

    user_request = (
        f"From the uploaded document, generate {count} {question_type} questions "
        f"about the topic: {topic}."
    )

    try:
        result = rag_chain.invoke({
            "input": user_request,
            "chat_history": chat_history,
            "question_type": question_type,
            "topic": topic,
            "count": count
        })

        answer = result["answer"]
        chat_history.extend([
            HumanMessage(content=user_request),
            AIMessage(content=answer)
        ])

        # Try to parse as JSON array for structured questions
        import json
        try:
            json_start = answer.find("[")
            json_end = answer.rfind("]") + 1
            if json_start != -1 and json_end > 0:
                questions = json.loads(answer[json_start:json_end])
                # Normalize types
                type_map = {
                    "multiple choice": "mcq",
                    "true/false": "truefalse",
                    "truefalse": "truefalse",
                    "short answer": "short",
                    "short": "short",
                    "essay": "essay",
                    "fill in the blanks": "fillblank",
                    "fillblank": "fillblank",
                    "mcq": "mcq"
                }
                for q in questions:
                    q_type = q.get("type", "short").lower()
                    q["type"] = type_map.get(q_type, "short")
                    if "marks" not in q:
                        q["marks"] = 1
                    # Keep options for mcq; set True/False options for truefalse; remove for others
                    if q["type"] == "truefalse":
                        q["options"] = ["True", "False"]
                    elif q["type"] != "mcq" and "options" in q:
                        del q["options"]
                return jsonify({"message": "Questions generated", "payload": questions})
        except (json.JSONDecodeError, ValueError):
            pass

        # Fallback: return raw text
        return jsonify({"message": "Questions generated (raw)", "payload": answer})

    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "sessions": len(sessions)})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
