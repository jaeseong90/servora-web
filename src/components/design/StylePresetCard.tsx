'use client'

interface StylePresetCardProps {
  name: string
  description: string
  icon: string
  colors: [string, string, string]
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

export default function StylePresetCard({
  name,
  description,
  icon,
  colors,
  selected,
  onClick,
  disabled,
}: StylePresetCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative text-left rounded-2xl p-5 border-2 transition-all duration-300 ${
        selected
          ? 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10'
          : 'border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container/50'
      } disabled:opacity-50 disabled:cursor-not-allowed group`}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-3 right-3">
          <span className="material-symbols-outlined text-purple-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="text-2xl mb-3">{icon}</div>

      {/* Name */}
      <h3 className="text-sm font-bold text-on-surface mb-1">{name}</h3>

      {/* Description */}
      <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{description}</p>

      {/* Color preview */}
      <div className="flex gap-1.5">
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border border-white/10"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </button>
  )
}
