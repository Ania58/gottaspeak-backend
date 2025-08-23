import "dotenv/config";  
import express from "express";
import { connectDB } from "./config/db";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.get("/", (_req, res) => {
  res.send("GottaSpeak backend works 🚀");
});

connectDB(process.env.MONGODB_URI!)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is working on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connect error:", err);
    process.exit(1);
  });
