class HIITTimer {
  constructor() {
    // Timer state
    this.warmupTime = 0;
    this.workTime = 0;
    this.restTime = 0;
    this.totalCycles = 0;
    this.currentCycle = 0;
    this.currentPhase = "warmup"; // 'warmup', 'work', 'rest'
    this.timeLeft = 0;
    this.timer = null;
    this.isRunning = false;
    this.isPaused = false;

    // Audio elements
    this.workSound = new Audio(
      "data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA==",
    );
    this.restSound = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiDQQgZaLvt559nDQckWqDn8750EwgQSobZ+cuJNw0HLmG09/OydxkGE0eQ4f7foF4OCiBOhOL//7d9JwoUNnTR//+Xax4GI0V26v//zYpFDRUlU5Xw//3JejcJB1AsgNb//uZ0QA0F",
    );
    this.countdownSound = new Audio(
      "data:audio/wav;base64,UklGRnoFAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoFAAB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4",
    );

    // DOM elements
    this.startBtn = document.getElementById("startBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.resumeBtn = document.getElementById("resumeBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.phaseDisplay = document.getElementById("phase");
    this.timeLeftDisplay = document.getElementById("timeLeft");
    this.cycleCountDisplay = document.getElementById("cycleCount");

    // Event listeners
    this.startBtn.addEventListener("click", () => this.startTimer());
    this.pauseBtn.addEventListener("click", () => this.pauseTimer());
    this.resumeBtn.addEventListener("click", () => this.resumeTimer());
    this.resetBtn.addEventListener("click", () => this.resetTimer());

    // Initialize keyboard shortcuts
    this.initializeKeyboardShortcuts();
  }

  initializeKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case " ": // Space bar
          if (!this.isRunning) {
            this.startTimer();
          } else if (!this.isPaused) {
            this.pauseTimer();
          } else {
            this.resumeTimer();
          }
          e.preventDefault();
          break;
        case "r":
          this.resetTimer();
          e.preventDefault();
          break;
      }
    });
  }

  getTimeInSeconds(type) {
    const minutes = parseInt(document.getElementById(`${type}Min`).value) || 0;
    const seconds = parseInt(document.getElementById(`${type}Sec`).value) || 0;
    return minutes * 60 + seconds;
  }

  validateInputs() {
    if (this.workTime <= 0 || this.restTime <= 0 || this.totalCycles <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Please enter valid positive numbers for all fields.",
      });
      return false;
    }
    return true;
  }

  startTimer() {
    if (this.isRunning) return;

    // Get input values and convert to seconds
    this.warmupTime = this.getTimeInSeconds("warmup");
    this.workTime = this.getTimeInSeconds("work");
    this.restTime = this.getTimeInSeconds("rest");
    this.totalCycles = parseInt(document.getElementById("cycles").value);

    if (!this.validateInputs()) return;

    this.isRunning = true;
    this.currentCycle = 0;
    this.currentPhase = "warmup";
    this.timeLeft = this.warmupTime;

    this.updateButtonStates("running");
    this.updateDisplay();
    this.runTimer();
  }

  pauseTimer() {
    if (!this.isRunning || this.isPaused) return;

    clearInterval(this.timer);
    this.isPaused = true;
    this.updateButtonStates("paused");
  }

  resumeTimer() {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;
    this.updateButtonStates("running");
    this.runTimer();
  }

  resetTimer() {
    clearInterval(this.timer);
    this.isRunning = false;
    this.isPaused = false;
    this.currentCycle = 0;
    this.currentPhase = "warmup";
    this.timeLeft = 0;

    this.updateButtonStates("initial");
    this.resetDisplay();
  }

  runTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;

      // Play countdown sound for last 3 seconds of each phase
      if (this.timeLeft <= 3 && this.timeLeft > 0) {
        this.countdownSound.play();
      }

      this.updateDisplay();

      if (this.timeLeft === 0) {
        this.handlePhaseComplete();
      }
    }, 1000);
  }

  handlePhaseComplete() {
    if (this.currentPhase === "warmup") {
      this.currentPhase = "work";
      this.currentCycle = 1;
      this.timeLeft = this.workTime;
      this.workSound.play();
    } else if (this.currentPhase === "work") {
      if (this.currentCycle === this.totalCycles) {
        this.completeWorkout();
        return;
      }
      this.currentPhase = "rest";
      this.timeLeft = this.restTime;
      this.restSound.play();
    } else {
      // rest phase
      this.currentCycle++;
      this.currentPhase = "work";
      this.timeLeft = this.workTime;
      this.workSound.play();
    }
    this.updateDisplay();
  }

  updateButtonStates(state) {
    switch (state) {
      case "initial":
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.resumeBtn.disabled = true;
        this.resetBtn.disabled = true;
        break;
      case "running":
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.resumeBtn.disabled = true;
        this.resetBtn.disabled = false;
        break;
      case "paused":
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = true;
        this.resumeBtn.disabled = false;
        this.resetBtn.disabled = false;
        break;
    }
  }

  updateDisplay() {
    let phaseText = "Get Ready!";
    let phaseClass = "";

    switch (this.currentPhase) {
      case "warmup":
        phaseText = "WARM UP!";
        phaseClass = "warmup-phase";
        break;
      case "work":
        phaseText = "WORK!";
        phaseClass = "work-phase";
        break;
      case "rest":
        phaseText = "REST";
        phaseClass = "rest-phase";
        break;
    }

    this.phaseDisplay.textContent = phaseText;
    this.phaseDisplay.className = phaseClass;
    this.timeLeftDisplay.textContent = this.formatTime(this.timeLeft);
    this.cycleCountDisplay.textContent = `Cycle: ${this.currentCycle} / ${this.totalCycles}`;
  }

  completeWorkout() {
    clearInterval(this.timer);
    this.isRunning = false;
    this.isPaused = false;
    this.workSound.play();

    this.updateButtonStates("initial");

    Swal.fire({
      icon: "success",
      title: "Workout Complete!",
      text: "Great job!",
    });

    this.resetDisplay();
  }

  resetDisplay() {
    this.phaseDisplay.textContent = "Get Ready!";
    this.phaseDisplay.className = "";
    this.timeLeftDisplay.textContent = "00:00";
    this.cycleCountDisplay.textContent = "Cycle: 0 / 0";

    // Reset input fields to their default values
    document.getElementById("warmupMin").value = "0";
    document.getElementById("warmupSec").value = "10";
    document.getElementById("workMin").value = "0";
    document.getElementById("workSec").value = "30";
    document.getElementById("restMin").value = "0";
    document.getElementById("restSec").value = "10";
    document.getElementById("cycles").value = "5";
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

// Initialize the timer when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new HIITTimer();
});
