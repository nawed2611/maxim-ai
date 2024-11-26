import { getJobToRun, markCompleted, pushJob, } from "../controller/job.controller.js";
import express from "express";
const router = express.Router();
router.post("/", (req, res) => pushJob(req, res));
router.get("/jobToRun", async (req, res) => {
    try {
        await getJobToRun(req, res);
    }
    catch (error) {
        console.error("Error in /jobToRun:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/markCompleted", (req, res) => markCompleted(req, res));
export default router;
//# sourceMappingURL=job.route.js.map