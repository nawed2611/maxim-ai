import {
  getJobToRun,
  markCompleted,
  pushJob,
} from "../controller/job.controller.js";
import express, { Request, Response } from "express";
const router = express.Router();

router.post("/", (req: Request, res: Response) => pushJob(req, res));
router.get("/jobToRun", async (req: Request, res: Response) => {
  try {
    await getJobToRun(req, res);
  } catch (error) {
    console.error("Error in /jobToRun:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/markCompleted", (req: Request, res: Response) =>
  markCompleted(req, res)
);

export default router;
