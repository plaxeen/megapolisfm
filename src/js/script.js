const playButton = document.getElementById('playButton');
const footerPlayButton = document.getElementById('footerPlayButton');
const audioPlayer = document.getElementById('audioPlayer');
const volumeControl = document.getElementById('volumeControl');
const footerVolumeControl = document.getElementById('footerVolumeControl');
const artistElement = document.getElementById('artist');
const titleElement = document.getElementById('title');
const footerArtist = document.getElementById('footerArtist');
const footerTitle = document.getElementById('footerTitle');
const playIcon = document.getElementById('playIcon');
const stopIcon = document.getElementById('stopIcon');
const footerPlayIcon = document.getElementById('footerPlayIcon');
const footerStopIcon = document.getElementById('footerStopIcon');

let isPlaying = false;

// Установка нового источника с параметром "nocache"
function setStreamSource() {
  const streamUrl = 'https://megapolisfm.hostingradio.ru/megapolisfm96.aacp';
  audioPlayer.src = `${streamUrl}?nocache=${Date.now()}`;
}

function updateMediaSessionMetadata(artist, title) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Unknown Title',
      artist: artist || 'Unknown Artist',
      album: 'MEGAPOLIS FM',
      artwork: [
        { src: '../imgs/mgps.jpg', sizes: '640x640', type: 'image/jpeg' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioPlayer.play();
      updateButtonState(true);
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioPlayer.pause();
      updateButtonState(false);
    });
  }
}

// Обновление кнопки Play/Stop
function updateButtonState(isPlaying) {
  [playIcon, footerPlayIcon].forEach(icon => icon.classList.toggle('hidden', isPlaying));
  [stopIcon, footerStopIcon].forEach(icon => icon.classList.toggle('hidden', !isPlaying));
}

// Управление громкостью
volumeControl.addEventListener('input', (e) => {
  audioPlayer.volume = e.target.value;
  footerVolumeControl.value = e.target.value;
});
footerVolumeControl.addEventListener('input', (e) => {
  audioPlayer.volume = e.target.value;
  volumeControl.value = e.target.value;
});

// Событие воспроизведения/паузы
function togglePlay() {
  if (isPlaying) {
    audioPlayer.pause();
    audioPlayer.src = '';
    isPlaying = false;
  } else {
    setStreamSource();
    audioPlayer.play();
    isPlaying = true;
  }
  updateButtonState(isPlaying);
}

playButton.addEventListener('click', togglePlay);
footerPlayButton.addEventListener('click', togglePlay);

// Получение метаданных
async function fetchMetadata() {
  try {
    const response = await fetch(audioPlayer.src, {
      method: 'GET',
      headers: { 'Icy-MetaData': '1' },
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const reader = response.body.getReader();
    const metaDataInterval = 8192;
    let bytesRead = 0;
    let metadata = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesRead += value.length;

      if (bytesRead >= metaDataInterval) {
        const metadataSize = value[metaDataInterval] * 16;
        metadata = new TextDecoder().decode(value.slice(metaDataInterval + 1, metaDataInterval + 1 + metadataSize));
        break;
      }
    }

    const metaMatch = metadata.match(/StreamTitle='(.*?)';/);
    if (metaMatch && metaMatch[1]) {
      const [artist, title] = metaMatch[1].split(' - ');
      updateTrackInfo(artist, title);
	  updateMediaSessionMetadata(artist, title);
    } else {
      updateTrackInfo('', '');
    }
  } catch (error) {
    console.error('Error fetching metadata:', error);
  }
}

// Обновление метаданных
function updateTrackInfo(artist, title) {
  const elements = [
    { el: artistElement, content: artist },
    { el: titleElement, content: title },
    { el: footerArtist, content: artist },
    { el: footerTitle, content: title },
  ];

  elements.forEach(({ el, content }) => {
    el.textContent = content || '';
    el.classList.toggle('hidden', !content);
  });
}

// События аудио-плеера
audioPlayer.addEventListener('play', () => {
  isPlaying = true;
  updateButtonState(true);
  fetchMetadata();
});

audioPlayer.addEventListener('pause', () => {
  isPlaying = false;
  updateButtonState(false);
});

// Инициализация
setStreamSource();