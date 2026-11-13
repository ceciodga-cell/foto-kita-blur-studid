// ==================================================
// CONFIGURATION & DATA SETS
// ==================================================

const NAMA_PACAR = new Set([
    "aurell",
    "aurel",
    "isell",
    "isel",
    "putri",
    "gisella",
    "gisela",
    "pribadi",
    "putri aurel gisella pribadi",
    "putri aurell gisella pribadi",
    "putri aurell gisela pribadi",
    "putri aurel gisela pribadi"
]);

const NAMA_CREATOR = new Set([
    "cecio",
    "cio",
    "cecio danan galih abednego",
    "cecio dannang galih abednego",
    "ceco danang galih abednego",
    "cecio danang galih abedenego",
    "cecoi danang galih abednego",
    "cecio danang galih abednegp",
    "danang",
    "galih",
    "abednego"
]);

// ==================================================
// APPLICATION STATE
// ==================================================

let currentUser = "pengguna misterius";
let currentMode = "default"; 
let snakeHighScore = [0];

// State skor & upgrade Tower Survival (otomatis ke-reset ke 0 saat sistem di-reset / ganti user)
let tsData = {
    bestFloor: 0,
    coins: 0,
    upgrades: {
        jump: 1,
        magnet: 1,
        shield: 1
    },
    soundOn: true
};

function resetAllScores(clearNeonStorage = false) {
    snakeHighScore = [0];
    snakeScore = 0;
    tsData = {
        bestFloor: 0,
        coins: 0,
        upgrades: {
            jump: 1,
            magnet: 1,
            shield: 1
        },
        soundOn: tsData.soundOn
    };
    if (clearNeonStorage && typeof NeonBreaker !== "undefined") {
        NeonBreaker.resetHighScore();
    }
}

// ==================================================
// GLOBAL WEB AUDIO SFX ENGINE (SCENARIO-ADAPTIVE)
// ==================================================

const SysSFX = (() => {
    let ctx = null;

    function getContext() {
        if (!tsData.soundOn) return null;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!ctx) ctx = new AudioCtx();
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    function playTone(f1, f2, dur, type = "triangle", vol = 0.25, delay = 0) {
        try {
            const c = getContext();
            if (!c) return;
            const now = c.currentTime + delay;
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(Math.max(20, f1), now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + dur);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(Math.min(0.85, vol), now + Math.min(0.012, dur * 0.2));
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(now);
            osc.stop(now + dur + 0.01);
        } catch (e) {}
    }

    function playChord(freqs, dur, type = "triangle", vol = 0.16, stagger = 0) {
        freqs.forEach((f, idx) => {
            playTone(f, f * 1.005, dur, type, vol, idx * stagger);
        });
    }

    return {
        unlock() {
            getContext();
        },

        // Efek mengetik karakter otomatis (menyesuaikan mode aktif)
        typeChar() {
            const jitter = 0.93 + Math.random() * 0.14;
            if (currentMode === "pacar" || currentMode === "kaciu") {
                playTone(840 * jitter, 960 * jitter, 0.032, "sine", 0.14);
            } else if (currentMode === "creator") {
                playTone(260 * jitter, 520 * jitter, 0.028, "sawtooth", 0.13);
            } else if (currentMode === "tamu") {
                playTone(360 * jitter, 240 * jitter, 0.026, "square", 0.11);
            } else {
                playTone(540 * jitter, 620 * jitter, 0.026, "triangle", 0.13);
            }
        },

        // Efek ketikan manual di input box
        keystroke() {
            const jitter = 0.94 + Math.random() * 0.12;
            playTone(460 * jitter, 310 * jitter, 0.03, "triangle", 0.18);
        },

        // Hover & klik tombol UI
        hover() {
            playTone(580, 660, 0.025, "sine", 0.10);
        },

        click() {
            if (currentMode === "pacar" || currentMode === "kaciu") {
                playTone(587.33, 880, 0.09, "sine", 0.24);
            } else {
                playTone(480, 720, 0.075, "triangle", 0.24);
            }
        },

        // Skenario Intro: Mode Pacar
        anomalyRadar() {
            playTone(620, 880, 0.18, "sine", 0.26, 0);
            playTone(620, 880, 0.18, "sine", 0.26, 0.24);
        },

        verifyStep(step) {
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            const f = notes[Math.min(step, notes.length - 1)];
            playTone(f, f * 1.12, 0.16, "triangle", 0.28);
        },

        surpriseSparkle() {
            playChord([523.25, 659.25, 783.99, 987.77, 1046.5], 0.32, "sine", 0.22, 0.06);
        },

        callingRing() {
            playTone(440, 440, 0.22, "sine", 0.20, 0);
            playTone(480, 480, 0.22, "sine", 0.20, 0);
            playTone(440, 440, 0.22, "sine", 0.20, 0.30);
            playTone(480, 480, 0.22, "sine", 0.20, 0.30);
        },

        callConnectedRomantic() {
            playTone(784, 1046.5, 0.12, "sine", 0.26, 0);
            playChord([261.63, 329.63, 392.00, 493.88, 523.25], 0.9, "sine", 0.18, 0.07);
        },

        // Skenario Intro: Kaciu, Tamu, Creator
        kaciuCute() {
            playChord([783.99, 659.25, 783.99, 880, 1046.5], 0.26, "sine", 0.22, 0.07);
        },

        tamuThreat() {
            playTone(190, 95, 0.38, "sawtooth", 0.28, 0);
            playTone(150, 75, 0.42, "sawtooth", 0.26, 0.22);
        },

        creatorAlarm() {
            playTone(720, 340, 0.22, "sawtooth", 0.30, 0);
            playTone(720, 340, 0.22, "sawtooth", 0.30, 0.25);
            playTone(540, 140, 0.35, "square", 0.28, 0.50);
        },

        // Skenario PTN Analysis
        scanStep(step) {
            const base = 380 + step * 110;
            playTone(base, base + 140, 0.14, "triangle", 0.24);
        },

        ptnSuccess() {
            playChord([523.25, 659.25, 783.99, 1046.5], 0.42, "triangle", 0.25, 0.08);
        },

        ptnMid() {
            playChord([329.63, 392.00, 440.00], 0.30, "triangle", 0.22, 0.09);
        },

        ptnMockTrombone() {
            // Sad trombone descending untuk hasil rendah / ngejek
            playTone(293.66, 285, 0.26, "sawtooth", 0.24, 0);
            playTone(277.18, 268, 0.26, "sawtooth", 0.24, 0.28);
            playTone(261.63, 252, 0.26, "sawtooth", 0.24, 0.56);
            playTone(246.94, 185, 0.65, "sawtooth", 0.26, 0.84);
        },

        // Skenario Game Ular
        snakeTurn() {
            playTone(280, 330, 0.03, "square", 0.12);
        },

        snakeEat() {
            if (currentMode === "pacar" || currentMode === "kaciu") {
                playTone(660, 990, 0.12, "sine", 0.28);
            } else {
                playTone(440, 880, 0.11, "square", 0.22);
            }
        },

        snakeOver() {
            if (currentMode === "pacar" || currentMode === "kaciu") {
                playChord([523.25, 440, 349.23], 0.35, "sine", 0.24, 0.12);
            } else {
                playTone(320, 65, 0.48, "sawtooth", 0.30);
            }
        },

        // Skenario Progress, Shutdown & Boot
        progressOpen() {
            playTone(620, 930, 0.10, "triangle", 0.22);
        },

        shutdown() {
            playTone(520, 42, 0.70, "sawtooth", 0.28);
        },

        bootUp() {
            playTone(150, 640, 0.24, "triangle", 0.26, 0);
            playTone(640, 960, 0.20, "sine", 0.24, 0.20);
        }
    };
})();

// ==================================================
// UTILITY FUNCTIONS
// ==================================================

function capitalize(str) {
    if (!str) return "";
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setScene(sceneId) {
    stopMood(); // Bersihkan emoji tiap pindah scene
    stopTowerLoop(); // Hentikan loop Tower Survival saat keluar scene
    if (typeof NeonBreaker !== "undefined") {
        NeonBreaker.stopLoop(); // Hentikan loop Neon Breaker saat keluar scene
    }

    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sceneId);
    if (target) {
        target.classList.add('active');
    }
}

// ==================================================
// DYNAMIC BACKGROUND ENGINE (VERSI AMAN & ESTETIK)
// ==================================================

function setupBackgroundDecorations(mode) {
    const container = document.getElementById('bgHearts');
    if (!container) return;

    // Paksa wadah ini untuk selalu tampil di semua mode
    // (Bypass kalau misal CSS lu nge-hide ini di luar mode pacar)
    container.style.display = 'block';
    container.style.opacity = '1';
    container.style.visibility = 'visible';
    container.innerHTML = '';

    let symbols = [];
    let count = 20;

    if (mode === 'pacar' || mode === 'kaciu') {
        symbols = ['❤️', '💖', '💕', '🌸', '✨'];
        count = 20;
    } else if (mode === 'tamu') {
        symbols = ['⚠️', '🚫', '❓', '❗', '🛑', '❌'];
        count = 15;
    } else if (mode === 'creator') {
        symbols = ['{ }', '</>', '0', '1', '💻', '⚡'];
        count = 25;
    } else { 
        // Mode Default (Biru Awal)
        symbols = ['0', '1', '•', '▪', '▫'];
        count = 35;
    }

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        // KITA BALIK PAKAI CLASS BAWAAN LU BIAR ANIMASINYA TETEP SMOOTH!
        el.className = 'floating-heart'; 
        
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.left = `${Math.random() * 100}%`;
        
        // Animasi delay dibikin negatif biar langsung penuh di layar pas web dibuka
        el.style.animationDelay = `${Math.random() * -20}s`; 
        el.style.animationDuration = `${8 + Math.random() * 6}s`;

        // Kalau BUKAN mode pacar, kita kecilin opacitynya manual biar ga norak
        // TAPI kalau mode pacar, KITA BIARIN KOSONG biar murni ngikutin CSS estetik lu
        if (mode !== 'pacar' && mode !== 'kaciu') {
            el.style.opacity = '0.15'; // Redup estetik buat hacker/sistem
            el.style.fontSize = (Math.random() * 1 + 1) + 'rem';
        }

        container.appendChild(el);
    }
}

function updateTheme(mode) {
    const body = document.body;
    const badge = document.getElementById('modeBadge');
    const title = document.getElementById('terminalTitle');

    body.classList.remove('theme-default', 'theme-pacar', 'theme-tamu', 'theme-creator');

    if (mode === 'pacar' || mode === 'kaciu') {
        body.classList.add('theme-pacar');
        badge.textContent = 'MODE PACAR ❤️';
        title.textContent = 'SYSTEM // PACAR VERIFIED';
    } else if (mode === 'creator') {
        body.classList.add('theme-creator');
        badge.textContent = 'CREATOR DETECTED';
        title.textContent = 'SYSTEM // ACCESS DENIED';
    } else if (mode === 'tamu') {
        body.classList.add('theme-tamu');
        badge.textContent = 'MODE TAMU ⚠️';
        title.textContent = 'SYSTEM // THREAT LEVEL HIGH';
    } else {
        body.classList.add('theme-default');
        badge.textContent = 'SYS_BLUE';
        title.textContent = 'SYSTEM // MODE: INITIALIZING';
    }

    // Panggil partikel/dekorasi
    setupBackgroundDecorations(mode);
}

function determineMode(nama) {
    const clean = nama.trim().toLowerCase();
    if (NAMA_PACAR.has(clean)) return "pacar";
    if (NAMA_CREATOR.has(clean)) return "creator";
    if (clean === "kaciu") return "kaciu";
    return "tamu";
}

async function typeTextToElement(element, text, speed = 20) {
    element.innerHTML = "";
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const p = document.createElement('div');
        element.appendChild(p);
        for (let char of line) {
            p.textContent += char;
            if (char.trim() !== "") {
                SysSFX.typeChar();
            }
            await sleep(speed);
        }
    }
}

// ==================================================
// INTRO FLOW CONTROLLER
// ==================================================

document.addEventListener('DOMContentLoaded', () => {
    // Layar pertama kali dibuka langsung keluarin dekorasi biner
    updateTheme('default');
    resetAllScores();

    // Unlock audio context otomatis pada interaksi pertama user
    const unlockOnce = () => {
        SysSFX.unlock();
        document.removeEventListener('pointerdown', unlockOnce);
        document.removeEventListener('keydown', unlockOnce);
    };
    document.addEventListener('pointerdown', unlockOnce);
    document.addEventListener('keydown', unlockOnce);

    const btnSubmitName = document.getElementById('btnSubmitName');
    const usernameInput = document.getElementById('usernameInput');
    const kampusInput = document.getElementById('kampusInput');

    usernameInput.addEventListener('input', () => SysSFX.keystroke());
    kampusInput.addEventListener('input', () => SysSFX.keystroke());

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnSubmitName.click();
    });

    btnSubmitName.addEventListener('click', async () => {
        SysSFX.click();
        let nameVal = usernameInput.value.trim();
        if (!nameVal) nameVal = "pengguna misterius";
        
        // Reset semua skor ke 0 setiap sesi pengguna baru dimulai
        resetAllScores();

        currentUser = nameVal;
        currentMode = determineMode(currentUser);

        if (typeof SecretFlow !== "undefined") {
            SecretFlow.onUserIdentified(currentMode, currentUser);
        }

        updateTheme(currentMode);
        
        setScene('sceneIntroMode');
        await runIntroSequence(currentMode, currentUser);
    });

    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => SysSFX.hover());
        btn.addEventListener('click', () => {
            SysSFX.click();
            const choice = btn.getAttribute('data-choice');
            handleMenuChoice(choice);
        });
    });

    document.getElementById('btnNextFromIntro').addEventListener('click', () => {
        SysSFX.click();
        setScene('sceneMenuUtama');
    });
    document.getElementById('btnPTNBack').addEventListener('click', () => {
        SysSFX.click();
        setScene('sceneMenuUtama');
    });
    document.getElementById('btnMiniGameBack').addEventListener('click', () => {
        SysSFX.click();
        setScene('sceneMenuUtama');
    });
    document.getElementById('btnProgBack').addEventListener('click', () => {
        SysSFX.click();
        setScene('sceneMenuUtama');
    });

    document.getElementById('btnRestartApp').addEventListener('click', () => {
        SysSFX.bootUp();
        // Reset seluruh skor ke 0 saat sistem di-restart untuk dicoba orang lain
        resetAllScores();
        currentUser = "pengguna misterius";
        currentMode = "default";
        document.getElementById('usernameInput').value = '';
        updateTheme('default'); 
        setScene('sceneIntroUmum');
    });

    document.getElementById('btnStartPTN').addEventListener('click', () => {
        SysSFX.click();
        runPTNAnalysis();
    });
    kampusInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            SysSFX.click();
            runPTNAnalysis();
        }
    });

    initTowerControls();
    if (typeof NeonBreaker !== "undefined") {
        NeonBreaker.init();
    }
});

async function runIntroSequence(mode, name) {
    const display = document.getElementById('modeContentDisplay');
    const nextBtn = document.getElementById('btnNextFromIntro');
    nextBtn.style.display = 'none';
    display.innerHTML = '';

    if (mode === 'pacar') {
        SysSFX.anomalyRadar();
        const p1 = document.createElement('div');
        display.appendChild(p1);
        await typeTextToElement(p1, "⚠️ ANOMALI TERDETEKSI ⚠️\n\nSistem menemukan pengguna spesial.\n\nMelakukan pengecekan...", 25);
        await sleep(1000);

        SysSFX.verifyStep(0);
        const check1 = document.createElement('div');
        check1.textContent = "✅ Nama cocok";
        display.appendChild(check1);
        await sleep(800);

        SysSFX.verifyStep(1);
        const check2 = document.createElement('div');
        check2.textContent = "✅ Prioritas maksimum";
        display.appendChild(check2);
        await sleep(800);

        SysSFX.verifyStep(2);
        const check3 = document.createElement('div');
        check3.textContent = "✅ Pengguna terverifikasi";
        display.appendChild(check3);
        await sleep(1000);

        SysSFX.typeChar();
        const p2 = document.createElement('div');
        p2.textContent = "\nSebentar...";
        display.appendChild(p2);
        await sleep(1000);

        SysSFX.verifyStep(1);
        const p3 = document.createElement('div');
        p3.textContent = "LOH?";
        display.appendChild(p3);
        await sleep(1000);

        SysSFX.surpriseSparkle();
        const p4 = document.createElement('div');
        p4.textContent = "INI DIA?????";
        display.appendChild(p4);
        await sleep(1200);

        SysSFX.callingRing();
        const pLoad1 = document.createElement('div');
        pLoad1.textContent = "📡 Menghubungi creator.....";
        display.appendChild(pLoad1);
        await sleep(1500);

        const p5 = document.createElement('div');
        display.appendChild(p5);
        await typeTextToElement(p5, "\n⚡ Creator langsung mengangkat panggilan.\n\nSepertinya ada seseorang yang ingin menyampaikan sesuatu.\n\nSistem akan menonaktifkan diri sementara.", 25);
        await sleep(1000);

        SysSFX.callConnectedRomantic();
        const pLoad2 = document.createElement('div');
        pLoad2.textContent = "🎙️ Mengalihkan ke creator...";
        display.appendChild(pLoad2);
        await sleep(1500);

        const divider1 = document.createElement('pre');
        divider1.className = 'ascii-line';
        divider1.textContent = "━".repeat(48);
        display.appendChild(divider1);

        const creatorMsg = document.createElement('div');
        creatorMsg.style.color = 'var(--primary-color)';
        creatorMsg.style.fontWeight = 'bold';
        display.appendChild(creatorMsg);
        await typeTextToElement(creatorMsg, `
HALOOO SAYANGKUUUU 😭❤️

Makasiii yahh udah check website ini.

Ini hasil belajar coding pacar Isell heheehe.

MAKASIIIHH SAYANGG UDAH MAU NYEMPETIN LIHAT WEBSITEKUUU.

Makasii juga karena kamu udah jadi support system aku yang nomor satu.

I LOVEEEE YOUUU SO MUCHHH.

MWAAA SAYANGGG ❤️
`, 20);

        const divider2 = document.createElement('pre');
        divider2.className = 'ascii-line';
        divider2.textContent = "━".repeat(48);
        display.appendChild(divider2);

        nextBtn.style.display = 'block';

    } else if (mode === 'creator') {
        SysSFX.creatorAlarm();
        const p = document.createElement('div');
        display.appendChild(p);
        await typeTextToElement(p, `
LAH LU NGAPAIN JIR 😭

lukira gw ga bisa lihat kamera lu??

LAWAK LAWAK

mana sok nyamar jadi creator pula mending lu pergi njing

CUIH

Shutting down...
`, 25);
        await sleep(2000);
        triggerShutdown("Sistem telah dimatikan oleh keamanan internal.");

    } else if (mode === 'kaciu') {
        SysSFX.kaciuCute();
        const p = document.createElement('div');
        display.appendChild(p);
        await typeTextToElement(p, `
IHHH SAYANGGG 😭❤️

Ngapain pakai nama Kaciu?

Isell penasaran yah apa yang terjadi kalau pakai nama ini.

Nih yang terjadi...

Aku tahu kalau itu kamuuu xixixi.

Love youuu sayanggg ❤️

MWAAA.

— Dear Creator
`, 25);
        nextBtn.style.display = 'block';

    } else { // TAMU MODE
        SysSFX.tamuThreat();
        const p = document.createElement('div');
        display.appendChild(p);
        await typeTextToElement(p, `
Yah sianjing, ${capitalize(name)}.

Ngapain coba kesini? 😭

Yaudahlah, karena lu udah terlanjur masuk, nih gw kasih akses ke menu.

Tapi jangan berharap sistem bakal ramah.
`, 25);
        nextBtn.style.display = 'block';
    }
}

// ==================================================
// MENU SELECTION DISPATCHER
// ==================================================

function handleMenuChoice(choice) {
    if (choice === '1') {
        initPTNGame();
    } else if (choice === '2') {
        initSnakeGame();
    } else if (choice === '3') {
        initTowerSurvival();
    } else if (choice === '4') {
        showProgress();
    } else if (choice === '5') {
        triggerShutdown("Sistem akan dimatikan.\n\nTerima kasih sudah mencoba program buatan creator.\n\nSampai ketemu lagi.");
    } else if (choice === '6') {
        NeonBreaker.open();
    }
}

// ==================================================
// GAME 1: PTN PERCENTAGE SYSTEM
// ==================================================

function initPTNGame() {
    setScene('sceneGamePTN');
    document.getElementById('ptnStepInput').style.display = 'block';
    document.getElementById('ptnStepLoading').style.display = 'none';
    document.getElementById('ptnStepResult').style.display = 'none';
    document.getElementById('kampusInput').value = '';

    const welcomeBox = document.getElementById('ptnWelcomeText');
    if (currentMode === 'pacar') {
        welcomeBox.textContent = `WELCOME TO PTN PERCENTAGE SYSTEM SAYANGGG ❤️\n\nSistem akan menganalisis peluangmu masuk ke kampus impian.`;
    } else {
        welcomeBox.textContent = `Sistem akan menghitung peluang pengguna masuk ke kampus impiannya.\n\nHasil dibuat oleh algoritma yang belum tentu tahu apa-apa.`;
    }
}

async function runPTNAnalysis() {
    let kampus = document.getElementById('kampusInput').value.trim();
    if (!kampus) kampus = "Kampus Misterius";

    document.getElementById('ptnStepInput').style.display = 'none';
    document.getElementById('ptnStepLoading').style.display = 'block';

    const logs = document.getElementById('ptnLoadingLogs');
    SysSFX.scanStep(0);
    logs.textContent = "📡 Menghubungkan ke server...";
    await sleep(1000);
    SysSFX.scanStep(1);
    logs.textContent = "🔍 Mengambil data pengguna...";
    await sleep(1000);
    SysSFX.scanStep(2);
    logs.textContent = "⚡ Menganalisis peluang...";
    await sleep(1500);

    let belajar, akademik, analitis, mental, peluang;
    if (currentMode === 'pacar') {
        belajar = getRandomInt(90, 100);
        akademik = getRandomInt(85, 100);
        analitis = getRandomInt(80, 100);
        mental = getRandomInt(75, 100);
        peluang = getRandomInt(85, 99);
    } else {
        belajar = getRandomInt(0, 100);
        akademik = getRandomInt(0, 100);
        analitis = getRandomInt(0, 100);
        mental = getRandomInt(0, 100);
        peluang = getRandomInt(0, 100);
    }

    document.getElementById('resNama').textContent = capitalize(currentUser);
    document.getElementById('resAkademik').textContent = `${akademik}%`;
    document.getElementById('resAnalitis').textContent = `${analitis}%`;
    document.getElementById('resBelajar').textContent = `${belajar}%`;
    document.getElementById('resMental').textContent = `${mental}%`;
    document.getElementById('resKampus').textContent = capitalize(kampus);
    document.getElementById('resPeluang').textContent = `${peluang}%`;

    let komentar = "";
    if (currentMode === 'pacar') {
        setMood('memuji');
        SysSFX.ptnSuccess();
        komentar = `Berdasarkan data yang berhasil dikumpulkan dan dianalisis...\n\nKamu memiliki peluang sebesar ${peluang}% untuk masuk ke:\n\n${capitalize(kampus)} ❤️\n\nTetap semangat belajar yaa sayang.\n\nAku percaya kamu bisa.\n\nJangan lupa istirahat juga.`;
    } else {
        if (peluang < 30) {
            setMood('ngejek'); 
            SysSFX.ptnMockTrombone();
            komentar = `HASIL ANALISIS: KRITIS.\n\nPeluang masuk ke ${capitalize(kampus)} saat ini cuma ${peluang}%.\n\nBHAHAHAAH DONGOK gini😹😹😹 \n\nmau belajar juga susah ngejarnya AWOWKWAOKOSWOKWAO.`;
        } else if (peluang < 50) {
            setMood('ngejek'); 
            SysSFX.ptnMockTrombone();
            komentar = `Peluang masuk ke ${capitalize(kampus)}:\n\n${peluang}%\n\nMasih ada harapan.\n\nHARAPAN DIPULANGIN PAKSA!!! AWKOWAKAKOKWKAWKO`;
        } else if (peluang < 80) {
            setMood('memuji'); 
            SysSFX.ptnMid();
            komentar = `Peluang masuk ke ${capitalize(kampus)}:\n\n${peluang}%\n\nWell Well Well \n\naga dongo tapi oke👍`;
        } else {
            setMood('memuji'); 
            SysSFX.ptnSuccess();
            komentar = `Peluang masuk ke ${capitalize(kampus)}:\n\n${peluang}%\n\nAn iq to high`;
        }
    }

    document.getElementById('resKomentar').textContent = komentar;

    document.getElementById('ptnStepLoading').style.display = 'none';
    document.getElementById('ptnStepResult').style.display = 'block';
}

// ==================================================
// GAME 2: SNAKE GAME RETRO
// ==================================================

let snakeCanvas, snakeCtx;
let snakeGridSize = 20;
let snakeHead = { x: 200, y: 200 };
let snakeDirection = "stop";
let snakeSegments = [];
let snakeFood = { x: 100, y: 100 };
let snakeScore = 0;
let snakeInterval = null;
let isSnakeGameOver = false;

function initSnakeGame() {
    setScene('sceneGameUlar');
    snakeCanvas = document.getElementById('snakeCanvas');
    snakeCtx = snakeCanvas.getContext('2d');

    resetSnakeGame();
    if (typeof SecretFlow !== "undefined") SecretFlow.updateGameBadges();

    document.removeEventListener('keydown', handleSnakeKeydown);
    document.addEventListener('keydown', handleSnakeKeydown);

    document.getElementById('ctrlUp').onclick = () => { if (snakeDirection !== "down") { snakeDirection = "up"; SysSFX.snakeTurn(); } };
    document.getElementById('ctrlDown').onclick = () => { if (snakeDirection !== "up") { snakeDirection = "down"; SysSFX.snakeTurn(); } };
    document.getElementById('ctrlLeft').onclick = () => { if (snakeDirection !== "right") { snakeDirection = "left"; SysSFX.snakeTurn(); } };
    document.getElementById('ctrlRight').onclick = () => { if (snakeDirection !== "left") { snakeDirection = "right"; SysSFX.snakeTurn(); } };

    document.getElementById('btnRestartSnake').onclick = () => { SysSFX.click(); resetSnakeGame(); };
    document.getElementById('btnSnakeExit').onclick = () => { SysSFX.click(); exitSnakeGame(); };
}

function resetSnakeGame() {
    snakeHead = { x: 200, y: 200 };
    snakeDirection = "stop";
    snakeSegments = [];
    snakeScore = 0;
    isSnakeGameOver = false;

    document.getElementById('snakeScore').textContent = snakeScore;
    document.getElementById('snakeHighScore').textContent = snakeHighScore[0];
    document.getElementById('snakeGameOverOverlay').style.display = 'none';

    placeSnakeFood();
    drawSnakeGame();

    if (snakeInterval) clearInterval(snakeInterval);
    snakeInterval = setInterval(gameLoopSnake, 120);
}

function exitSnakeGame() {
    if (snakeInterval) clearInterval(snakeInterval);
    document.removeEventListener('keydown', handleSnakeKeydown);
    setScene('sceneMenuUtama');
}

function handleSnakeKeydown(e) {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') {
        if (snakeDirection !== "down" && snakeDirection !== "up") { snakeDirection = "up"; SysSFX.snakeTurn(); }
    } else if (key === 's' || key === 'arrowdown') {
        if (snakeDirection !== "up" && snakeDirection !== "down") { snakeDirection = "down"; SysSFX.snakeTurn(); }
    } else if (key === 'a' || key === 'arrowleft') {
        if (snakeDirection !== "right" && snakeDirection !== "left") { snakeDirection = "left"; SysSFX.snakeTurn(); }
    } else if (key === 'd' || key === 'arrowright') {
        if (snakeDirection !== "left" && snakeDirection !== "right") { snakeDirection = "right"; SysSFX.snakeTurn(); }
    } else if (key === 'q') {
        SysSFX.click();
        exitSnakeGame();
    }
}

function placeSnakeFood() {
    const maxX = (snakeCanvas.width / snakeGridSize) - 1;
    const maxY = (snakeCanvas.height / snakeGridSize) - 1;
    snakeFood.x = Math.floor(Math.random() * maxX) * snakeGridSize;
    snakeFood.y = Math.floor(Math.random() * maxY) * snakeGridSize;
}

function gameLoopSnake() {
    if (isSnakeGameOver) return;

    for (let i = snakeSegments.length - 1; i > 0; i--) {
        snakeSegments[i].x = snakeSegments[i - 1].x;
        snakeSegments[i].y = snakeSegments[i - 1].y;
    }
    if (snakeSegments.length > 0) {
        snakeSegments[0].x = snakeHead.x;
        snakeSegments[0].y = snakeHead.y;
    }

    if (snakeDirection === "up") snakeHead.y -= snakeGridSize;
    if (snakeDirection === "down") snakeHead.y += snakeGridSize;
    if (snakeDirection === "left") snakeHead.x -= snakeGridSize;
    if (snakeDirection === "right") snakeHead.x += snakeGridSize;

    if (snakeHead.x < 0 || snakeHead.x >= snakeCanvas.width || snakeHead.y < 0 || snakeHead.y >= snakeCanvas.height) {
        triggerSnakeGameOver();
        return;
    }

    for (let seg of snakeSegments) {
        if (snakeHead.x === seg.x && snakeHead.y === seg.y) {
            triggerSnakeGameOver();
            return;
        }
    }

    if (snakeHead.x === snakeFood.x && snakeHead.y === snakeFood.y) {
        SysSFX.snakeEat();
        snakeSegments.push({ x: -20, y: -20 });
        snakeScore += 10;
        if (snakeScore > snakeHighScore[0]) {
            snakeHighScore[0] = snakeScore;
        }
        document.getElementById('snakeScore').textContent = snakeScore;
        document.getElementById('snakeHighScore').textContent = snakeHighScore[0];
        if (typeof SecretFlow !== "undefined") SecretFlow.checkScore('snake', snakeScore);
        placeSnakeFood();
    }

    drawSnakeGame();
}

function drawSnakeGame() {
    snakeCtx.fillStyle = "#000000";
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    snakeCtx.fillStyle = (currentMode === 'pacar') ? "#ec4899" : "#10b981";
    snakeCtx.fillRect(snakeHead.x, snakeHead.y, snakeGridSize - 2, snakeGridSize - 2);

    snakeCtx.fillStyle = (currentMode === 'pacar') ? "#f472b6" : "#34d399";
    for (let seg of snakeSegments) {
        snakeCtx.fillRect(seg.x, seg.y, snakeGridSize - 2, snakeGridSize - 2);
    }

    snakeCtx.font = "16px sans-serif";
    snakeCtx.textAlign = "center";
    snakeCtx.textBaseline = "middle";
    const foodIcon = (currentMode === 'pacar') ? "🌯" : "🍎";
    snakeCtx.fillText(foodIcon, snakeFood.x + snakeGridSize / 2, snakeFood.y + snakeGridSize / 2);
}

function triggerSnakeGameOver() {
    isSnakeGameOver = true;
    if (snakeInterval) clearInterval(snakeInterval);
    SysSFX.snakeOver();

    let pesanKalah = "";
    if (currentMode === 'pacar') {
        pesanKalah = `${capitalize(currentUser)} SAYANGGG 😭\nKamu kalahh...\nTapi gapapaa, coba lagi yaa ❤️`;
    } else {
        pesanKalah = `${currentUser.toUpperCase()}...\nDONGO!!! 😭`;
    }

    document.getElementById('snakeGameOverMsg').textContent = pesanKalah;
    document.getElementById('snakeGameOverOverlay').style.display = 'flex';
}

// ==================================================
// VIEW PROGRESS & SHUTDOWN
// ==================================================

function showProgress() {
    SysSFX.progressOpen();
    setScene('sceneProgress');
    const isPacar = currentMode === 'pacar' || currentMode === 'kaciu';
    document.getElementById('progNama').textContent = capitalize(currentUser);
    document.getElementById('progMode').textContent = currentMode.toUpperCase();
    document.getElementById('progScore').textContent = snakeHighScore[0];
    document.getElementById('progTowerFloor').textContent = `Lantai ${tsData.bestFloor}`;
    document.getElementById('progTowerCoinLabel').textContent = isPacar ? "Hati Tower Survival:" : "Koin Tower Survival:";
    document.getElementById('progTowerCoins').textContent = `${tsData.coins} ${isPacar ? "❤️" : "◈"}`;
    document.getElementById('progNeonBreaker').textContent = typeof NeonBreaker !== "undefined" ? NeonBreaker.getHighScore() : 0;

    if (typeof SecretFlow !== "undefined") {
        SecretFlow.renderProgressSummary();
    }
}

function triggerShutdown(message) {
    if (typeof NeonBreaker !== "undefined") {
    if (typeof NeonBreaker !== "undefined" && !(typeof SecretFlow !== "undefined" && SecretFlow.isSessionEligible())) {
    NeonBreaker.resetHighScore();
}
    }
    SysSFX.shutdown();
    setScene('sceneShutdown');
    document.getElementById('shutdownMsg').textContent = message;
}

// ==================================================
// EMOJI BACKGROUND SYSTEM 
// ==================================================

const moods = {
    ngejek: ['😂', '🤣', '🤪', '🤭', '🤡', '☝️🤓', '😹'],
    ngusir: ['😡', '🤬', '🚪', '🛑', '🚫', '🔪', '💢'],
    memuji: ['👏', '🎉', '✨', '🥳', '👑', '💯', '🎆', '🤩'],
    netral: []
};

let emojiInterval;

function stopMood() {
    clearInterval(emojiInterval); 
    const container = document.getElementById('emoji-background');
    if (container) {
        container.innerHTML = ''; 
    }
}

function setMood(moodName) {
    stopMood();
    const container = document.getElementById('emoji-background');
    if (!container) return; 

    const activeEmojis = moods[moodName];
    if (!activeEmojis || activeEmojis.length === 0) return;

    emojiInterval = setInterval(() => {
        const emojiEl = document.createElement('div');
        emojiEl.classList.add('floating-emoji');
        
        const randomEmoji = activeEmojis[Math.floor(Math.random() * activeEmojis.length)];
        emojiEl.innerText = randomEmoji;
        
        emojiEl.style.left = Math.random() * 100 + 'vw';
        emojiEl.style.fontSize = (Math.random() * 2 + 1.5) + 'rem'; 
        emojiEl.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        container.appendChild(emojiEl);

        emojiEl.addEventListener('animationend', () => {
            emojiEl.remove();
        });
    }, 300);
}

// ==================================================
// GAME 3: TOWER SURVIVAL (PACAR PINK/HEART VS FUTURISTIC)
// ==================================================

let tsRafId = null;
let tsLastTime = 0;
let tsState = "MENU"; // MENU | PLAYING | PAUSED | GAMEOVER
let tsKeys = { left: false, right: false };
let tsJumpBuffer = 0;
let tsCoyote = 0;
let tsAudioCtx = null;

let tsPlayer = null;
let tsPlatforms = [];
let tsCoins = [];
let tsPowerups = [];
let tsDrones = [];
let tsParticles = [];
let tsPopups = [];
let tsCamY = 0;
let tsFloor = 0;
let tsRunEarned = 0;
let tsNextFloor = 1;
let tsLastMilestone = 0;
let tsPassedBest = false;
let tsShake = 0;

function tsPlayTone(f1, f2, dur, type = "sine", vol = 0.1) {
    if (!tsData.soundOn) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!tsAudioCtx) tsAudioCtx = new AudioCtx();
    if (tsAudioCtx.state === "suspended") tsAudioCtx.resume();

    // Volume diperkuat 5x agar terdengar lantang & jelas di speaker HP/laptop
    const boostedVol = Math.min(0.85, vol * 5);
    const waveType = type === "sine" ? "triangle" : type;

    const now = tsAudioCtx.currentTime;
    const osc = tsAudioCtx.createOscillator();
    const gain = tsAudioCtx.createGain();
    osc.type = waveType;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + dur);
    gain.gain.setValueAtTime(boostedVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(tsAudioCtx.destination);
    osc.start(now);
    osc.stop(now + dur);
}

function isTsPacarMode() {
    return currentMode === "pacar" || currentMode === "kaciu";
}

function getTsPalette() {
    if (isTsPacarMode()) {
        return {
            badge: "ROMANTIC EDITION ♥",
            title: "TOWER OF LOVE",
            desc: "Kumpulkan hati & daki menara! Puncak rintangan terbuka di Lantai 25.",
            currencyLabel: "HEARTS",
            icon: "♥",
            bgTop: "#1f0714",
            bgBottom: "#3b0d26",
            grid: "rgba(255, 133, 179, 0.08)",
            player: "#ff4d8d",
            playerGlow: "#ff99c2",
            platStatic: "#ff75a0",
            platRim: "#ffe4e6",
            platMoving: "#e879f9",
            platFragile: "#ef4444",
            hazard: "#f43f5e",
            coinNorm: "#ff4d8d",
            coinSpec: "#ffd700",
            particles: ["#ff4d8d", "#ff99c2", "#ffd700", "#ffffff"]
        };
    }
    return {
        badge: "CYBER PROTOCOL ◈",
        title: "TOWER SURVIVAL",
        desc: "Daki menara setinggi mungkin! Puncak rintangan terbuka di Lantai 25.",
        currencyLabel: "COINS",
        icon: "◈",
        bgTop: "#050811",
        bgBottom: "#0c1631",
        grid: "rgba(0, 240, 255, 0.06)",
        player: "#00f0ff",
        playerGlow: "#38bdf8",
        platStatic: "#0284c7",
        platRim: "#00f0ff",
        platMoving: "#9333ea",
        platFragile: "#d97706",
        hazard: "#ef4444",
        coinNorm: "#00f0ff",
        coinSpec: "#c084fc",
        particles: ["#00f0ff", "#a855f7", "#38bdf8", "#ffffff"]
    };
}

function stopTowerLoop() {
    if (tsRafId) {
        cancelAnimationFrame(tsRafId);
        tsRafId = null;
    }
}

function setTsOverlay(name) {
    document.getElementById("tsOverlayMenu").classList.remove("active");
    document.getElementById("tsOverlayPause").classList.remove("active");
    document.getElementById("tsOverlayGameOver").classList.remove("active");
    if (name === "MENU") document.getElementById("tsOverlayMenu").classList.add("active");
    if (name === "PAUSED") document.getElementById("tsOverlayPause").classList.add("active");
    if (name === "GAMEOVER") document.getElementById("tsOverlayGameOver").classList.add("active");
}

function updateTsShopUI() {
    const pal = getTsPalette();
    document.getElementById("tsThemeBadge").textContent = pal.badge;
    document.getElementById("tsTitle").textContent = pal.title;
    document.getElementById("tsDesc").textContent = pal.desc;
    document.getElementById("tsCurrencyLabel").textContent = pal.currencyLabel;
    document.getElementById("tsMenuIcon").textContent = pal.icon;
    document.getElementById("btnTsSound").textContent = tsData.soundOn ? "🔊" : "🔇";

    document.getElementById("tsBest").textContent = tsData.bestFloor;
    document.getElementById("tsCoins").textContent = tsData.coins;
    document.getElementById("tsMenuBest").textContent = tsData.bestFloor;
    document.getElementById("tsMenuCoins").textContent = tsData.coins;

    const upgConfigs = [
        { key: "jump", lvId: "upgJumpLv", btnId: "btnUpgJump", base: 40 },
        { key: "magnet", lvId: "upgMagnetLv", btnId: "btnUpgMagnet", base: 35 },
        { key: "shield", lvId: "upgShieldLv", btnId: "btnUpgShield", base: 50 }
    ];

    upgConfigs.forEach(u => {
        const lv = tsData.upgrades[u.key];
        const btn = document.getElementById(u.btnId);
        document.getElementById(u.lvId).textContent = `Lv. ${lv}/5`;
        if (lv >= 5) {
            btn.textContent = "MAX";
            btn.disabled = true;
        } else {
            const cost = u.base * lv;
            btn.textContent = `${pal.icon} ${cost}`;
            btn.disabled = tsData.coins < cost;
        }
    });
}

function initTowerSurvival() {
    setScene("sceneTowerSurvival");
    tsState = "MENU";
    document.getElementById("tsFloor").textContent = "0";
    document.getElementById("tsPowerupBar").innerHTML = "";
    updateTsShopUI();
    if (typeof SecretFlow !== "undefined") SecretFlow.updateGameBadges();
    setTsOverlay("MENU");
    drawTowerBackdrop();
}

function initTowerControls() {
    document.addEventListener("keydown", (e) => {
        if (!document.getElementById("sceneTowerSurvival").classList.contains("active")) return;

        if (e.key === "Escape") {
            e.preventDefault();
            if (tsState === "PLAYING") {
                SysSFX.click();
                tsState = "PAUSED";
                stopTowerLoop();
                setTsOverlay("PAUSED");
            } else if (tsState === "PAUSED") {
                SysSFX.click();
                tsState = "PLAYING";
                setTsOverlay(null);
                tsLastTime = performance.now();
                tsRafId = requestAnimationFrame(loopTower);
            }
            return;
        }

        const k = e.key.toLowerCase();
        if (k === "a" || e.key === "ArrowLeft") {
            e.preventDefault();
            tsKeys.left = true;
        } else if (k === "d" || e.key === "ArrowRight") {
            e.preventDefault();
            tsKeys.right = true;
        } else if (e.key === " " || k === "w" || e.key === "ArrowUp") {
            e.preventDefault();
            if (tsState === "PLAYING" && !e.repeat) {
                tsJumpBuffer = 0.11;
            }
        }
    });

    document.addEventListener("keyup", (e) => {
        const k = e.key.toLowerCase();
        if (k === "a" || e.key === "ArrowLeft") tsKeys.left = false;
        if (k === "d" || e.key === "ArrowRight") tsKeys.right = false;
    });

    const bindHold = (btnId, dir) => {
        const el = document.getElementById(btnId);
        const on = (ev) => { ev.preventDefault(); tsKeys[dir] = true; el.classList.add("active"); };
        const off = (ev) => { ev.preventDefault(); tsKeys[dir] = false; el.classList.remove("active"); };
        el.addEventListener("touchstart", on, { passive: false });
        el.addEventListener("touchend", off, { passive: false });
        el.addEventListener("touchcancel", off, { passive: false });
        el.addEventListener("mousedown", on);
        el.addEventListener("mouseup", off);
        el.addEventListener("mouseleave", off);
    };
    bindHold("tsBtnLeft", "left");
    bindHold("tsBtnRight", "right");

    const jumpBtn = document.getElementById("tsBtnJump");
    const jOn = (ev) => {
        ev.preventDefault();
        jumpBtn.classList.add("active");
        if (tsState === "PLAYING") tsJumpBuffer = 0.11;
    };
    const jOff = (ev) => { ev.preventDefault(); jumpBtn.classList.remove("active"); };
    jumpBtn.addEventListener("touchstart", jOn, { passive: false });
    jumpBtn.addEventListener("touchend", jOff, { passive: false });
    jumpBtn.addEventListener("mousedown", jOn);
    jumpBtn.addEventListener("mouseup", jOff);

    document.getElementById("btnTsStart").onclick = () => { SysSFX.click(); startTowerRun(); };
    document.getElementById("btnTsRestart").onclick = () => { SysSFX.click(); startTowerRun(); };
    document.getElementById("btnTsRestartPause").onclick = () => { SysSFX.click(); startTowerRun(); };
    document.getElementById("btnTsToShop").onclick = () => { SysSFX.click(); initTowerSurvival(); };

    document.getElementById("btnTsPause").onclick = () => {
        if (tsState === "PLAYING") {
            SysSFX.click();
            tsState = "PAUSED";
            stopTowerLoop();
            setTsOverlay("PAUSED");
        } else if (tsState === "PAUSED") {
            SysSFX.click();
            tsState = "PLAYING";
            setTsOverlay(null);
            tsLastTime = performance.now();
            tsRafId = requestAnimationFrame(loopTower);
        }
    };

    document.getElementById("btnTsResume").onclick = () => {
        if (tsState === "PAUSED") {
            SysSFX.click();
            tsState = "PLAYING";
            setTsOverlay(null);
            tsLastTime = performance.now();
            tsRafId = requestAnimationFrame(loopTower);
        }
    };

    const goMainMenu = () => {
        SysSFX.click();
        stopTowerLoop();
        setScene("sceneMenuUtama");
    };
    document.getElementById("btnTsBackMain").onclick = goMainMenu;
    document.getElementById("btnTsQuitPause").onclick = goMainMenu;
    document.getElementById("btnTsQuitOver").onclick = goMainMenu;

    document.getElementById("btnTsSound").onclick = () => {
        tsData.soundOn = !tsData.soundOn;
        document.getElementById("btnTsSound").textContent = tsData.soundOn ? "🔊" : "🔇";
        if (tsData.soundOn) SysSFX.click();
    };

    document.querySelectorAll(".ts-upg-btn").forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute("data-upg");
            const base = { jump: 40, magnet: 35, shield: 50 }[key];
            const lv = tsData.upgrades[key];
            if (lv < 5 && tsData.coins >= base * lv) {
                tsData.coins -= base * lv;
                tsData.upgrades[key] = lv + 1;
                tsPlayTone(400, 950, 0.25, "triangle", 0.14);
                updateTsShopUI();
            }
        };
    });
}

function startTowerRun() {
    stopTowerLoop();
    tsKeys = { left: false, right: false };
    tsJumpBuffer = 0;
    tsCoyote = 0;

    tsPlatforms = [];
    tsCoins = [];
    tsPowerups = [];
    tsDrones = [];
    tsParticles = [];
    tsPopups = [];

    tsCamY = 0;
    tsFloor = 0;
    tsRunEarned = 0;
    tsNextFloor = 1;
    tsLastMilestone = 0;
    tsPassedBest = tsData.bestFloor <= 0;
    tsShake = 0;

    const jumpMult = 1 + (tsData.upgrades.jump - 1) * 0.04;
    tsPlayer = {
        x: 180,
        y: 440,
        w: 24,
        h: 26,
        vx: 0,
        vy: 0,
        jumpVel: -700 * jumpMult,
        grounded: true,
        canDouble: false,
        invuln: 0,
        puDouble: 0,
        puShield: false,
        puMagnet: 0
    };

    // Lantai 0 (Dasar)
    tsPlatforms.push({
        floor: 0, x: 0, y: 468, w: 360, h: 32,
        type: "static", vx: 0, cracked: false, breakTimer: 0, fallen: false, spike: null
    });

    for (let i = 0; i < 12; i++) spawnTowerFloor();

    document.getElementById("tsFloor").textContent = "0";
    document.getElementById("tsBest").textContent = tsData.bestFloor;
    document.getElementById("tsCoins").textContent = tsData.coins;

    tsState = "PLAYING";
    setTsOverlay(null);
    tsLastTime = performance.now();
    tsRafId = requestAnimationFrame(loopTower);
}

function spawnTowerFloor() {
    const fl = tsNextFloor++;
    const prev = tsPlatforms[tsPlatforms.length - 1];
    // Kesulitan mencapai puncak pada Lantai 25
    const diff = Math.min(1, fl / 25);

    const gapY = 72 + diff * 24 + Math.random() * 10;
    const y = prev.y - gapY;
    const w = Math.round(92 - diff * 20 + Math.random() * 8);
    const x = Math.random() * (360 - w - 16) + 8;

    let type = "static";
    let vx = 0;
    let spike = null;
    const r = Math.random();

    if (fl >= 15 && r < 0.28) {
        type = "fragile";
    } else if (fl >= 7 && r < 0.58) {
        type = "moving";
        vx = (Math.random() < 0.5 ? -1 : 1) * (62 + diff * 60);
    }

    if (fl >= 25 && type !== "fragile" && w >= 72 && Math.random() < 0.34) {
        spike = Math.random() < 0.5 ? "left" : "right";
    }

    tsPlatforms.push({
        floor: fl, x, y, w, h: 13,
        type, vx, cracked: false, breakTimer: 0, fallen: false, spike
    });

    // Drone patroli mulai Lantai 25
    if (fl >= 25 && fl % 4 === 0) {
        tsDrones.push({
            x: Math.random() * 300 + 30,
            y: y + gapY * 0.5,
            r: 8.5,
            vx: (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 30)
        });
    }

    // Koin / Hati
    if (Math.random() < 0.72) {
        const spec = Math.random() < 0.16;
        const cx = spike === "left" ? x + w * 0.72 : (spike === "right" ? x + w * 0.28 : x + w * 0.5);
        tsCoins.push({ x: cx, y: y - 20, r: spec ? 9.5 : 7.5, val: spec ? 5 : 1, spec, ph: Math.random() * 6 });
    }

    // Power-up (Double Jump, Shield, Magnet)
    const shieldChance = (tsData.upgrades.shield - 1) * 0.015;
    if (fl >= 4 && Math.random() < (0.11 + shieldChance)) {
        const list = ["DOUBLE", "SHIELD", "MAGNET"];
        tsPowerups.push({
            x: x + w * 0.5, y: y - 24, r: 10,
            kind: list[Math.floor(Math.random() * list.length)], ph: 0
        });
    }
}

function loopTower(now) {
    if (tsState !== "PLAYING") return;
    const dt = Math.min((now - tsLastTime) / 1000, 0.05);
    tsLastTime = now;

    updateTower(dt);
    renderTower();

    if (tsState === "PLAYING") {
        tsRafId = requestAnimationFrame(loopTower);
    }
}

function updateTower(dt) {
    const p = tsPlayer;
    const pal = getTsPalette();

    if (tsShake > 0) tsShake -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.puDouble > 0) p.puDouble = Math.max(0, p.puDouble - dt);
    if (p.puMagnet > 0) p.puMagnet = Math.max(0, p.puMagnet - dt);

    const accel = 2400;
    const maxVx = 320;
    const fric = 2000;

    if (tsKeys.left && !tsKeys.right) {
        p.vx = Math.max(-maxVx, p.vx - accel * dt);
    } else if (tsKeys.right && !tsKeys.left) {
        p.vx = Math.min(maxVx, p.vx + accel * dt);
    } else {
        if (p.vx > 0) p.vx = Math.max(0, p.vx - fric * dt);
        if (p.vx < 0) p.vx = Math.min(0, p.vx + fric * dt);
    }

    p.x += p.vx * dt;
    if (p.x < -12) p.x = 372;
    if (p.x > 372) p.x = -12;

    if (p.grounded) {
        tsCoyote = 0.09;
        p.canDouble = p.puDouble > 0;
    } else {
        tsCoyote = Math.max(0, tsCoyote - dt);
    }

    if (tsJumpBuffer > 0) {
        tsJumpBuffer = Math.max(0, tsJumpBuffer - dt);
        if (tsCoyote > 0) {
            p.vy = p.jumpVel;
            p.grounded = false;
            tsCoyote = 0;
            tsJumpBuffer = 0;
            tsPlayTone(280, 560, 0.13, "triangle", 0.14);
            spawnTsBurst(p.x, p.y + 12, pal.particles, 6);
        } else if (p.puDouble > 0 && p.canDouble) {
            p.vy = p.jumpVel * 0.94;
            p.canDouble = false;
            tsJumpBuffer = 0;
            tsPlayTone(430, 860, 0.15, "sine", 0.15);
            spawnTsBurst(p.x, p.y + 12, ["#ffffff", pal.player], 9);
        }
    }

    const prevBottom = p.y + p.h * 0.5;
    p.vy = Math.min(900, p.vy + 1720 * dt);
    p.y += p.vy * dt;
    const currBottom = p.y + p.h * 0.5;
    p.grounded = false;

    for (const pl of tsPlatforms) {
        if (pl.type === "moving") {
            pl.x += pl.vx * dt;
            if (pl.x <= 6) { pl.x = 6; pl.vx = Math.abs(pl.vx); }
            else if (pl.x + pl.w >= 354) { pl.x = 354 - pl.w; pl.vx = -Math.abs(pl.vx); }
        }
        if (pl.type === "fragile" && pl.cracked && !pl.fallen) {
            pl.breakTimer -= dt;
            if (pl.breakTimer <= 0) {
                pl.fallen = true;
                tsPlayTone(130, 55, 0.18, "sawtooth", 0.13);
                spawnTsBurst(pl.x + pl.w * 0.5, pl.y, [pal.platFragile, "#ffffff"], 7);
            }
        }
        if (pl.fallen) continue;

        const inX = (p.x + 8 > pl.x) && (p.x - 8 < pl.x + pl.w);
        if (p.vy >= 0 && inX && prevBottom <= pl.y + 8 && currBottom >= pl.y) {
            if (pl.spike) {
                const sx = pl.spike === "left" ? pl.x + 4 : pl.x + pl.w - 28;
                if (p.x + 7 > sx && p.x - 7 < sx + 24) {
                    hitTsHazard(p.x, pl.y - 6);
                    continue;
                }
            }

            p.y = pl.y - p.h * 0.5;
            p.vy = 0;
            p.grounded = true;
            if (pl.type === "moving") p.x += pl.vx * dt;
            if (pl.type === "fragile" && !pl.cracked) {
                pl.cracked = true;
                pl.breakTimer = 0.4;
                tsPlayTone(180, 90, 0.14, "sawtooth", 0.12);
            }

            if (pl.floor > tsFloor) {
                tsFloor = pl.floor;
                document.getElementById("tsFloor").textContent = tsFloor;
                if (typeof SecretFlow !== "undefined") SecretFlow.checkScore('tower', tsFloor);

                if (!tsPassedBest && tsData.bestFloor > 0 && tsFloor > tsData.bestFloor) {
                    tsPassedBest = true;
                    tsPlayTone(520, 1040, 0.3, "triangle", 0.15);
                    tsPopups.push({ x: 180, y: p.y - 28, text: "NEW RECORD! ✨", color: "#fde047", life: 1.0 });
                }

                if (tsFloor > 0 && tsFloor % 15 === 0 && tsFloor > tsLastMilestone) {
                    tsLastMilestone = tsFloor;
                    const bonus = tsFloor * 2;
                    tsRunEarned += bonus;
                    tsData.coins += bonus;
                    document.getElementById("tsCoins").textContent = tsData.coins;
                    tsPlayTone(523, 1046, 0.32, "triangle", 0.16);
                    tsPopups.push({ x: 180, y: p.y - 36, text: `+${bonus} ${pal.icon} BONUS!`, color: "#fde047", life: 1.0 });
                }
            }
        }
    }

    // Drones (Floor 25+)
    for (let i = tsDrones.length - 1; i >= 0; i--) {
        const d = tsDrones[i];
        d.x += d.vx * dt;
        if (d.x <= 16 || d.x >= 344) d.vx *= -1;
        if (Math.hypot(p.x - d.x, p.y - d.y) < d.r + 9) {
            tsDrones.splice(i, 1);
            hitTsHazard(d.x, d.y);
        }
    }

    // Collectibles
    const magRad = 140 + (tsData.upgrades.magnet - 1) * 35;
    for (let i = tsCoins.length - 1; i >= 0; i--) {
        const c = tsCoins[i];
        c.ph += dt * 4.5;
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        const dist = Math.hypot(dx, dy);

        if (p.puMagnet > 0 && dist < magRad && dist > 1) {
            c.x += (dx / dist) * 320 * dt;
            c.y += (dy / dist) * 320 * dt;
        }
        if (dist < c.r + 13) {
            tsRunEarned += c.val;
            tsData.coins += c.val;
            document.getElementById("tsCoins").textContent = tsData.coins;
            tsPlayTone(c.spec ? 660 : 520, c.spec ? 1180 : 880, 0.14, "sine", 0.14);
            spawnTsBurst(c.x, c.y, c.spec ? ["#fde047", "#ffffff"] : pal.particles, c.spec ? 11 : 6);
            tsCoins.splice(i, 1);
        }
    }

    // Power-ups
    for (let i = tsPowerups.length - 1; i >= 0; i--) {
        const pu = tsPowerups[i];
        pu.ph += dt * 4;
        if (Math.hypot(p.x - pu.x, p.y - pu.y) < pu.r + 13) {
            tsPlayTone(360, 960, 0.25, "triangle", 0.15);
            spawnTsBurst(pu.x, pu.y, [pal.player, "#fde047"], 12);
            if (pu.kind === "DOUBLE") {
                p.puDouble = 12;
                p.canDouble = true;
                tsPopups.push({ x: pu.x, y: pu.y - 10, text: "DOUBLE JUMP!", color: pal.player, life: 0.9 });
            } else if (pu.kind === "SHIELD") {
                p.puShield = true;
                tsPopups.push({ x: pu.x, y: pu.y - 10, text: "SHIELD ON!", color: "#38bdf8", life: 0.9 });
            } else {
                p.puMagnet = 10 + (tsData.upgrades.magnet - 1) * 1.5;
                tsPopups.push({ x: pu.x, y: pu.y - 10, text: "MAGNET ON!", color: "#fde047", life: 0.9 });
            }
            tsPowerups.splice(i, 1);
        }
    }

    // Camera follow
    const targetCam = p.y - 310;
    if (targetCam < tsCamY) {
        tsCamY += (targetCam - tsCamY) * Math.min(1, dt * 10);
    }

    while (tsPlatforms[tsPlatforms.length - 1].y > tsCamY - 200) {
        spawnTowerFloor();
    }

    const cullY = tsCamY + 620;
    tsPlatforms = tsPlatforms.filter(pl => pl.y < cullY);
    tsCoins = tsCoins.filter(c => c.y < cullY);
    tsPowerups = tsPowerups.filter(pu => pu.y < cullY);
    tsDrones = tsDrones.filter(d => d.y < cullY);

    for (let i = tsParticles.length - 1; i >= 0; i--) {
        const pt = tsParticles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 300 * dt;
        pt.life -= dt;
        if (pt.life <= 0) tsParticles.splice(i, 1);
    }

    for (let i = tsPopups.length - 1; i >= 0; i--) {
        const ft = tsPopups[i];
        ft.y -= 35 * dt;
        ft.life -= dt;
        if (ft.life <= 0) tsPopups.splice(i, 1);
    }

    let hudHtml = "";
    if (p.puDouble > 0) hudHtml += `<span class="ts-pu-tag">2x JUMP ${p.puDouble.toFixed(1)}s</span>`;
    if (p.puShield) hudHtml += `<span class="ts-pu-tag">🛡️ SHIELD</span>`;
    if (p.puMagnet > 0) hudHtml += `<span class="ts-pu-tag">🧲 MAGNET ${p.puMagnet.toFixed(1)}s</span>`;
    document.getElementById("tsPowerupBar").innerHTML = hudHtml;

    if (p.y - 13 > tsCamY + 515) {
        endTowerRun("Kamu terjatuh dari menara!");
    }
}

function hitTsHazard(hx, hy) {
    const p = tsPlayer;
    if (p.invuln > 0) return;

    if (p.puShield) {
        p.puShield = false;
        p.invuln = 1.2 + (tsData.upgrades.shield - 1) * 0.4;
        p.vy = p.jumpVel * 0.85;
        tsShake = 0.25;
        tsPlayTone(520, 130, 0.28, "sawtooth", 0.16);
        spawnTsBurst(hx, hy, ["#38bdf8", "#ffffff"], 15);
        tsPopups.push({ x: p.x, y: p.y - 18, text: "SHIELD SAVED!", color: "#38bdf8", life: 0.9 });
        return;
    }

    endTowerRun("Terkena jebakan menara!");
}

function endTowerRun(msg) {
    tsState = "GAMEOVER";
    stopTowerLoop();
    tsPlayTone(290, 75, 0.42, "sawtooth", 0.16);

    const isNewBest = tsFloor > tsData.bestFloor;
    if (isNewBest) tsData.bestFloor = tsFloor;

    const pal = getTsPalette();
    document.getElementById("tsNewBestBadge").style.display = isNewBest ? "block" : "none";
    document.getElementById("tsOverTitle").textContent = isTsPacarMode() ? "YAHH JATUH SAYANG ♥" : "GAME OVER";
    document.getElementById("tsOverMsg").textContent = msg;
    document.getElementById("tsEndFloor").textContent = `Lantai ${tsFloor}`;
    document.getElementById("tsEndBest").textContent = `Lantai ${tsData.bestFloor}`;
    document.getElementById("tsEndEarned").textContent = `+${tsRunEarned} ${pal.icon}`;
    document.getElementById("tsEndTotal").textContent = `${tsData.coins} ${pal.icon}`;
    document.getElementById("tsBest").textContent = tsData.bestFloor;

    setTsOverlay("GAMEOVER");
}

function spawnTsBurst(x, y, colors, count = 8) {
    for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const s = 55 + Math.random() * 130;
        tsParticles.push({
            x, y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - 35,
            size: 2.8 + Math.random() * 2.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 0.35 + Math.random() * 0.2
        });
    }
}

function drawTowerBackdrop() {
    const canvas = document.getElementById("towerCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pal = getTsPalette();

    const grad = ctx.createLinearGradient(0, 0, 0, 500);
    grad.addColorStop(0, pal.bgTop);
    grad.addColorStop(1, pal.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 360, 500);

    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < 360; x += 36) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke();
    }
    for (let y = 0; y < 500; y += 36) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(360, y); ctx.stroke();
    }
}

function renderTower() {
    const canvas = document.getElementById("towerCanvas");
    const ctx = canvas.getContext("2d");
    const pal = getTsPalette();
    const pacar = isTsPacarMode();

    drawTowerBackdrop();

    ctx.save();
    if (tsShake > 0) {
        const m = tsShake * 16;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    ctx.translate(0, -tsCamY);

    // Platforms
    for (const pl of tsPlatforms) {
        if (pl.fallen) continue;
        ctx.save();
        if (pl.cracked) ctx.translate((Math.random() - 0.5) * 4, 0);

        let col = pal.platStatic;
        if (pl.type === "moving") col = pal.platMoving;
        if (pl.type === "fragile") col = pal.platFragile;

        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(pl.x, pl.y, pl.w, pl.h, 6);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = pal.platRim;
        ctx.fillRect(pl.x + 4, pl.y + 1, pl.w - 8, 2);

        if (pl.spike) {
            const sx = pl.spike === "left" ? pl.x + 4 : pl.x + pl.w - 28;
            ctx.fillStyle = pal.hazard;
            for (let s = 0; s < 3; s++) {
                const bx = sx + s * 8;
                ctx.beginPath();
                ctx.moveTo(bx, pl.y);
                ctx.lineTo(bx + 4, pl.y - 10);
                ctx.lineTo(bx + 8, pl.y);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // Drones
    for (const d of tsDrones) {
        ctx.save();
        ctx.fillStyle = pal.hazard;
        ctx.shadowColor = pal.hazard;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Coins (Hearts untuk Mode Pacar, Hex-Coin untuk Mode Lain)
    for (const c of tsCoins) {
        const by = c.y + Math.sin(c.ph) * 3;
        const col = c.spec ? pal.coinSpec : pal.coinNorm;
        ctx.save();
        ctx.translate(c.x, by);
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
        if (pacar) {
            const sc = 1 + Math.sin(c.ph * 1.4) * 0.12;
            ctx.scale(sc, sc);
            drawHeartCanvas(ctx, 0, -c.r * 0.4, c.r * 1.15);
        } else {
            ctx.scale(Math.max(0.35, Math.abs(Math.cos(c.ph * 0.8))), 1);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i;
                const px = c.r * Math.cos(a);
                const py = c.r * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    // Power-ups
    for (const pu of tsPowerups) {
        const by = pu.y + Math.sin(pu.ph) * 3.5;
        ctx.save();
        ctx.translate(pu.x, by);
        const col = pu.kind === "SHIELD" ? "#38bdf8" : (pu.kind === "MAGNET" ? "#fde047" : pal.player);
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, pu.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#090d16";
        ctx.font = "bold 10px 'Fira Code', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pu.kind === "DOUBLE" ? "2x" : (pu.kind === "SHIELD" ? "S" : "M"), 0, 0.5);
        ctx.restore();
    }

    // Player
    const p = tsPlayer;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.invuln > 0 && Math.floor(p.invuln * 16) % 2 === 0) ctx.globalAlpha = 0.45;

    if (p.puShield) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.fillStyle = pal.player;
    ctx.shadowColor = pal.playerGlow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h, 7);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    const look = p.vx > 20 ? 2.5 : (p.vx < -20 ? -2.5 : 0);
    if (pacar) {
        ctx.beginPath();
        ctx.arc(-4.5 + look, -2, 2.2, 0, Math.PI * 2);
        ctx.arc(4.5 + look, -2, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fda4af";
        ctx.fillRect(-8 + look, 2, 3.5, 2);
        ctx.fillRect(4.5 + look, 2, 3.5, 2);
    } else {
        ctx.fillRect(-7 + look, -4, 14, 5);
    }
    ctx.restore();

    // Particles
    for (const pt of tsParticles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life * 1.6);
        ctx.fillStyle = pt.color;
        if (pacar) {
            drawHeartCanvas(ctx, pt.x, pt.y, pt.size);
        } else {
            ctx.fillRect(pt.x - pt.size * 0.5, pt.y - pt.size * 0.5, pt.size, pt.size);
        }
        ctx.restore();
    }

    // Popups
    for (const ft of tsPopups) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.font = "bold 11px 'Fira Code', monospace";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }

    ctx.restore();
}

function drawHeartCanvas(ctx, x, y, s) {
    ctx.beginPath();
    const top = s * 0.3;
    ctx.moveTo(x, y + top);
    ctx.bezierCurveTo(x, y, x - s, y, x - s, y + top);
    ctx.bezierCurveTo(x - s, y + (s + top) / 2, x, y + (s + top) / 1.3, x, y + s);
    ctx.bezierCurveTo(x, y + (s + top) / 1.3, x + s, y + (s + top) / 2, x + s, y + top);
    ctx.bezierCurveTo(x + s, y, x, y, x, y + top);
    ctx.closePath();
    ctx.fill();
}

// ==================================================
// GAME 4: NEON BREAKER ARCADE MINI GAME (MULTI-MODE)
// ==================================================

const NeonBreaker = (() => {
    const STORAGE_KEY = "neonBreakerHighScore";
    const WIDTH = 360;
    const HEIGHT = 500;
    const MAX_LIVES = 3;

    // Game State
    let state = "MENU"; // MENU | READY | PLAYING | PAUSED | GAMEOVER
    let score = 0;
    let highScore = 0;
    let lives = MAX_LIVES;
    let wave = 1;
    let combo = 0;
    let isNewRecord = false;
    let isMuted = false;

    // Loop & Timing
    let rafId = null;
    let lastTime = 0;
    let shakeTime = 0;
    let pulsePhase = 0;

    // Entities
    const paddle = {
        w: 78,
        h: 12,
        x: (WIDTH - 78) / 2,
        y: HEIGHT - 34,
        speed: 460,
        glowPulse: 0
    };

    const ball = {
        x: WIDTH / 2,
        y: HEIGHT - 48,
        r: 6.5,
        vx: 0,
        vy: 0,
        speed: 315,
        baseSpeed: 315,
        maxSpeed: 540,
        trail: []
    };

    let bricks = [];
    let particles = [];
    let popups = [];
    let ambientHearts = [];
    const keys = { left: false, right: false };

    // Theme Palette & Texts per User Mode
    function isPacar() {
        return currentMode === "pacar" || currentMode === "kaciu";
    }

    function getTheme() {
        if (isPacar()) {
            return {
                chip: "ROMANTIC EDITION // ♥",
                title: "LOVE BREAKER ♥",
                subtitle: "Hancurkan balok cinta & cetak skor tertinggi buat sayangku ♥",
                legend: ["Pink +10", "Rose +25", "Love ♥ +50"],
                overTitle: "YAHH HABIS SAYANG ♥",
                overSub: "Gapapaa sayang, coba lagi yaaa ♥",
                newRecordText: "💖 NEW LOVE RECORD! 💖",
                launchHint: "TAP / SPACE BUAT MULAI SAYANG ♥",
                waveText: "LOVE WAVE",
                recordPopup: "SWEET RECORD! ♥",
                bgStops: ["#1d0512", "#360a22", "#4c0f31"],
                gridColor: "rgba(255, 133, 179, 0.08)",
                wallColor: "rgba(255, 117, 160, 0.6)",
                dangerColor: "rgba(255, 42, 122, 0.35)",
                watermarkColor: "rgba(251, 207, 232, 0.22)",
                normalFill: "#ff4d8d",
                normalStroke: "#fbcfe8",
                normalGlow: "rgba(255, 77, 141, 0.65)",
                strongFill: "#d946ef",
                strongCracked: "#f472b6",
                strongStroke: "#fae8ff",
                strongGlow: "rgba(217, 70, 239, 0.65)",
                bonusFill: "#fbbf24",
                bonusStroke: "#fef3c7",
                bonusGlow: "rgba(251, 191, 36, 0.8)",
                bonusSymbol: "♥",
                paddleStops: ["#ec4899", "#ff85b3", "#ec4899"],
                paddleGlow: "#ff4d8d",
                ballStroke: "#ff75a0",
                ballGlow: "#ff85b3",
                trailColor: "#ff75a0",
                popupDefault: "#ff85b3",
                heartParticles: true
            };
        }

        if (currentMode === "tamu") {
            return {
                chip: "THREAT PROTOCOL // INTRUDER",
                title: "RED BREAKER ⚠️",
                subtitle: "Sistem gak ramah. Hancurkan blok sebelum nyawamu habis!",
                legend: ["Red +10", "Crimson +25", "Hazard +50"],
                overTitle: "GAME OVER, DONGO! 💀",
                overSub: "Gitu doang masa kalah sih? Coba lagi!",
                newRecordText: "🔥 LUMAYAN JUGA REKORNYA! 🔥",
                launchHint: "SPACE / TAP UNTUK MENYERANG",
                waveText: "THREAT WAVE",
                recordPopup: "NEW RECORD! 🔥",
                bgStops: ["#0d0202", "#1c0404", "#290606"],
                gridColor: "rgba(239, 68, 68, 0.06)",
                wallColor: "rgba(239, 68, 68, 0.5)",
                dangerColor: "rgba(248, 113, 113, 0.35)",
                watermarkColor: "rgba(252, 165, 165, 0.16)",
                normalFill: "#ef4444",
                normalStroke: "#fecaca",
                normalGlow: "rgba(239, 68, 68, 0.6)",
                strongFill: "#991b1b",
                strongCracked: "#f87171",
                strongStroke: "#fee2e2",
                strongGlow: "rgba(185, 28, 28, 0.65)",
                bonusFill: "#f59e0b",
                bonusStroke: "#fef3c7",
                bonusGlow: "rgba(245, 158, 11, 0.75)",
                bonusSymbol: "!",
                paddleStops: ["#b91c1c", "#f87171", "#b91c1c"],
                paddleGlow: "#ef4444",
                ballStroke: "#ef4444",
                ballGlow: "#f87171",
                trailColor: "#ef4444",
                popupDefault: "#f87171",
                heartParticles: false
            };
        }

        if (currentMode === "creator") {
            return {
                chip: "ADMIN OVERRIDE // ROOT",
                title: "CODE BREAKER </>",
                subtitle: "Debug seluruh firewall blok di dalam kernel sistem.",
                legend: ["Node +10", "Firewall +25", "Root +50"],
                overTitle: "RUNTIME ERROR ⚠️",
                overSub: "Kernel panic! Nyawa sistem habis.",
                newRecordText: "⚡ NEW BENCHMARK RECORD! ⚡",
                launchHint: "PRESS SPACE / TAP TO EXECUTE",
                waveText: "KERNEL WAVE",
                recordPopup: "BENCHMARK UP! ⚡",
                bgStops: ["#080703", "#141005", "#1f1807"],
                gridColor: "rgba(245, 158, 11, 0.06)",
                wallColor: "rgba(245, 158, 11, 0.5)",
                dangerColor: "rgba(239, 68, 68, 0.3)",
                watermarkColor: "rgba(253, 230, 138, 0.16)",
                normalFill: "#f59e0b",
                normalStroke: "#fef3c7",
                normalGlow: "rgba(245, 158, 11, 0.6)",
                strongFill: "#b45309",
                strongCracked: "#fbbf24",
                strongStroke: "#fde68a",
                strongGlow: "rgba(217, 119, 6, 0.65)",
                bonusFill: "#10b981",
                bonusStroke: "#d1fae5",
                bonusGlow: "rgba(16, 185, 129, 0.75)",
                bonusSymbol: "#",
                paddleStops: ["#b45309", "#fbbf24", "#b45309"],
                paddleGlow: "#f59e0b",
                ballStroke: "#fbbf24",
                ballGlow: "#f59e0b",
                trailColor: "#fbbf24",
                popupDefault: "#fbbf24",
                heartParticles: false
            };
        }

        // Default Mode (Cyber Cyan / Blue)
        return {
            chip: "ARCADE PROTOCOL // 02",
            title: "NEON BREAKER",
            subtitle: "Hancurkan seluruh balok neon dan cetak skor tertinggi!",
            legend: ["Normal +10", "Strong +25", "Bonus +50"],
            overTitle: "GAME OVER",
            overSub: "Seluruh nyawa telah habis.",
            newRecordText: "✨ NEW RECORD! ✨",
            launchHint: "PRESS SPACE / TAP TO LAUNCH",
            waveText: "WAVE",
            recordPopup: "NEW RECORD! ✨",
            bgStops: ["#040711", "#070e22", "#0b1330"],
            gridColor: "rgba(0, 240, 255, 0.055)",
            wallColor: "rgba(0, 240, 255, 0.45)",
            dangerColor: "rgba(244, 63, 94, 0.28)",
            watermarkColor: "rgba(96, 165, 250, 0.14)",
            normalFill: "#00f0ff",
            normalStroke: "#bae6fd",
            normalGlow: "rgba(0, 240, 255, 0.55)",
            strongFill: "#9333ea",
            strongCracked: "#c084fc",
            strongStroke: "#e9d5ff",
            strongGlow: "rgba(168, 85, 247, 0.65)",
            bonusFill: "#facc15",
            bonusStroke: "#fef9c3",
            bonusGlow: "rgba(253, 224, 71, 0.75)",
            bonusSymbol: "★",
            paddleStops: ["#3b82f6", "#00f0ff", "#3b82f6"],
            paddleGlow: "#00f0ff",
            ballStroke: "#00f0ff",
            ballGlow: "#00f0ff",
            trailColor: "#00f0ff",
            popupDefault: "#00f0ff",
            heartParticles: false
        };
    }

    function applyThemeTexts() {
        const t = getTheme();
        const scene = el("sceneNeonBreaker");
        if (!scene) return;

        const chip = scene.querySelector("#nbMenuOverlay .nb-chip");
        const menuTitle = scene.querySelector("#nbMenuOverlay .nb-logo");
        const menuSub = scene.querySelector("#nbMenuOverlay .nb-sub");
        const legendItems = scene.querySelectorAll("#nbMenuOverlay .nb-legend span");
        const overTitle = scene.querySelector("#nbGameOverOverlay .nb-logo");
        const overSub = scene.querySelector("#nbGameOverOverlay .nb-sub");
        const recordBadge = el("nbNewRecordBadge");

        if (chip) chip.textContent = t.chip;
        if (menuTitle) menuTitle.textContent = t.title;
        if (menuSub) menuSub.textContent = t.subtitle;
        if (legendItems.length >= 3) {
            const dots = ["dot-c", "dot-b", "dot-g"];
            legendItems.forEach((span, i) => {
                span.innerHTML = `<i class="${dots[i]}"></i> ${t.legend[i]}`;
            });
        }
        if (overTitle) overTitle.textContent = t.overTitle;
        if (overSub) overSub.textContent = t.overSub;
        if (recordBadge) recordBadge.textContent = t.newRecordText;
    }

    // Audio Synthesizer (Web Audio API)
    let audioCtx = null;

    function getAudio() {
        if (isMuted) return null;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function playTone(f1, f2, dur, type = "triangle", vol = 0.22, delay = 0) {
        try {
            const ctx = getAudio();
            if (!ctx) return;
            const now = ctx.currentTime + delay;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(Math.max(25, f1), now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(25, f2), now + dur);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(Math.min(0.8, vol), now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + dur + 0.01);
        } catch (e) {}
    }

    const sfx = {
        bounceWall() {
            if (isPacar()) playTone(520, 680, 0.06, "sine", 0.16);
            else playTone(360, 480, 0.055, "sine", 0.16);
        },
        bouncePaddle() {
            if (isPacar()) playTone(440, 784, 0.09, "sine", 0.22);
            else playTone(280, 560, 0.08, "triangle", 0.24);
        },
        armorHit() {
            playTone(220, 160, 0.09, isPacar() ? "triangle" : "square", 0.18);
        },
        brickBreak(type, comboCount) {
            const pitchBoost = Math.min(260, comboCount * 18);
            const waveType = isPacar() ? "sine" : "triangle";
            if (type === "bonus") {
                playTone(660, 1180, 0.14, "sine", 0.25, 0);
                playTone(880, 1320, 0.18, waveType, 0.22, 0.06);
            } else if (type === "strong") {
                playTone(440 + pitchBoost, 820 + pitchBoost, 0.13, waveType, 0.24);
            } else {
                playTone(500 + pitchBoost, 880 + pitchBoost, 0.10, waveType, 0.21);
            }
        },
        waveClear() {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
                playTone(f, f * 1.02, 0.22, isPacar() ? "sine" : "triangle", 0.22, idx * 0.06);
            });
        },
        loseLife() {
            if (isPacar()) {
                playTone(440, 293.66, 0.28, "sine", 0.22);
            } else {
                playTone(340, 110, 0.36, "sawtooth", 0.28);
            }
        },
        gameOver() {
            if (isPacar()) {
                playTone(523.25, 440, 0.24, "sine", 0.22, 0);
                playTone(440, 349.23, 0.32, "sine", 0.22, 0.20);
            } else {
                playTone(280, 190, 0.22, "sawtooth", 0.24, 0);
                playTone(220, 140, 0.24, "sawtooth", 0.24, 0.18);
                playTone(170, 65, 0.48, "sawtooth", 0.26, 0.36);
            }
        },
        newRecord() {
            [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, idx) => {
                playTone(f, f * 1.03, 0.28, isPacar() ? "sine" : "triangle", 0.25, idx * 0.07);
            });
        }
    };

    // LocalStorage Helpers (Scoped exclusively to neonBreakerHighScore)
    function loadHighScore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = parseInt(raw, 10);
            highScore = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        } catch (e) {
            highScore = 0;
        }
        return highScore;
    }

    function saveHighScore(val) {
        highScore = Math.max(0, Math.floor(val));
        try {
            localStorage.setItem(STORAGE_KEY, String(highScore));
        } catch (e) {}
    }

    function resetHighScore() {
        highScore = 0;
        score = 0;
        isNewRecord = false;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
        syncHUD();
    }

    // DOM Helpers
    function el(id) {
        return document.getElementById(id);
    }

    function setOverlay(mode) {
        const menuOv = el("nbMenuOverlay");
        const pauseOv = el("nbPauseOverlay");
        const overOv = el("nbGameOverOverlay");
        if (!menuOv || !pauseOv || !overOv) return;

        menuOv.classList.remove("active");
        pauseOv.classList.remove("active");
        overOv.classList.remove("active");

        if (mode === "MENU") menuOv.classList.add("active");
        if (mode === "PAUSED") pauseOv.classList.add("active");
        if (mode === "GAMEOVER") overOv.classList.add("active");
    }

    function formatLives(count) {
        let out = [];
        for (let i = 0; i < MAX_LIVES; i++) {
            out.push(i < count ? "♥" : "♡");
        }
        return out.join(" ");
    }

    function syncHUD() {
        if (el("nbScore")) el("nbScore").textContent = score;
        if (el("nbBest")) el("nbBest").textContent = highScore;
        if (el("nbMenuHighScore")) el("nbMenuHighScore").textContent = highScore;
        if (el("nbLives")) el("nbLives").textContent = formatLives(lives);
        if (el("btnNbMute")) el("btnNbMute").textContent = isMuted ? "🔇" : "🔊";
    }

    function triggerLifeFlash() {
        const flash = el("nbLifeFlash");
        if (!flash) return;
        flash.classList.add("active");
        setTimeout(() => flash.classList.remove("active"), 240);
    }

    // Ambient Floating Hearts on Canvas (Pacar Mode)
    function initAmbientHearts() {
        ambientHearts = [];
        for (let i = 0; i < 14; i++) {
            ambientHearts.push({
                x: Math.random() * WIDTH,
                y: Math.random() * HEIGHT,
                size: 4 + Math.random() * 5,
                speed: 14 + Math.random() * 18,
                alpha: 0.08 + Math.random() * 0.14,
                wobble: Math.random() * Math.PI * 2
            });
        }
    }

    // Brick Wave Builder
    function buildWave(waveNum) {
        bricks = [];
        const cols = 7;
        const rows = Math.min(7, 4 + Math.floor((waveNum - 1) / 2));
        const padX = 14;
        const gap = 6;
        const brickW = Math.floor((WIDTH - padX * 2 - gap * (cols - 1)) / cols);
        const brickH = 18;
        const startY = 48;
        const pattern = (waveNum - 1) % 3;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (pattern === 0) {
                    if (r === 0 && (c === 0 || c === cols - 1)) continue;
                } else if (pattern === 1) {
                    if (c === 3 && r % 2 === 1) continue;
                } else {
                    if ((r + c) % 4 === 0 && r > 0) continue;
                }

                let type = "normal";
                let hp = 1;
                let points = 10;

                if (r === 0 || (waveNum >= 2 && r === 1 && (c === 1 || c === cols - 2))) {
                    type = "strong";
                    hp = waveNum >= 3 ? 3 : 2;
                    points = 25;
                } else if ((r === Math.floor(rows / 2) && (c === 2 || c === 4)) || (r === rows - 1 && c === 3)) {
                    type = "bonus";
                    hp = 1;
                    points = 50;
                } else if (waveNum >= 2 && (r + c) % 5 === 0) {
                    type = "strong";
                    hp = 2;
                    points = 25;
                }

                bricks.push({
                    x: padX + c * (brickW + gap),
                    y: startY + r * (brickH + gap),
                    w: brickW,
                    h: brickH,
                    type,
                    hp,
                    maxHp: hp,
                    points,
                    hitFlash: 0
                });
            }
        }
    }

    function resetBallOnPaddle() {
        state = "READY";
        combo = 0;
        ball.vx = 0;
        ball.vy = 0;
        ball.trail = [];
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 1;
    }

    function launchBall() {
        if (state !== "READY") return;
        state = "PLAYING";
        const spread = (Math.random() - 0.5) * 0.55;
        ball.vx = ball.speed * Math.sin(spread);
        ball.vy = -ball.speed * Math.cos(spread);
        sfx.bouncePaddle();
    }

    function startNewGame() {
        stopLoop();
        applyThemeTexts();
        loadHighScore();
        score = 0;
        lives = MAX_LIVES;
        wave = 1;
        combo = 0;
        isNewRecord = false;
        shakeTime = 0;
        particles = [];
        popups = [];

        paddle.w = 78;
        paddle.x = (WIDTH - paddle.w) / 2;
        ball.baseSpeed = 315;
        ball.speed = ball.baseSpeed;

        initAmbientHearts();
        buildWave(wave);
        resetBallOnPaddle();
        syncHUD();
        setOverlay(null);

        lastTime = performance.now();
        rafId = requestAnimationFrame(gameLoop);
    }

    function stopLoop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function pauseGame() {
        if (state !== "PLAYING" && state !== "READY") return;
        state = "PAUSED";
        stopLoop();
        setOverlay("PAUSED");
    }

    function resumeGame() {
        if (state !== "PAUSED") return;
        state = ball.vy === 0 ? "READY" : "PLAYING";
        setOverlay(null);
        lastTime = performance.now();
        rafId = requestAnimationFrame(gameLoop);
    }

    function openMainMenu() {
        stopLoop();
        state = "MENU";
        applyThemeTexts();
        loadHighScore();
        initAmbientHearts();
        syncHUD();
        setOverlay("MENU");
        render();
    }

    function triggerGameOver() {
        state = "GAMEOVER";
        stopLoop();
        applyThemeTexts();
        sfx.gameOver();

        if (el("nbFinalScore")) el("nbFinalScore").textContent = score;
        if (el("nbOverBestScore")) el("nbOverBestScore").textContent = highScore;

        const badge = el("nbNewRecordBadge");
        if (badge) {
            badge.style.display = isNewRecord && score > 0 ? "block" : "none";
        }
        if (isNewRecord && score > 0) {
            sfx.newRecord();
        }

        setOverlay("GAMEOVER");
    }

    // Particles & Floating Text
    function spawnExplosion(x, y, color, count = 14) {
        const theme = getTheme();
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const spd = 65 + Math.random() * 155;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: (theme.heartParticles ? 3.2 : 2.2) + Math.random() * 2.8,
                color,
                life: 0.35 + Math.random() * 0.25,
                maxLife: 0.6
            });
        }
    }

    function addPopup(x, y, text, color) {
        const theme = getTheme();
        popups.push({
            x,
            y,
            text,
            color: color || theme.popupDefault,
            life: 0.85
        });
    }

    function addScore(pts, popupX, popupY, popupColor) {
        const theme = getTheme();
        score += pts;
        if (popupX !== undefined && popupY !== undefined) {
            const label = isPacar() && pts >= 50 ? `+${pts} ♥` : `+${pts}`;
            addPopup(popupX, popupY, label, popupColor);
        }
        if (score > highScore) {
            if (!isNewRecord && highScore > 0) {
                addPopup(WIDTH / 2, HEIGHT * 0.48, theme.recordPopup, "#fde047");
            }
            isNewRecord = true;
            saveHighScore(score);
        }
        syncHUD();
        if (typeof SecretFlow !== "undefined") SecretFlow.checkScore('neonBreaker', score);
    }

    // Physics & Collision Update
    function update(dt) {
        const theme = getTheme();
        pulsePhase += dt * 4;
        if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
        if (paddle.glowPulse > 0) paddle.glowPulse = Math.max(0, paddle.glowPulse - dt);

        // Ambient Hearts in Pacar Mode
        if (theme.heartParticles) {
            for (const h of ambientHearts) {
                h.y -= h.speed * dt;
                h.wobble += dt * 2.2;
                h.x += Math.sin(h.wobble) * 10 * dt;
                if (h.y < -15) {
                    h.y = HEIGHT + 15;
                    h.x = Math.random() * WIDTH;
                }
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 180 * dt;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }

        for (let i = popups.length - 1; i >= 0; i--) {
            const pop = popups[i];
            pop.y -= 34 * dt;
            pop.life -= dt;
            if (pop.life <= 0) popups.splice(i, 1);
        }

        let moveDir = 0;
        if (keys.left && !keys.right) moveDir = -1;
        if (keys.right && !keys.left) moveDir = 1;
        if (moveDir !== 0) {
            paddle.x += moveDir * paddle.speed * dt;
            clampPaddle();
        }

        for (const b of bricks) {
            if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt);
        }

        if (state === "READY") {
            ball.x = paddle.x + paddle.w / 2;
            ball.y = paddle.y - ball.r - 1;
            return;
        }

        if (state !== "PLAYING") return;

        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        const subSteps = 2;
        const subDt = dt / subSteps;

        for (let step = 0; step < subSteps; step++) {
            ball.x += ball.vx * subDt;
            ball.y += ball.vy * subDt;

            // Left & Right Walls
            if (ball.x - ball.r <= 6) {
                ball.x = 6 + ball.r;
                ball.vx = Math.abs(ball.vx);
                sfx.bounceWall();
                spawnExplosion(ball.x - ball.r, ball.y, theme.normalFill, 5);
            } else if (ball.x + ball.r >= WIDTH - 6) {
                ball.x = WIDTH - 6 - ball.r;
                ball.vx = -Math.abs(ball.vx);
                sfx.bounceWall();
                spawnExplosion(ball.x + ball.r, ball.y, theme.normalFill, 5);
            }

            // Top Wall
            if (ball.y - ball.r <= 6) {
                ball.y = 6 + ball.r;
                ball.vy = Math.abs(ball.vy);
                sfx.bounceWall();
                spawnExplosion(ball.x, ball.y - ball.r, theme.normalFill, 5);
            }

            // Paddle Collision
            if (
                ball.vy > 0 &&
                ball.y + ball.r >= paddle.y &&
                ball.y - ball.r <= paddle.y + paddle.h &&
                ball.x + ball.r >= paddle.x &&
                ball.x - ball.r <= paddle.x + paddle.w
            ) {
                const paddleCenter = paddle.x + paddle.w / 2;
                const rawOffset = (ball.x - paddleCenter) / (paddle.w / 2);
                const hitOffset = Math.max(-0.92, Math.min(0.92, rawOffset));
                const maxAngle = (62 * Math.PI) / 180;
                const bounceAngle = hitOffset * maxAngle;

                ball.vx = ball.speed * Math.sin(bounceAngle);
                ball.vy = -ball.speed * Math.cos(bounceAngle);
                ball.y = paddle.y - ball.r - 0.5;
                paddle.glowPulse = 0.25;
                combo = 0;

                sfx.bouncePaddle();
                spawnExplosion(ball.x, paddle.y, theme.paddleGlow, 7);
            }

            // Brick Collision (Circle vs AABB)
            for (let i = bricks.length - 1; i >= 0; i--) {
                const b = bricks[i];
                const closestX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
                const closestY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
                const dx = ball.x - closestX;
                const dy = ball.y - closestY;

                if (dx * dx + dy * dy <= ball.r * ball.r) {
                    const overlapLeft = (ball.x + ball.r) - b.x;
                    const overlapRight = (b.x + b.w) - (ball.x - ball.r);
                    const overlapTop = (ball.y + ball.r) - b.y;
                    const overlapBottom = (b.y + b.h) - (ball.y - ball.r);
                    const minOverlapX = Math.min(overlapLeft, overlapRight);
                    const minOverlapY = Math.min(overlapTop, overlapBottom);

                    if (minOverlapX < minOverlapY) {
                        ball.vx = -ball.vx;
                        ball.x += overlapLeft < overlapRight ? -minOverlapX : minOverlapX;
                    } else {
                        ball.vy = -ball.vy;
                        ball.y += overlapTop < overlapBottom ? -minOverlapY : minOverlapY;
                    }

                    const minVy = ball.speed * 0.24;
                    if (Math.abs(ball.vy) < minVy) {
                        const signY = ball.vy >= 0 ? 1 : -1;
                        ball.vy = signY * minVy;
                        const signX = ball.vx >= 0 ? 1 : -1;
                        ball.vx = signX * Math.sqrt(Math.max(1, ball.speed * ball.speed - ball.vy * ball.vy));
                    }

                    b.hp -= 1;
                    b.hitFlash = 0.14;

                    if (b.hp <= 0) {
                        combo += 1;
                        const color = b.type === "bonus"
                            ? theme.bonusFill
                            : (b.type === "strong" ? theme.strongFill : theme.normalFill);
                        spawnExplosion(b.x + b.w / 2, b.y + b.h / 2, color, b.type === "bonus" ? 20 : 13);
                        addScore(b.points, b.x + b.w / 2, b.y + b.h / 2, color);
                        sfx.brickBreak(b.type, combo);
                        bricks.splice(i, 1);

                        ball.speed = Math.min(ball.maxSpeed, ball.speed + 3.2);
                        const currMag = Math.hypot(ball.vx, ball.vy) || 1;
                        ball.vx = (ball.vx / currMag) * ball.speed;
                        ball.vy = (ball.vy / currMag) * ball.speed;
                    } else {
                        sfx.armorHit();
                        spawnExplosion(closestX, closestY, theme.strongStroke, 6);
                    }
                    break;
                }
            }

            // Wave Cleared
            if (bricks.length === 0) {
                const waveBonus = wave * 100;
                wave += 1;
                sfx.waveClear();
                addScore(waveBonus, WIDTH / 2, HEIGHT * 0.42, theme.bonusFill);
                addPopup(WIDTH / 2, HEIGHT * 0.35, `${theme.waveText} ${wave}`, theme.normalFill);
                ball.baseSpeed = Math.min(440, ball.baseSpeed + 18);
                ball.speed = ball.baseSpeed;
                buildWave(wave);
                resetBallOnPaddle();
                break;
            }

            // Bottom Boundary (Lose Life)
            if (ball.y - ball.r > HEIGHT) {
                lives -= 1;
                syncHUD();
                shakeTime = 0.28;
                triggerLifeFlash();
                sfx.loseLife();

                if (lives <= 0) {
                    triggerGameOver();
                    return;
                } else {
                    ball.speed = Math.max(ball.baseSpeed, ball.speed - 20);
                    resetBallOnPaddle();
                    break;
                }
            }
        }
    }

    function clampPaddle() {
        const margin = 8;
        if (paddle.x < margin) paddle.x = margin;
        if (paddle.x + paddle.w > WIDTH - margin) paddle.x = WIDTH - margin - paddle.w;
    }

    // Canvas Drawing Helpers
    function drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.rect(x, y, w, h);
        }
    }

    function drawMiniHeart(ctx, x, y, s) {
        ctx.beginPath();
        const top = s * 0.3;
        ctx.moveTo(x, y + top);
        ctx.bezierCurveTo(x, y, x - s, y, x - s, y + top);
        ctx.bezierCurveTo(x - s, y + (s + top) / 2, x, y + (s + top) / 1.3, x, y + s);
        ctx.bezierCurveTo(x, y + (s + top) / 1.3, x + s, y + (s + top) / 2, x + s, y + top);
        ctx.bezierCurveTo(x + s, y, x, y, x, y + top);
        ctx.closePath();
        ctx.fill();
    }

    function render() {
        const canvas = el("neonBreakerCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const theme = getTheme();

        // Mode-Adaptive Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        bgGrad.addColorStop(0, theme.bgStops[0]);
        bgGrad.addColorStop(0.55, theme.bgStops[1]);
        bgGrad.addColorStop(1, theme.bgStops[2]);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Tech / Romantic Grid
        ctx.strokeStyle = theme.gridColor;
        ctx.lineWidth = 1;
        for (let x = 0; x <= WIDTH; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= HEIGHT; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WIDTH, y);
            ctx.stroke();
        }

        // Ambient Floating Hearts for Mode Pacar
        if (theme.heartParticles) {
            for (const h of ambientHearts) {
                ctx.save();
                ctx.globalAlpha = h.alpha;
                ctx.fillStyle = "#ff85b3";
                drawMiniHeart(ctx, h.x, h.y, h.size);
                ctx.restore();
            }
        }

        ctx.save();
        if (shakeTime > 0) {
            const mag = shakeTime * 18;
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }

        // Arena Walls
        ctx.strokeStyle = theme.wallColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, HEIGHT);
        ctx.lineTo(5, 5);
        ctx.lineTo(WIDTH - 5, 5);
        ctx.lineTo(WIDTH - 5, HEIGHT);
        ctx.stroke();

        // Bottom Danger Line
        ctx.strokeStyle = theme.dangerColor;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(10, HEIGHT - 8);
        ctx.lineTo(WIDTH - 10, HEIGHT - 8);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wave Watermark
        ctx.fillStyle = theme.watermarkColor;
        ctx.font = "bold 11px 'Fira Code', monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${theme.waveText} 0${wave}`, WIDTH - 14, 24);

        // Render Bricks
        for (const b of bricks) {
            ctx.save();
            let fill = theme.normalFill;
            let stroke = theme.normalStroke;
            let glow = theme.normalGlow;

            if (b.type === "strong") {
                fill = b.hp === 1 ? theme.strongCracked : theme.strongFill;
                stroke = theme.strongStroke;
                glow = theme.strongGlow;
            } else if (b.type === "bonus") {
                fill = theme.bonusFill;
                stroke = theme.bonusStroke;
                glow = theme.bonusGlow;
            }

            if (b.hitFlash > 0) {
                fill = "#ffffff";
                glow = "#ffffff";
            }

            ctx.shadowColor = glow;
            ctx.shadowBlur = 10;
            ctx.fillStyle = fill;
            drawRoundRect(ctx, b.x, b.y, b.w, b.h, isPacar() ? 6 : 4);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            drawRoundRect(ctx, b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1, isPacar() ? 6 : 4);
            ctx.stroke();

            if (b.type === "strong") {
                ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
                ctx.fillRect(b.x + 6, b.y + 5, b.w - 12, b.h - 10);
                if (b.hp < b.maxHp) {
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(b.x + b.w * 0.3, b.y + 2);
                    ctx.lineTo(b.x + b.w * 0.5, b.y + b.h * 0.6);
                    ctx.lineTo(b.x + b.w * 0.7, b.y + b.h - 2);
                    ctx.stroke();
                }
            } else if (b.type === "bonus") {
                ctx.fillStyle = isPacar() ? "#831843" : "#422006";
                ctx.font = "bold 10px 'Fira Code', monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(theme.bonusSymbol, b.x + b.w / 2, b.y + b.h / 2 + 0.5);
            } else if (isPacar()) {
                // Subtle heart stamp on normal pink bricks
                ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
                drawMiniHeart(ctx, b.x + b.w / 2, b.y + 5, 4);
            }

            ctx.restore();
        }

        // Render Paddle
        ctx.save();
        const padGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.w, paddle.y);
        padGrad.addColorStop(0, theme.paddleStops[0]);
        padGrad.addColorStop(0.5, theme.paddleStops[1]);
        padGrad.addColorStop(1, theme.paddleStops[2]);

        ctx.shadowColor = paddle.glowPulse > 0 ? "#ffffff" : theme.paddleGlow;
        ctx.shadowBlur = paddle.glowPulse > 0 ? 18 : 12;
        ctx.fillStyle = padGrad;
        drawRoundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(paddle.x + 12, paddle.y + 3, paddle.w - 24, 2.5);

        if (isPacar()) {
            ctx.fillStyle = "#831843";
            drawMiniHeart(ctx, paddle.x + paddle.w / 2, paddle.y + 2.5, 4);
        }
        ctx.restore();

        // Render Ball Trail
        for (let i = 0; i < ball.trail.length; i++) {
            const t = ball.trail[i];
            const ratio = (i + 1) / ball.trail.length;
            ctx.save();
            ctx.globalAlpha = ratio * 0.38;
            ctx.fillStyle = theme.trailColor;
            ctx.beginPath();
            ctx.arc(t.x, t.y, ball.r * ratio * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render Ball
        ctx.save();
        ctx.shadowColor = theme.ballGlow;
        ctx.shadowBlur = 14;
        ctx.fillStyle = isPacar() ? "#fff1f2" : "#ffffff";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = theme.ballStroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Render Particles (Hearts in Pacar Mode, Neon Shards in Others)
        for (const p of particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            if (theme.heartParticles) {
                drawMiniHeart(ctx, p.x, p.y, p.size * 1.15);
            } else {
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
            ctx.restore();
        }

        // Render Floating Popups
        for (const pop of popups) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, pop.life * 1.4);
            ctx.fillStyle = pop.color;
            ctx.font = "bold 12px 'Fira Code', monospace";
            ctx.textAlign = "center";
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        }

        // Ready Launch Hint
        if (state === "READY") {
            const alpha = 0.55 + 0.45 * Math.sin(pulsePhase * 1.4);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = theme.normalFill;
            ctx.font = "bold 11.5px 'Fira Code', monospace";
            ctx.textAlign = "center";
            ctx.fillText(theme.launchHint, WIDTH / 2, HEIGHT * 0.62);
            ctx.restore();
        }

        ctx.restore();
    }

    function gameLoop(now) {
        if (state !== "PLAYING" && state !== "READY") return;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        update(dt);
        render();

        if (state === "PLAYING" || state === "READY") {
            rafId = requestAnimationFrame(gameLoop);
        }
    }

    // Input Binding
    function movePaddleToClientX(clientX) {
        const canvas = el("neonBreakerCanvas");
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0) return;
        const scaleX = WIDTH / rect.width;
        const relX = (clientX - rect.left) * scaleX;
        paddle.x = relX - paddle.w / 2;
        clampPaddle();
    }

    function bindEvents() {
        if (el("btnNbPlay")) el("btnNbPlay").onclick = () => { SysSFX.click(); startNewGame(); };
        if (el("btnNbPlayAgain")) el("btnNbPlayAgain").onclick = () => { SysSFX.click(); startNewGame(); };
        if (el("btnNbRestartPause")) el("btnNbRestartPause").onclick = () => { SysSFX.click(); startNewGame(); };

        if (el("btnNbResume")) el("btnNbResume").onclick = () => { SysSFX.click(); resumeGame(); };
        if (el("btnNbMenuPause")) el("btnNbMenuPause").onclick = () => { SysSFX.click(); openMainMenu(); };
        if (el("btnNbMenuOver")) el("btnNbMenuOver").onclick = () => { SysSFX.click(); openMainMenu(); };

        if (el("btnNbPause")) {
            el("btnNbPause").onclick = () => {
                SysSFX.click();
                if (state === "PLAYING" || state === "READY") pauseGame();
                else if (state === "PAUSED") resumeGame();
            };
        }

        if (el("btnNbMute")) {
            el("btnNbMute").onclick = () => {
                isMuted = !isMuted;
                syncHUD();
                if (!isMuted) SysSFX.click();
            };
        }

        if (el("btnNbExitMain")) {
            el("btnNbExitMain").onclick = () => {
                SysSFX.click();
                stopLoop();
                setScene("sceneMenuUtama");
            };
        }

        const stage = el("nbStage");
        if (stage) {
            stage.addEventListener("mousemove", (e) => {
                if (state === "PLAYING" || state === "READY") {
                    movePaddleToClientX(e.clientX);
                }
            });

            stage.addEventListener("click", (e) => {
                if (e.target.closest(".nb-overlay")) return;
                if (state === "READY") {
                    launchBall();
                }
            });

            stage.addEventListener("touchstart", (e) => {
                if (e.target.closest(".nb-overlay")) return;
                if (e.touches.length > 0) {
                    e.preventDefault();
                    movePaddleToClientX(e.touches[0].clientX);
                    if (state === "READY") {
                        launchBall();
                    }
                }
            }, { passive: false });

            stage.addEventListener("touchmove", (e) => {
                if (e.target.closest(".nb-overlay")) return;
                if (e.touches.length > 0 && (state === "PLAYING" || state === "READY")) {
                    e.preventDefault();
                    movePaddleToClientX(e.touches[0].clientX);
                }
            }, { passive: false });
        }

        document.addEventListener("keydown", (e) => {
            const scene = el("sceneNeonBreaker");
            if (!scene || !scene.classList.contains("active")) return;

            if (e.key === "Escape") {
                e.preventDefault();
                if (state === "PLAYING" || state === "READY") pauseGame();
                else if (state === "PAUSED") resumeGame();
                return;
            }

            const k = e.key.toLowerCase();
            if (k === "a" || e.key === "ArrowLeft") {
                e.preventDefault();
                keys.left = true;
            } else if (k === "d" || e.key === "ArrowRight") {
                e.preventDefault();
                keys.right = true;
            } else if (e.key === " " || k === "w" || e.key === "ArrowUp") {
                e.preventDefault();
                if (state === "READY" && !e.repeat) {
                    launchBall();
                }
            }
        });

        document.addEventListener("keyup", (e) => {
            const k = e.key.toLowerCase();
            if (k === "a" || e.key === "ArrowLeft") keys.left = false;
            if (k === "d" || e.key === "ArrowRight") keys.right = false;
        });
    }

    function init() {
        loadHighScore();
        initAmbientHearts();
        applyThemeTexts();
        syncHUD();
        bindEvents();
        render();
    }

    function open() {
        setScene("sceneNeonBreaker");
        keys.left = false;
        keys.right = false;
        openMainMenu();
        if (typeof SecretFlow !== "undefined") SecretFlow.updateGameBadges();
    }

    return {
        init,
        open,
        stopLoop,
        getHighScore: loadHighScore,
        resetHighScore
    };
})();
// ==================================================
// SECRET FLOW ENGINE — STATE MACHINE & SCENE 01
// ==================================================

const SecretFlow = (() => {
    const STORAGE_KEY = "finalSecretState_v1";

    const DEFAULT_STATE = {
        isTargetUser: false,
        userName: "",
        game1Perfect: false,
        game2Perfect: false,
        game3Perfect: false,
        bestScores: {
            snake: 0,
            tower: 0,
            neonBreaker: 0
        },
        allChallengesCompleted: false,
        secretFileUnlocked: false,
        letterOpened: false,
        museumProgress: [],
        museumCompleted: false,
        finalSurpriseUnlocked: false
    };

    let state = { ...DEFAULT_STATE, bestScores: { ...DEFAULT_STATE.bestScores } };
    let toastTimer = null;

    function getTargets() {
        return (typeof SECRET_CONFIG !== "undefined" && SECRET_CONFIG.targets)
            ? SECRET_CONFIG.targets
            : { snake: 120, tower: 28, neonBreaker: 800 };
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                state = {
                    ...DEFAULT_STATE,
                    ...parsed,
                    bestScores: {
                        ...DEFAULT_STATE.bestScores,
                        ...(parsed.bestScores || {})
                    }
                };
            }
        } catch (e) {
            console.warn("Gagal membaca state rahasia:", e);
        }
        return state;
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn("Gagal menyimpan state rahasia:", e);
        }
    }

    function isSessionEligible() {
        return currentMode === "pacar" || currentMode === "kaciu";
    }

    function showToast(msg, duration = 3400) {
        const toast = document.getElementById("secretToast");
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add("show");
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, duration);
    }

    function updateMenuBanner() {
        const banner = document.getElementById("menuSecretBanner");
        if (!banner) return;
        if (isSessionEligible() && state.allChallengesCompleted) {
            banner.style.display = "flex";
        } else {
            banner.style.display = "none";
        }
    }

    function updateGameBadges() {
        const eligible = isSessionEligible();
        const targets = getTargets();

        const snakeBadge = document.getElementById("snakeTargetBadge");
        if (snakeBadge) {
            snakeBadge.style.display = eligible ? "inline-block" : "none";
            snakeBadge.textContent = state.game1Perfect ? `✅ ${targets.snake} PERFECT` : `Target: ${targets.snake}`;
            snakeBadge.classList.toggle("done", state.game1Perfect);
        }

        const tsBadge = document.getElementById("tsTargetBadge");
        if (tsBadge) {
            tsBadge.style.display = eligible ? "inline-block" : "none";
            tsBadge.textContent = state.game2Perfect ? `✅ Lt. ${targets.tower} PERFECT` : `Target: Lt. ${targets.tower}`;
            tsBadge.classList.toggle("done", state.game2Perfect);
        }

        const nbBadge = document.getElementById("nbTargetBadge");
        if (nbBadge) {
            nbBadge.style.display = eligible ? "inline-block" : "none";
            nbBadge.textContent = state.game3Perfect ? `✅ ${targets.neonBreaker} PERFECT` : `Target: ${targets.neonBreaker}`;
            nbBadge.classList.toggle("done", state.game3Perfect);
        }
    }

    function onUserIdentified(mode, name) {
        loadState();
        if (mode === "pacar" || mode === "kaciu") {
            state.isTargetUser = true;
            state.userName = name;

            // Pulihkan rekor tersimpan ke sesi aktif
            snakeHighScore[0] = Math.max(snakeHighScore[0], state.bestScores.snake || 0);
            tsData.bestFloor = Math.max(tsData.bestFloor, state.bestScores.tower || 0);
            if (typeof NeonBreaker !== "undefined") {
                const currentNb = NeonBreaker.getHighScore();
                if ((state.bestScores.neonBreaker || 0) > currentNb) {
                    localStorage.setItem("neonBreakerHighScore", String(state.bestScores.neonBreaker));
                }
            }
            saveState();
        } else {
            // Mode tamu/creator: reset skor tampilan sesi tanpa menghapus progress tersimpan target utama
            resetAllScores(true);
        }
        updateMenuBanner();
        updateGameBadges();
    }

    function checkScore(gameKey, rawValue) {
        if (!isSessionEligible()) return;

        const value = Number(rawValue) || 0;
        const targets = getTargets();
        let newlyCompletedTitle = null;

        if (value > (state.bestScores[gameKey] || 0)) {
            state.bestScores[gameKey] = value;
        }

        if (gameKey === "snake" && !state.game1Perfect && value >= targets.snake) {
            state.game1Perfect = true;
            newlyCompletedTitle = "Game Ular Retro";
        } else if (gameKey === "tower" && !state.game2Perfect && value >= targets.tower) {
            state.game2Perfect = true;
            newlyCompletedTitle = "Tower Survival";
        } else if (gameKey === "neonBreaker" && !state.game3Perfect && value >= targets.neonBreaker) {
            state.game3Perfect = true;
            newlyCompletedTitle = "Neon Breaker";
        }

        saveState();
        updateGameBadges();

        const completedCount = [state.game1Perfect, state.game2Perfect, state.game3Perfect].filter(Boolean).length;

        if (newlyCompletedTitle) {
            SysSFX.verifyStep(completedCount - 1);
            if (completedCount < 3) {
                showToast(`✨ PERFECT (${completedCount}/3): ${newlyCompletedTitle} tercapai!`);
            }
        }

        if (completedCount === 3 && !state.allChallengesCompleted) {
            state.allChallengesCompleted = true;
            saveState();
            updateMenuBanner();
            triggerAllChallengesCompleted();
        }
    }

    function triggerAllChallengesCompleted() {
        SysSFX.surpriseSparkle();
        showToast("🏆 ALL 3 CHALLENGES PERFECT! Membuka pencapaian akhir...", 2200);

        setTimeout(() => {
            // Hentikan loop mini-game yang sedang aktif secara aman
            if (typeof snakeInterval !== "undefined" && snakeInterval) {
                clearInterval(snakeInterval);
            }
            if (typeof stopTowerLoop === "function") stopTowerLoop();
            if (typeof NeonBreaker !== "undefined") NeonBreaker.stopLoop();

            openScene01();
        }, 1500);
    }

    async function openScene01() {
        if (!isSessionEligible() || !state.allChallengesCompleted) {
            setScene("sceneMenuUtama");
            return;
        }

        setScene("sceneSecretAchievement");

        const targets = getTargets();
        const listEl = document.getElementById("secretAchievementList");
        const headlineEl = document.getElementById("secretAchievementHeadline");
        const continueBtn = document.getElementById("btnSecretScene1Continue");

        headlineEl.classList.remove("visible");
        continueBtn.style.display = "none";

        const items = [
            {
                name: "01. Game Ular Retro",
                detail: `Skor Tercapai: ${Math.max(state.bestScores.snake, targets.snake)} / Target: ${targets.snake}`
            },
            {
                name: "02. Tower Survival",
                detail: `Rekor Tercapai: Lantai ${Math.max(state.bestScores.tower, targets.tower)} / Target: Lantai ${targets.tower}`
            },
            {
                name: "03. Neon Breaker",
                detail: `Skor Tercapai: ${Math.max(state.bestScores.neonBreaker, targets.neonBreaker)} / Target: ${targets.neonBreaker}`
            }
        ];

        listEl.innerHTML = items.map((item, idx) => `
            <div class="secret-ach-card" id="secAchCard${idx}">
                <div class="secret-ach-info">
                    <strong>${item.name}</strong>
                    <span>${item.detail}</span>
                </div>
                <div class="secret-ach-status">★ PERFECT</div>
            </div>
        `).join("");

        for (let i = 0; i < items.length; i++) {
            await sleep(320);
            const card = document.getElementById(`secAchCard${i}`);
            if (card) card.classList.add("revealed");
            SysSFX.verifyStep(i);
        }

        await sleep(450);
        SysSFX.surpriseSparkle();
        headlineEl.classList.add("visible");

        await sleep(600);
        continueBtn.style.display = "inline-flex";
    }

    function stopAllAudio() {
        SecretBGM.stop()
        tsData.soundOn = false;
        const btnTsSound = document.getElementById("btnTsSound");
        if (btnTsSound) btnTsSound.textContent = "🔇";

        document.querySelectorAll("audio").forEach(aud => {
            try {
                aud.pause();
                aud.currentTime = 0;
            } catch (e) {}
        });
    }

    async function transitionToOffline() {
        if (!isSessionEligible() || !state.allChallengesCompleted) return;

        // Hentikan seluruh musik dan efek suara
        stopAllAudio();

        state.secretFileUnlocked = true;
        saveState();

        const dimOverlay = document.getElementById("secretDimOverlay");
        const dimContent = document.getElementById("secretDimContent");
        dimContent.innerHTML = "";
        dimOverlay.classList.add("active");

        // Layar perlahan meredup selama 1.4 detik
        await sleep(1400);

        // Ubah tema ke mode gelap offline & pindah ke Scene 02 di balik layar hitam
        document.body.classList.remove("theme-default", "theme-pacar", "theme-tamu", "theme-creator", "theme-secret-warm");
        document.body.classList.add("theme-secret-offline");
        setScene("sceneSecretOffline");

        await sleep(350);
        dimOverlay.classList.remove("active");

        await openScene02();
    }

    async function openScene02() {
        if (!isSessionEligible() || !state.secretFileUnlocked) {
            setScene("sceneMenuUtama");
            return;
        }

        stopAllAudio();

        const logContainer = document.getElementById("offlineLogStream");
        const finalReveal = document.getElementById("offlineFinalReveal");
        if (!logContainer || !finalReveal) return;

        logContainer.innerHTML = "";
        finalReveal.style.display = "none";
        finalReveal.classList.remove("visible");

        const sequence = [
            { text: "CONNECTION INTERRUPTED...", style: "alert", pauseAfter: 1100 },
            { text: "CHECKING SYSTEM...", style: "", pauseAfter: 1200 },
            { text: "AN UNREGISTERED FILE HAS BEEN FOUND.", style: "emphasis", pauseAfter: 1300 },
            { text: "WAIT...", style: "", pauseAfter: 1100 },
            { text: "THIS FILE WAS NEVER MEANT TO BE DISCOVERED.", style: "emphasis", pauseAfter: 2000 }
        ];

        for (const step of sequence) {
            const lineEl = document.createElement("div");
            lineEl.className = `offline-log-line ${step.style}`.trim();
            logContainer.appendChild(lineEl);

            // Efek ketik senyap (tanpa suara karena sistem dalam keadaan offline)
            for (const ch of step.text) {
                lineEl.textContent += ch;
                await sleep(26);
            }

            await sleep(step.pauseAfter);
        }

        // Setelah beberapa detik, tampilkan pesan terakhir & tombol ACCESS SECRET FILE
        finalReveal.style.display = "flex";
        requestAnimationFrame(() => {
            finalReveal.classList.add("visible");
        });
    }

    // ==================================================
    // HYBRID SECRET BGM ENGINE (FILE MP3 ATAU MELODI BAWAAN)
    // ==================================================
    const SecretBGM = (() => {
        let isMuted = false;
        let synthTimer = null;
        let synthCtx = null;
        let isPlaying = false;

        function getConfig() {
            return (typeof SECRET_CONFIG !== "undefined" && SECRET_CONFIG.audio)
                ? SECRET_CONFIG.audio
                : { secretBgmSrc: "", volume: 0.45 };
        }

        function updateToggleUI() {
            const btn = document.getElementById("btnSecretBgmToggle");
            if (btn) {
                btn.textContent = isMuted ? "🔇 Musik: OFF" : "🔊 Musik: ON";
            }
        }

        function startFallbackMelody() {
            if (synthTimer) return;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!synthCtx) synthCtx = new AudioCtx();
            if (synthCtx.state === "suspended") synthCtx.resume().catch(() => {});

            // Progresi akor lembut Fmaj7 -> Cmaj7 -> Am7 -> G6
            const chords = [
                [349.23, 440.00, 523.25, 659.25],
                [261.63, 329.63, 392.00, 493.88],
                [220.00, 261.63, 329.63, 392.00],
                [196.00, 246.94, 293.66, 329.63]
            ];
            let step = 0;

            const playGentleChord = () => {
                if (isMuted || !isPlaying || !synthCtx) return;
                const notes = chords[step % chords.length];
                step += 1;
                const now = synthCtx.currentTime;
                notes.forEach((freq, idx) => {
                    const osc = synthCtx.createOscillator();
                    const gain = synthCtx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, now + idx * 0.14);

                    gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
                    gain.gain.linearRampToValueAtTime(0.045, now + idx * 0.14 + 0.35);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 2.6);

                    osc.connect(gain);
                    gain.connect(synthCtx.destination);
                    osc.start(now + idx * 0.14);
                    osc.stop(now + idx * 0.14 + 2.7);
                });
            };

            playGentleChord();
            synthTimer = setInterval(playGentleChord, 2800);
        }

        function stopFallbackMelody() {
            if (synthTimer) {
                clearInterval(synthTimer);
                synthTimer = null;
            }
        }

        function play() {
            isPlaying = true;
            updateToggleUI();
            if (isMuted) return;

            const cfg = getConfig();
            const audioEl = document.getElementById("secretBgmAudio");

            if (cfg.secretBgmSrc && cfg.secretBgmSrc.trim() !== "" && audioEl) {
                if (!audioEl.getAttribute("src")) {
                    audioEl.src = cfg.secretBgmSrc.trim();
                }
                audioEl.volume = typeof cfg.volume === "number" ? cfg.volume : 0.45;
                audioEl.play().catch(() => {
                    // Jika file belum ada / gagal dimuat, gunakan melodi lembut bawaan
                    startFallbackMelody();
                });
            } else {
                startFallbackMelody();
            }
        }

        function stop() {
            isPlaying = false;
            stopFallbackMelody();
            const audioEl = document.getElementById("secretBgmAudio");
            if (audioEl) {
                try {
                    audioEl.pause();
                    audioEl.currentTime = 0;
                } catch (e) {}
            }
        }

        function toggleMute() {
            isMuted = !isMuted;
            updateToggleUI();
            const audioEl = document.getElementById("secretBgmAudio");
            if (isMuted) {
                stopFallbackMelody();
                if (audioEl) audioEl.pause();
            } else if (isPlaying) {
                play();
            }
        }

        return { play, stop, toggleMute };
    })();

    // ==================================================
    // SCENE 03 CONTROLLER: A MESSAGE FROM THE CREATOR
    // ==================================================
    let isLetterTypingSkipped = false;
    let isLetterSequenceRunning = false;

    async function transitionToWarmScene() {
        if (!isSessionEligible() || !state.secretFileUnlocked) return;

        tsData.soundOn = true;
        SysSFX.unlock();
        SysSFX.callConnectedRomantic();

        const dimOverlay = document.getElementById("secretDimOverlay");
        const dimContent = document.getElementById("secretDimContent");

        dimOverlay.style.background = "#fdf6f0";
        dimContent.innerHTML = "";
        dimOverlay.classList.add("active");

        await sleep(950);

        document.body.classList.remove("theme-secret-offline", "theme-default", "theme-pacar", "theme-tamu", "theme-creator");
        document.body.classList.add("theme-secret-warm");

        const titleEl = document.getElementById("terminalTitle");
        const badgeEl = document.getElementById("modeBadge");
        if (titleEl) titleEl.textContent = "PRIVATE ARCHIVE // PERSONAL MESSAGE";
        if (badgeEl) badgeEl.textContent = "FOR YOU ♥";

        openScene03();

        await sleep(250);
        dimOverlay.classList.remove("active");
        setTimeout(() => {
            dimOverlay.style.background = "#030305";
        }, 1200);
    }

    function openScene03() {
        if (!isSessionEligible() || !state.secretFileUnlocked) {
            setScene("sceneMenuUtama");
            return;
        }

        setScene("sceneSecretLetter");

        const letterCfg = (typeof SECRET_CONFIG !== "undefined" && SECRET_CONFIG.letter)
            ? SECRET_CONFIG.letter
            : {
                badge: "PRIVATE MESSAGE // FOR YOU",
                title: "Before You Continue...",
                greeting: "[ISI SALAM PEMBUKA DI SINI]",
                story: "[ISI CERITA DI SINI]",
                gratitude: "[ISI UCAPAN TERIMA KASIH DI SINI]",
                personalMessage: "[ISI PESAN PERSONAL DI SINI]",
                closing: "[ISI PENUTUP DI SINI]"
            };

        const badgeEl = document.getElementById("letterSceneBadge");
        const envTitleEl = document.getElementById("letterEnvelopeTitle");
        const paperTitleEl = document.getElementById("letterPaperTitle");
        if (badgeEl) badgeEl.textContent = letterCfg.badge || "PRIVATE MESSAGE // FOR YOU";
        if (envTitleEl) envTitleEl.textContent = letterCfg.title || "Before You Continue...";
        if (paperTitleEl) paperTitleEl.textContent = letterCfg.title || "Before You Continue...";

        // Reset tampilan ke fase amplop tertutup
        const envBox = document.getElementById("digitalEnvelopeBox");
        const paperBox = document.getElementById("digitalLetterPaper");
        const footerAction = document.getElementById("letterFooterAction");
        const skipBtn = document.getElementById("btnSkipLetterType");

        isLetterTypingSkipped = false;
        isLetterSequenceRunning = false;

        envBox.style.display = "block";
        envBox.classList.remove("is-opening");
        paperBox.style.display = "none";
        paperBox.classList.remove("visible");
        footerAction.style.display = "none";
        footerAction.classList.remove("visible");
        if (skipBtn) skipBtn.style.display = "inline-block";

        ["letterOutGreeting", "letterOutStory", "letterOutGratitude", "letterOutPersonal", "letterOutClosing"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "";
        });

        // Mulai musik latar lembut (aman karena dipicu oleh klik tombol sebelumnya)
        SecretBGM.play();
    }

    async function handleOpenDigitalEnvelope() {
        if (isLetterSequenceRunning) return;
        isLetterSequenceRunning = true;

        SecretBGM.play();
        SysSFX.surpriseSparkle();

        state.letterOpened = true;
        saveState();

        const envBox = document.getElementById("digitalEnvelopeBox");
        const paperBox = document.getElementById("digitalLetterPaper");

        envBox.classList.add("is-opening");
        await sleep(850);

        envBox.style.display = "none";
        paperBox.style.display = "flex";
        requestAnimationFrame(() => {
            paperBox.classList.add("visible");
        });

        await runLetterTypewriter();
    }

    async function runLetterTypewriter() {
        const letterCfg = (typeof SECRET_CONFIG !== "undefined" && SECRET_CONFIG.letter)
            ? SECRET_CONFIG.letter
            : {};

        const sections = [
            { id: "letterOutGreeting", text: letterCfg.greeting || "" },
            { id: "letterOutStory", text: letterCfg.story || "" },
            { id: "letterOutGratitude", text: letterCfg.gratitude || "" },
            { id: "letterOutPersonal", text: letterCfg.personalMessage || "" },
            { id: "letterOutClosing", text: letterCfg.closing || "" }
        ];

        const paperBody = document.getElementById("letterPaperBody");

        for (const sec of sections) {
            const targetEl = document.getElementById(sec.id);
            if (!targetEl || !sec.text) continue;

            if (isLetterTypingSkipped) {
                targetEl.textContent = sec.text;
                continue;
            }

            for (const ch of sec.text) {
                if (isLetterTypingSkipped) {
                    targetEl.textContent = sec.text;
                    break;
                }
                targetEl.textContent += ch;
                if (paperBody) {
                    paperBody.scrollTop = paperBody.scrollHeight;
                }
                await sleep(24);
            }

            if (!isLetterTypingSkipped) {
                await sleep(380);
            }
        }

        const skipBtn = document.getElementById("btnSkipLetterType");
        if (skipBtn) skipBtn.style.display = "none";

        const footerAction = document.getElementById("letterFooterAction");
        if (footerAction) {
            footerAction.style.display = "block";
            requestAnimationFrame(() => {
                footerAction.classList.add("visible");
            });
        }
    }

    async function proceedToMuseum() {
        if (!isSessionEligible() || !state.letterOpened) return;

        SecretBGM.stop();
        SysSFX.click();

        const dimOverlay = document.getElementById("secretDimOverlay");
        const dimContent = document.getElementById("secretDimContent");

        dimOverlay.style.background = "#fff5f6";
        dimContent.style.color = "#831843";
        dimContent.innerHTML = "";
        dimOverlay.classList.add("active");

        await sleep(1000);

        // Checkpoint Phase 4 (Akan langsung mengarahkan ke index_2.html pada Phase 5)
        dimContent.innerHTML = `
            <p style="color:#9f1239; font-size:12px; letter-spacing:1px; margin-bottom:10px;">
                [PHASE 4 VERIFIED — SURAT SELESAI DIBACA]
            </p>
            <p style="font-size:14px; margin-bottom:18px;">
                Tombol <strong>[ THERE'S SOMETHING ELSE ]</strong> siap menghubungkan ke <strong>The Museum of Us (Scene 04)</strong> pada Phase 5.
            </p>
            <button id="btnPhase4BackMenu" class="btn btn-primary">← Kembali ke Menu Utama</button>
        `;

        document.getElementById("btnPhase4BackMenu").onclick = () => {
            dimOverlay.classList.remove("active");
            setTimeout(() => {
                dimOverlay.style.background = "#030305";
                dimContent.style.color = "#e2e8f0";
                dimContent.innerHTML = "";
            }, 600);
            document.body.classList.remove("theme-secret-warm");
            updateTheme(currentMode);
            setScene("sceneMenuUtama");
        };
    }

    function renderProgressSummary() {
        const countEl = document.getElementById("progMiniGameCount");
        const rewardEl = document.getElementById("progHiddenReward");
        if (!countEl || !rewardEl) return;

        if (!isSessionEligible()) {
            countEl.textContent = "3 Tersedia";
            rewardEl.textContent = "AKTIF";
            return;
        }

        const done = [state.game1Perfect, state.game2Perfect, state.game3Perfect].filter(Boolean).length;
        countEl.textContent = `${done} / 3 PERFECT`;
        rewardEl.textContent = state.allChallengesCompleted ? "🔓 TERBUKA" : "🔒 TERKUNCI";
    }

    function bindUI() {
        const envBox = document.getElementById("digitalEnvelopeBox");
        if (envBox) {
            envBox.onclick = () => handleOpenDigitalEnvelope();
            envBox.onkeydown = (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenDigitalEnvelope();
                }
            };
        }

        const btnBgmToggle = document.getElementById("btnSecretBgmToggle");
        if (btnBgmToggle) {
            btnBgmToggle.onclick = () => SecretBGM.toggleMute();
        }

        const btnSkipType = document.getElementById("btnSkipLetterType");
        if (btnSkipType) {
            btnSkipType.onclick = () => {
                isLetterTypingSkipped = true;
            };
        }

        const btnToMuseum = document.getElementById("btnLetterNextToMuseum");
        if (btnToMuseum) {
            btnToMuseum.onclick = () => proceedToMuseum();
        }
        const btnContinue = document.getElementById("btnSecretScene1Continue");
        if (btnContinue) {
            btnContinue.onclick = () => {
                SysSFX.click();
                transitionToOffline();
            };
        }

        const btnFromMenu = document.getElementById("btnOpenSecretFromMenu");
        if (btnFromMenu) {
            btnFromMenu.onclick = () => {
                SysSFX.click();
                openScene01();
            };
        }

        const btnAccessFile = document.getElementById("btnAccessSecretFile");
        if (btnAccessFile) {
            btnAccessFile.onclick = () => {
                transitionToWarmScene();
            };
        }

        // Pintasan Uji Cepat (HP & Desktop): Ketuk badge pojok kanan atas 5x
        const modeBadge = document.getElementById("modeBadge");
        if (modeBadge) {
            let tapCount = 0;
            let tapResetTimer = null;
            modeBadge.style.cursor = "pointer";
            modeBadge.addEventListener("click", () => {
                tapCount += 1;
                if (tapResetTimer) clearTimeout(tapResetTimer);
                tapResetTimer = setTimeout(() => {
                    tapCount = 0;
                }, 2500);

                if (tapCount >= 5) {
                    tapCount = 0;
                    debugUnlockAll();
                }
            });
        }
    }

    // Helper khusus pengujian creator via Console Browser (F12)
    function debugUnlockAll() {
        const targets = getTargets();
        currentMode = "pacar";
        updateTheme("pacar");
        state.isTargetUser = true;
        state.bestScores = {
            snake: targets.snake,
            tower: targets.tower,
            neonBreaker: targets.neonBreaker
        };
        state.game1Perfect = true;
        state.game2Perfect = true;
        state.game3Perfect = true;
        state.allChallengesCompleted = true;
        saveState();
        updateMenuBanner();
        updateGameBadges();
        openScene01();
    }

    function debugReset() {
        localStorage.removeItem(STORAGE_KEY);
        state = { ...DEFAULT_STATE, bestScores: { ...DEFAULT_STATE.bestScores } };
        resetAllScores(true);
        updateMenuBanner();
        updateGameBadges();
        showToast("🔄 SecretFlow state berhasil di-reset.");
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadState();
        bindUI();
    });

    return {
        isSessionEligible,
        onUserIdentified,
        checkScore,
        updateGameBadges,
        renderProgressSummary,
        openScene01,
        getState: () => ({ ...state }),
        debugUnlockAll,
        debugReset
    };
})();