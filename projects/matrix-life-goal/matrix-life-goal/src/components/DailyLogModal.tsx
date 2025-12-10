import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Goal } from '../types/goal';

interface DailyLogModalProps {
  checkInGoals: Goal[];
  onMarkDone: (goalId: string, date: string) => void;
  onSkip: (goalId: string) => void;
  onClose: () => void;
}

interface CardState {
  goalId: string;
  text: string;
  action: 'done' | 'skipped' | null;
}

export const DailyLogModal: React.FC<DailyLogModalProps> = ({
  checkInGoals,
  onMarkDone,
  onSkip,
  onClose,
}) => {
  // Get today's date in local format (computed once)
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Initialize cards ONCE when modal opens - use a ref to track if initialized
  const [cards, setCards] = useState<CardState[]>(() =>
    checkInGoals.map((goal) => ({
      goalId: goal.id,
      text: goal.text,
      action: null as 'done' | 'skipped' | null,
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState<'left' | 'right' | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Track pending actions to apply when modal closes
  const pendingActionsRef = React.useRef<{ goalId: string; action: 'done' | 'skipped' }[]>([]);

  // Apply all pending actions when modal closes
  const handleClose = () => {
    pendingActionsRef.current.forEach(({ goalId, action }) => {
      if (action === 'done') {
        onMarkDone(goalId, todayStr);
      } else {
        onSkip(goalId);
      }
    });
    onClose();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSummary) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          handleClose();
        }
        return;
      }

      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (animating) return; // Prevent rapid key presses during animation

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipe('right');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipe('left');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length, animating, showSummary]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= cards.length) return;

    setAnimating(direction);

    // Update the card's action
    const newCards = [...cards];
    const action = direction === 'right' ? 'done' : 'skipped';
    newCards[currentIndex].action = action;
    setCards(newCards);

    // Queue the action to be applied when modal closes
    pendingActionsRef.current.push({
      goalId: cards[currentIndex].goalId,
      action,
    });

    // Animate and move to next card
    setTimeout(() => {
      setAnimating(null);
      if (currentIndex + 1 >= cards.length) {
        setShowSummary(true);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }, 300);
  };

  // Calculate summary stats
  const doneCount = cards.filter((c) => c.action === 'done').length;
  const skippedCount = cards.filter((c) => c.action === 'skipped').length;

  // Render summary view
  if (showSummary) {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg
              width="32"
              height="32"
              fill="none"
              stroke="#fff"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#000',
              marginBottom: '8px',
            }}
          >
            Daily Log Complete
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '32px',
            }}
          >
            {doneCount} marked done, {skippedCount} skipped
          </p>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              backgroundColor: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000';
            }}
          >
            Done
          </button>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
            Press Enter or Esc to close
          </p>
        </div>
      </div>,
      document.body
    );
  }

  // No cards to show
  if (cards.length === 0) {
    return null;
  }

  const currentCard = cards[currentIndex];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Progress indicator */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '8px',
          }}
        >
          {cards.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  idx < currentIndex
                    ? '#10B981'
                    : idx === currentIndex
                    ? '#000'
                    : '#D1D5DB',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Card stack */}
        <div
          style={{
            position: 'relative',
            width: '320px',
            height: '200px',
          }}
        >
          {/* Background cards (stacked effect) */}
          {currentIndex + 2 < cards.length && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '100%',
                height: '100%',
                backgroundColor: '#E5E7EB',
                borderRadius: '16px',
                transform: 'scale(0.94)',
              }}
            />
          )}
          {currentIndex + 1 < cards.length && (
            <div
              style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                width: '100%',
                height: '100%',
                backgroundColor: '#F3F4F6',
                borderRadius: '16px',
                transform: 'scale(0.97)',
              }}
            />
          )}

          {/* Current card */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              transform: animating
                ? animating === 'right'
                  ? 'translateX(150%) rotate(15deg)'
                  : 'translateX(-150%) rotate(-15deg)'
                : 'translateX(0) rotate(0)',
              opacity: animating ? 0 : 1,
              transition: 'all 0.3s ease-out',
            }}
          >
            <p
              style={{
                fontSize: '18px',
                fontWeight: 500,
                color: '#000',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              {currentCard?.text}
            </p>
          </div>
        </div>

        {/* Action hints */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="#EF4444"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>Skip</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#D1FAE5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="#10B981"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>Done</span>
          </div>
        </div>

        {/* Keyboard hints */}
        <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
          Use ← → arrow keys &bull; Esc to close
        </p>

        {/* Counter */}
        <p style={{ fontSize: '14px', color: '#666' }}>
          {currentIndex + 1} / {cards.length}
        </p>
      </div>
    </div>,
    document.body
  );
};
