'use client';

import { useEffect, useState } from 'react';
import { soundManager, SoundSettings } from '@/lib/soundManager';

interface VolumeControlProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  className = '',
  position = 'top-right',
  compact = false
}) => {
  const [settings, setSettings] = useState<SoundSettings>({
    masterVolume: 0.7,
    muted: false,
    soundEffectsEnabled: true
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Load initial settings
    setSettings(soundManager.getSettings());
    setIsSupported(soundManager.isAudioSupported());
  }, []);

  const handleVolumeChange = async (volume: number) => {
    soundManager.setVolume(volume);
    setSettings(soundManager.getSettings());
    
    // Play a test sound when adjusting volume
    if (volume > 0 && !settings.muted) {
      await soundManager.playSound('button');
    }
  };

  const handleMuteToggle = async () => {
    soundManager.toggleMute();
    const newSettings = soundManager.getSettings();
    setSettings(newSettings);
    
    // Play unmute sound if unmuting
    if (!newSettings.muted) {
      setTimeout(async () => {
        await soundManager.playSound('button');
      }, 100);
    }
  };

  const handleSoundToggle = async () => {
    const newEnabled = !settings.soundEffectsEnabled;
    soundManager.setSoundEffectsEnabled(newEnabled);
    setSettings(soundManager.getSettings());
    
    // Play test sound if enabling
    if (newEnabled && !settings.muted) {
      await soundManager.playSound('button');
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getMuteIcon = () => {
    if (settings.muted || settings.masterVolume === 0) return '🔇';
    if (settings.masterVolume < 0.3) return '🔈';
    if (settings.masterVolume < 0.7) return '🔉';
    return '🔊';
  };

  if (!isSupported) {
    return null; // Don't show on unsupported browsers
  }

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      <div className="relative">
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-white hover:bg-black/40 transition-all duration-200"
          title="Sound Settings"
        >
          <span className="text-lg">{getMuteIcon()}</span>
        </button>

        {/* Expanded Controls */}
        {isExpanded && (
          <div 
            className={`absolute ${
              position.includes('right') ? 'right-0' : 'left-0'
            } ${
              position.includes('top') ? 'top-12' : 'bottom-12'
            } bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-4 space-y-4 min-w-[200px] transform transition-all duration-300`}
          >
            {/* Master Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">Volume</span>
                <span className="text-white/70 text-xs">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMuteToggle}
                  className="text-lg hover:scale-110 transition-transform duration-200"
                  title={settings.muted ? 'Unmute' : 'Mute'}
                >
                  {getMuteIcon()}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.masterVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  disabled={settings.muted}
                />
              </div>
            </div>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">Sound Effects</span>
              <button
                onClick={handleSoundToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEffectsEnabled ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEffectsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Audio Context Status (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="border-t border-white/10 pt-2">
                <span className="text-white/50 text-xs">
                  Audio: {soundManager.getAudioContextState()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-thumb:hover {
          background: #f0f9ff;
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default VolumeControl; 