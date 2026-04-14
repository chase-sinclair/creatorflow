import { useState } from 'react'
import { motion } from 'framer-motion'

// ── Platform definitions ──────────────────────────────────────────────────────
// color: brand fill used when selected / full-opacity
// Icon: inline SVG component, viewBox 0 0 24 24

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.96a8.25 8.25 0 004.83 1.54V7.06a4.85 4.85 0 01-1.06-.37z"
        fill="#fe2c55"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ig" x1="22" y1="2" x2="2" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#833AB4" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="100%" stopColor="#F77737" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" />
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="white" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
      <path d="M10 9.5l5 2.5-5 2.5V9.5z" fill="white" />
    </svg>
  )
}

function TwitterXIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#000" />
      <path
        d="M17.5 4.5L13.28 9.5l4.72 7H15L12 12l-4.1 4.5H5.5l4.44-4.88L5.5 4.5H8.5L12 9.2l3.9-4.7h1.6z"
        fill="white"
      />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2" />
      <path
        d="M7 9.5h2.5V17H7V9.5zm1.25-3.75a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM11 9.5h2.4v1.03h.03c.34-.64 1.16-1.31 2.38-1.31 2.55 0 3.02 1.68 3.02 3.86V17h-2.5v-3.44c0-.82-.02-1.87-1.14-1.87-1.14 0-1.32.89-1.32 1.81V17H11V9.5z"
        fill="white"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#1877F2" />
      <path
        d="M15 8h-1.5C13.12 8 13 8.3 13 9v1.5h2l-.3 2H13V18h-2.5v-5.5H9v-2h1.5V9c0-2 1.2-3 2.9-3H15v2z"
        fill="white"
      />
    </svg>
  )
}

function RedditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#FF4500" />
      <path
        d="M19.5 12a1.5 1.5 0 00-2.55-1.07 7.4 7.4 0 00-3.95-1.26l.67-3.14 2.18.46a1.1 1.1 0 102.15-.06 1.1 1.1 0 00-1.1 1.1l-2.42-.52a.22.22 0 00-.26.17l-.75 3.5a7.45 7.45 0 00-3.97 1.25A1.5 1.5 0 104.86 14a2.9 2.9 0 000 .35c0 1.8 2.1 3.25 4.69 3.25s4.69-1.45 4.69-3.25a2.9 2.9 0 000-.35 1.5 1.5 0 00.76-2.75zM8.5 14.5a1 1 0 110-2 1 1 0 010 2zm3.5 2.3c-.8 0-1.5-.3-1.5-.67h3c0 .37-.7.67-1.5.67zm3.5-2.3a1 1 0 110-2 1 1 0 010 2z"
        fill="white"
      />
    </svg>
  )
}

function SnapchatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#FFFC00" />
      <path
        d="M12 5c-2.5 0-4.5 1.8-4.5 4 0 .5.1 1 .3 1.4-.3.2-.5.5-.5.8 0 .4.2.7.5.9-.1.4-.4.7-.8.9-.3.1-.5.3-.5.5 0 .4.5.7 1.5.9.1.3.2.6.5.6.2 0 .5-.1.8-.2.5-.1.9-.2 1.2-.2.3 0 .7.1 1.2.2.3.1.6.2.8.2.3 0 .4-.3.5-.6 1-.2 1.5-.5 1.5-.9 0-.2-.2-.4-.5-.5-.4-.2-.7-.5-.8-.9.3-.2.5-.5.5-.9 0-.3-.2-.6-.5-.8.2-.4.3-.9.3-1.4 0-2.2-2-4-4.5-4z"
        fill="#3D3D3D"
      />
    </svg>
  )
}

function ThreadsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#000" />
      <path
        d="M16.5 11.2c-.1-.05-.2-.1-.32-.14-.07-1.5-.9-2.36-2.28-2.36-.8 0-1.5.34-1.92.96l.8.54c.28-.42.72-.64 1.12-.64.67 0 1.1.4 1.22 1.1a6.5 6.5 0 00-1.22-.12c-1.22 0-2.4.67-2.4 1.9 0 1.16 1.01 1.86 2.15 1.86.96 0 1.7-.47 2.1-1.28.3.58.44 1.28.36 2.08-.12 1.14-.9 1.82-2.11 1.82-1.42 0-2.5-1.04-2.5-2.5s1.08-2.5 2.5-2.5c.2 0 .38.02.57.06V11c-.19-.03-.38-.05-.57-.05-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5c1.7 0 2.96-1.04 3.1-2.62.12-1.16-.18-2.18-.8-2.95zm-3.32 2.55c-.52 0-.85-.25-.85-.6 0-.42.44-.68 1.1-.68.38 0 .72.04 1.02.12-.1.72-.6 1.16-1.27 1.16z"
        fill="white"
      />
    </svg>
  )
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#E60023" />
      <path
        d="M12 4C7.58 4 4 7.58 4 12c0 3.4 2.07 6.33 5.05 7.6-.07-.63-.13-1.6.03-2.28.14-.6.95-4.03.95-4.03s-.24-.49-.24-1.21c0-1.14.66-1.99 1.48-1.99.7 0 1.04.52 1.04 1.15 0 .7-.45 1.75-.68 2.72-.19.81.4 1.47 1.19 1.47 1.43 0 2.46-1.84 2.46-4.02 0-1.66-1.12-2.82-2.72-2.82-1.85 0-2.94 1.39-2.94 2.83 0 .56.21 1.16.48 1.49.05.06.06.12.04.18l-.18.74c-.03.11-.1.13-.22.08-1.06-.5-1.72-2.06-1.72-3.31 0-2.69 1.95-5.17 5.63-5.17 2.95 0 5.25 2.1 5.25 4.91 0 2.93-1.85 5.28-4.41 5.28-.86 0-1.67-.45-1.95-.97l-.53 1.97c-.19.73-.7 1.65-1.05 2.21.79.24 1.62.38 2.5.38 4.42 0 8-3.58 8-8S16.42 4 12 4z"
        fill="white"
      />
    </svg>
  )
}

function OtherIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="2" fill="#64748b" />
      <circle cx="12" cy="7" r="2" fill="#64748b" />
      <circle cx="17" cy="7" r="2" fill="#64748b" />
      <circle cx="7" cy="12" r="2" fill="#64748b" />
      <circle cx="12" cy="12" r="2" fill="#64748b" />
      <circle cx="17" cy="12" r="2" fill="#64748b" />
      <circle cx="7" cy="17" r="2" fill="#64748b" />
      <circle cx="12" cy="17" r="2" fill="#64748b" />
      <circle cx="17" cy="17" r="2" fill="#64748b" />
    </svg>
  )
}

const PLATFORMS = [
  { id: 'TikTok',     label: 'TikTok',     Icon: TikTokIcon },
  { id: 'Instagram',  label: 'Instagram',  Icon: InstagramIcon },
  { id: 'YouTube',    label: 'YouTube',    Icon: YouTubeIcon },
  { id: 'Twitter/X',  label: 'Twitter / X', Icon: TwitterXIcon },
  { id: 'LinkedIn',   label: 'LinkedIn',   Icon: LinkedInIcon },
  { id: 'Facebook',   label: 'Facebook',   Icon: FacebookIcon },
  { id: 'Reddit',     label: 'Reddit',     Icon: RedditIcon },
  { id: 'Snapchat',   label: 'Snapchat',   Icon: SnapchatIcon },
  { id: 'Threads',    label: 'Threads',    Icon: ThreadsIcon },
  { id: 'Pinterest',  label: 'Pinterest',  Icon: PinterestIcon },
  { id: 'Other',      label: 'Other',      Icon: OtherIcon },
]

const MAX_SELECTIONS = 5

// ── Single platform tile ──────────────────────────────────────────────────────
function PlatformTile({ platform, selected, onToggle }) {
  const { Icon, label } = platform

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => onToggle(platform.id)}
      className="flex flex-col items-center gap-1.5 focus:outline-none group"
    >
      {/* Icon container */}
      <div
        className="relative rounded-xl p-0.5 transition-all duration-150"
        style={{
          boxShadow: selected ? '0 0 0 2px rgba(139,92,246,0.8)' : 'none',
          background: selected ? 'rgba(139,92,246,0.12)' : 'transparent',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            opacity: selected ? 1 : 0.55,
            transition: 'opacity 150ms ease, transform 150ms ease',
            transform: selected ? 'scale(1.05)' : 'scale(1)',
          }}
          className="group-hover:opacity-100 transition-opacity"
        >
          <Icon />
        </div>

        {/* Checkmark badge */}
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shadow-sm"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Label */}
      <span
        className="text-[11px] font-medium leading-none text-center transition-colors duration-150"
        style={{ color: selected ? '#c4b5fd' : '#64748b' }}
      >
        {label}
      </span>
    </motion.button>
  )
}

// ── Main selector card ────────────────────────────────────────────────────────
export default function PlatformSelector({ onNext }) {
  const [selected, setSelected] = useState(new Set())

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_SELECTIONS) {
        next.add(id)
      }
      return next
    })
  }

  const canProceed = selected.size > 0
  const selectedCount = selected.size

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-10 flex items-center justify-center bg-[var(--color-surface)] px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          {/* Logo mark */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/40 mx-auto mb-5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="4" cy="8" r="2.5" fill="white" />
              <circle cx="12" cy="4" r="2.5" fill="white" fillOpacity="0.7" />
              <circle cx="12" cy="12" r="2.5" fill="white" fillOpacity="0.7" />
              <line x1="6.5" y1="7" x2="10" y2="4.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
              <line x1="6.5" y1="9" x2="10" y2="11.5" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold mb-2">Select the platforms you'll be automating</h1>
          <p className="text-slate-500 text-sm">Pick up to {MAX_SELECTIONS}. We'll tailor everything to your setup.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-5 mb-8 place-items-center">
          {PLATFORMS.map(p => (
            <PlatformTile
              key={p.id}
              platform={p}
              selected={selected.has(p.id)}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3">
          {/* Count indicator */}
          <p className="text-center text-sm text-slate-500 h-5">
            {selectedCount === 0
              ? 'Select at least one to continue'
              : selectedCount === 1
              ? '1 selected'
              : `${selectedCount} selected`}
          </p>

          {/* Next button */}
          <motion.button
            whileTap={canProceed ? { scale: 0.97 } : {}}
            onClick={() => canProceed && onNext(Array.from(selected))}
            disabled={!canProceed}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200"
            style={{
              background: canProceed
                ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                : 'rgba(30,31,53,1)',
              color: canProceed ? 'white' : '#374151',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              boxShadow: canProceed ? '0 4px 24px rgba(124,58,237,0.35)' : 'none',
            }}
          >
            {canProceed ? 'Next →' : 'Next →'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
