// ==================================================
// SECRET CONFIG — PENGATURAN KONTEN & TARGET RAHASIA
// ==================================================

const SECRET_CONFIG = {
    // 1. Syarat Perfect Score untuk 3 Mini-Game
    targets: {
        snake: 120,        // Game 1: Game Ular Retro (Skor >= 120)
        tower: 28,         // Game 2: Tower Survival (Lantai >= 28)
        neonBreaker: 800   // Game 3: Neon Breaker (Skor >= 800)
    },

    // 2. Pengaturan Musik Latar (Digunakan pada Phase 3 - 6)
    audio: {
        // Isi dengan nama file mp3 Anda di folder proyek (contoh: "lagu_rahasia.mp3")
        // Biarkan kosong ("") jika ingin menggunakan melodi lembut bawaan sistem
        secretBgmSrc: "",
        volume: 0.45
    },

    // 3. Pengaturan Integrasi The Museum of Us (Digunakan pada Phase 5)
    museum: {
        url: "index_2.html",
        requiredPhotosCount: 7 // Sebagian dari 14 foto unik yang wajib diklik
    },

    // 4. Template Surat Personal — SCENE 03 (Digunakan pada Phase 4)
    letter: {
        badge: "PRIVATE MESSAGE // FOR YOU",
        title: "Before You Continue...",
        greeting: "[ISI SALAM PEMBUKA DI SINI]",
        story: "[ISI CERITA ATAU ALASAN MEMBUAT WEBSITE INI DI SINI]",
        gratitude: "[ISI UCAPAN TERIMA KASIH DI SINI]",
        personalMessage: "[ISI PESAN PERSONAL DI SINI]",
        closing: "[ISI KALIMAT PENUTUP & NAMA PENGIRIM DI SINI]"
    },

    // 5. Placeholder Hadiah Terakhir — SCENE 05 (Digunakan pada Phase 6)
    surprise: {
        subtitle: "A Special Gift Just For You",
        voiceMessage: {
            enabled: false,
            label: "Pesan Suara Khusus Untukmu",
            audioSrc: "" // contoh: "voice_note.mp3"
        },
        shortVideo: {
            enabled: false,
            label: "Video Singkat",
            videoSrc: "" // contoh: "video_kenangan.mp4"
        },
        secondLetter: {
            enabled: true,
            title: "One More Note",
            content: "[ISI SURAT KEDUA ATAU PESAN MASA DEPAN DI SINI]"
        },
        physicalGiftHint: {
            enabled: true,
            title: "Something In The Real World",
            content: "[ISI PETUNJUK HADIAH FISIK DI SINI]"
        }
    }
};