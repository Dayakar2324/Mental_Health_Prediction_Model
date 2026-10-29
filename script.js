"use strict";

// This must match the port used when you start your FastAPI backend.
const API_URL = "http://127.0.0.1:8000/predict";

const form = document.getElementById("prediction-form");
const predictButton = document.getElementById("predict-button");
const buttonLabel = document.getElementById("button-label");
const errorBox = document.getElementById("error-box");
const resultCard = document.getElementById("result-card");
const emptyState = document.getElementById("result-empty");
const loadingState = document.getElementById("result-loading");
const successState = document.getElementById("result-success");
const scoreValue = document.getElementById("score-value");
const predictAgain = document.getElementById("predict-again");

const integerFields = ["Age", "Daily_Unlocks"];
const floatFields = [
  "Avg_Daily_Usage_Hours", "Study_Hours", "Physical_Activity_Hours",
  "Sleep_Hours_Per_Night"
];
const fieldNames = [
  "Age", "Gender", "Country", "Academic_Level", "Most_Used_Platform",
  "Purpose_Of_Use", "Avg_Daily_Usage_Hours", "Daily_Unlocks",
  "Study_Hours", "Physical_Activity_Hours", "Sleep_Hours_Per_Night", "Stress_Level"
];

function showState(state) {
  emptyState.hidden = state !== "empty";
  loadingState.hidden = state !== "loading";
  successState.hidden = state !== "success";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function createPayload() {
  const payload = {};
  for (const fieldName of fieldNames) {
    const element = form.elements.namedItem(fieldName);
    const raw = element.value.trim();
    if (raw === "") throw new Error(`Please complete the ${fieldName.replaceAll("_", " ")} field.`);
    if (integerFields.includes(fieldName)) {
      const number = Number(raw);
      if (!Number.isInteger(number)) throw new Error(`${fieldName.replaceAll("_", " ")} must be a whole number.`);
      payload[fieldName] = number;
    } else if (floatFields.includes(fieldName)) {
      const number = Number(raw);
      if (!Number.isFinite(number)) throw new Error(`${fieldName.replaceAll("_", " ")} must be a valid number.`);
      payload[fieldName] = number;
    } else {
      payload[fieldName] = raw;
    }
  }
  return payload;
}

function formatApiError(body, status) {
  if (status === 422 && Array.isArray(body?.detail)) {
    const messages = body.detail.slice(0, 3).map(item => {
      const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "Input";
      return `${String(field).replaceAll("_", " ")}: ${item.msg || "invalid value"}`;
    });
    return `Please check your inputs:\n${messages.join("\n")}`;
  }
  if (status >= 500) return "The FastAPI server encountered an error. Check the Uvicorn terminal for details.";
  return `The prediction request failed (HTTP ${status}). Please check your inputs and try again.`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  if (!form.reportValidity()) return;

  let payload;
  try {
    payload = createPayload();
  } catch (error) {
    showError(error.message);
    return;
  }

  predictButton.disabled = true;
  buttonLabel.textContent = "Analyzing your information...";
  showState("loading");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("The server returned a response that is not valid JSON.");
    }

    if (!response.ok) throw new Error(formatApiError(result, response.status));
    const score = result?.Predicted_Mental_Health_Score;
    if (typeof score !== "number" || !Number.isFinite(score)) {
      throw new Error("The server response did not contain a valid Predicted_Mental_Health_Score.");
    }

    scoreValue.textContent = score.toFixed(2);
    showState("success");
    if (window.matchMedia("(max-width: 850px)").matches) {
      resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    showState("empty");
    if (error instanceof TypeError) {
      showError("Cannot connect to FastAPI. Make sure the backend is running at http://127.0.0.1:8000 and that CORS is enabled.");
    } else {
      showError(error.message || "An unexpected error occurred.");
    }
  } finally {
    predictButton.disabled = false;
    buttonLabel.textContent = "Predict my mental health score";
  }
});

predictAgain.addEventListener("click", () => {
  form.reset();
  clearError();
  showState("empty");
  document.getElementById("form-title").scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("Age").focus({ preventScroll: true });
});
