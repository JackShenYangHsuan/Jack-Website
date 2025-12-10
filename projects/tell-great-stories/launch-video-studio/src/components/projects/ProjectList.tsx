'use client';

import { useState } from 'react';
import { ProjectCard } from './ProjectCard';
import type { ProjectSummary } from '@/types/project';

/**
 * Film/Clapperboard icon for empty state - modern and bold
 */
function FilmIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '44px', height: '44px', color: '#52525b' }}
    >
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

/**
 * Plus icon for create button
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
 * Loading skeleton for project card
 */
function ProjectCardSkeleton() {
  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e4e4e7',
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: '20px',
              width: '128px',
              backgroundColor: '#f4f4f5',
              borderRadius: '6px',
            }}
          />
          <div
            style={{
              height: '16px',
              width: '96px',
              backgroundColor: '#f4f4f5',
              borderRadius: '6px',
              marginTop: '8px',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#f4f4f5',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              height: '16px',
              width: '64px',
              backgroundColor: '#f4f4f5',
              borderRadius: '6px',
            }}
          />
        </div>
      </div>

      {/* Tagline skeleton */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            height: '16px',
            width: '100%',
            backgroundColor: '#f4f4f5',
            borderRadius: '6px',
            marginBottom: '8px',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '75%',
            backgroundColor: '#f4f4f5',
            borderRadius: '6px',
          }}
        />
      </div>

      {/* Progress skeleton */}
      <div
        style={{
          height: '4px',
          width: '100%',
          backgroundColor: '#f4f4f5',
          borderRadius: '2px',
          marginBottom: '16px',
        }}
      />

      {/* Footer skeleton */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid #e4e4e7',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#f4f4f5',
            borderRadius: '6px',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '80px',
            backgroundColor: '#f4f4f5',
            borderRadius: '6px',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Project list props
 */
export interface ProjectListProps {
  /** List of projects */
  projects: ProjectSummary[];
  /** Loading state */
  loading?: boolean;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** Create new project handler */
  onCreateNew: () => void;
}

/**
 * Project list component
 * Grid of project cards with empty state
 */
export function ProjectList({ projects, loading, onDelete, onCreateNew }: ProjectListProps) {
  const [buttonHovered, setButtonHovered] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}
      >
        {[1, 2, 3].map((i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state - Vercel Geist style
  if (projects.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          {/* Large icon container */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '16px',
              background: 'linear-gradient(to bottom, #f8f8f8, #f0f0f0)',
              border: '1px solid #e4e4e7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 32px auto',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <FilmIcon />
          </div>

          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#18181b',
              marginBottom: '8px',
              letterSpacing: '-0.01em',
            }}
          >
            No projects yet
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#52525b',
              marginBottom: '32px',
              lineHeight: 1.6,
              maxWidth: '320px',
              margin: '0 auto 32px auto',
            }}
          >
            Create your first project to start building an AI-generated launch video for your startup.
          </p>

          <button
            onClick={onCreateNew}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '44px',
              padding: '0 20px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              backgroundColor: buttonHovered ? '#171717' : '#18181b',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 150ms',
              boxShadow: buttonHovered ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <PlusIcon />
            Create your first project
          </button>
        </div>
      </div>
    );
  }

  // Projects grid
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
      }}
    >
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onDelete={onDelete} />
      ))}
    </div>
  );
}
