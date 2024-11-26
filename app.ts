import express from "express";
import jobRoutes from "./routes/job.route.js";
const app = express();
const port: number = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Maxim AI Distributed Job Queue System",
  });
});

app.use("/api/jobs", jobRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
