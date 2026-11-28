import React, { useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface PatternLockInputProps {
  value: string;
  onChange: (pattern: string) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

const DOT_COORDS = [
  { x: 32, y: 32 },
  { x: 100, y: 32 },
  { x: 168, y: 32 },
  { x: 32, y: 100 },
  { x: 100, y: 100 },
  { x: 168, y: 100 },
  { x: 32, y: 168 },
  { x: 100, y: 168 },
  { x: 168, y: 168 },
];

export const PatternLockInput: React.FC<PatternLockInputProps> = ({
  value,
  onChange,
  disabled = false,
  label = '3x3 Security Pattern Lock',
  helperText = 'Drag across or tap at least 4 dots in order',
}) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  const selected = value
    ? value
        .split('-')
        .map(Number)
        .filter(n => Number.isInteger(n) && n >= 0 && n <= 8)
    : [];

  const appendDot = (idx: number, current: number[]) => {
    if (disabled || current.includes(idx)) return;
    const next = [...current, idx];
    onChange(next.join('-'));
  };

  const dotFromPointer = (clientX: number, clientY: number): number | null => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const relX = ((clientX - rect.left) / rect.width) * 200;
    const relY = ((clientY - rect.top) / rect.height) * 200;
    for (let i = 0; i < DOT_COORDS.length; i += 1) {
      const dx = relX - DOT_COORDS[i].x;
      const dy = relY - DOT_COORDS[i].y;
      if (Math.hypot(dx, dy) <= 22) {
        return i;
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const hit = dotFromPointer(e.clientX, e.clientY);
    setDrawing(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (hit !== null) {
      onChange(String(hit));
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing || disabled) return;
    const hit = dotFromPointer(e.clientX, e.clientY);
    if (hit !== null) {
      appendDot(hit, selected);
    }
  };

  const stopDrawing = () => setDrawing(false);

  const polylinePoints = selected.map(i => `${DOT_COORDS[i].x},${DOT_COORDS[i].y}`).join(' ');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-600">{label}</label>
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={disabled || selected.length === 0}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#2855A6] disabled:opacity-40"
        >
          <RotateCcw className="w-3 h-3" />
          Clear ({selected.length} dots)
        </button>
      </div>

      <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50/80 py-3 px-4">
        <div
          ref={boardRef}
          role="group"
          aria-label={label}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
          className="relative w-44 h-44 select-none touch-none"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full pointer-events-none">
            {selected.length > 1 && (
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#2855A6"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.75"
              />
            )}
            {DOT_COORDS.map((coord, idx) => {
              const order = selected.indexOf(idx);
              const active = order !== -1;
              return (
                <g key={idx}>
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={active ? 16 : 12}
                    fill={active ? '#DBEAFE' : '#FFFFFF'}
                    stroke={active ? '#2855A6' : '#CBD5E1'}
                    strokeWidth={active ? 2.5 : 1.5}
                  />
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={active ? 7 : 5}
                    fill={active ? '#142B4A' : '#94A3B8'}
                  />
                  {active && (
                    <text
                      x={coord.x + 14}
                      y={coord.y - 12}
                      fontSize="10"
                      fontWeight="700"
                      fill="#142B4A"
                    >
                      {order + 1}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Accessible tap buttons for click/keyboard users */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {DOT_COORDS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Pattern dot ${idx}`}
                disabled={disabled}
                onClick={e => {
                  e.stopPropagation();
                  appendDot(idx, selected);
                }}
                className="opacity-0 cursor-pointer focus:opacity-20 focus:bg-blue-200 rounded-full"
              />
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 text-center">{helperText}</p>
      </div>
    </div>
  );
};
