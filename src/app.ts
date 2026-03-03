import express from "express";
import identifyRoute from "./routes/identify.route";

const app = express();

app.use(express.json());
app.use("/", identifyRoute);
app.get("/", (req, res) => {
  res.send("Bitespeed Identity Reconciliation API Running 🚀");
});
export default app;