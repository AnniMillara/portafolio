/* js/main.js — Bootstrap de la aplicación */
document.addEventListener("DOMContentLoaded", () => {
    window.AudioManager?.init();
    window.EffectsManager?.init();
    window.SecretWords?.init();
    window.Stars?.init();
    window.EffectsExtra?.init();
    window.Interactions?.init();
    window.Bug?.init();

    // Botón de música del efecto "super"
    const musicToggle = document.getElementById("music-toggle");
    const specialMusic = document.getElementById("special-music");
    if (musicToggle && specialMusic) {
        let musicPlaying = false;
        musicToggle.addEventListener("click", () => {
            if (musicPlaying) {
                specialMusic.pause();
                musicPlaying = false;
                musicToggle.textContent = "♪ Reanudar música";
            } else {
                specialMusic.play().then(() => {
                    musicPlaying = true;
                    musicToggle.textContent = "⏸ Pausar música";
                }).catch(() => {
                    musicToggle.textContent = "♪ Activar música";
                });
            }
        });
    }
});