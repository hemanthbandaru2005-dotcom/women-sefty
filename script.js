const sosBtn = document.getElementById("sosBtn");
const stopBtn = document.getElementById("stopBtn");
const alertBox = document.getElementById("alertBox");
const callButtons = document.querySelectorAll(".callBtn");

let watchID = null;
let sosActive = false;

// ============ Send SOS ============
function sendSOS(message, lat=null, lon=null) {
  let locationLink = "";
  if (lat && lon) {
    locationLink = `<br><a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank">📍 View Live Location</a>`;
  }
  alertBox.innerHTML += `<div>🚨 ${message}${locationLink}</div>`;
  alertBox.scrollTop = alertBox.scrollHeight;
}

// ============ Start SOS ============
function startLocationTracking(message) {
  if (sosActive) return;
  sosActive = true;

  if (!navigator.geolocation) {
    sendSOS("Location not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    sendSOS(message, pos.coords.latitude, pos.coords.longitude);

    watchID = navigator.geolocation.watchPosition(p => {
      sendSOS("Location Updated", p.coords.latitude, p.coords.longitude);
    });
  });
}

// ============ SOS Button ============
sosBtn.addEventListener("click", () => {
  startLocationTracking("SOS Button Pressed");
  callEmergencyContact(0);
});

// ============ Stop SOS ============
stopBtn.addEventListener("click", () => {
  if (watchID) navigator.geolocation.clearWatch(watchID);
  watchID = null;
  sosActive = false;
  sendSOS("SOS Stopped by User");
});

// ============ Call Contacts ============
function callEmergencyContact(index) {
  if (index >= callButtons.length) return;
  const number = callButtons[index].dataset.number;
  sendSOS(`Calling ${number}`);
  window.location.href = `tel:${number}`;
}

callButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const number = btn.dataset.number;
    sendSOS(`Calling ${number}`);
    window.location.href = `tel:${number}`;
  });
});

// ============ Voice Detection ============
if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";

  recognition.onresult = e => {
    const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
    if (text.includes("help")) {
      startLocationTracking("HELP detected by voice");
      callEmergencyContact(0);
    }
  };
  recognition.start();
}

// ============ Shake Detection ============
let lastShake = 0;
window.addEventListener("devicemotion", e => {
  const a = e.accelerationIncludingGravity;
  const mag = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);

  if (mag > 25 && Date.now() - lastShake > 3000) {
    lastShake = Date.now();
    startLocationTracking("Phone shaken – Emergency");
    callEmergencyContact(0);
  }
});
