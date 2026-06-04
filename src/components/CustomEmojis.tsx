import React from 'react';

interface EmojiProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const AngryEmoji: React.FC<EmojiProps> = ({ size = 48, className, ...props }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    {/* Base Circle */}
    <circle cx="50" cy="50" r="45" fill="#F05A5A" stroke="#1A1C20" strokeWidth="3" />

    {/* Eyes */}
    <circle cx="34" cy="48" r="5" fill="#1A1C20" />
    <circle cx="66" cy="48" r="5" fill="#1A1C20" />

    {/* Inward-slanting dark brows (V-shape) */}
    <path d="M 22 34 L 40 40" stroke="#1A1C20" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M 78 34 L 60 40" stroke="#1A1C20" strokeWidth="4.5" strokeLinecap="round" />

    {/* Mouth curves downward (frown) */}
    <path d="M 36 67 Q 50 55 64 67" fill="none" stroke="#1A1C20" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const SadEmoji: React.FC<EmojiProps> = ({ size = 48, className, ...props }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    {/* Base Circle */}
    <circle cx="50" cy="50" r="45" fill="#6B9FD4" stroke="#1A1C20" strokeWidth="3" />

    {/* Eyes */}
    <circle cx="34" cy="48" r="5" fill="#1A1C20" />
    <circle cx="66" cy="48" r="5" fill="#1A1C20" />

    {/* Mouth curves downward (frown shape) */}
    <path d="M 36 67 Q 50 55 64 67" fill="none" stroke="#1A1C20" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const NeutralEmoji: React.FC<EmojiProps> = ({ size = 48, className, ...props }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    {/* Base Circle */}
    <circle cx="50" cy="50" r="45" fill="#9BB5CE" stroke="#1A1C20" strokeWidth="3" />

    {/* Eyes */}
    <circle cx="34" cy="48" r="5" fill="#1A1C20" />
    <circle cx="66" cy="48" r="5" fill="#1A1C20" />

    {/* Straight horizontal dark line for the mouth */}
    <line x1="34" y1="63" x2="66" y2="63" stroke="#1A1C20" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const HappyEmoji: React.FC<EmojiProps> = ({ size = 48, className, ...props }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    {/* Base Circle */}
    <circle cx="50" cy="50" r="45" fill="#F5C842" stroke="#1A1C20" strokeWidth="3" />

    {/* Eyes */}
    <circle cx="34" cy="48" r="5" fill="#1A1C20" />
    <circle cx="66" cy="48" r="5" fill="#1A1C20" />

    {/* Gentle smile curve */}
    <path d="M 36 58 Q 50 71 64 58" fill="none" stroke="#1A1C20" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const VeryHappyEmoji: React.FC<EmojiProps> = ({ size = 48, className, ...props }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    {/* Base Circle */}
    <circle cx="50" cy="50" r="45" fill="#6DC97B" stroke="#1A1C20" strokeWidth="3" />

    {/* squinting happy eyes ^ ^ */}
    <path d="M 26 48 Q 35 39 44 48" fill="none" stroke="#1A1C20" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M 56 48 Q 65 39 74 48" fill="none" stroke="#1A1C20" strokeWidth="4.5" strokeLinecap="round" />

    {/* Filled mouth grin */}
    <path d="M 32 58 Q 50 58 68 58 Q 50 78 32 58 Z" fill="#1A1C20" />
  </svg>
);

interface CustomEmojiRendererProps extends EmojiProps {
  score: number;
}

export const CustomEmoji: React.FC<CustomEmojiRendererProps> = ({ score, ...props }) => {
  switch (score) {
    case 1:
      return <AngryEmoji {...props} />;
    case 2:
      return <SadEmoji {...props} />;
    case 3:
      return <NeutralEmoji {...props} />;
    case 4:
      return <HappyEmoji {...props} />;
    case 5:
      return <VeryHappyEmoji {...props} />;
    default:
      return <NeutralEmoji {...props} />;
  }
};
