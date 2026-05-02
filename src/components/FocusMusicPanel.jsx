import React from 'react';

export default function FocusMusicPanel({ sounds, isPlaying, currentSound, volume, onToggle, onChangeSound, onChangeVolume, onClose }) {
  return (
    <div className="focus-music-panel open">
      <div className="music-header">
        <h2>
          <i className="fa-solid fa-music" style={{ marginRight: 8 }}></i>
          Focus Music
        </h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close music panel">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* Sound Type Selection */}
      <div className="sound-types">
        {Object.entries(sounds).map(([type, sound]) => (
          <button
            key={type}
            className={`sound-type-btn ${currentSound === type ? 'active' : ''}`}
            onClick={() => onChangeSound(type)}
            title={sound.description}
          >
            <i className={`fa-solid ${sound.icon}`}></i>
            <span>{sound.name}</span>
          </button>
        ))}
      </div>

      {/* Volume Control */}
      <div className="volume-control">
        <i className="fa-solid fa-volume-low"></i>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
          className="volume-slider"
          aria-label="Volume"
        />
        <i className="fa-solid fa-volume-high"></i>
      </div>

      {/* Play/Pause Button */}
      <button
        className="play-pause-btn"
        onClick={onToggle}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
        <span>{isPlaying ? 'Pause' : 'Play'}</span>
      </button>
    </div>
  );
}
