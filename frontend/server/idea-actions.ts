"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db/drizzle";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  Videos,
  VideoComments,
  Ideas,
  InsertIdea,
  Idea,
  InsertCrewJob,
  CrewJobs,
} from "@/server/db/schema";
import { IdeaDetails } from "@/components/IdeaList";

// Define an interface for the idea object
interface IdeaData {
  video_id: string;
  comment_id: string;
  score?: number;
  description: string;
  video_title: string;
  research?: { url: string }[];
}

// Define a type for the research object
interface Research {
  url: string;
}

export async function kickoffIdeaGeneration(): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  console.log("Fetching latest 50 unused comments for user:", userId);

  // Fetch the latest 50 unused comments
  const comments = await db
    .select({
      title: Videos.title,
      comment: VideoComments.commentText,
      video_id: Videos.id,
      comment_id: VideoComments.id,
    })
    .from(VideoComments)
    .innerJoin(Videos, eq(VideoComments.videoId, Videos.id))
    .where(
      and(eq(VideoComments.userId, userId), eq(VideoComments.isUsed, false))
    )
    .orderBy(VideoComments.createdAt)
    .limit(50);

  console.log("Fetched comments:", comments);

  if (comments.length === 0) {
    throw new Error("No unused comments found to generate ideas");
  }

  const commentsString = JSON.stringify(comments);
  console.log("Formatted comments:", commentsString);

  const usedCommentIds = comments.map((comment) => comment.comment_id);

  await db
    .update(VideoComments)
    .set({ isUsed: true, updatedAt: new Date() })
    .where(
      and(
        eq(VideoComments.userId, userId),
        inArray(VideoComments.id, usedCommentIds)
      )
    );

  // Prepare request payload
  const payload = {
    inputs: { comments: commentsString },
  };

  try {
    console.log(
      "Sending POST request to CrewAI /kickoff endpoint with payload:",
      payload
    );

    // Send POST request to CrewAI /kickoff endpoint
    const kickoffResponse = await fetch(`${process.env.CREWAI_URL}/kickoff`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CREWAI_BEARER_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Received response from CrewAI /kickoff:", kickoffResponse);

    if (!kickoffResponse.ok) {
      throw new Error("Failed to initiate job with CrewAI");
    }

    const kickoffData = await kickoffResponse.json();
    console.log("Kickoff data received:", kickoffData);

    const kickoffId = kickoffData.kickoff_id;

    // Store the kickoff_id in the CrewJobs table
    const newJob: InsertCrewJob = {
      userId,
      kickoffId,
      jobState: "STARTED",
    };

    await db.insert(CrewJobs).values(newJob);
    console.log("New job inserted into CrewJobs table:", newJob);
  } catch (error) {
    console.error("Error initiating idea generation:", error);
    throw error;
  }
}

export async function processPendingJobs(): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Fetch pending or running jobs that have not been processed
  const pendingJobs = await db
    .select()
    .from(CrewJobs)
    .where(
      and(
        eq(CrewJobs.userId, userId),
        eq(CrewJobs.processed, false),
        inArray(CrewJobs.jobState, ["RUNNING", "STARTED", "PENDING"])
      )
    );

  if (pendingJobs.length === 0) {
    // No pending jobs to process
    return;
  }

  for (const job of pendingJobs) {
    try {
      // Poll the CrewAI /status/{kickoff_id} endpoint
      const statusResponse = await fetch(
        `${process.env.CREWAI_URL}/status/${job.kickoffId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.CREWAI_BEARER_TOKEN}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to fetch job status from CrewAI for job ${job.kickoffId}`
        );
      }

      const statusData = await statusResponse.json();
      const jobState = statusData.state;

      console.log("Received status data for job:", statusData);

      // Update the CrewJobs table with the latest job state
      await db
        .update(CrewJobs)
        .set({
          jobState: jobState,
          updatedAt: new Date(),
        })
        .where(eq(CrewJobs.id, job.id));

      if (jobState === "SUCCESS") {
        // Process the job result
        const jobResult = JSON.parse(statusData.result);
        console.log("Processing job result:", jobResult);

        // Update the CrewJobs table with the job result and processed flag
        await db
          .update(CrewJobs)
          .set({
            jobResult: JSON.stringify(jobResult),
            processed: true,
            updatedAt: new Date(),
          })
          .where(eq(CrewJobs.id, job.id));

        // Parse the ideas from the job result and insert into Ideas table
        const ideasData = jobResult;
        const newIdeas: InsertIdea[] = ideasData.map((idea: IdeaData) => ({
          userId,
          videoId: idea.video_id,
          commentId: idea.comment_id,
          score: idea.score || 0,
          videoTitle: idea.video_title,
          description: idea.description,
          research: idea.research
            ? idea.research.map((r: Research) => r.url)
            : [],
        }));

        await db.insert(Ideas).values(newIdeas);
      }
    } catch (error) {
      console.error(`Error processing job ${job.kickoffId}:`, error);
    }
  }
}

export async function checkForUnprocessedJobs(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Fetch jobs that are not yet processed and are either running or pending
  const unprocessedJobs = await db
    .select()
    .from(CrewJobs)
    .where(
      and(
        eq(CrewJobs.userId, userId),
        eq(CrewJobs.processed, false),
        inArray(CrewJobs.jobState, ["RUNNING", "STARTED", "PENDING"])
      )
    );

  const hasUnprocessedJobs = unprocessedJobs.length > 0;
  return hasUnprocessedJobs;
}

export async function getNewIdeas(): Promise<Idea[]> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const ideas = await db
    .select()
    .from(Ideas)
    .where(eq(Ideas.userId, userId))
    .orderBy(desc(Ideas.createdAt));

  return ideas;
}

export async function getIdeaDetails(
  videoId: string,
  commentId: string
): Promise<IdeaDetails> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [video] = await db
    .select({
      title: Videos.title,
    })
    .from(Videos)
    .where(eq(Videos.id, videoId));

  const [comment] = await db
    .select({
      commentText: VideoComments.commentText,
    })
    .from(VideoComments)
    .where(eq(VideoComments.id, commentId));

  return {
    videoTitle: video?.title || "Video not found",
    commentText: comment?.commentText || "Comment not found",
  };
}