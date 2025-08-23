import express from "express";

const app = express();
const PORT = 4000;

app.get("/", (_req, res) => {
  res.send("GottaSpeak backend works 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is working on http://localhost:${PORT}`);
});
