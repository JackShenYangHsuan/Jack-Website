'use client';

import { type ReactNode } from 'react';

/**
 * Header component props
 */
export interface HeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Actions to display on the right side */
  actions?: ReactNode;
  /** Breadcrumbs or back navigation */
  breadcrumbs?: ReactNode;
}

/**
 * Header component - Vercel Geist design system
 * Clean, spacious header with refined typography
 */
export function Header({ title, subtitle, actions, breadcrumbs }: HeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e4e4e7',
      }}
    >
      <div
        style={{
          height: '64px',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {breadcrumbs}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#18181b',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#52525b',
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
