const text = "I have a fever and headache";
const language = "Hindi";

fetch("http://localhost:8000/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text, language })
}).then(res => res.json()).then(data => {
  console.log("Analysis Result:");
  console.log(data);
});
