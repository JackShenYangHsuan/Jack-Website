'use client';

import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import type { CreateProjectInput } from '@/types/project';

/**
 * New project modal props
 */
export interface NewProjectModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when project is created */
  onCreate: (input: CreateProjectInput) => Promise<void>;
}

/**
 * New project modal component
 * Modal for creating a new project with company name and tagline
 */
export function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; tagline?: string }>({});

  function handleClose() {
    setName('');
    setTagline('');
    setErrors({});
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    const newErrors: { name?: string; tagline?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (!tagline.trim()) {
      newErrors.tagline = 'Tagline is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onCreate({ name: name.trim(), tagline: tagline.trim() });
      handleClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Project" size="sm">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Company Name"
            placeholder="Acme Inc."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={errors.name}
            autoFocus
          />

          <Input
            label="Tagline"
            placeholder="The fastest way to do X"
            value={tagline}
            onChange={(e) => {
              setTagline(e.target.value);
              if (errors.tagline) setErrors((prev) => ({ ...prev, tagline: undefined }));
            }}
            error={errors.tagline}
            helperText="A short description of what your company does"
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #e4e4e7',
            marginTop: '24px',
            marginLeft: '-24px',
            marginRight: '-24px',
            marginBottom: '-24px',
            padding: '20px 24px 24px 24px',
          }}
        >
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
