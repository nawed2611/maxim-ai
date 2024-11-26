import { createClient } from "redis";
import express, { Request, Response } from "express";

const client = createClient();
client.connect();

client.on("error", (err) => console.log("Redis Client Error", err));

// Push Job to a Topic
export const pushJob = async (req: Request, res: Response) => {
  const { job, topic } = req.body;
  console.log("JOB IS ", job, "TOPIC IS", topic);
  const jobId = `${topic}:${Date.now()}`;
  const createdAt = Date.now();
  await client.rPush(
    `queue:${topic}`,
    JSON.stringify({ jobId, createdAt, updatedAt: createdAt, ...job })
  );

  res.status(200).json({ jobId, message: "Job added successfully" });
};

// Get Job from Topic
export const getJobToRun = async (req: Request, res: Response) => {
  const { topic } = req.query;

  if (!topic) return res.status(400).json({ message: "Topic is required" });
  console.log("TOPIC IS ", topic);

  // check if the topic exists and has a job
  const jobCount = await client.lLen(`queue:${topic}`);
  console.log("JOB COUNT IS ", jobCount);

  if (jobCount === 0) {
    return res.status(404).json({ message: "No job available" });
  }

  // Move the job to a processing list atomically
  const rawJob: any = await client.blPop(`queue:${topic}`, 60);
  console.log("RAW JOB IS ", rawJob);

  if (rawJob.element) {
    const job = JSON.parse(rawJob.element);
    job.updatedAt = Date.now();

    // Update the job in the processing list
    // await client.lRem(`processing:${topic}`, 0, rawJob);  // Remove the old job
    // await client.rPush(`processing:${topic}`, JSON.stringify(job));  // Insert updated job
    await client.rPush(`processing:${topic}`, JSON.stringify(job));

    return res.status(200).json({ job, message: "Job to run" });
  } else {
    return res.status(404).json({ message: "No job available" });
  }
};

// Mark Job as Completed
export const markCompleted = async (req: Request, res: Response) => {
  const { jobId, topic } = req.body;
  console.log("JOB ID IS ", jobId, "TOPIC IS", topic);

  const jobs = await client.lRange(`processing:${topic}`, 0, -1);
  console.log("JOBS ARE ", jobs);

  let jobToRemove: any = null;

  for (const job of jobs) {
    if (JSON.parse(job).jobId === jobId) {
      jobToRemove = job;
      break;
    }
  }

  if (jobToRemove) {
    console.log("JOB TO REMOVE IS ", jobToRemove);
    await client.lRem(`processing:${topic}`, 0, jobToRemove);
    res
      .status(200)
      .json({ message: "Job completed successfully", job: jobToRemove });
  } else {
    res.status(400).json({ message: "Job not found or already processed" });
  }
};

// Retry Mechanism (Cron Job)
const retryExpiredJobs = async () => {
  const topics = await client.keys("processing:*");
  const now = Date.now();

  for (const topic of topics) {
    const jobs = await client.lRange(topic, 0, -1);
    console.log("JOBS ARE ", jobs);

    for (const job of jobs) {
      const { jobId, createdAt, updatedAt } = JSON.parse(job);

      console.log(
        "JOB ID IS ",
        jobId,
        "Updated IS",
        updatedAt,
        "CreatedAt IS",
        createdAt,
        "Now IS",
        now,
        "DIFFERENCE IS",
        now - updatedAt,
        "SHOULD BE MOVED? ",
        now - updatedAt > 60000
      );

      if (now - updatedAt > 60000) {
        // Move job back to the main queue
        await client.lRem(topic, 0, job);
        await client.rPush(`queue:${topic.split(":")[1]}`, job);
      }
    }
  }
};

setInterval(retryExpiredJobs, 10000);
