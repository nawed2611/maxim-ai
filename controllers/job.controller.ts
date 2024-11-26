import { createClient } from "redis";
import express, { Request, Response } from "express";

const client = createClient();
client.connect();

client.on("error", (err) => console.log("Redis Client Error", err));

const moveJobScript = `
    local job = redis.call('lpop', KEYS[1]) -- Pop job from queue
    if job then
        redis.call('rpush', KEYS[2], job) -- Push job to processing
    end
    return job
`;

const maxRetries = 3;

// Push Job to a Topic
export const pushJob = async (req: Request, res: Response) => {
  const { job, topic } = req.body;
  console.log("JOB IS ", job, "TOPIC IS", topic);
  const jobId = `${topic}:${Date.now()}`;
  const createdAt = Date.now();

  await client.rPush(
    `queue:${topic}`,
    JSON.stringify({
      jobId,
      createdAt,
      updatedAt: createdAt,
      retryCount: 0,
      ...job,
    })
  );

  res.status(200).json({ jobId, message: "Job added successfully" });
};

// Get Job from Topic
export const getJobToRun = async (req: Request, res: Response) => {
  const { topic } = req.query;
  if (!topic) return res.status(400).json({ message: "Topic is required" });

  try {
    const rawJob: any = await client.eval(moveJobScript, {
      keys: [`queue:${topic}`, `processing:${topic}`],
    });

    if (rawJob) {
      const job = JSON.parse(rawJob);
      job.updatedAt = Date.now();

      // check if it is already in the activeJobs list
      if (await client.sIsMember("activeJobs", job.jobId)) {
        return res.status(409).json({ message: "Job already in activeJobs" });
      }

      // Update the job in the processing list with a new timestamp
      await client.lRem(`processing:${topic}`, 0, rawJob);
      await client.rPush(`processing:${topic}`, JSON.stringify(job));

      await client.sAdd("activeJobs", job.jobId);

      return res.status(200).json({ job, message: "Job to run" });
    } else {
      return res.status(404).json({ message: "No job available" });
    }
  } catch (error) {
    console.error("Error fetching job:", error);
    return res.status(500).json({ message: "Internal server error" });
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
    await client.sRem("activeJobs", jobId);
    res.status(200).json({
      message: "Job completed successfully",
      job: JSON.parse(jobToRemove),
    });
  } else {
    res.status(400).json({ message: "Job not found or already processed" });
  }
};

// Stale Jobs Mechanism
const handleStaleJobs = async () => {
  try {
    const topics = await client.keys("processing:*");
    const now = Date.now();

    for (const topic of topics) {
      const jobs = await client.lRange(topic, 0, -1);

      for (const job of jobs) {
        const jobData = JSON.parse(job);
        const { jobId, createdAt, updatedAt, retryCount } = jobData;

        if (now - updatedAt > 60000) {
          if (retryCount >= maxRetries) {
            console.log(`Job ${jobId} exceeded max retries. Removing.`);
            await client.lRem(topic, 0, job);
            continue;
          }

          console.log(
            "STALE JOB FOUND -> ",
            jobId,
            " MOVING BACK TO THE MAIN QUEUE"
          );

          // Increment retry count and move back to main queue
          jobData.retryCount += 1;
          jobData.updatedAt = now;

          // Move job back to the main queue
          await client.lRem(topic, 0, job);
          await client.rPush(`queue:${topic.split(":")[1]}`, job);
        }
      }
    }
  } catch (error) {
    console.error("Error retrying expired jobs:", error);
  }
};

setInterval(handleStaleJobs, 10000);
