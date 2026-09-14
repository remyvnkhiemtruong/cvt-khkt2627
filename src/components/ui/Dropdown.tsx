import React, { useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface DropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right', className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  const close = (restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) close(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => itemRefs.current.find(Boolean)?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const enabledIndexes = () => items.map((item, index) => item.disabled ? -1 : index).filter(index => index >= 0);

  const moveFocus = (direction: 1 | -1) => {
    const enabled = enabledIndexes();
    if (!enabled.length) return;
    const activeIndex = itemRefs.current.findIndex(node => node === document.activeElement);
    const position = Math.max(0, enabled.indexOf(activeIndex));
    const next = enabled[(position + direction + enabled.length) % enabled.length];
    itemRefs.current[next]?.focus();
  };

  const triggerProps = trigger.props as Record<string, unknown>;
  const originalClick = triggerProps.onClick as ((event: React.MouseEvent) => void) | undefined;
  const originalKeyDown = triggerProps.onKeyDown as ((event: React.KeyboardEvent) => void) | undefined;
  const isNativeButton = typeof trigger.type === 'string' && trigger.type === 'button';
  const enhancedTrigger = React.cloneElement(trigger, {
    ref: (node: HTMLElement | null) => { triggerRef.current = node; },
    onClick: (event: React.MouseEvent) => {
      originalClick?.(event);
      if (!event.defaultPrevented) setIsOpen(previous => !previous);
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      originalKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        close();
      }
    },
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': menuId,
    ...(isNativeButton ? {} : { role: triggerProps.role || 'button', tabIndex: triggerProps.tabIndex ?? 0 })
  } as Record<string, unknown>);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {enhancedTrigger}

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              moveFocus(1);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              moveFocus(-1);
            } else if (event.key === 'Home') {
              event.preventDefault();
              const first = enabledIndexes()[0];
              if (first !== undefined) itemRefs.current[first]?.focus();
            } else if (event.key === 'End') {
              event.preventDefault();
              const indexes = enabledIndexes();
              const last = indexes[indexes.length - 1];
              if (last !== undefined) itemRefs.current[last]?.focus();
            }
          }}
          className={cn(
            'absolute z-50 mt-1.5 w-48 rounded-lg bg-white border border-slate-200 shadow-dropdown py-1 focus:outline-none animate-dropdown-panel',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item, index) => (
            <button
              ref={node => { itemRefs.current[index] = node; }}
              key={item.key}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              onClick={() => {
                item.onClick?.();
                close();
              }}
              className={cn(
                'w-full text-left px-3.5 py-2 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {item.icon && <span className="w-4 h-4 shrink-0 text-slate-400">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
