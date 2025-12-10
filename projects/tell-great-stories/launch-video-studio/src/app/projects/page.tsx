'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button, Modal, useToast } from '@/components/ui';
import { ProjectList, NewProjectModal } from '@/components/projects';
import type { ProjectSummary, CreateProjectInput } from '@/types/project';

/**
 * Plus icon for new project button
 */
function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="16"
      height="16"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/**
 * Projects page component
 * Lists all projects with create and delete functionality
 */
export default function ProjectsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; projectId: string | null }>({
    open: false,
    projectId: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  // Load projects on mount
  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      } else {
        addToast({ type: 'error', message: 'Failed to load projects' });
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      addToast({ type: 'error', message: 'Failed to load projects' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Create new project
  async function handleCreateProject(input: CreateProjectInput) {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const data = await response.json();
      addToast({ type: 'success', message: 'Project created successfully' });

      // Navigate to the discovery phase for the new project
      router.push(`/projects/${data.project.id}/discover`);
    } catch (error) {
      console.error('Error creating project:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create project',
      });
      throw error;
    }
  }

  // Confirm delete
  function handleDeleteClick(projectId: string) {
    setDeleteModal({ open: true, projectId });
  }

  // Execute delete
  async function handleConfirmDelete() {
    if (!deleteModal.projectId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteModal.projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteModal.projectId));
        addToast({ type: 'success', message: 'Project deleted' });
      } else {
        const error = await response.json();
        addToast({ type: 'error', message: error.error || 'Failed to delete project' });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      addToast({ type: 'error', message: 'Failed to delete project' });
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, projectId: null });
    }
  }

  return (
    <div>
      <Header
        title="Projects"
        subtitle={projects.length > 0 ? `${projects.length} project${projects.length !== 1 ? 's' : ''}` : undefined}
        actions={
          <button
            onClick={() => setShowNewModal(true)}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '40px',
              padding: '0 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: buttonHovered ? '#171717' : '#18181b',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 150ms',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            <PlusIcon />
            New Project
          </button>
        }
      />

      <div style={{ padding: '32px' }}>
        <ProjectList
          projects={projects}
          loading={loading}
          onDelete={handleDeleteClick}
          onCreateNew={() => setShowNewModal(true)}
        />
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreateProject}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, projectId: null })}
        title="Delete Project"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#52525b', margin: 0 }}>
            Are you sure you want to delete this project? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, projectId: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
