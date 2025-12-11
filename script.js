// =============================================
// AUDIO PLAYER TEMPLATE
// Edit this once to update all players
// =============================================
const PLAYER_HTML = `
<div class="audio-player">
    <div class="loading-bar">
        <div class="loading-progress"></div>
        <span class="loading-text">Loading audio...</span>
    </div>
    <div class="player-content" style="display:none;">
        <div class="time-slider-container">
            <input type="range" class="time-slider" value="0" min="0" max="100">
            <div class="time-display">
                <span class="current-time">0:00</span>
                <span class="duration">0:00</span>
            </div>
        </div>
        <div class="player-bottom-controls">
            <button class="player-btn play-pause-btn">
                <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg class="icon-pause" viewBox="0 0 24 24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <div class="volume-container">
                <button class="volume-btn">
                    <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
                <input type="range" class="volume-slider" value="100" min="0" max="100">
            </div>
        </div>
    </div>
</div>
`;

// =============================================
// AUDIO PLAYER LOGIC
// =============================================
const audio = new Audio();
audio.preload = 'auto'; // Preload more aggressively
let currentBtn = null;
let currentPlayer = null;
let currentContainer = null;
let savedVolume = 1;
let isSeeking = false;

// Get all track buttons as array for autoplay
const trackButtons = Array.from(document.querySelectorAll('.track-btn'));

// Format time helper
function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Check if audio is ready for seeking (less strict now)
function canSeek() {
    return audio.duration && audio.duration > 0 && isFinite(audio.duration);
}

// Update icons helper
function updateIcons(element, isPlaying) {
    if (!element) return;
    const playIcon = element.querySelector('.icon-play');
    const pauseIcon = element.querySelector('.icon-pause');
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
    if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
}

// Show player controls when audio is ready
function showPlayerReady() {
    if (!currentPlayer) return;
    const loadingBar = currentPlayer.querySelector('.loading-bar');
    const playerContent = currentPlayer.querySelector('.player-content');
    const durationEl = currentPlayer.querySelector('.duration');
    
    if (canSeek()) {
        if (loadingBar) loadingBar.style.display = 'none';
        if (playerContent) playerContent.style.display = 'block';
        if (durationEl) durationEl.textContent = formatTime(audio.duration);
    }
}

// Update loading progress bar
function updateLoadingProgress() {
    if (!currentPlayer || !audio.buffered.length) return;
    const loadingProgress = currentPlayer.querySelector('.loading-progress');
    if (loadingProgress && audio.duration) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const percent = (bufferedEnd / audio.duration) * 100;
        loadingProgress.style.width = percent + '%';
    }
}

// Inject player into container and setup controls
function injectPlayer(container) {
    container.innerHTML = PLAYER_HTML;
    const player = container.querySelector('.audio-player');
    
    const playPauseBtn = player.querySelector('.play-pause-btn');
    const timeSlider = player.querySelector('.time-slider');
    const volumeSlider = player.querySelector('.volume-slider');
    const volumeBtn = player.querySelector('.volume-btn');

    // Set current volume
    volumeSlider.value = audio.volume * 100;

    // Player play/pause button
    playPauseBtn.addEventListener('click', function() {
        if (audio.paused) {
            audio.play();
            updateIcons(currentBtn, true);
            updateIcons(this, true);
            currentBtn.classList.add('playing');
        } else {
            audio.pause();
            updateIcons(currentBtn, false);
            updateIcons(this, false);
            currentBtn.classList.remove('playing');
        }
    });

    // Time slider - handle seeking
    function startSeeking() {
        isSeeking = true;
    }
    function stopSeeking() {
        isSeeking = false;
    }
    function doSeek() {
        const duration = audio.duration;
        // Try to seek even if duration seems invalid - let the browser handle it
        if (duration && duration > 0) {
            const targetTime = (timeSlider.value / 100) * duration;
            try {
                // Try fastSeek first (better for streaming)
                if (audio.fastSeek) {
                    audio.fastSeek(targetTime);
                } else {
                    audio.currentTime = targetTime;
                }
            } catch (e) {
                // Fallback - just set currentTime
                audio.currentTime = targetTime;
            }
        }
    }
    
    timeSlider.addEventListener('mousedown', startSeeking);
    timeSlider.addEventListener('touchstart', startSeeking, { passive: true });
    timeSlider.addEventListener('input', doSeek);
    timeSlider.addEventListener('mouseup', function() {
        doSeek(); // Seek on release too
        stopSeeking();
    });
    timeSlider.addEventListener('touchend', function() {
        doSeek(); // Seek on release too
        stopSeeking();
    });
    timeSlider.addEventListener('change', function() {
        doSeek();
        stopSeeking();
    });

    // Volume slider
    volumeSlider.addEventListener('input', function() {
        audio.volume = this.value / 100;
    });

    // Volume button (mute toggle)
    volumeBtn.addEventListener('click', function() {
        if (audio.volume > 0) {
            savedVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
        } else {
            audio.volume = savedVolume;
            volumeSlider.value = savedVolume * 100;
        }
    });

    return player;
}

// Track button clicks
document.querySelectorAll('.track-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const trackItem = this.closest('.track-item');
        const container = trackItem.querySelector('.audio-player-container');
        const trackSrc = this.dataset.track;
        
        // If clicking same button, stop and close player
        if (currentBtn === this) {
            audio.pause();
            audio.currentTime = 0;
            updateIcons(this, false);
            this.classList.remove('playing');
            container.innerHTML = '';
            currentBtn = null;
            currentPlayer = null;
            currentContainer = null;
            return;
        }
        
        // Hide previous player
        if (currentBtn) {
            updateIcons(currentBtn, false);
            currentBtn.classList.remove('playing');
            if (currentContainer) {
                currentContainer.innerHTML = '';
            }
        }
        
        // Inject and show new player
        const player = injectPlayer(container);
        player.classList.add('visible');
        
        currentBtn = this;
        currentPlayer = player;
        currentContainer = container;
        
        // Load and play audio
        audio.src = trackSrc;
        audio.load(); // Force load
        audio.play().catch(e => console.log('Play error:', e));
        updateIcons(this, true);
        updateIcons(player.querySelector('.play-pause-btn'), true);
        this.classList.add('playing');
        
        // Fallback: show player after 3 seconds even if metadata not loaded
        setTimeout(() => {
            if (currentPlayer) {
                const loadingBar = currentPlayer.querySelector('.loading-bar');
                const playerContent = currentPlayer.querySelector('.player-content');
                if (loadingBar && loadingBar.style.display !== 'none') {
                    loadingBar.style.display = 'none';
                    playerContent.style.display = 'block';
                    // Show unknown duration
                    const durationEl = currentPlayer.querySelector('.duration');
                    if (durationEl && durationEl.textContent === '0:00') {
                        durationEl.textContent = '--:--';
                    }
                }
            }
        }, 3000);
    });
});

// Update time display for active player
audio.addEventListener('timeupdate', function() {
    if (!currentPlayer || isSeeking) return;
    const timeSlider = currentPlayer.querySelector('.time-slider');
    const currentTimeEl = currentPlayer.querySelector('.current-time');
    
    if (canSeek()) {
        const progress = (audio.currentTime / audio.duration) * 100;
        if (timeSlider && !isSeeking) timeSlider.value = progress || 0;
    }
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
});

// Show player when audio is ready
audio.addEventListener('loadedmetadata', showPlayerReady);
audio.addEventListener('durationchange', showPlayerReady);
audio.addEventListener('canplay', showPlayerReady);
audio.addEventListener('canplaythrough', showPlayerReady);
audio.addEventListener('progress', updateLoadingProgress);

// Track ended - autoplay next song
audio.addEventListener('ended', function() {
    if (!currentBtn) return;
    
    const currentIndex = trackButtons.indexOf(currentBtn);
    
    if (currentIndex < trackButtons.length - 1) {
        const nextBtn = trackButtons[currentIndex + 1];
        nextBtn.click();
    } else {
        if (currentPlayer) {
            const playPauseBtn = currentPlayer.querySelector('.play-pause-btn');
            const timeSlider = currentPlayer.querySelector('.time-slider');
            const currentTimeEl = currentPlayer.querySelector('.current-time');
            updateIcons(currentBtn, false);
            updateIcons(playPauseBtn, false);
            currentBtn.classList.remove('playing');
            if (timeSlider) timeSlider.value = 0;
            if (currentTimeEl) currentTimeEl.textContent = '0:00';
        }
    }
});

// Click on cover image to scroll down
document.getElementById('coverImage').addEventListener('click', function() {
    const element = document.getElementById('releaseInfo');
    const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 40;
    window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });
});
