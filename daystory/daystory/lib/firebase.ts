import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase credentials. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
  }

  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

export const db = getFirestore();
export const storage = getStorage();

export interface Story {
  id: string;
  userId: string;
  userName: string;
  date: string;
  characterId: string;
  characterName: string;
  script: {
    title: string;
    logline: string;
    scenes: any[];
    totalDuration: string;
  };
  events: any[];
  videoUrl?: string;
  thumbnailUrl?: string;
  videoProvider?: "mock" | "sora" | null;
  videoJobId?: string | null;
  createdAt: Date;
  status: "script_generated" | "video_generating" | "completed";
}

export async function saveStory(story: Omit<Story, "id" | "createdAt">): Promise<string> {
  const storyRef = db.collection("stories").doc();

  const storyData: Story = {
    ...story,
    id: storyRef.id,
    videoProvider: story.videoProvider ?? null,
    videoJobId: story.videoJobId ?? null,
    createdAt: new Date(),
  };

  await storyRef.set(storyData);

  return storyRef.id;
}

export async function getStoriesByUser(userId: string): Promise<Story[]> {
  const snapshot = await db
    .collection("stories")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as Story);
}

export async function getStoryById(storyId: string): Promise<Story | null> {
  const doc = await db.collection("stories").doc(storyId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as Story;
}

export async function updateStoryStatus(
  storyId: string,
  status: Story["status"],
  options: {
    videoUrl?: string;
    thumbnailUrl?: string;
    videoProvider?: Story["videoProvider"];
    videoJobId?: string | null;
  } = {}
): Promise<void> {
  const updateData: Record<string, unknown> = { status };

  if (options.videoUrl !== undefined) updateData.videoUrl = options.videoUrl;
  if (options.thumbnailUrl !== undefined) updateData.thumbnailUrl = options.thumbnailUrl;
  if (options.videoProvider !== undefined) updateData.videoProvider = options.videoProvider;
  if (options.videoJobId !== undefined) updateData.videoJobId = options.videoJobId;

  await db.collection("stories").doc(storyId).update(updateData);
}

export interface UserSettings {
  openAIApiKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const doc = await db.collection("userSettings").doc(userId).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as UserSettings;
}

export async function upsertUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  const docRef = db.collection("userSettings").doc(userId);
  const snapshot = await docRef.get();

  const data: Record<string, unknown> = {
    ...settings,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!snapshot.exists) {
    data.createdAt = FieldValue.serverTimestamp();
  }

  await docRef.set(data, { merge: true });
}

export async function deleteUserOpenAIApiKey(userId: string): Promise<void> {
  await db.collection("userSettings").doc(userId).set(
    {
      openAIApiKey: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
