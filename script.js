// Menggunakan versi 0.10.0 yang stabil tanpa tambahan path vision_bundle.js
import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// ==========================================
// ⚙️ KONFIGURASI UTAMA (MUDAH DIUBAH)
// ==========================================
const VIDEO_DURATION = 15;        
const AUDIO_START_OFFSET = 59.4;    
const AUDIO_START_DELAY = 0;      
const BLUR_AMOUNT = 12;           
// ==========================================

// --- UI Elements ---
const views = {
    landing: document.getElementById('landing-view'),
    camera: document.getElementById('camera-view'),
    result: document.getElementById('result-view')
};

const rawVideo = document.getElementById('raw-video');
const renderCanvas = document.getElementById('render-canvas');
const ctx = renderCanvas.getContext('2d');
const resultVideo = document.getElementById('result-video');
const bgMusic = document.getElementById('bg-music');

const btnStart = document.getElementById('btn-start');
const loadingText = document.getElementById('loading-text');
const btnRecord = document.getElementById('btn-record');
const countdownDisplay = document.getElementById('countdown-display');
const timerDisplay = document.getElementById('recording-timer');
const btnDownload = document.getElementById('btn-download');
const btnRetake = document.getElementById('btn-retake');

// --- State Variables ---
let handLandmarker = null;
let isCameraActive = false;
let isRecording = false;
let isPeaceSignActive = false;
let mediaRecorder = null;
let recordedChunks = [];
let finalBlobUrl = null;
let recordingInterval = null;
let audioContext = null;
let audioDest = null;
let lastVideoTime = -1;

// --- Initialize AI Model (Dengan Fallback CPU) ---
async function initMediaPipe() {
    try {
        // PENTING: Path wasm juga disesuaikan ke versi 0.10.0
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        try {
            handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
        } catch (gpuError) {
            console.warn("GPU gagal, beralih ke CPU...");
            handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "CPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
        }
        return true;
    } catch (err) {
        console.error("Gagal memuat AI MediaPipe:", err);
        alert("Gagal memuat model AI. Pastikan internet jalan.");
        return false;
    }
}
// --- Navigation ---
function showView(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
}

// --- Start Button Logic (Request Permissions & Load) ---
btnStart.addEventListener('click', async () => {
    btnStart.classList.add('hidden');
    loadingText.classList.remove('hidden');

    // Init AI
    if (!handLandmarker) {
        const success = await initMediaPipe();
        if (!success) {
            btnStart.classList.remove('hidden');
            loadingText.classList.add('hidden');
            return;
        }
    }

    // Init Camera (9:16 Ratio for mobile)
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
            audio: true // Request mic permission just in case, though we use local audio
        });
        rawVideo.srcObject = stream;
        
        rawVideo.onloadedmetadata = () => {
            rawVideo.play();
            // Sesuaikan ukuran canvas dengan resolusi asli video kamera
            renderCanvas.width = rawVideo.videoWidth;
            renderCanvas.height = rawVideo.videoHeight;
            isCameraActive = true;
            
            // Start Render Loop
            requestAnimationFrame(renderLoop);
            
            // Tampilkan Kamera UI
            showView('camera');
        };
    } catch (err) {
        alert("Izin kamera diperlukan untuk menggunakan aplikasi ini.");
        btnStart.classList.remove('hidden');
        loadingText.classList.add('hidden');
    }
});

// --- Deteksi V-Sign (✌🏼) Logika ---
function detectPeaceSign(landmarks) {
    if (!landmarks || landmarks.length === 0) return false;
    const hand = landmarks[0];
    
    // Landmark tips & pips
    // Index: tip 8, pip 6
    // Middle: tip 12, pip 10
    // Ring: tip 16, pip 14
    // Pinky: tip 20, pip 18
    
    const isIndexUp = hand[8].y < hand[6].y;
    const isMiddleUp = hand[12].y < hand[10].y;
    const isRingDown = hand[16].y > hand[14].y;
    const isPinkyDown = hand[20].y > hand[18].y;

    return isIndexUp && isMiddleUp && isRingDown && isPinkyDown;
}

// --- Render Loop (Menggambar ke Canvas + Efek Blur) ---
function renderLoop() {
    if (!isCameraActive) return;

    // 1. Prediksi AI
    let startTimeMs = performance.now();
    if (rawVideo.currentTime !== lastVideoTime) {
        lastVideoTime = rawVideo.currentTime;
        const results = handLandmarker.detectForVideo(rawVideo, startTimeMs);
        isPeaceSignActive = detectPeaceSign(results.landmarks);
    }

    // 2. Gambar ke Canvas
    ctx.save();
    
    // Mirroring kamera depan agar seperti cermin
    ctx.translate(renderCanvas.width, 0);
    ctx.scale(-1, 1);

    // Terapkan blur jika terdeteksi gesture
    if (isPeaceSignActive) {
        ctx.filter = `blur(${BLUR_AMOUNT}px)`;
    } else {
        ctx.filter = 'none';
    }

    ctx.drawImage(rawVideo, 0, 0, renderCanvas.width, renderCanvas.height);
    ctx.restore();

    requestAnimationFrame(renderLoop);
}

// --- Setup Audio Routing (Web Audio API) ---
function setupAudioRouting() {
    if (!audioContext) {
        // Init Audio Context (Harus dilakukan setelah interaksi user)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioSource = audioContext.createMediaElementSource(bgMusic);
        audioDest = audioContext.createMediaStreamDestination();
        
        // Routing ke Stream Destinasi (Untuk direkam)
        audioSource.connect(audioDest);
        // Routing ke Speaker (Untuk didengar user)
        audioSource.connect(audioContext.destination);
    }
    // Resume context if suspended
    if(audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// --- Recording Logic ---
btnRecord.addEventListener('click', () => {
    if (isRecording) return;
    
    setupAudioRouting();

    // Mulai Countdown
    let count = 4;
    countdownDisplay.innerText = count;
    countdownDisplay.classList.remove('hidden');
    btnRecord.style.pointerEvents = 'none'; // Disable klik

    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownDisplay.innerText = count;
        } else {
            clearInterval(countInterval);
            countdownDisplay.classList.add('hidden');
            startRecording();
        }
    }, 1000);
});

function getBestMimeType() {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    for (let t of types) {
        if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
}

function startRecording() {
    isRecording = true;
    recordedChunks = [];
    btnRecord.classList.add('recording');
    btnRecord.style.pointerEvents = 'auto'; // Re-enable jika ingin manual stop (opsional)

    // 1. Ambil Stream dari Canvas (Ini membawa efek blur)
    const canvasStream = renderCanvas.captureStream(30);
    let finalStream = canvasStream;

    // 2. Gabungkan dengan Audio Stream dari file mp3
    try {
        const audioTrack = audioDest.stream.getAudioTracks()[0];
        if (audioTrack) {
            finalStream = new MediaStream([
                canvasStream.getVideoTracks()[0], 
                audioTrack
            ]);
        }
    } catch(e) {
        console.warn("Gagal menggabungkan audio, merekam video saja.", e);
    }

    // 3. Konfigurasi MediaRecorder
    mediaRecorder = new MediaRecorder(finalStream, { mimeType: getBestMimeType() });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = finalizeVideo;

    // 4. Mulai Rekam & Musik berdasarkan Config
    mediaRecorder.start();
    
    setTimeout(() => {
        bgMusic.currentTime = AUDIO_START_OFFSET;
        bgMusic.play().catch(e => console.log("Lagu gagal diputar, pastikan file ada di assets/audio/music.mp3", e));
    }, AUDIO_START_DELAY * 1000);

    // 5. UI Timer & Auto Stop
    timerDisplay.classList.remove('hidden');
    let elapsed = 0;
    timerDisplay.innerText = `00:00`;
    
    recordingInterval = setInterval(() => {
        elapsed++;
        let sec = elapsed < 10 ? `0${elapsed}` : elapsed;
        timerDisplay.innerText = `00:${sec}`;

        if (elapsed >= VIDEO_DURATION) {
            stopRecording();
        }
    }, 1000);
}

function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    clearInterval(recordingInterval);
    
    mediaRecorder.stop(); // memicu mediaRecorder.onstop
    bgMusic.pause();
    bgMusic.currentTime = 0;
    
    btnRecord.classList.remove('recording');
    timerDisplay.classList.add('hidden');
}

function finalizeVideo() {
    // Buat file Blob dari chunk yang direkam
    const blob = new Blob(recordedChunks, { type: getBestMimeType() || 'video/webm' });
    if (finalBlobUrl) URL.revokeObjectURL(finalBlobUrl);
    finalBlobUrl = URL.createObjectURL(blob);

    // Tampilkan di Halaman Hasil
    resultVideo.src = finalBlobUrl;
    showView('result');
}

// --- Result Actions ---
btnDownload.addEventListener('click', () => {
    if (!finalBlobUrl) return;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = finalBlobUrl;
    a.download = `StudioMini_Video_${new Date().getTime()}.webm`; // Fallback ext
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

btnRetake.addEventListener('click', () => {
    // Kembali ke kamera
    showView('camera');
});