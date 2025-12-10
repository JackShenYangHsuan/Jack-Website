'use client';

import { cn } from '@/lib/utils';
import { formatTime, VolumeIcon } from './Timeline';
import type { VoiceoverClip, MusicTrack } from '@/types/project';

interface VoiceoverTrackProps {
  voiceovers: VoiceoverClip[];
  getSceneStartTime: (sceneOrder: number) => number;
  getClipDuration: (sceneId: string) => number;
  pixelsPerSecond: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onGenerateVoiceover: (sceneId: string) => void;
  generatingSceneId: string | null;
  muted?: boolean;
  onToggleMute?: () => void;
}

/**
 * Voiceover track showing all voiceover clips
 */
export function VoiceoverTrack({
  voiceovers,
  getSceneStartTime,
  getClipDuration,
  pixelsPerSecond,
  volume,
  onVolumeChange,
  onGenerateVoiceover,
  generatingSceneId,
  muted = false,
  onToggleMute,
}: VoiceoverTrackProps) {
  return (
    <div className="relative h-16 bg-zinc-800/50 border-t border-zinc-700">
      {/* Track label */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-zinc-900 border-r border-zinc-700 flex flex-col items-center justify-center gap-1 z-20">
        <div className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          <span className="text-[10px] text-zinc-400 font-medium">VO</span>
        </div>
        {/* Volume control */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMute}
            className={cn(
              'p-0.5 rounded transition-colors',
              muted ? 'text-red-400' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <VolumeIcon className="w-3 h-3" muted={muted} />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-10 h-1 accent-emerald-500"
          />
        </div>
      </div>

      {/* Voiceover clips */}
      <div className="absolute left-20 right-0 top-0 bottom-0 overflow-hidden">
        {voiceovers.map((vo) => {
          const startTime = getSceneStartTime(vo.sceneOrder);
          const duration = getClipDuration(vo.sceneId);
          const left = startTime * pixelsPerSecond;
          const width = Math.max(duration * pixelsPerSecond - 4, 40);
          const isGenerating = generatingSceneId === vo.sceneId;

          return (
            <div
              key={vo.id}
              className={cn(
                'absolute top-1 bottom-1 rounded flex items-center justify-center cursor-pointer transition-all group',
                vo.status === 'completed'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : vo.status === 'generating' || isGenerating
                  ? 'bg-amber-600'
                  : 'bg-zinc-600 hover:bg-zinc-500'
              )}
              style={{
                left: `${left}px`,
                width: `${width}px`,
              }}
              onClick={() => {
                if (vo.status !== 'completed' && !isGenerating) {
                  onGenerateVoiceover(vo.sceneId);
                }
              }}
              title={vo.text || 'No voiceover text'}
            >
              {/* Waveform visualization (decorative) */}
              {vo.status === 'completed' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 overflow-hidden">
                  {Array.from({ length: Math.floor(width / 4) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-white mx-px"
                      style={{
                        height: `${Math.random() * 60 + 20}%`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 flex items-center gap-1.5 px-2">
                {isGenerating || vo.status === 'generating' ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : vo.status === 'completed' ? (
                  <span className="text-[10px] text-white font-medium truncate">
                    Scene {vo.sceneOrder}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-200 font-medium">Generate</span>
                )}
              </div>

              {/* Duration badge */}
              {vo.status === 'completed' && vo.duration > 0 && (
                <div className="absolute bottom-0.5 right-1 text-[8px] text-white/70">
                  {formatTime(vo.duration)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MusicTrackProps {
  musicTracks: MusicTrack[];
  totalDuration: number;
  pixelsPerSecond: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onRemoveTrack?: (trackId: string) => void;
  muted?: boolean;
  onToggleMute?: () => void;
}

/**
 * Music track showing all music clips
 */
export function MusicTrackComponent({
  musicTracks,
  totalDuration,
  pixelsPerSecond,
  volume,
  onVolumeChange,
  onRemoveTrack,
  muted = false,
  onToggleMute,
}: MusicTrackProps) {
  return (
    <div className="relative h-14 bg-zinc-800/50 border-t border-zinc-700">
      {/* Track label */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-zinc-900 border-r border-zinc-700 flex flex-col items-center justify-center gap-1 z-20">
        <div className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="text-[10px] text-zinc-400 font-medium">MUSIC</span>
        </div>
        {/* Volume control */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMute}
            className={cn(
              'p-0.5 rounded transition-colors',
              muted ? 'text-red-400' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <VolumeIcon className="w-3 h-3" muted={muted} />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-10 h-1 accent-purple-500"
          />
        </div>
      </div>

      {/* Music clips */}
      <div className="absolute left-20 right-0 top-0 bottom-0 overflow-hidden">
        {musicTracks.length > 0 ? (
          musicTracks.map((track) => {
            const left = (track.startTime || 0) * pixelsPerSecond;
            const trackDuration = track.duration || totalDuration;
            const width = Math.max(trackDuration * pixelsPerSecond - 4, 60);
            const hasAudio = track.audioUrl && track.audioUrl.length > 0;

            return (
              <div
                key={track.id}
                className={cn(
                  'absolute top-1 bottom-1 rounded transition-all group',
                  hasAudio
                    ? 'bg-purple-600 hover:bg-purple-500'
                    : 'bg-purple-600/50'
                )}
                style={{
                  left: `${left}px`,
                  width: `${width}px`,
                }}
              >
                {/* Waveform visualization (decorative) */}
                {hasAudio && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 overflow-hidden">
                    {Array.from({ length: Math.floor(width / 6) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-white mx-0.5 rounded-full"
                        style={{
                          height: `${Math.sin(i * 0.3) * 30 + 40}%`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between h-full px-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {hasAudio ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white shrink-0">
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                        <span className="text-[10px] text-white font-medium truncate">
                          {track.name}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-[10px] text-white">Generating...</span>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  {hasAudio && onRemoveTrack && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/50 text-white/70 hover:text-white transition-all"
                      title="Remove track"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Duration and source badge */}
                {hasAudio && (
                  <div className="absolute bottom-0.5 right-1 flex items-center gap-1">
                    <span className={cn(
                      'text-[8px] px-1 rounded',
                      track.source === 'uploaded' ? 'bg-blue-500/50 text-blue-100' : 'bg-purple-800/50 text-purple-100'
                    )}>
                      {track.source === 'uploaded' ? 'Uploaded' : 'AI'}
                    </span>
                    <span className="text-[8px] text-white/70">
                      {formatTime(trackDuration)}
                    </span>
                  </div>
                )}

                {/* Fade handles (decorative for now) */}
                {hasAudio && track.fadeIn > 0 && (
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-zinc-900/80 to-transparent pointer-events-none"
                    style={{ width: `${track.fadeIn * pixelsPerSecond}px` }}
                  />
                )}
                {hasAudio && track.fadeOut > 0 && (
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-zinc-900/80 to-transparent pointer-events-none"
                    style={{ width: `${track.fadeOut * pixelsPerSecond}px` }}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
            <span>No music added</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default {
  VoiceoverTrack,
  MusicTrackComponent,
};
