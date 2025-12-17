import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center">
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`h-8 px-3 flex items-center gap-2 transition-colors duration-70 text-sm ${
            theme === option.value
              ? 'bg-[var(--cds-layer-selected-01)] text-[var(--cds-text-primary)]'
              : 'bg-[var(--cds-field-01)] text-[var(--cds-text-secondary)] hover:bg-[var(--cds-field-hover-01)]'
          } ${index === 0 ? '' : 'border-l border-[var(--cds-border-subtle-01)]'}`}
          title={option.label}
        >
          <option.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};
