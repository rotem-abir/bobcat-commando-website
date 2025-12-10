const audio = new Audio();
let currentBtn = null;
let currentPlayer = null;
let savedVolume = 1;

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

// Track button clicks
document.querySelectorAll('.track-btn').forEach(btn => {
    const trackItem = btn.closest('.track-item');
    const player = trackItem.querySelector('.audio-player');
    const playPauseBtn = player.querySelector('.play-pause-btn');
    const timeSlider = player.querySelector('.time-slider');
    const currentTimeEl = player.querySelector('.current-time');
    const durationEl = player.querySelector('.duration');
    const volumeSlider = player.querySelector('.volume-slider');
    const volumeBtn = player.querySelector('.volume-btn');

    btn.addEventListener('click', function() {
        const trackSrc = this.dataset.track;
        
        // If clicking same button, stop and close player
        if (currentBtn === this) {
            audio.pause();
            audio.currentTime = 0;
            updateIcons(this, false);
            updateIcons(playPauseBtn, false);
            this.classList.remove('playing');
            player.classList.remove('visible');
            // Reset time display
            const currentTimeEl = player.querySelector('.current-time');
            const timeSliderEl = player.querySelector('.time-slider');
            if (currentTimeEl) currentTimeEl.textContent = '0:00';
            if (timeSliderEl) timeSliderEl.value = 0;
            currentBtn = null;
            currentPlayer = null;
            return;
        }
        
        // Hide previous player and reset button
        if (currentBtn && currentBtn !== this) {
            const prevItem = currentBtn.closest('.track-item');
            const prevPlayer = prevItem.querySelector('.audio-player');
            prevPlayer.classList.remove('visible');
            updateIcons(currentBtn, false);
            currentBtn.classList.remove('playing');
        }
        
        // Show this player and play
        player.classList.add('visible');
        audio.src = trackSrc;
        audio.play();
        updateIcons(this, true);
        updateIcons(playPauseBtn, true);
        this.classList.add('playing');
        currentBtn = this;
        currentPlayer = player;
    });

    // Player play/pause button
    playPauseBtn.addEventListener('click', function() {
        if (!currentBtn || currentBtn.closest('.track-item') !== trackItem) return;
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

    // Time slider
    timeSlider.addEventListener('input', function() {
        if (currentPlayer !== player) return;
        const time = (this.value / 100) * audio.duration;
        audio.currentTime = time;
    });

    // Volume slider
    volumeSlider.addEventListener('input', function() {
        audio.volume = this.value / 100;
        // Sync all volume sliders
        document.querySelectorAll('.volume-slider').forEach(vs => vs.value = this.value);
    });

    // Volume button (mute toggle)
    volumeBtn.addEventListener('click', function() {
        if (audio.volume > 0) {
            savedVolume = audio.volume;
            audio.volume = 0;
            document.querySelectorAll('.volume-slider').forEach(vs => vs.value = 0);
        } else {
            audio.volume = savedVolume;
            document.querySelectorAll('.volume-slider').forEach(vs => vs.value = savedVolume * 100);
        }
    });
});

// Update time display for active player
audio.addEventListener('timeupdate', function() {
    if (!currentPlayer) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    const timeSlider = currentPlayer.querySelector('.time-slider');
    const currentTimeEl = currentPlayer.querySelector('.current-time');
    if (timeSlider) timeSlider.value = progress || 0;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
});

// Set duration when loaded
audio.addEventListener('loadedmetadata', function() {
    if (!currentPlayer) return;
    const durationEl = currentPlayer.querySelector('.duration');
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
});

// Track ended
audio.addEventListener('ended', function() {
    if (!currentBtn || !currentPlayer) return;
    const playPauseBtn = currentPlayer.querySelector('.play-pause-btn');
    const timeSlider = currentPlayer.querySelector('.time-slider');
    const currentTimeEl = currentPlayer.querySelector('.current-time');
    updateIcons(currentBtn, false);
    updateIcons(playPauseBtn, false);
    currentBtn.classList.remove('playing');
    if (timeSlider) timeSlider.value = 0;
    if (currentTimeEl) currentTimeEl.textContent = '0:00';
});

// Click on cover image to scroll down
document.getElementById('coverImage').addEventListener('click', function() {
    document.getElementById('releaseInfo').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
});

