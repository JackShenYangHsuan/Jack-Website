'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { PhaseStepperHorizontal } from '@/components/layout';
import type { ProjectSummary, ProjectStatus } from '@/types/project';

/**
 * Trash icon for delete button
 */
function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="15"
      height="15"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/**
 * Chevron right icon for open button
 */
function ChevronRightIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="14"
      height="14"
      style={style}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/**
 * Status colors - Geist design with muted tones
 */
const statusColors: Record<ProjectStatus, string> = {
  discover: '#18181b',
  style: '#18181b',
  storyboard: '#18181b',
  images: '#18181b',
  videos: '#18181b',
  stitch: '#18181b',
  audio: '#18181b',
  complete: '#22c55e',
};

/**
 * Status display names
 */
const statusNames: Record<ProjectStatus, string> = {
  discover: 'Discovery',
  style: 'Style',
  storyboard: 'Storyboard',
  images: 'Images',
  videos: 'Videos',
  stitch: 'Stitch',
  audio: 'Audio',
  complete: 'Complete',
};

/**
 * Project card props
 */
export interface ProjectCardProps {
  /** Project data */
  project: ProjectSummary;
  /** Delete handler */
  onDelete: (id: string) => void;
}

/**
 * Project card component - Geist design system
 */
export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const projectRoute = `/projects/${project.id}/${project.status === 'complete' ? 'stitch' : project.status}`;
  const statusColor = statusColors[project.status];

  return (
    <Link
      href={projectRoute}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'block',
        padding: '20px',
        backgroundColor: '#ffffff',
        border: isHovered ? '1px solid #a1a1aa' : '1px solid #e4e4e7',
        borderRadius: '12px',
        textDecoration: 'none',
        transition: 'all 150ms ease',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none',
      }}
    >
      {/* Header: Name and Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '12px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontWeight: 600,
              color: '#18181b',
              fontSize: '15px',
              lineHeight: 1.4,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.name}
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: '#71717a',
              marginTop: '4px',
              margin: 0,
            }}
          >
            Updated {formatRelativeTime(project.updatedAt)}
          </p>
        </div>

        {/* Status badge - minimal dot style */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: statusColor,
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: statusColor,
            }}
          >
            {statusNames[project.status]}
          </span>
        </div>
      </div>

      {/* Tagline preview */}
      {project.tagline && (
        <p
          style={{
            fontSize: '14px',
            color: '#52525b',
            marginBottom: '16px',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {truncate(project.tagline, 100)}
        </p>
      )}

      {/* Progress indicator */}
      <div style={{ marginBottom: '16px' }}>
        <PhaseStepperHorizontal currentPhase={project.status} />
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid #e4e4e7',
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(project.id);
          }}
          onMouseEnter={() => setDeleteHovered(true)}
          onMouseLeave={() => setDeleteHovered(false)}
          style={{
            padding: '8px',
            marginLeft: '-8px',
            borderRadius: '8px',
            color: deleteHovered ? '#ef4444' : '#71717a',
            backgroundColor: deleteHovered ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            opacity: isHovered ? 1 : 0,
            transition: 'all 150ms',
          }}
          aria-label="Delete project"
        >
          <TrashIcon />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: 500,
            color: isHovered ? '#18181b' : '#52525b',
            transition: 'all 150ms',
          }}
        >
          <span>Open project</span>
          <ChevronRightIcon
            style={{
              transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
              transition: 'transform 150ms',
            }}
          />
        </div>
      </div>
    </Link>
  );
}
