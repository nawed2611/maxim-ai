# Distributed Job Queue System

[Code Walkthrough](https://youtu.be/EQ1xny1F_vg)

The job queue system is a distributed system that allows you to process jobs in a queue. It is designed to work with redis and is implemented using Node.js and Express.js. It provides three core functions: push, listen, and mark-completed.

The push function is used to insert a new job into the queue, the listen function is used to retrieve a job for processing, and the mark-completed function is used to mark a job as completed.

The proposed solution is a distributed job queue system that uses redis as the underlying database. There is a queue for each topic, and each topic has a processing queue and a main queue. The main queue is used to queue jobs that are ready to be processed, while the processing queue is used to hold jobs that are currently being processed.

## Functions

1. push: Insert a new job into the queue
2. listen: Retrieve a job for processing
3. mark-completed: Mark the job as completed

## Features

1. When a job is pushed into the queue, it should be added to the main queue.
2. When a job is retrieved from the main queue, it should be moved to the processing queue.
3. When a job is marked as completed, it should be removed from the processing queue and from the main queue.
4. The system should be able to handle multiple topics.
5. The system should be able to handle multiple jobs with the same topic.
6. The system should be able to remove jobs that are not picked up from the processing queue within a 60s window. Unpicked jobs should be moved back to the main queue. The retry mechanism handles this.

## Redis Implementation

The redis implementation is done using the redis client library and redis-commander for the GUI interface. The client library is used to connect to the redis server and listen for events.

rPush: Add a job to the end of the queue.
lPop: Remove and return the first element from a queue.
lRem: Remove specific elements from a queue.

## API Endpoints

BASE URL - `/api/jobs`

1. Push Job to Queue
   URL: `/`
   Method: `POST`
   Description: Add a new job to a specified topic in the queue.
   Request:

Body:

```json
{
  "job": {
    "id": "job3",
    "type": "email"
  },
  "topic": "emails"
}
```

Response:

```json
{
  "jobId": "emails:1732616363278",
  "message": "Job added successfully"
}
```

Fields:
jobId: Unique identifier for the job.
message: Confirmation message.

2. Retrieve Job for Processing
   URL: `/jobToRun`
   Method: `GET`
   Description: Retrieve the next available job from a specified topic and move it to the processing list.
   Request:

Query Parameters:

```plaintext
?topic=emails
```

Response:

```json
{
  "job": {
    "jobId": "emails:1732629187051",
    "createdAt": 1732629187051,
    "updatedAt": 1732632641123,
    "retryCount": 0,
    "id": "job2",
    "type": "email"
  },
  "message": "Job to run"
}
```

Fields:
job: The job object to be processed.
message: Status message.

Error Response:

No Job Available:

```json
{
  "message": "No job available"
}
```

3. Mark Job as Completed
   URL: `/mark`
   Method: `POST`
   Description: Mark a job in the processing list as completed.
   Request:

Body:

```json
{
  "jobId": "emails:1732616363278",
  "topic": "emails"
}
```

Response:

```json
{
  "message": "Job completed successfully",
  "job": {
    "jobId": "emails:1732616363278",
    "createdAt": 1732616363278,
    "updatedAt": 1732616511348,
    "retryCount": 0
  }
}
```

Fields:
message: Confirmation message.
job: The completed job object.
Error Response:

Job Not Found:

```json
{
  "message": "Job not found or already processed"
}
```

Error Handling
`400 Bad Request`: Missing or invalid parameters.
`404 Not Found`: No job available or specified job not found.

Retry Mechanism (Background Process)
Job Recovery:
Jobs not marked as completed within 60 seconds are automatically retried.
Jobs with more than 3 retries are removed from the system.
