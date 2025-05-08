// Firebase - تهيئة
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBm5C...",
  authDomain: "love-6f927.firebaseapp.com",
  databaseURL: "https://love-6f927-default-rtdb.firebaseio.com",
  projectId: "love-6f927",
  storageBucket: "love-6f927.appspot.com",
  messagingSenderId: "986690537911",
  appId: "1:986690537911:web:4d5f980f39090249250032",
  measurementId: "G-FVMS8SEGGF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const messagesRef = ref(db, "messages");

// تحويل الوقت لصيغة واضحة
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

// إرسال رسالة نصية
function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  if (message) {
    push(messagesRef, { text: message, timestamp: Date.now() });
    input.value = "";
  }
}

// إرسال صورة
function sendImage(file) {
  if (!file) return;
  const fileRef = storageRef(storage, `images/${file.name}`);
  uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref))
    .then(url => {
      push(messagesRef, { imageUrl: url, timestamp: Date.now() });
    })
    .catch(err => console.error("❌ خطأ في تحميل الصورة:", err));
}

// استقبال الرسائل
onChildAdded(messagesRef, snapshot => {
  const chatBox = document.getElementById("chat-box");
  const data = snapshot.val();
  const msg = document.createElement("div");

  const messageClass = data.sender === "me" ? "sent" : "received";
  msg.classList.add("message", messageClass);

  const time = formatTimestamp(data.timestamp);

  if (data.text) {
    msg.innerHTML = `<p>${data.text}<br><span class="time">${time}</span></p>`;
  } else if (data.imageUrl) {
    msg.innerHTML = `<img src="${data.imageUrl}" alt="📷 صورة"><br><span class="time">${time}</span>`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// الوضع الليلي
document.addEventListener("DOMContentLoaded", () => {
  const ball = document.getElementById("ball");
  const body = document.body;

  // حفظ واسترجاع الوضع من التخزين المحلي
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    ball.style.left = "40px";
  }

  ball.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    if (body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
      ball.style.left = "40px";
    } else {
      localStorage.setItem("theme", "light");
      ball.style.left = "5px";
    }
  });

  // التعامل مع الرسائل
  document.getElementById("send-btn").addEventListener("click", sendMessage);
  document.getElementById("message-input").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });
  document.getElementById("file-input").addEventListener("change", e => {
    sendImage(e.target.files[0]);
  });
});