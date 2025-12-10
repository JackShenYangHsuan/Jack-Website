import { redirect } from 'next/navigation';

/**
 * Root page - redirects to projects
 */
export default function HomePage() {
  redirect('/projects');
}
