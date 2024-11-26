import { getJobToRun, markCompleted, pushJob } from "../controller/job.controller.js";
import express from 'express'
const router = express.Router()

router.post('/', (req, res) => pushJob(req, res));
router.get('/jobToRun', (req, res) => getJobToRun(req, res));
router.get('/markCompleted', (req, res) => markCompleted(req, res));

export default router