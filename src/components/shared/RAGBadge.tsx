import React from 'react';
import { RAGStatus } from '../../types';

interface RAGBadgeProps {
  status: RAGStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusColors: Record<RAGStatus, { bg: string; text: string; label: string }> = {
  red: { bg: 'bg-rag-red', text: 'text-rag-red', label: 'Red Status' },
  amber: { bg: 'bg-rag-amber', text: 'text-rag-amber', label: 'Amber Status' },
  green: { bg: 'bg-rag-green', text: 'text-rag-green', label: 'Green Status' },
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export const RAGBadge: React.FC<RAGBadgeProps> = ({
  status,
  size = 'md',
  showLabel = false,
}) => {
  const { bg, text, label } = statusColors[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`${sizeClasses[size]} ${bg} rounded-full`} />
      {showLabel && (
        <span className={`text-sm font-medium ${text} capitalize`}>{status}</span>
      )}
    </div>
  );
};

interface RAGStatusLabelProps {
  status: RAGStatus;
}

export const RAGStatusLabel: React.FC<RAGStatusLabelProps> = ({ status }) => {
  const { bg } = statusColors[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} text-white capitalize`}
    >
      {status}
    </span>
  );
};
