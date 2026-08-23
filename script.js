import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// ==========================================
// ⚙️ KONFIGURASI UTAMA
// ==========================================
const VIDEO_DURATION = 15;        
const AUDIO_START_OFFSET = 59.4;    
const AUDIO_START_DELAY = 0;      
const CAMERA_ZOOM = 1.0;          
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
let lastAiCheckTime = 0;

// --- DOWNSAMPLING HACK (Trik Blur Super Ringan) ---
const blurCanvas = document.createElement('canvas');
const blurCtx = blurCanvas.getContext('2d');

// --- Initialize AI Model ---
async function initMediaPipe() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });
        return true;
    } catch (err) {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "CPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
            return true;
        } catch (cpuErr) {
            console.error("AI Error:", cpuErr);
            alert("Gagal memuat model AI.");
            return false;
        }
    }
}

// --- Navigation ---
function showView(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
}

// --- Start Button Logic ---
btnStart.addEventListener('click', async () => {
    btnStart.classList.add('hidden');
    loadingText.classList.remove('hidden');

    if (!handLandmarker) {
        const success = await initMediaPipe();
        if (!success) {
            btnStart.classList.remove('hidden');
            loadingText.classList.add('hidden');
            return;
        }
    }

    try {
        // FIX PORTRAIT: Minta kamera format vertikal (9:16) agar hasil rekaman/download tidak landscape
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: "user", 
                aspectRatio: { ideal: 9 / 16 },
                width: { ideal: 720 },
                height: { ideal: 1280 } 
            },
            audio: false 
        });
        
        rawVideo.srcObject = stream;
        
        rawVideo.onloadedmetadata = () => {
            rawVideo.play();
            
            // KUNCI UKURAN CANVAS KE PORTRAIT HD (720x1280)
            renderCanvas.width = 720;
            renderCanvas.height = 1280;

            // Atur ukuran canvas kecil untuk trik blur super ringan (5% dari ukuran asli)
            blurCanvas.width = renderCanvas.width * 0.05;
            blurCanvas.height = renderCanvas.height * 0.05;
            
            isCameraActive = true;
            requestAnimationFrame(renderLoop);
            showView('camera');
        };
    } catch (err) {
        alert("Tidak dapat mengakses kamera.");
        btnStart.classList.remove('hidden');
        loadingText.classList.add('hidden');
    }
});

function detectPeaceSign(landmarks) {
    if (!landmarks || landmarks.length === 0) return false;
    const hand = landmarks[0];
    return (hand[8].y < hand[6].y) && (hand[12].y < hand[10].y) && 
           (hand[16].y > hand[14].y) && (hand[20].y > hand[18].y);
}

// RUMUS OBJECT-FIT COVER PORTRAIT
function drawVideoCover(context, video, targetW, targetH) {
    const vidW = video.videoWidth;
    const vidH = video.videoHeight;
    const scale = Math.max(targetW / vidW, targetH / vidH);
    const x = (targetW - (vidW * scale)) / 2;
    const y = (targetH - (vidH * scale)) / 2;
    context.drawImage(video, 0, 0, vidW, vidH, x, y, vidW * scale, vidH * scale);
}

// --- Render Loop ---
function renderLoop() {
    if (!isCameraActive) return;

    const now = performance.now();
    
    // AI cek tiap 250ms agar tidak berat
    if (now - lastAiCheckTime > 250) {
        lastAiCheckTime = now;
        if (rawVideo.readyState >= 2) {
            const results = handLandmarker.detectForVideo(rawVideo, now);
            isPeaceSignActive = detectPeaceSign(results.landmarks);
        }
    }

    ctx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);

    if (isPeaceSignActive) {
        // TRIK BLUR RINGAN
        blurCtx.save();
        blurCtx.translate(blurCanvas.width, 0);
        blurCtx.scale(-1, 1); // Mirror
        drawVideoCover(blurCtx, rawVideo, blurCanvas.width, blurCanvas.height);
        blurCtx.restore();

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(blurCanvas, 0, 0, blurCanvas.width, blurCanvas.height, 0, 0, renderCanvas.width, renderCanvas.height);
    } else {
        ctx.save();
        ctx.translate(renderCanvas.width, 0);
        ctx.scale(-1, 1); // Mirror
        drawVideoCover(ctx, rawVideo, renderCanvas.width, renderCanvas.height);
        ctx.restore();
    }

    requestAnimationFrame(renderLoop);
}

// --- Audio Routing ---
function setupAudioRouting() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioSource = audioContext.createMediaElementSource(bgMusic);
        audioDest = audioContext.createMediaStreamDestination();
        audioSource.connect(audioDest);
        audioSource.connect(audioContext.destination);
    }
    if (audioContext.state === 'suspended') audioContext.resume();
}

// --- Recording Logic ---
btnRecord.addEventListener('click', () => {
    if (isRecording) return;
    setupAudioRouting();
    let count = 4;
    countdownDisplay.innerText = count;
    countdownDisplay.classList.remove('hidden');
    btnRecord.style.pointerEvents = 'none';

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
    btnRecord.style.pointerEvents = 'auto';

    const canvasStream = renderCanvas.captureStream(30);
    let finalStream = canvasStream;
    try {
        const audioTrack = audioDest.stream.getAudioTracks()[0];
        if (audioTrack) finalStream = new MediaStream([canvasStream.getVideoTracks()[0], audioTrack]);
    } catch(e) { console.warn("Audio gabung gagal."); }

    mediaRecorder = new MediaRecorder(finalStream, { 
        mimeType: getBestMimeType(),
        videoBitsPerSecond: 4000000 
    });

    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = finalizeVideo;
    mediaRecorder.start();
    
    setTimeout(() => {
        bgMusic.currentTime = AUDIO_START_OFFSET;
        bgMusic.play().catch(e => console.log(e));
    }, AUDIO_START_DELAY * 1000);

    timerDisplay.classList.remove('hidden');
    let elapsed = 0;
    timerDisplay.innerText = `00:00`;
    
    recordingInterval = setInterval(() => {
        elapsed++;
        let sec = elapsed < 10 ? `0${elapsed}` : elapsed;
        timerDisplay.innerText = `00:${sec}`;
        if (elapsed >= VIDEO_DURATION) stopRecording();
    }, 1000);
}

function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    clearInterval(recordingInterval);
    mediaRecorder.stop();
    bgMusic.pause();
    bgMusic.currentTime = 0;
    btnRecord.classList.remove('recording');
    timerDisplay.classList.add('hidden');
}

function finalizeVideo() {
    const blob = new Blob(recordedChunks, { type: getBestMimeType() || 'video/webm' });
    if (finalBlobUrl) URL.revokeObjectURL(finalBlobUrl);
    finalBlobUrl = URL.createObjectURL(blob);
    resultVideo.src = finalBlobUrl;
    showView('result');
}

btnDownload.addEventListener('click', () => {
    if (!finalBlobUrl) return;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = finalBlobUrl;
    a.download = `StudioMini_${new Date().getTime()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

btnRetake.addEventListener('click', () => {
    showView('camera');
});