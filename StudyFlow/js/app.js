/* ═══════════════════════════════════════════════
   StudyFlow — App Logic
   ═══════════════════════════════════════════════ */

// ——— State ———
const STATE = {
    timer: {
        mode: 'work', // 'work' | 'short' | 'long'
        durations: { work: 25 * 60, short: 5 * 60, long: 15 * 60 },
        remaining: 25 * 60,
        total: 25 * 60,
        running: false,
        interval: null,
        cycle: 0,
        maxCycles: 4,
    },
    calendar: {
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
    },
    flashcards: [],
    studyIndex: 0,
    quiz: {
        questions: [],
        currentIndex: 0,
        score: 0,
        total: 0,
    },
    extractedText: '',
};

// ——— Helpers ———
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function saveToStorage(key, data) {
    try {
        localStorage.setItem(`studyflow_${key}`, JSON.stringify(data));
    } catch (e) {
        console.warn('Error saving to localStorage:', e);
    }
}

function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(`studyflow_${key}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.warn('Error loading from localStorage:', e);
        return null;
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function initNavigation() {
    // Mobile menu
    const menuBtn = $('#mobile-menu-btn');
    const navLinks = $('.nav-links');

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Smooth scroll + active states
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            menuBtn.classList.remove('active');
            navLinks.classList.remove('open');
            $$('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Scroll spy
    const sections = $$('section[id]');
    const observerOpts = { rootMargin: '-40% 0px -60% 0px' };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                $$('.nav-link').forEach(l => l.classList.remove('active'));
                const link = $(`.nav-link[data-section="${entry.target.id}"]`);
                if (link) link.classList.add('active');
            }
        });
    }, observerOpts);

    sections.forEach(s => observer.observe(s));
}

// ═══════════════════════════════════════════════
// POMODORO TIMER
// ═══════════════════════════════════════════════
function initTimer() {
    const btnStart = $('#btn-start');
    const btnReset = $('#btn-reset');
    const btnSkip = $('#btn-skip');
    const modeBtns = $$('.mode-btn');

    // Mode selection
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (STATE.timer.running) return;
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            STATE.timer.mode = btn.dataset.mode;
            resetTimer();
        });
    });

    btnStart.addEventListener('click', toggleTimer);
    btnReset.addEventListener('click', resetTimer);
    btnSkip.addEventListener('click', skipTimer);
}

function toggleTimer() {
    if (STATE.timer.running) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    STATE.timer.running = true;
    $('#btn-start .icon-play').classList.add('hidden');
    $('#btn-start .icon-pause').classList.remove('hidden');
    $('#timer-label').textContent = STATE.timer.mode === 'work' ? '¡Enfocate!' : 'Descansando...';

    STATE.timer.interval = setInterval(() => {
        STATE.timer.remaining--;
        updateTimerDisplay();

        if (STATE.timer.remaining <= 0) {
            clearInterval(STATE.timer.interval);
            timerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    STATE.timer.running = false;
    clearInterval(STATE.timer.interval);
    $('#btn-start .icon-play').classList.remove('hidden');
    $('#btn-start .icon-pause').classList.add('hidden');
    $('#timer-label').textContent = 'Pausado';
}

function resetTimer() {
    pauseTimer();
    const mode = STATE.timer.mode;
    STATE.timer.remaining = STATE.timer.durations[mode];
    STATE.timer.total = STATE.timer.durations[mode];
    updateTimerDisplay();
    $('#timer-label').textContent = 'Listo para empezar';
}

function skipTimer() {
    clearInterval(STATE.timer.interval);
    timerComplete();
}

function timerComplete() {
    STATE.timer.running = false;
    $('#btn-start .icon-play').classList.remove('hidden');
    $('#btn-start .icon-pause').classList.add('hidden');

    if (STATE.timer.mode === 'work') {
        STATE.timer.cycle++;
        recordSession();
        updateTimerInfo();

        if (STATE.timer.cycle >= STATE.timer.maxCycles) {
            STATE.timer.cycle = 0;
            STATE.timer.mode = 'long';
            showToast('🌿 ¡Felicitaciones! Tomá un descanso largo.', 'success');
        } else {
            STATE.timer.mode = 'short';
            showToast('☕ ¡Buen trabajo! Tiempo de descanso.', 'success');
        }
    } else {
        STATE.timer.mode = 'work';
        showToast('💼 ¡Vamos de nuevo! A enfocarse.', 'info');
    }

    // Update mode buttons
    $$('.mode-btn').forEach(b => b.classList.remove('active'));
    $(`.mode-btn[data-mode="${STATE.timer.mode}"]`).classList.add('active');

    resetTimer();

    // Play notification sound
    playNotificationSound();
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* audio not supported */ }
}

function updateTimerDisplay() {
    const mins = Math.floor(STATE.timer.remaining / 60);
    const secs = STATE.timer.remaining % 60;

    $('#timer-minutes').textContent = String(mins).padStart(2, '0');
    $('#timer-seconds').textContent = String(secs).padStart(2, '0');

    // Update circular progress
    const circumference = 2 * Math.PI * 120; // r=120
    const progress = 1 - (STATE.timer.remaining / STATE.timer.total);
    const offset = circumference * (1 - progress);
    $('#timer-progress').style.strokeDashoffset = offset;
}

function updateTimerInfo() {
    const sessions = getSessions();
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === today);

    $('#cycle-count').textContent = `${STATE.timer.cycle} / ${STATE.timer.maxCycles}`;
    $('#sessions-today').textContent = todaySessions.length;

    const totalMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    if (totalMinutes >= 60) {
        $('#time-today').textContent = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
    } else {
        $('#time-today').textContent = `${totalMinutes} min`;
    }

    updateHeroStats();
}

// ——— Session Recording ———
function recordSession() {
    const sessions = getSessions();
    sessions.push({
        date: new Date().toISOString().split('T')[0],
        duration: STATE.timer.durations.work / 60, // minutes
        timestamp: Date.now(),
    });
    saveToStorage('sessions', sessions);
    renderCalendar();
    updateCalendarStats();
}

function getSessions() {
    return loadFromStorage('sessions') || [];
}

// ═══════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════
const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function initCalendar() {
    $('#cal-prev').addEventListener('click', () => {
        STATE.calendar.currentMonth--;
        if (STATE.calendar.currentMonth < 0) {
            STATE.calendar.currentMonth = 11;
            STATE.calendar.currentYear--;
        }
        renderCalendar();
    });

    $('#cal-next').addEventListener('click', () => {
        STATE.calendar.currentMonth++;
        if (STATE.calendar.currentMonth > 11) {
            STATE.calendar.currentMonth = 0;
            STATE.calendar.currentYear++;
        }
        renderCalendar();
    });

    renderCalendar();
    updateCalendarStats();
}

function renderCalendar() {
    const { currentMonth, currentYear } = STATE.calendar;
    const grid = $('#calendar-grid');
    const title = $('#cal-month-title');

    title.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

    // Get sessions for this month
    const sessions = getSessions();
    const sessionsByDay = {};
    sessions.forEach(s => {
        const d = new Date(s.date + 'T12:00:00');
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const day = d.getDate();
            sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
        }
    });

    // Build grid
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday start

    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    let html = '';

    // Empty cells before start
    for (let i = 0; i < startOffset; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const count = sessionsByDay[day] || 0;
        let level = 0;
        if (count >= 6) level = 4;
        else if (count >= 4) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;

        const isToday = isCurrentMonth && today.getDate() === day;
        const todayClass = isToday ? ' today' : '';
        const tooltipText = count > 0 ? `${count} sesión${count > 1 ? 'es' : ''} — ${day}/${currentMonth + 1}` : `Sin sesiones — ${day}/${currentMonth + 1}`;

        html += `<div class="cal-day level-${level}${todayClass}">
            ${day}
            <span class="tooltip">${tooltipText}</span>
        </div>`;
    }

    grid.innerHTML = html;
}

function updateCalendarStats() {
    const sessions = getSessions();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Streak
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (sessions.some(s => s.date === dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    $('#stat-streak').textContent = streak;

    // This week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const weekSessions = sessions.filter(s => new Date(s.date + 'T12:00:00') >= weekStart);
    $('#stat-week').textContent = weekSessions.length;

    // This month
    const monthSessions = sessions.filter(s => {
        const d = new Date(s.date + 'T12:00:00');
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    $('#stat-month').textContent = monthSessions.length;

    // Total time
    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    if (totalHours > 0) {
        $('#stat-total-time').textContent = `${totalHours}h ${totalMinutes % 60}m`;
    } else {
        $('#stat-total-time').textContent = `${totalMinutes}m`;
    }
}

// ═══════════════════════════════════════════════
// FLASHCARDS
// ═══════════════════════════════════════════════
function initFlashcards() {
    // Load saved flashcards
    const saved = loadFromStorage('flashcards');
    if (saved) STATE.flashcards = saved;
    renderFlashcardList();

    // Tab switching
    $$('.fc-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.fc-tab').forEach(t => t.classList.remove('active'));
            $$('.fc-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            $(`#panel-${tab.dataset.tab}`).classList.add('active');

            // Update study/quiz when switching
            if (tab.dataset.tab === 'study') updateStudyCard();
            if (tab.dataset.tab === 'quiz') updateQuizSetup();
        });
    });

    // Create form
    $('#create-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const question = $('#fc-question').value.trim();
        const answer = $('#fc-answer').value.trim();

        if (!question || !answer) {
            showToast('Completá ambos campos.', 'error');
            return;
        }

        addFlashcard(question, answer, 'manual');
        $('#fc-question').value = '';
        $('#fc-answer').value = '';
        showToast('✅ Flashcard agregada.', 'success');
    });

    // File upload
    initFileUpload();

    // Study controls
    initStudyControls();

    // Quiz controls
    initQuizControls();
}

function addFlashcard(question, answer, source = 'manual') {
    STATE.flashcards.push({ id: Date.now() + Math.random(), question, answer, source });
    saveToStorage('flashcards', STATE.flashcards);
    renderFlashcardList();
    updateHeroStats();
}

function deleteFlashcard(id) {
    STATE.flashcards = STATE.flashcards.filter(fc => fc.id !== id);
    saveToStorage('flashcards', STATE.flashcards);
    renderFlashcardList();
    updateHeroStats();
}

function renderFlashcardList() {
    const container = $('#fc-list-items');
    const countEl = $('#fc-count');
    countEl.textContent = STATE.flashcards.length;

    if (STATE.flashcards.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 24px; font-size: 0.85rem;">No hay flashcards todavía.</p>';
        return;
    }

    container.innerHTML = STATE.flashcards.map(fc => `
        <div class="fc-list-item">
            <div class="fc-list-item-text">${escapeHtml(fc.question)}</div>
            <span class="fc-list-item-badge">${fc.source === 'auto' ? '🤖 Auto' : '✍️ Manual'}</span>
            <button class="fc-list-item-delete" data-id="${fc.id}" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        </div>
    `).join('');

    container.querySelectorAll('.fc-list-item-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteFlashcard(Number(btn.dataset.id)));
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ═══════════════════════════════════════════════
// FILE UPLOAD & TEXT EXTRACTION
// ═══════════════════════════════════════════════
function initFileUpload() {
    const zone = $('#upload-zone');
    const input = $('#file-input');

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    });

    input.addEventListener('change', () => {
        if (input.files[0]) processFile(input.files[0]);
        input.value = '';
    });

    // Auto-generate button
    $('#btn-auto-generate').addEventListener('click', () => {
        if (!STATE.extractedText) {
            showToast('No hay texto extraído.', 'error');
            return;
        }
        const cards = generateFlashcardsFromText(STATE.extractedText);
        if (cards.length === 0) {
            showToast('No se pudieron generar flashcards. Intentá con un texto más largo.', 'error');
            return;
        }
        cards.forEach(c => addFlashcard(c.question, c.answer, 'auto'));
        showToast(`🤖 ¡${cards.length} flashcards generadas!`, 'success');

        // Switch to study tab
        $$('.fc-tab').forEach(t => t.classList.remove('active'));
        $$('.fc-panel').forEach(p => p.classList.remove('active'));
        $('#tab-create').classList.add('active');
        $('#panel-create').classList.add('active');
    });
}

async function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const validExts = ['pdf', 'docx', 'txt', 'mp3', 'mp4'];

    if (!validExts.includes(ext)) {
        showToast('Formato no soportado. Usá PDF, DOCX, TXT, MP3 o MP4.', 'error');
        return;
    }

    // Show file in list
    showUploadedFile(file);

    // Process based on type
    if (ext === 'txt') {
        const text = await file.text();
        showExtractedContent(text);
    } else if (ext === 'pdf') {
        await extractPdfText(file);
    } else if (ext === 'docx') {
        await extractDocxText(file);
    } else if (ext === 'mp3' || ext === 'mp4') {
        showMediaPlayer(file, ext);
    }
}

function showUploadedFile(file) {
    const container = $('#uploaded-files');
    const ext = file.name.split('.').pop().toLowerCase();
    const icons = { pdf: '📄', docx: '📝', txt: '📃', mp3: '🎵', mp4: '🎬' };

    const fileEl = document.createElement('div');
    fileEl.className = 'uploaded-file';
    fileEl.innerHTML = `
        <div class="uploaded-file-icon">${icons[ext] || '📁'}</div>
        <div class="uploaded-file-info">
            <div class="uploaded-file-name">${escapeHtml(file.name)}</div>
            <div class="uploaded-file-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="uploaded-file-remove" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    fileEl.querySelector('.uploaded-file-remove').addEventListener('click', () => {
        fileEl.remove();
        $('#extracted-content').classList.add('hidden');
        $('#media-player').classList.add('hidden');
        STATE.extractedText = '';
    });

    container.appendChild(fileEl);
}

async function extractPdfText(file) {
    try {
        showToast('Procesando PDF...', 'info');
        const arrayBuffer = await file.arrayBuffer();

        if (typeof pdfjsLib === 'undefined') {
            showToast('Error: pdf.js no cargó. Verificá tu conexión a internet.', 'error');
            return;
        }

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        if (fullText.trim()) {
            showExtractedContent(fullText.trim());
            showToast('✅ PDF procesado correctamente.', 'success');
        } else {
            showToast('El PDF no contiene texto extraíble (puede ser escaneado).', 'error');
        }
    } catch (e) {
        console.error('PDF error:', e);
        showToast('Error al procesar el PDF.', 'error');
    }
}

async function extractDocxText(file) {
    try {
        showToast('Procesando DOCX...', 'info');
        const arrayBuffer = await file.arrayBuffer();

        if (typeof mammoth === 'undefined') {
            showToast('Error: mammoth.js no cargó. Verificá tu conexión a internet.', 'error');
            return;
        }

        const result = await mammoth.extractRawText({ arrayBuffer });

        if (result.value.trim()) {
            showExtractedContent(result.value.trim());
            showToast('✅ DOCX procesado correctamente.', 'success');
        } else {
            showToast('El documento está vacío.', 'error');
        }
    } catch (e) {
        console.error('DOCX error:', e);
        showToast('Error al procesar el DOCX.', 'error');
    }
}

function showMediaPlayer(file, type) {
    const player = $('#media-player');
    const url = URL.createObjectURL(file);

    if (type === 'mp3') {
        player.innerHTML = `
            <p style="color:var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;">🎵 Reproducí el audio y creá flashcards manualmente desde la pestaña "Crear Manual".</p>
            <audio controls src="${url}"></audio>
        `;
    } else {
        player.innerHTML = `
            <p style="color:var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;">🎬 Mirá el video y creá flashcards manualmente desde la pestaña "Crear Manual".</p>
            <video controls src="${url}" style="max-height:400px;"></video>
        `;
    }

    player.classList.remove('hidden');
    $('#extracted-content').classList.remove('hidden');
    $('#extracted-text').textContent = '';
    $('#btn-auto-generate').style.display = 'none';
}

function showExtractedContent(text) {
    STATE.extractedText = text;
    $('#extracted-content').classList.remove('hidden');
    $('#extracted-text').textContent = text;
    $('#btn-auto-generate').style.display = '';
    $('#media-player').classList.add('hidden');
}

// ═══════════════════════════════════════════════
// AUTO FLASHCARD GENERATION
// ═══════════════════════════════════════════════
function generateFlashcardsFromText(text) {
    const cards = [];
    const sentences = splitIntoSentences(text);

    // Strategy 1: Definition-style sentences ("X es Y", "X se define como Y", "X consiste en Y")
    const definitionPatterns = [
        /^(.{5,60}?)\s+(?:es|son|fue|era|será)\s+(.{10,})/i,
        /^(.{5,60}?)\s+(?:se define como|se refiere a|consiste en|se caracteriza por)\s+(.{10,})/i,
        /^(.{5,60}?)\s*:\s*(.{10,})/,
        /^(.{5,60}?)\s*[-–—]\s*(.{10,})/,
    ];

    sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length < 20 || trimmed.length > 500) return;

        for (const pattern of definitionPatterns) {
            const match = trimmed.match(pattern);
            if (match) {
                const term = match[1].trim();
                let definition = match[2].trim();
                if (definition.endsWith('.')) definition = definition.slice(0, -1);

                if (term.length >= 3 && definition.length >= 10) {
                    cards.push({
                        question: `¿Qué es ${term}?`,
                        answer: definition,
                    });
                }
                break;
            }
        }
    });

    // Strategy 2: Fill-in-the-blank from important sentences
    const importantSentences = sentences.filter(s => {
        const t = s.trim();
        return t.length >= 30 && t.length <= 300 && !t.startsWith('http');
    });

    const usedSentences = new Set(cards.map(c => c.answer));

    importantSentences.forEach(sentence => {
        if (cards.length >= 30) return; // Limit
        const trimmed = sentence.trim();
        if (usedSentences.has(trimmed)) return;

        // Find key terms (capitalized words, multi-word terms, or words in quotes)
        const keyTerms = extractKeyTerms(trimmed);

        if (keyTerms.length > 0) {
            const term = keyTerms[0];
            const blanked = trimmed.replace(new RegExp(escapeRegExp(term), 'gi'), '_____');

            if (blanked !== trimmed) {
                cards.push({
                    question: `Completá: ${blanked}`,
                    answer: term,
                });
                usedSentences.add(trimmed);
            }
        }
    });

    // Strategy 3: True/False from factual sentences
    importantSentences.forEach(sentence => {
        if (cards.length >= 30) return;
        const trimmed = sentence.trim();
        if (usedSentences.has(trimmed)) return;

        // Look for sentences with numbers, years, or specific facts
        if (/\d{2,}/.test(trimmed) || /(?:siempre|nunca|todos|ninguno|debe|puede)/i.test(trimmed)) {
            cards.push({
                question: `Verdadero o Falso: "${trimmed}"`,
                answer: 'Verdadero',
            });
            usedSentences.add(trimmed);
        }
    });

    // Strategy 4: Enumeration questions (lines with lists/enumerations)
    const listPatterns = text.match(/(?:[•\-\*\d]+[.)]\s*.{5,}(?:\n|$)){2,}/gm);
    if (listPatterns) {
        listPatterns.forEach(listBlock => {
            if (cards.length >= 30) return;
            const items = listBlock.split('\n').filter(l => l.trim().length > 3);
            if (items.length >= 2 && items.length <= 8) {
                const cleanItems = items.map(i => i.replace(/^[\s•\-\*\d.)]+/, '').trim()).filter(Boolean);
                if (cleanItems.length >= 2) {
                    cards.push({
                        question: `Mencioná los siguientes elementos (son ${cleanItems.length}):`,
                        answer: cleanItems.join(', '),
                    });
                }
            }
        });
    }

    // Deduplicate
    const seen = new Set();
    return cards.filter(c => {
        const key = c.question.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function splitIntoSentences(text) {
    // Split by periods, question marks, exclamation marks, or line breaks
    return text
        .split(/(?<=[.!?])\s+|\n{2,}/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
}

function extractKeyTerms(sentence) {
    const terms = [];

    // Words in quotes
    const quoteMatches = sentence.match(/"([^"]+)"|«([^»]+)»|"([^"]+)"/g);
    if (quoteMatches) {
        quoteMatches.forEach(m => {
            const clean = m.replace(/["""«»]/g, '').trim();
            if (clean.length >= 3) terms.push(clean);
        });
    }

    // Capitalized multi-word terms (proper nouns, technical terms)
    const capMatches = sentence.match(/(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s*){2,}/g);
    if (capMatches) {
        capMatches.forEach(m => {
            const clean = m.trim();
            if (clean.length >= 4 && !['Este', 'Esta', 'Estos', 'Estas', 'Para', 'Entre', 'Según', 'Además'].some(w => clean.startsWith(w))) {
                terms.push(clean);
            }
        });
    }

    // Bold/important terms (words with specific patterns)
    const words = sentence.split(/\s+/);
    words.forEach(word => {
        const clean = word.replace(/[.,;:!?()]/g, '');
        // All-caps words (acronyms)
        if (/^[A-ZÁÉÍÓÚÑ]{2,}$/.test(clean) && clean.length >= 2) {
            terms.push(clean);
        }
    });

    return [...new Set(terms)];
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════
// STUDY MODE (Flip Cards)
// ═══════════════════════════════════════════════
function initStudyControls() {
    const flashcard = $('#flashcard');
    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
    });

    $('#btn-study-prev').addEventListener('click', () => {
        if (STATE.flashcards.length === 0) return;
        STATE.studyIndex = (STATE.studyIndex - 1 + STATE.flashcards.length) % STATE.flashcards.length;
        updateStudyCard();
    });

    $('#btn-study-next').addEventListener('click', () => {
        if (STATE.flashcards.length === 0) return;
        STATE.studyIndex = (STATE.studyIndex + 1) % STATE.flashcards.length;
        updateStudyCard();
    });

    $('#btn-study-shuffle').addEventListener('click', () => {
        if (STATE.flashcards.length === 0) return;
        // Fisher-Yates shuffle (on a copy for display order)
        for (let i = STATE.flashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [STATE.flashcards[i], STATE.flashcards[j]] = [STATE.flashcards[j], STATE.flashcards[i]];
        }
        STATE.studyIndex = 0;
        updateStudyCard();
        showToast('🔀 Flashcards mezcladas.', 'info');
    });
}

function updateStudyCard() {
    const flashcard = $('#flashcard');
    flashcard.classList.remove('flipped');

    if (STATE.flashcards.length === 0) {
        $('#study-empty').classList.remove('hidden');
        $('#study-area').style.display = 'none';
        return;
    }

    $('#study-empty').classList.add('hidden');
    $('#study-area').style.display = '';

    const card = STATE.flashcards[STATE.studyIndex] || STATE.flashcards[0];
    STATE.studyIndex = Math.min(STATE.studyIndex, STATE.flashcards.length - 1);

    $('#fc-front-text').textContent = card.question;
    $('#fc-back-text').textContent = card.answer;
    $('#study-current').textContent = STATE.studyIndex + 1;
    $('#study-total').textContent = STATE.flashcards.length;
}

// ═══════════════════════════════════════════════
// QUIZ MODE
// ═══════════════════════════════════════════════
function initQuizControls() {
    $('#btn-start-quiz').addEventListener('click', startQuiz);
    $('#btn-next-question').addEventListener('click', nextQuestion);
    $('#btn-retry-quiz').addEventListener('click', () => {
        $('#quiz-results').classList.add('hidden');
        $('#quiz-setup').classList.remove('hidden');
    });
}

function updateQuizSetup() {
    const minCards = 4;
    if (STATE.flashcards.length < minCards) {
        $('#btn-start-quiz').disabled = true;
        $('#btn-start-quiz').textContent = `Necesitás al menos ${minCards} flashcards`;
    } else {
        $('#btn-start-quiz').disabled = false;
        $('#btn-start-quiz').textContent = '🚀 Iniciar Quiz';
    }
}

function startQuiz() {
    if (STATE.flashcards.length < 4) {
        showToast(`Necesitás al menos 4 flashcards para el quiz.`, 'error');
        return;
    }

    const countSelect = $('#quiz-count').value;
    let count = countSelect === 'all' ? STATE.flashcards.length : parseInt(countSelect);
    count = Math.min(count, STATE.flashcards.length);

    // Shuffle and pick
    const shuffled = [...STATE.flashcards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    STATE.quiz.questions = selected.map(card => {
        // Get 3 wrong answers from other flashcards
        const wrongAnswers = STATE.flashcards
            .filter(fc => fc.id !== card.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(fc => fc.answer);

        const options = [card.answer, ...wrongAnswers].sort(() => Math.random() - 0.5);

        return {
            question: card.question,
            correctAnswer: card.answer,
            options,
        };
    });

    STATE.quiz.currentIndex = 0;
    STATE.quiz.score = 0;
    STATE.quiz.total = count;

    $('#quiz-setup').classList.add('hidden');
    $('#quiz-results').classList.add('hidden');
    $('#quiz-area').classList.remove('hidden');

    renderQuizQuestion();
}

function renderQuizQuestion() {
    const q = STATE.quiz.questions[STATE.quiz.currentIndex];
    const total = STATE.quiz.total;
    const current = STATE.quiz.currentIndex + 1;

    $('#quiz-counter').textContent = `${current} / ${total}`;
    $('#quiz-progress-fill').style.width = `${(current / total) * 100}%`;
    $('#quiz-question').textContent = q.question;
    $('#btn-next-question').classList.add('hidden');

    const optionsContainer = $('#quiz-options');
    const letters = ['A', 'B', 'C', 'D'];

    optionsContainer.innerHTML = q.options.map((opt, i) => `
        <button class="quiz-option" data-answer="${escapeHtml(opt)}">
            <span class="option-letter">${letters[i]}</span>
            <span>${escapeHtml(opt)}</span>
        </button>
    `).join('');

    optionsContainer.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => selectAnswer(btn, q.correctAnswer));
    });
}

function selectAnswer(btn, correctAnswer) {
    const selected = btn.dataset.answer;
    const options = $$('.quiz-option');

    // Disable all
    options.forEach(o => o.classList.add('disabled'));

    // Mark correct/wrong
    if (selected === correctAnswer) {
        btn.classList.add('correct');
        STATE.quiz.score++;
    } else {
        btn.classList.add('wrong');
        // Highlight the correct one
        options.forEach(o => {
            if (o.dataset.answer === correctAnswer) {
                o.classList.add('correct');
            }
        });
    }

    // Show next button or finish
    if (STATE.quiz.currentIndex < STATE.quiz.total - 1) {
        $('#btn-next-question').classList.remove('hidden');
    } else {
        setTimeout(showQuizResults, 1200);
    }
}

function nextQuestion() {
    STATE.quiz.currentIndex++;
    renderQuizQuestion();
}

function showQuizResults() {
    $('#quiz-area').classList.add('hidden');
    $('#quiz-results').classList.remove('hidden');

    const pct = Math.round((STATE.quiz.score / STATE.quiz.total) * 100);
    $('#quiz-score').textContent = pct;
    $('#quiz-result-detail').textContent = `Respondiste correctamente ${STATE.quiz.score} de ${STATE.quiz.total} preguntas.`;

    if (pct >= 90) {
        $('#quiz-result-title').textContent = '🏆 ¡Excelente!';
    } else if (pct >= 70) {
        $('#quiz-result-title').textContent = '💪 ¡Muy bien!';
    } else if (pct >= 50) {
        $('#quiz-result-title').textContent = '👍 ¡Buen trabajo!';
    } else {
        $('#quiz-result-title').textContent = '📚 ¡Seguí practicando!';
    }
}

// ═══════════════════════════════════════════════
// HERO STATS
// ═══════════════════════════════════════════════
function updateHeroStats() {
    const sessions = getSessions();
    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    $('#hero-total-sessions').textContent = sessions.length;
    $('#hero-total-hours').textContent = totalHours;
    $('#hero-total-cards').textContent = STATE.flashcards.length;
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTimer();
    initCalendar();
    initFlashcards();
    updateTimerInfo();
    updateHeroStats();
    updateTimerDisplay();
});
