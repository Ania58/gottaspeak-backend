import "dotenv/config";  
import express from "express";
import { connectDB } from "./config/db";
import materialsRouter from "./models/materials/material.routes";
import configRouter from "./models/config/config.routes";
import notesRouter from "./models/notes/note.routes";
import progressRouter from "./models/progress/progress.routes";
import messagesRouter from "./models/messages/message.routes"; 
import contactRouter from "./models/contact/contact.routes";
import supportMailRouter from "./models/messages/support-mail.routes";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
app.use(express.json());

app.use("/materials", materialsRouter);
app.use("/config", configRouter);
app.use("/notes", notesRouter);
app.use("/progress", progressRouter);
app.use("/messages", messagesRouter);   
app.use("/contact", contactRouter);
app.use("/support-mail", supportMailRouter);

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
