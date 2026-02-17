import { Filament } from '@/lib/api/spoolman';

interface SpoolColorSwatchProps {
  filament: Filament;
  size?: string;
  className?: string;
  /** For inline styles (e.g., label-cell print layout) */
  style?: React.CSSProperties;
}

/**
 * Renders a color swatch for a filament.
 * - Single color: solid circle
 * - Multi-color coaxial: vertical stripes (side by side)
 * - Multi-color longitudinal: horizontal stripes (top to bottom)
 */
export function SpoolColorSwatch({ filament, size = 'h-8 w-8', className = '', style }: SpoolColorSwatchProps) {
  const colors = filament.multi_color_hexes
    ? filament.multi_color_hexes.split(',')
    : null;

  if (colors && colors.length > 1) {
    const isLongitudinal = filament.multi_color_direction === 'longitudinal';
    return (
      <div
        className={`${size} rounded-full overflow-hidden flex ${isLongitudinal ? 'flex-col' : 'flex-row'} flex-shrink-0 ${className}`}
        style={{ border: '2px solid var(--border)', ...style }}
      >
        {colors.map((hex, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: `#${hex}` }}
          />
        ))}
      </div>
    );
  }

  const hex = filament.color_hex || (colors?.[0]) || 'cccccc';
  return (
    <div
      className={`${size} rounded-full flex-shrink-0 ${className}`}
      style={{ backgroundColor: `#${hex}`, border: '2px solid var(--border)', ...style }}
    />
  );
}
