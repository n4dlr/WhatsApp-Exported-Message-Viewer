import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, Mic } from 'lucide-react'

// Realistic WhatsApp voice note waveform pattern
const WAVEFORM_HEIGHTS = [
  30, 45, 20, 60, 80, 40, 95, 70, 50, 35, 65, 90, 100, 85, 45, 60, 75, 40, 30, 55,
  80, 90, 60, 40, 70, 85, 50, 30, 45, 60, 40, 25, 50, 70, 85, 60, 35, 20
]

export default function AudioPlayer({
  duration = 42,
  isOutgoing = false
}: {
  duration?: number | null
  isOutgoing?: boolean
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0 to 1
  const [speed, setSpeed] = useState<'1x' | '1.5x' | '2x'>('1x')

  const totalSeconds = duration && duration > 0 ? duration : 35
  const animRef = useRef<number | null>(null)

  const speedMultiplier = speed === '1.5x' ? 1.5 : speed === '2x' ? 2 : 1

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) clearInterval(animRef.current)
      return
    }

    const intervalMs = 100
    const step = (intervalMs / 1000 / totalSeconds) * speedMultiplier

    const interval = window.setInterval(() => {
      setProgress(prev => {
        if (prev + step >= 1) {
          setIsPlaying(false)
          return 0
        }
        return prev + step
      })
    }, intervalMs)

    return () => clearInterval(interval)
  }, [isPlaying, totalSeconds, speedMultiplier])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const cycleSpeed = () => {
    if (speed === '1x') setSpeed('1.5x')
    else if (speed === '1.5x') setSpeed('2x')
    else setSpeed('1x')
  }

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width))
    setProgress(newProgress)
  }

  const currentSeconds = Math.floor(progress * totalSeconds)
  const formattedCurrent = `${Math.floor(currentSeconds / 60)}:${(currentSeconds % 60).toString().padStart(2, '0')}`
  const formattedTotal = `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`

  // WhatsApp colors
  const activeColor = isOutgoing ? '#ffffff' : '#00a884'
  const inactiveColor = isOutgoing ? 'rgba(255, 255, 255, 0.35)' : 'rgba(134, 150, 160, 0.4)'

  return (
    <div className="py-1 px-1 flex items-center gap-3 select-none min-w-[260px] max-w-[340px]">
      {/* Play / Pause Circular Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-sm ${
          isOutgoing
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-[var(--wa-green)] text-[#111b21] hover:opacity-90'
        }`}
      >
        {isPlaying ? (
          <Pause size={18} className="fill-current" />
        ) : (
          <Play size={18} className="fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Duration Container */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Interactive Waveform */}
        <div
          onClick={handleWaveformClick}
          className="h-8 flex items-center gap-[2.5px] cursor-pointer group py-1"
          title="Səs faylını irəli/geri çək"
        >
          {WAVEFORM_HEIGHTS.map((heightPercent, idx) => {
            const barProgress = idx / WAVEFORM_HEIGHTS.length
            const isPlayed = barProgress <= progress
            return (
              <div
                key={idx}
                className="w-[2.5px] rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(15, (heightPercent / 100) * 26)}px`,
                  backgroundColor: isPlayed ? activeColor : inactiveColor
                }}
              />
            )
          })}
        </div>

        {/* Time and Speed */}
        <div className="flex justify-between items-center text-[11px] text-[var(--wa-text-secondary)] mt-0.5">
          <span>{isPlaying ? formattedCurrent : formattedTotal}</span>

          <div className="flex items-center gap-2">
            {/* Speed Badge */}
            {isPlaying && (
              <button
                type="button"
                onClick={cycleSpeed}
                className="px-1.5 py-0.5 rounded-full bg-black/20 hover:bg-black/30 text-[10px] font-semibold text-[var(--wa-text-primary)] transition-colors"
              >
                {speed}
              </button>
            )}

            {/* Mic Indicator */}
            <Mic
              size={13}
              className={progress > 0 ? 'text-[#53bdeb]' : 'text-[var(--wa-text-secondary)] opacity-70'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
