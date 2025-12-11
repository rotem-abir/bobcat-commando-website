// =============================================
// AUDIO PLAYER TEMPLATE
// Edit this once to update all players
// =============================================
const PLAYER_HTML = `
<div class="audio-player">
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
`;

// =============================================
// AUDIO PLAYER LOGIC
// =============================================
const audio = new Audio();
let currentBtn = null;
let currentPlayer = null;
let currentContainer = null;
let savedVolume = 1;
let isSeeking = false; // Flag to prevent timeupdate from interfering with seeking

// Get all track buttons as array for autoplay
const trackButtons = Array.from(document.querySelectorAll('.track-btn'));

// Format time helper
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update icons helper
function updateIcons(element, isPlaying) {
    if (!element) return;
    const playIcon = element.querySelector('.icon-play');
    const pauseIcon = element.querySelector('.icon-pause');
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
    if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
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
    timeSlider.addEventListener('mousedown', function() {
        isSeeking = true;
    });
    timeSlider.addEventListener('touchstart', function() {
        isSeeking = true;
    });
    timeSlider.addEventListener('input', function() {
        const time = (this.value / 100) * audio.duration;
        if (!isNaN(time)) {
            audio.currentTime = time;
        }
    });
    timeSlider.addEventListener('mouseup', function() {
        isSeeking = false;
    });
    timeSlider.addEventListener('touchend', function() {
        isSeeking = false;
    });
    timeSlider.addEventListener('change', function() {
        isSeeking = false;
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
            container.innerHTML = ''; // Remove player
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
                currentContainer.innerHTML = ''; // Remove previous player
            }
        }
        
        // Inject and show new player
        const player = injectPlayer(container);
        player.classList.add('visible');
        
        // Play audio
        audio.src = trackSrc;
        audio.play();
        updateIcons(this, true);
        updateIcons(player.querySelector('.play-pause-btn'), true);
        this.classList.add('playing');
        
        currentBtn = this;
        currentPlayer = player;
        currentContainer = container;
    });
});

// Update time display for active player
audio.addEventListener('timeupdate', function() {
    if (!currentPlayer || isSeeking) return; // Don't update while user is seeking
    const progress = (audio.currentTime / audio.duration) * 100;
    const timeSlider = currentPlayer.querySelector('.time-slider');
    const currentTimeEl = currentPlayer.querySelector('.current-time');
    if (timeSlider && !isSeeking) timeSlider.value = progress || 0;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
});

// Set duration when loaded
audio.addEventListener('loadedmetadata', function() {
    if (!currentPlayer) return;
    const durationEl = currentPlayer.querySelector('.duration');
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
});

// Track ended - autoplay next song
audio.addEventListener('ended', function() {
    if (!currentBtn) return;
    
    // Find current track index
    const currentIndex = trackButtons.indexOf(currentBtn);
    
    // Check if there's a next track
    if (currentIndex < trackButtons.length - 1) {
        // Play next track
        const nextBtn = trackButtons[currentIndex + 1];
        nextBtn.click();
    } else {
        // Last track ended - just reset
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

// Click on cover image to scroll down (with offset for spacing)
document.getElementById('coverImage').addEventListener('click', function() {
    const element = document.getElementById('releaseInfo');
    const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 40;
    window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });
});
