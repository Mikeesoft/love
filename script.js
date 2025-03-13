// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// تهيئة Firebase
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

// تحويل التوقيت إلى صيغة مفهومة
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

// إرسال الرسائل النصية
function sendMessage() {
  let messageInput = document.getElementById("message-input");
  let message = messageInput.value.trim();
  
  if (message) {
    push(messagesRef, { text: message, timestamp: Date.now() });
    messageInput.value = "";
  }
}

// إرسال الصور
function sendImage(file) {
  if (!file) return;
  
  const fileRef = storageRef(storage, `images/${file.name}`);
  uploadBytes(fileRef, file).then(snapshot => {
    return getDownloadURL(snapshot.ref);
  }).then(url => {
    push(messagesRef, { imageUrl: url, timestamp: Date.now() });
  }).catch(error => console.error("❌ خطأ في تحميل الصورة:", error));
}

// استقبال الرسائل والصور مع تحديد الاتجاه
onChildAdded(messagesRef, (snapshot) => {
    let chatBox = document.getElementById("chat-box");
    let messageData = snapshot.val();
    let messageElement = document.createElement("div");

    // تحديد اتجاه الرسالة بناءً على المرسل
    let messageClass = messageData.sender === "me" ? "sent" : "received";
    messageElement.classList.add("message", messageClass);

    let formattedTime = formatTimestamp(messageData.timestamp);

    if (messageData.text) {
        messageElement.innerHTML = `<p>${messageData.text}<br><span class="time">${formattedTime}</span></p>`;
    } else if (messageData.imageUrl) {
        messageElement.innerHTML = `<img src="${messageData.imageUrl}" alt="📷 صورة مرسلة"><br><span class="time">${formattedTime}</span>`;
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// التعامل مع الإدخال
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("keypress", function(event) {
  if (event.key === "Enter") sendMessage();
});

// إرسال الصور عند اختيارها
document.getElementById("file-input").addEventListener("change", function(event) {
  sendImage(event.target.files[0]);
});