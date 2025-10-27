const API_BASE = "http://localhost:8000/api";
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const browseBtn = document.getElementById("browse-btn");
const uploadBtn = document.getElementById("upload-btn");
const uploadStatus = document.getElementById("upload-status");
const chatForm = document.getElementById("chat-form");
const questionInput = document.getElementById("question");
const conversation = document.getElementById("conversation");

let selectedFile = null;
const documentIds = new Set();

function setUploadState(state, message) {
    uploadBtn.disabled = state !== "ready";
    uploadStatus.textContent = message;
}

function addMessage(role, content, citations = []) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("message", role === "assistant" ? "message--assistant" : "message--user");

    const roleLabel = document.createElement("span");
    roleLabel.classList.add("message__role");
    roleLabel.textContent = role;
    wrapper.appendChild(roleLabel);

    const body = document.createElement("div");
    body.textContent = content;
    wrapper.appendChild(body);

    if (citations.length > 0) {
        const list = document.createElement("ul");
        list.classList.add("citation-list");
        citations.forEach((citation) => {
            const item = document.createElement("li");
            item.textContent = `Doc ${citation.document_id} · Page ${citation.page} (score: ${citation.score.toFixed(3)})`;
            list.appendChild(item);
        });
        wrapper.appendChild(list);
    }

    conversation.appendChild(wrapper);
    conversation.scrollTop = conversation.scrollHeight;
}

function handleFiles(files) {
    const [file] = files;
    if (!file) return;

    if (file.type !== "application/pdf") {
        setUploadState("idle", "Only PDF files are supported.");
        return;
    }

    selectedFile = file;
    setUploadState("ready", `Ready to upload: ${file.name}`);
}

browseBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (event) => {
    handleFiles(event.target.files);
});

dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
});

dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("is-dragover");
});

dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    handleFiles(event.dataTransfer.files);
});

uploadBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    setUploadState("uploading", "Uploading...");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
        const response = await fetch(`${API_BASE}/uploads/pdf`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail ?? "Upload failed");
        }

        const result = await response.json();
        documentIds.add(result.document_id);
        setUploadState("idle", `Uploaded ✔ Document ID: ${result.document_id}`);
        selectedFile = null;
        fileInput.value = "";
    } catch (error) {
        console.error(error);
        setUploadState("idle", `Upload failed: ${error.message}`);
    }
});

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = questionInput.value.trim();
    if (!question) return;

    if (documentIds.size === 0) {
        addMessage("assistant", "Upload a PDF before asking a question.");
        return;
    }

    addMessage("user", question);
    questionInput.value = "";

    try {
        const response = await fetch(`${API_BASE}/chat/qa`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                question,
                document_ids: Array.from(documentIds),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail ?? "Chat request failed");
        }

        const result = await response.json();
        addMessage("assistant", result.answer, result.citations ?? []);
    } catch (error) {
        console.error(error);
        addMessage("assistant", `Request failed: ${error.message}`);
    }
});

setUploadState("idle", "No file selected");
