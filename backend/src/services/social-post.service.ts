import { db } from "../db";
import { socialPosts, activityLog } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const SOCIAL_PLATFORMS = [
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "instagram_reels", label: "Instagram Reels" },
  { id: "facebook_reels", label: "Facebook Reels" },
  { id: "tiktok", label: "TikTok" },
];

function calcScores(post: any) {
  const views = Number(post.views) || 0;
  const likes = Number(post.likes) || 0;
  const comments = Number(post.comments) || 0;
  const shares = Number(post.shares) || 0;
  const saves = Number(post.saves) || 0;
  const clicks = Number(post.clicks) || 0;

  const contentScore = Math.round(
    views * 1 + likes * 3 + comments * 8 + shares * 10 + saves * 6 + clicks * 4
  );

  const interactions = likes + comments + shares + saves + clicks;
  // stored as integer bps*100: 8.75% => 875
  const rate = views > 0 ? Math.min(100, (interactions / views) * 100) : 0;
  const engagementRate = Math.round(rate * 100);

  return { contentScore, engagementRate };
}

function generateId() {
  return `SCL-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export class SocialPostService {
  static async getAllByProject(userId: string, projectId: string) {
    return db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.userId, userId), eq(socialPosts.projectId, projectId)))
      .orderBy(socialPosts.createdAt);
  }

  static async getAllByUser(userId: string) {
    return db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.userId, userId))
      .orderBy(socialPosts.createdAt);
  }

  static async create(userId: string, projectId: string, data: any) {
    const scores = calcScores(data);
    const [created] = await db
      .insert(socialPosts)
      .values({
        id: generateId(),
        userId,
        projectId,
        platform: data.platform,
        title: data.title || "Untitled",
        postUrl: data.postUrl || null,
        publishedAt: data.publishedAt || null,
        views: Number(data.views) || 0,
        likes: Number(data.likes) || 0,
        comments: Number(data.comments) || 0,
        shares: Number(data.shares) || 0,
        saves: Number(data.saves) || 0,
        clicks: Number(data.clicks) || 0,
        contentScore: scores.contentScore,
        engagementRate: scores.engagementRate,
        status: data.status || "draft",
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(activityLog).values({
      userId,
      message: `Posting sosial ditambahkan: ${data.title} (${data.platform})`,
    });

    return created;
  }

  static async update(userId: string, projectId: string, postId: string, data: any) {
    const existing = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.userId, userId), eq(socialPosts.id, postId)))
      .limit(1);

    if (!existing.length) throw new Error("Social post not found");

    const scores = calcScores({ ...existing[0], ...data });
    const updateData: any = { updatedAt: new Date() };

    if (data.platform !== undefined) updateData.platform = data.platform;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.postUrl !== undefined) updateData.postUrl = data.postUrl || null;
    if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt || null;
    if (data.views !== undefined) updateData.views = Number(data.views) || 0;
    if (data.likes !== undefined) updateData.likes = Number(data.likes) || 0;
    if (data.comments !== undefined) updateData.comments = Number(data.comments) || 0;
    if (data.shares !== undefined) updateData.shares = Number(data.shares) || 0;
    if (data.saves !== undefined) updateData.saves = Number(data.saves) || 0;
    if (data.clicks !== undefined) updateData.clicks = Number(data.clicks) || 0;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    updateData.contentScore = scores.contentScore;
    updateData.engagementRate = scores.engagementRate;

    const [updated] = await db
      .update(socialPosts)
      .set(updateData)
      .where(and(eq(socialPosts.userId, userId), eq(socialPosts.id, postId)))
      .returning();

    return updated;
  }

  static async delete(userId: string, projectId: string, postId: string) {
    const existing = await db
      .select({ title: socialPosts.title, platform: socialPosts.platform })
      .from(socialPosts)
      .where(and(eq(socialPosts.userId, userId), eq(socialPosts.id, postId)))
      .limit(1);

    if (existing.length) {
      await db.insert(activityLog).values({
        userId,
        message: `Posting sosial dihapus: ${existing[0].title} (${existing[0].platform})`,
      });
    }

    await db
      .delete(socialPosts)
      .where(and(eq(socialPosts.userId, userId), eq(socialPosts.id, postId)));

    return { success: true };
  }
}
