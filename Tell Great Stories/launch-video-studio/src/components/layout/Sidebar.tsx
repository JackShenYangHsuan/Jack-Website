'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Play/video icon for logo - cleaner triangle play design
 */
function LogoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: '16px', height: '16px', color: '#ffffff' }}
    >
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

/**
 * Folder icon for projects - filled style for active
 */
function ProjectsIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '18px', height: '18px' }}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/**
 * Settings icon - cleaner gear
 */
function SettingsIcon({ filled }: { filled?: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: '18px', height: '18px' }}
      >
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.056a1.5 1.5 0 01-.898.877l-.607.242a1.5 1.5 0 01-1.236-.04l-1.175-.646a1.875 1.875 0 00-2.417.586l-.917 1.5a1.875 1.875 0 00.416 2.427l1.015.798a1.5 1.5 0 01.526 1.167v.608a1.5 1.5 0 01-.526 1.167l-1.015.798a1.875 1.875 0 00-.416 2.427l.917 1.5a1.875 1.875 0 002.417.586l1.175-.646a1.5 1.5 0 011.236-.04l.607.242a1.5 1.5 0 01.898.877l.178 1.239c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.239a1.5 1.5 0 01.898-.877l.607-.242a1.5 1.5 0 011.236.04l1.175.646a1.875 1.875 0 002.417-.586l.917-1.5a1.875 1.875 0 00-.416-2.427l-1.015-.798a1.5 1.5 0 01-.526-1.167v-.608a1.5 1.5 0 01.526-1.167l1.015-.798a1.875 1.875 0 00.416-2.427l-.917-1.5a1.875 1.875 0 00-2.417-.586l-1.175.646a1.5 1.5 0 01-1.236.04l-.607-.242a1.5 1.5 0 01-.898-.877l-.178-1.239a1.875 1.875 0 00-1.85-1.567h-1.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '18px', height: '18px' }}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/**
 * Navigation item
 */
interface NavItem {
  href: string;
  label: string;
  icon: typeof ProjectsIcon;
}

/**
 * Navigation items
 */
const navItems: NavItem[] = [
  { href: '/projects', label: 'Projects', icon: ProjectsIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

/**
 * Sidebar component - Vercel Geist design system
 * Clean, minimal sidebar with refined typography
 */
export function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: '220px',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #e4e4e7',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          height: '64px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Link
          href="/projects"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            <LogoIcon />
          </div>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#18181b',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              Launch
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#52525b',
                lineHeight: 1.2,
              }}
            >
              Video Studio
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 12px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isHovered = hoveredItem === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href} style={{ marginBottom: '4px' }}>
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 150ms',
                    backgroundColor: isActive
                      ? '#ffffff'
                      : isHovered
                      ? 'rgba(255, 255, 255, 0.6)'
                      : 'transparent',
                    color: isActive || isHovered ? '#18181b' : '#52525b',
                    border: isActive ? '1px solid #e4e4e7' : '1px solid transparent',
                    boxShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      color: isActive ? '#18181b' : '#71717a',
                      transition: 'color 150ms',
                    }}
                  >
                    <Icon filled={isActive} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e4e4e7',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: '#a1a1aa',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Beta
        </div>
      </div>
    </aside>
  );
}
