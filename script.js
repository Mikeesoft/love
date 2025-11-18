import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// ⚠️ ضع إعداداتك هنا مرة أخرى
const firebaseConfig = {
  apiKey: "AIzaSyBm5C...", // تأكد من وضع مفتاحك
  authDomain: "love-6f927.firebaseapp.com",
  databaseURL: "https://love-6f927-default-rtdb.firebaseio.com",
  projectId: "love-6f927",
  storageBucket: "love-6f927.appspot.com",
  messagingSenderId: "986690537911",
  appId: "1:986690537911:web:4d5f980f39090249250032"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const messagesRef = ref(db, "messages");

// --- إدارة المستخدم ---
let currentUser = localStorage.getItem("chat_username") || "";
let userId = localStorage.getItem("chat_user_id");

if (!userId) {
  userId = "uid_" + Date.now();
  localStorage.setItem("chat_user_id", userId);
}

// التحقق من الدخول
const loginScreen = document.getElementById("login-screen");
const joinBtn = document.getElementById("join-btn");
const usernameInput = document.getElementById("username-input");

if (currentUser) {
  loginScreen.style.display = "none"; // المستخدم مسجل سابقاً
}

joinBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (name) {
    currentUser = name;
    localStorage.setItem("chat_username", name);
    loginScreen.style.display = "none";
  }
});

// --- الدوال ---
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function sendMessage() {
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (text && currentUser) {
    push(messagesRef, {
      senderId: userId,
      senderName: currentUser, // نرسل الاسم الآن
      text: text,
      type: "text",
      timestamp: Date.now()
    });
    input.value = "";
  }
}

function sendImage(file) {
  if (!file || !currentUser) return;
  const uniqueName = Date.now() + '-' + file.name;
  const fileRef = storageRef(storage, `images/${uniqueName}`);
  
  uploadBytes(fileRef, file).then(snap => getDownloadURL(snap.ref)).then(url => {
    push(messagesRef, {
      senderId: userId,
      senderName: currentUser,
      imageUrl: url,
      type: "image",
      timestamp: Date.now()
    });
  });
}

// --- عرض الرسائل ---
onChildAdded(messagesRef, snapshot => {
  const data = snapshot.val();
  const chatBox = document.getElementById("chat-box");
  
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  
  // تحديد الكلاس (مرسل أم مستقبل)
  const isMe = data.senderId === userId;
  msgDiv.classList.add(isMe ? "sent" : "received");

  const time = formatTime(data.timestamp);
  
  // بناء محتوى الرسالة (اسم المرسل يظهر فقط للآخرين)
  let htmlContent = "";
  if (!isMe) {
    htmlContent += `<span class="sender-name">${data.senderName}</span>`;
  }

  if (data.type === "text") {
    htmlContent += `${data.text}`;
  } else if (data.type === "image") {
    htmlContent += `<img src="${data.imageUrl}" style="max-width:100%; border-radius:10px;">`;
  }

  htmlContent += `<span class="time">${time}</span>`;
  msgDiv.innerHTML = htmlContent;

  chatBox.appendChild(msgDiv);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
});

// --- تهيئة الأحداث ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("send-btn").addEventListener("click", sendMessage);
  document.getElementById("message-input").addEventListener("keypress", e => { if(e.key==="Enter") sendMessage() });
  
  const fileInp = document.getElementById("file-input");
  fileInp.addEventListener("change", () => sendImage(fileInp.files[0]));

  // الوضع الليلي
  const btn = document.getElementById("theme-toggle");
  if(localStorage.getItem("theme")==="dark") document.body.classList.add("dark-mode");
  
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  });
});
