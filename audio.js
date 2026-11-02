// Sound begins after the player starts the game; the preference applies to music and effects.
const sound = (() => {
  const preferenceKey = "scam-shift-sound";
  let enabled = true;
  let started = false;
  let storageWarning = false;
  const playbackErrors = new Set();

  try {
    enabled = localStorage.getItem(preferenceKey) !== "off";
  } catch (error) {
    storageWarning = true;
    console.warn("Could not read the sound preference:", error);
  }

  const music = new Audio("assets/audio/asteroids.mp3");
  music.loop = true;
  music.preload = "none";
  music.volume = 0.1;

  const effects = {
    select: new Audio("assets/audio/select_001.mp3"),
    call: new Audio("assets/audio/click_001.mp3"),
    arrival: new Audio("assets/audio/question_001.mp3"),
    correct: new Audio("assets/audio/confirmation_001.mp3"),
    incorrect: new Audio("assets/audio/error_001.mp3"),
  };
  Object.values(effects).forEach((clip) => {
    clip.preload = "auto";
    clip.volume = 0.3;
  });
  // The result clips are brief, so make them stand out from the music.
  effects.correct.volume = 0.5;
  effects.incorrect.volume = 0.8;

  function updateStatus() {
    const message = playbackErrors.size
      ? "Sound couldn't play. Try turning it off and on."
      : storageWarning ? "Sound preference can't be saved in this browser." : "";
    document.querySelectorAll(".audio-status").forEach((node) => { node.textContent = message; });
  }

  function updateButtons() {
    document.querySelectorAll(".sound-toggle").forEach((button) => {
      button.textContent = `SOUND ${enabled ? "ON" : "OFF"}`;
      button.setAttribute("aria-pressed", String(enabled));
    });
  }

  function play(clip, name, restart = false) {
    if (!enabled || document.hidden) return;
    if (restart) clip.currentTime = 0;
    const pending = clip.play();
    if (pending) {
      pending.then(() => {
        playbackErrors.delete(name);
        updateStatus();
      }).catch((error) => {
        if (!enabled || document.hidden || error.name === "AbortError") return;
        playbackErrors.add(name);
        console.warn(`Could not play ${name}:`, error);
        updateStatus();
      });
    }
  }

  function pauseAll() {
    music.pause();
    Object.values(effects).forEach((clip) => clip.pause());
  }

  function toggle() {
    enabled = !enabled;
    try {
      localStorage.setItem(preferenceKey, enabled ? "on" : "off");
    } catch (error) {
      storageWarning = true;
      console.warn("Could not save the sound preference:", error);
    }

    if (enabled) {
      if (started) play(music, "music");
      play(effects.select, "select", true);
    } else {
      pauseAll();
      playbackErrors.clear();
    }
    updateButtons();
    updateStatus();
  }

  document.querySelectorAll(".sound-toggle").forEach((button) => {
    button.addEventListener("click", toggle);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAll();
    else if (started && enabled) play(music, "music");
  });
  updateButtons();
  updateStatus();

  return {
    start() {
      started = true;
      if (music.paused) play(music, "music");
    },
    effect(name) {
      if (!effects[name]) throw new Error(`Unknown sound effect: ${name}`);
      play(effects[name], name, true);
    },
  };
})();
