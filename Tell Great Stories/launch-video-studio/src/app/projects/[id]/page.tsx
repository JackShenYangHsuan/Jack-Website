import { redirect } from 'next/navigation';
import { loadProject } from '@/lib/storage';

/**
 * Project overview page
 * Redirects to the current phase
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await loadProject(id);

  if (!project) {
    redirect('/projects');
  }

  // Redirect to the current phase
  const phase = project.status === 'complete' ? 'stitch' : project.status;
  redirect(`/projects/${id}/${phase}`);
}
