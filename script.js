// Firebase - تهيئة
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// ⚠️⚠️ هام جداً: استبدل النقاط (...) بكود الـ API Key الكامل بتاعك ⚠️⚠️
const firebaseConfig = {
  apiKey: "AIzaSyBm5C...", // كمل الكود هنا
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

// 🔥 1. إنشاء هوية فريدة للمستخدم (عشان نعرف مين بيبعت)
let myId = localStorage.getItem("chat_user_id");
if (!myId) {
  // لو مفيش ID، نعمل واحد جديد عشوائي ونحفظه
  myId = "user_" + Date.now() + Math.floor(Math.random() * 1000);
  localStorage.setItem("chat_user_id", myId);
}

// تحويل الوقت لصيغة واضحة
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// إرسال رسالة نصية
function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  if (message) {
    // بنبعت الـ sender: myId مع الرسالة
    push(messagesRef, { 
        text: message, 
        timestamp: Date.now(),
        sender: myId 
    });
    input.value = "";
  }
}

// إرسال صورة
function sendImage(file) {
  if (!file) return;
  const fileRef = storageRef(storage, `images/${Date.now()}_${file.name}`);
  
  uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref))
    .then(url => {
      push(messagesRef, { 
          imageUrl: url, 
          timestamp: Date.now(),
          sender: myId 
      });
    })
    .catch(err => console.error("❌ خطأ في تحميل الصورة:", err));
}

// استقبال الرسائل وعرضها
onChildAdded(messagesRef, snapshot => {
  const chatBox = document.getElementById("chat-box");
  const data = snapshot.val();
  const msg = document.createElement("div");

  // 🔥 2. المقارنة: لو الـ sender هو الـ myId يبقى الرسالة مني (sent) وإلا تبقى (received)
  const messageClass = data.sender === myId ? "sent" : "received";
  msg.classList.add("message", messageClass);

  const time = formatTimestamp(data.timestamp);

  if (data.text) {
    msg.innerHTML = `<p>${data.text}</p><span class="time">${time}</span>`;
  } else if (data.imageUrl) {
    msg.innerHTML = `<img src="${data.imageUrl}" alt="صورة"><span class="time">${time}</span>`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight; // نزول تلقائي لآخر رسالة
});

// إعدادات الصفحة والوضع الليلي
document.addEventListener("DOMContentLoaded", () => {
  const ball = document.getElementById("ball");
  const body = document.body;

  // استرجاع الوضع المفضل
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    ball.style.left = "40px";
  }

  // زر التبديل
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

  // مستمعات الأحداث (Events)
  document.getElementById("send-btn").addEventListener("click", sendMessage);
  
  document.getElementById("message-input").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  document.getElementById("file-input").addEventListener("change", e => {
    if(confirm("هل تريد إرسال هذه الصورة؟")) {
        sendImage(e.target.files[0]);
    }
  });
});
