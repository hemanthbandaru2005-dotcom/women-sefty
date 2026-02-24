const sosBtn = document.getElementById("sosBtn");
const stopBtn = document.getElementById("stopBtn");
const alertBox = document.getElementById("alertBox");
const callButtons = document.querySelectorAll(".callBtn");
const siren = document.getElementById("siren");

let watchID = null;
let sosActive = false;

// -------- Send Alert --------
function sendSOS(message, lat=null, lon=null) {
  let locationLink = "";
  if (lat !== null && lon !== null) {
    locationLink = `<br><a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank">📍 View Location</a>`;
  }
  alertBox.innerHTML += `<div>🚨 ${message}${locationLink}</div>`;
  alertBox.scrollTop = alertBox.scrollHeight;
}

// -------- Start Siren --------
function startSiren() {
  siren.loop = true;
  siren.play();
}

// -------- Stop Siren --------
function stopSiren() {
  siren.pause();
  siren.currentTime = 0;
}

// -------- Start Location --------
function startLocationTracking(message) {
  if (sosActive) return;
  sosActive = true;

  sosBtn.classList.add("active");
  startSiren();

  if (!navigator.geolocation) {
    sendSOS("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      sendSOS(message, lat, lon);
      callEmergencyContact(0);

      watchID = navigator.geolocation.watchPosition(
        pos => {
          sendSOS("Live Location Update",
            pos.coords.latitude,
            pos.coords.longitude
          );
        },
        () => sendSOS("Location tracking error"),
        { enableHighAccuracy: true }
      );
    },
    () => sendSOS("Location permission denied"),
    { enableHighAccuracy: true }
  );
}

// -------- Stop SOS --------
stopBtn.addEventListener("click", () => {
  if (watchID) navigator.geolocation.clearWatch(watchID);
  watchID = null;
  sosActive = false;
  sosBtn.classList.remove("active");
  stopSiren();
  sendSOS("SOS Stopped by User");
});

// -------- SOS Button --------
sosBtn.addEventListener("click", () => {
  startLocationTracking("SOS Button Pressed");
});

// -------- Call Contacts --------
function callEmergencyContact(index) {
  if (index >= callButtons.length) return;
  const number = callButtons[index].dataset.number;
  window.location.href = `tel:${number}`;
}

callButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const number = btn.dataset.number;
    window.location.href = `tel:${number}`;
  });
});

// -------- Voice Detection --------
if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";

  recognition.onresult = event => {
    const text =
      event.results[event.results.length - 1][0].transcript.toLowerCase();
    if (text.includes("help")) {
      startLocationTracking("HELP detected by voice");
    }
  };

  recognition.onend = () => recognition.start();
  recognition.start();
}

// -------- Shake Detection --------
let lastShake = 0;
window.addEventListener("devicemotion", e => {
  const a = e.accelerationIncludingGravity;
  if (!a) return;

  const mag = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);

  if (mag > 30 && Date.now() - lastShake > 5000) {
    lastShake = Date.now();
    startLocationTracking("Phone shaken – Emergency");
  }
});

// -------- Triple Tap Detection --------
let tapCount = 0;
let tapTimer;

document.addEventListener("click", () => {
  tapCount++;

  if (tapCount === 3) {
    startLocationTracking("Triple Tap Emergency Activated");
    tapCount = 0;
  }

  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => {
    tapCount = 0;
  }, 2000);
});
