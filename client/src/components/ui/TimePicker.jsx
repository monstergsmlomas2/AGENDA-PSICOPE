import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function Drum({ items, selected, onSelect }) {
  const ref = useRef(null);
  const itemHeight = 40;

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * itemHeight;
    }
  }, [selected, items]);

  const handleScroll = () => {
    const idx = Math.round(ref.current.scrollTop / itemHeight);
    if (items[idx] !== undefined) onSelect(items[idx]);
  };

  return (
    <div className="relative w-20 overflow-hidden" style={{ height: itemHeight * 5 }}>
      <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: itemHeight * 2, height: itemHeight, background: 'rgba(219,39,119,0.15)', borderTop: '2px solid rgb(219,39,119)', borderBottom: '2px solid rgb(219,39,119)', borderRadius: 6 }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="overflow-y-scroll h-full scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
      >
        <div style={{ paddingTop: itemHeight * 2, paddingBottom: itemHeight * 2 }}>
          {items.map((item) => (
            <div
              key={item}
              onClick={() => onSelect(item)}
              style={{ height: itemHeight, scrollSnapAlign: 'center' }}
              className={`flex items-center justify-center text-xl font-bold cursor-pointer transition-colors select-none ${item === selected ? 'text-pink-500 dark:text-teal-400' : 'text-slate-900 dark:text-gray-500'}`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TimePicker({ value, onChange, className, placeholder }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const parts = (value || '00:00').substring(0, 5).split(':');
  const currentHour = parts[0].padStart(2, '0');
  const rawMin = parseInt(parts[1] || '0');
  const currentMinute = String(Math.round(rawMin / 5) * 5 % 60).padStart(2, '0');

  const [hour, setHour] = useState(currentHour);
  const [minute, setMinute] = useState(currentMinute);

  useEffect(() => {
    const parts = (value || '00:00').substring(0, 5).split(':');
    setHour(parts[0].padStart(2, '0'));
    const rawMin = parseInt(parts[1] || '0');
    setMinute(String(Math.round(rawMin / 5) * 5 % 60).padStart(2, '0'));
  }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        onChange(`${hour}:${minute}`);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [hour, minute, onChange]);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }
    setOpen((v) => !v);
  };

  const handleConfirm = () => {
    onChange(`${hour}:${minute}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`text-left ${className || ''}`}
      >
        {value ? value.substring(0, 5) : placeholder || 'HH:mm'}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white dark:bg-gray-900 border border-purple-300 dark:border-gray-700 rounded-2xl shadow-2xl p-4"
          style={{ top: dropdownPos.top, left: dropdownPos.left, minWidth: 200 }}
        >
          <div className="flex items-center justify-center gap-2">
            <Drum items={HOURS} selected={hour} onSelect={setHour} />
            <span className="text-pink-500 dark:text-teal-400 text-2xl font-bold mb-1">:</span>
            <Drum items={MINUTES} selected={minute} onSelect={setMinute} />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-1.5 text-sm text-slate-900 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white transition-colors">Cancelar</button>
            <button type="button" onClick={handleConfirm} className="px-4 py-1.5 text-sm bg-pink-500 hover:bg-pink-400 dark:bg-teal-500 dark:hover:bg-teal-400 text-white rounded-lg font-semibold transition-colors">Aceptar</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}





