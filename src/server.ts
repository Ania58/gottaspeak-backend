import "dotenv/config";  
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import materialsRouter from "./models/materials/material.routes";
import configRouter from "./models/config/config.routes";
import notesRouter from "./models/notes/note.routes";
import progressRouter from "./models/progress/progress.routes";
import messagesRouter from "./models/messages/message.routes"; 
import contactRouter from "./models/contact/contact.routes";
import supportMailRouter from "./models/messages/support-mail.routes";
import lessonLinkRoutes from "./lessons/lesson-link.routes";
import coursesRouter from "./models/courses/course.routes"; 
import sessionRoutes from "./sessions/session.routes";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const origins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map(s => s.trim());

app.use(cors({ origin: origins }));

app.use(express.json());

app.use("/materials", materialsRouter);
app.use("/config", configRouter);
app.use("/notes", notesRouter);
app.use("/progress", progressRouter);
app.use("/messages", messagesRouter);   
app.use("/contact", contactRouter);
app.use("/support-mail", supportMailRouter);
app.use("/lessons", lessonLinkRoutes);
app.use("/courses", coursesRouter);
app.use("/sessions", sessionRoutes);

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
