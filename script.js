// استيراد المكتبات
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBm5C...", // ⚠️ حط مفتاحك الكامل هنا
  authDomain: "love-6f927.firebaseapp.com",
  databaseURL: "https://love-6f927-default-rtdb.firebaseio.com",
  projectId: "love-6f927",
  storageBucket: "love-6f927.appspot.com",
  messagingSenderId: "986690537911",
  appId: "1:986690537911:web:4d5f980f39090249250032",
  measurementId: "G-FVMS8SEGGF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);
const messagesRef = ref(db, "messages");
const provider = new GoogleAuthProvider();

// العناصر من HTML
const loginScreen = document.getElementById("login-screen");
const chatContainer = document.getElementById("main-chat");
const googleLoginBtn = document.getElementById("google-login-btn");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = null;

// 1. مراقبة حالة الدخول
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginScreen.style.display = "none";
    chatContainer.style.display = "flex";
  } else {
    currentUser = null;
    loginScreen.style.display = "flex";
    chatContainer.style.display = "none";
  }
});

// 2. زر الدخول بجوجل
googleLoginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .catch((error) => {
      console.error("Error:", error);
      alert("حدث خطأ في الدخول!");
    });
});

// 3. زر الخروج
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// تنسيق الوقت
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeString = `${hours}:${minutes} ${ampm}`;

  const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();
  
  if (isToday) return timeString;
  
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} ${timeString}`;
}

// إرسال رسالة
function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  
  if (message && currentUser) {
    push(messagesRef, { 
        text: message, 
        timestamp: Date.now(),
        uid: currentUser.uid,
        name: currentUser.displayName,
        photo: currentUser.photoURL
    });
    input.value = "";
  }
}

// إرسال صورة
function sendImage(file) {
  if (!file || !currentUser) return;
  const fileRef = storageRef(storage, `images/${file.name}_${Date.now()}`);
  uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref))
    .then(url => {
      push(messagesRef, { 
          imageUrl: url, 
          timestamp: Date.now(), 
          uid: currentUser.uid,
          name: currentUser.displayName,
          photo: currentUser.photoURL
      });
    });
}

// استقبال وعرض الرسائل
onChildAdded(messagesRef, snapshot => {
  const chatBox = document.getElementById("chat-box");
  const data = snapshot.val();
  
  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper");

  const isMe = currentUser && data.uid === currentUser.uid;
  if (isMe) wrapper.classList.add("sent-wrapper");

  // صورة البروفايل
  const avatarUrl = data.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  const avatar = `<img src="${avatarUrl}" class="user-avatar" alt="User">`;

  // محتوى الرسالة
  const msgContent = document.createElement("div");
  msgContent.classList.add("message", isMe ? "sent" : "received");

  const timeDisplay = formatTimestamp(data.timestamp);
  
  let nameHtml = "";
  if (!isMe) nameHtml = `<span class="sender-name">${data.name}</span>`;

  let bodyHtml = "";
  if (data.text) {
    bodyHtml = `<p>${data.text}</p>`;
  } else if (data.imageUrl) {
    bodyHtml = `<img src="${data.imageUrl}" style="max-width:100%; border-radius:10px;">`;
  }

  msgContent.innerHTML = `${nameHtml}${bodyHtml}<span class="time">${timeDisplay}</span>`;

  // ترتيب العناصر (صورة + رسالة)
  if (isMe) {
      wrapper.innerHTML = `${msgContent.outerHTML} ${avatar}`;
  } else {
      wrapper.innerHTML = `${avatar} ${msgContent.outerHTML}`;
  }

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// الأحداث
document.addEventListener("DOMContentLoaded", () => {
  const ball = document.getElementById("ball");
  const body = document.body;

  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
  }

  ball.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
  });

  document.getElementById("send-btn").addEventListener("click", sendMessage);
  document.getElementById("message-input").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });
  document.getElementById("file-input").addEventListener("change", e => {
    sendImage(e.target.files[0]);
  });
});
