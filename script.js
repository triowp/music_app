// --- 1. ПЕРЕМЕННЫЕ ---
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const resultsGrid = document.getElementById('resultsGrid');

// Плеер
const audioPlayer = document.getElementById('audioPlayer');
const masterPlay = document.getElementById('masterPlay');
const playerCover = document.getElementById('player-cover');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');

// Ползунки и время
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('durationTime');
const volumeSlider = document.getElementById('volumeSlider');

// --- 2. ФУНКЦИЯ ПОИСКА (iTunes API) ---
async function searchMusic(query) {
    if (!query) return;

    // Показываем статус загрузки
    resultsGrid.innerHTML = '<p style="text-align:center; color:#888; width:100%;">Поиск в iTunes...</p>';

    try {
        // Формируем запрос:
        // term = запрос пользователя
        // media = music (ищем музыку)
        // entity = song (конкретно песни, а не альбомы)
        // limit = 25 (количество результатов)
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`;
        
        const response = await fetch(url);
        const data = await response.json();

        // Проверяем, есть ли результаты
        if (data.resultCount > 0) {
            displayResults(data.results);
        } else {
            resultsGrid.innerHTML = '<p style="text-align:center; width:100%;">Ничего не найдено.</p>';
        }

    } catch (error) {
        console.error("Ошибка API:", error);
        resultsGrid.innerHTML = '<p style="text-align:center; color:red;">Ошибка соединения с iTunes.</p>';
    }
}

// --- 3. ОТОБРАЖЕНИЕ КАРТОЧЕК ---
function displayResults(songs) {
    resultsGrid.innerHTML = ''; // Очищаем поле

    songs.forEach(song => {
        // Пропускаем треки без аудио-превью
        if (!song.previewUrl) return;

        const card = document.createElement('div');
        card.classList.add('card');

        // Улучшаем качество обложки:
        // iTunes по умолчанию дает 100x100. Мы меняем URL, чтобы получить 600x600.
        const highResImage = song.artworkUrl100.replace('100x100bb', '600x600bb');

        card.innerHTML = `
            <img src="${highResImage}" alt="${song.trackName}">
            <div class="card-info">
                <h3>${song.trackName}</h3>
                <p>${song.artistName}</p>
            </div>
        `;

        // При клике запускаем трек
        card.addEventListener('click', () => {
            playTrack(song.previewUrl, song.trackName, song.artistName, highResImage);
        });

        resultsGrid.appendChild(card);
    });
}

// --- 4. ЛОГИКА ПЛЕЕРА ---
function playTrack(url, title, artist, cover) {
    // Устанавливаем источник аудио
    audioPlayer.src = url;
    
    // Обновляем визуальную часть плеера
    playerTitle.innerText = title;
    playerArtist.innerText = artist;
    playerCover.src = cover;

    // Сбрасываем прогресс бар
    progressBar.value = 0;
    currentTimeEl.innerText = "0:00";
    
    // Запускаем
    audioPlayer.play();
    updatePlayIcon(true);
}

// Кнопка Пауза / Плей
masterPlay.addEventListener('click', () => {
    // Если трек не выбран (src пустой), ничего не делаем
    if (!audioPlayer.src) return;

    if (audioPlayer.paused) {
        audioPlayer.play();
        updatePlayIcon(true);
    } else {
        audioPlayer.pause();
        updatePlayIcon(false);
    }
});

// Функция смены иконки (Play/Pause)
function updatePlayIcon(isPlaying) {
    const icon = masterPlay.querySelector('i');
    if (isPlaying) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
    } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    }
}

// --- 5. ПРОГРЕСС БАР И ВРЕМЯ ---
audioPlayer.addEventListener('timeupdate', (e) => {
    const { currentTime, duration } = e.target;

    // Если длительность определилась
    if (duration) {
        // Высчитываем процент для ползунка
        const progressPercent = (currentTime / duration) * 100;
        progressBar.value = progressPercent;
        
        // Обновляем цифры таймера
        currentTimeEl.innerText = formatTime(currentTime);
        durationEl.innerText = formatTime(duration);
    }
});

// Перемотка трека (input event на ползунке)
progressBar.addEventListener('input', () => {
    if (audioPlayer.duration) {
        const seekTime = (progressBar.value * audioPlayer.duration) / 100;
        audioPlayer.currentTime = seekTime;
    }
});

// Регулировка громкости
volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value;
});

// Когда трек закончился
audioPlayer.addEventListener('ended', () => {
    updatePlayIcon(false);
    progressBar.value = 0;
    currentTimeEl.innerText = "0:00";
});

// Вспомогательная функция форматирования времени (1:05)
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// --- 6. ОБРАБОТЧИКИ ПОИСКА ---

// Клик по лупе
searchBtn.addEventListener('click', () => {
    searchMusic(searchInput.value);
});

// Нажатие Enter в поле ввода
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchMusic(searchInput.value);
    }
});

// Автозапуск при старте страницы (для проверки)
window.addEventListener('load', () => {
    // Автоматически показываем популярные треки при загрузке
    const defaultSearch = 'The Weeknd';
    searchMusic(defaultSearch); 
});