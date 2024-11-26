# Distributed Job Queue System

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

1. 


