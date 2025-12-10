/**
 * Local file storage utilities
 * Handles reading and writing to the local filesystem
 *
 * Storage structure:
 * ~/launch-video-studio/
 *   ├── settings.json           # App settings
 *   └── projects/
 *       └── {project-id}/
 *           ├── project.json    # Project data
 *           ├── assets/         # Generated images, videos, audio
 *           └── exports/        # Final rendered videos
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import type { Project, ProjectSummary, CreateProjectInput } from '@/types/project';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

// ============================================================================
// File Locking - Prevents concurrent writes from corrupting JSON files
// ============================================================================

/**
 * Map of project IDs to their lock promises
 * This ensures only one write operation happens at a time per project
 */
const projectLocks = new Map<string, Promise<void>>();

/**
 * Acquire a lock for a project before writing
 * Returns a release function to call when done
 */
async function acquireProjectLock(projectId: string): Promise<() => void> {
  // Wait for any existing lock to release
  while (projectLocks.has(projectId)) {
    await projectLocks.get(projectId);
  }

  // Create a new lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  projectLocks.set(projectId, lockPromise);

  return () => {
    projectLocks.delete(projectId);
    releaseLock!();
  };
}

/**
 * Base directory for all Launch Video Studio data
 */
const BASE_DIR = path.join(os.homedir(), 'launch-video-studio');

/**
 * Path to settings file
 */
const SETTINGS_PATH = path.join(BASE_DIR, 'settings.json');

/**
 * Path to projects directory
 */
const PROJECTS_DIR = path.join(BASE_DIR, 'projects');

/**
 * Ensure a directory exists, creating it if necessary
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory already exists, ignore
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize the storage directories
 */
export async function initializeStorage(): Promise<void> {
  await ensureDir(BASE_DIR);
  await ensureDir(PROJECTS_DIR);
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Load app settings from disk
 * Returns default settings if file doesn't exist
 */
export async function loadSettings(): Promise<AppSettings> {
  try {
    await ensureDir(BASE_DIR);

    if (!(await fileExists(SETTINGS_PATH))) {
      return DEFAULT_SETTINGS;
    }

    const content = await fs.readFile(SETTINGS_PATH, 'utf-8');
    const settings = JSON.parse(content) as Partial<AppSettings>;

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      prompts: {
        ...DEFAULT_SETTINGS.prompts,
        ...settings.prompts,
      },
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save app settings to disk
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  await ensureDir(BASE_DIR);
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

/**
 * Update specific settings fields
 */
export async function updateSettings(
  updates: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await loadSettings();
  const updated = {
    ...current,
    ...updates,
    prompts: {
      ...current.prompts,
      ...updates.prompts,
    },
  };
  await saveSettings(updated);
  return updated;
}

// ============================================================================
// Projects
// ============================================================================

/**
 * Get the path to a project's directory
 */
export function getProjectDir(projectId: string): string {
  return path.join(PROJECTS_DIR, projectId);
}

/**
 * Get the path to a project's JSON file
 */
function getProjectPath(projectId: string): string {
  return path.join(getProjectDir(projectId), 'project.json');
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  await ensureDir(PROJECTS_DIR);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const project: Project = {
    id,
    name: input.name,
    status: 'discover',
    createdAt: now,
    updatedAt: now,
    storyBrief: null,
    styleGuide: null,
    storyboard: null,
    keyframes: null,
    videoClips: null,
    timeline: null,
    audio: null,
    exportData: null,
    chatHistory: [],
    branding: null,
  };

  const projectDir = getProjectDir(id);
  await ensureDir(projectDir);
  await ensureDir(path.join(projectDir, 'assets'));
  await ensureDir(path.join(projectDir, 'assets', 'references'));
  await ensureDir(path.join(projectDir, 'assets', 'keyframes'));
  await ensureDir(path.join(projectDir, 'assets', 'videos'));
  await ensureDir(path.join(projectDir, 'assets', 'audio'));
  await ensureDir(path.join(projectDir, 'assets', 'exports'));

  // Store tagline in the initial story brief (partial)
  project.storyBrief = {
    companyName: input.name,
    tagline: input.tagline,
    pain: '',
    solution: '',
    transformation: '',
    emotionalStakes: '',
    uniqueAngle: '',
    emotionalBehaviors: [],
    toneNotes: [],
    interviewTranscript: [],
  };

  await saveProject(project);

  return project;
}

/**
 * Load a project by ID
 */
export async function loadProject(projectId: string): Promise<Project | null> {
  try {
    const projectPath = getProjectPath(projectId);

    if (!(await fileExists(projectPath))) {
      return null;
    }

    const content = await fs.readFile(projectPath, 'utf-8');
    return JSON.parse(content) as Project;
  } catch (error) {
    console.error(`Error loading project ${projectId}:`, error);
    return null;
  }
}

/**
 * Save a project to disk
 * Uses file locking to prevent concurrent write corruption
 * Uses atomic write (temp file + rename) for additional safety
 */
export async function saveProject(project: Project): Promise<void> {
  const releaseLock = await acquireProjectLock(project.id);

  try {
    const projectDir = getProjectDir(project.id);
    await ensureDir(projectDir);

    project.updatedAt = new Date().toISOString();

    const projectPath = getProjectPath(project.id);
    const tempPath = `${projectPath}.tmp.${Date.now()}`;

    // Write to temp file first
    const content = JSON.stringify(project, null, 2);
    await fs.writeFile(tempPath, content, 'utf-8');

    // Verify the temp file is valid JSON before replacing
    const verification = await fs.readFile(tempPath, 'utf-8');
    JSON.parse(verification); // This will throw if invalid

    // Atomic rename - replaces the old file
    await fs.rename(tempPath, projectPath);
  } finally {
    releaseLock();
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const projectDir = getProjectDir(projectId);

  if (await fileExists(projectDir)) {
    await fs.rm(projectDir, { recursive: true, force: true });
  }
}

/**
 * List all projects as summaries
 */
export async function listProjects(): Promise<ProjectSummary[]> {
  try {
    await ensureDir(PROJECTS_DIR);

    const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
    const projectDirs = entries.filter(e => e.isDirectory());

    const summaries: ProjectSummary[] = [];

    for (const dir of projectDirs) {
      try {
        const project = await loadProject(dir.name);
        if (project) {
          // Get the first approved keyframe image for thumbnail
          const approvedKeyframe = project.keyframes?.images.find(img => img.isApproved);
          const thumbnailUrl = approvedKeyframe?.imageUrl ?? null;

          // Get the exported video URL if available
          const videoUrl = project.exportData?.status === 'completed'
            ? project.exportData.exportedVideoUrl ?? null
            : null;

          summaries.push({
            id: project.id,
            name: project.name,
            status: project.status,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            tagline: project.storyBrief?.tagline ?? null,
            hasStoryBrief: Boolean(project.storyBrief?.pain),
            videoUrl,
            thumbnailUrl,
          });
        }
      } catch (error) {
        console.error(`Error loading project ${dir.name}:`, error);
      }
    }

    // Sort by updatedAt descending (most recent first)
    summaries.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return summaries;
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
}

/**
 * Update specific project fields
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Promise<Project | null> {
  const project = await loadProject(projectId);

  if (!project) {
    return null;
  }

  const updated = {
    ...project,
    ...updates,
  };

  await saveProject(updated);
  return updated;
}

/**
 * Add a message to project chat history
 */
export async function addMessageToProject(
  projectId: string,
  message: Project['chatHistory'][0]
): Promise<void> {
  const project = await loadProject(projectId);

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  project.chatHistory.push(message);

  // Also update the interview transcript in story brief
  if (project.storyBrief) {
    project.storyBrief.interviewTranscript = project.chatHistory;
  }

  await saveProject(project);
}
