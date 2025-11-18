import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, remove, onChildRemoved, onValue } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// ⚠️⚠️ هام جداً: استبدل النقاط بمفتاحك الخاص وإلا لن يعمل الموقع ⚠️⚠️
const firebaseConfig = {
  apiKey: "AIzaSyBm5C...", // <--- ضع المفتاح الكامل هنا
  authDomain: "love-6f927.firebaseapp.com",
  databaseURL: "https://love-6f927-default-rtdb.firebaseio.com",
  projectId: "love-6f927",
  storageBucket: "love-6f927.appspot.com",
  messagingSenderId: "986690537911",
  appId: "1:986690537911:web:4d5f980f39090249250032"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// المراجع في قاعدة البيانات
const messagesRef = ref(db, "messages");
const typingRef = ref(db, "typing");

// صوت الإشعار
const notificationSound = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_8b472d845c.mp3");

// المتغيرات العامة
let currentUser = localStorage.getItem("chat_username") || "";
let userId = localStorage.getItem("chat_user_id");
let typingTimeout = null;

// إنشاء هوية للمستخدم إذا لم تكن موجودة
if (!userId) {
  userId = "uid_" + Date.now() + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("chat_user_id", userId);
}

// === 1. إدارة تسجيل الدخول ===
const loginScreen = document.getElementById("login-screen");
const joinBtn = document.getElementById("join-btn");
const usernameInput = document.getElementById("username-input");

if (currentUser) {
  loginScreen.style.display = "none";
}

joinBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (name) {
    currentUser = name;
    localStorage.setItem("chat_username", name);
    loginScreen.style.display = "none";
  }
});

// === 2. دوال مساعدة ===

// تحويل الاسم إلى لون (Hex Color)
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

// تنسيق الوقت
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

// === 3. إرسال الرسائل ===
function sendMessage() {
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  
  if (text && currentUser) {
    push(messagesRef, {
      senderId: userId,
      senderName: currentUser,
      text: text,
      type: "text",
      timestamp: Date.now()
    });
    input.value = "";
    input.focus();
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
  }).catch(err => alert("فشل رفع الصورة"));
}

// === 4. استقبال وعرض الرسائل ===
onChildAdded(messagesRef, snapshot => {
  const data = snapshot.val();
  const key = snapshot.key;
  const chatBox = document.getElementById("chat-box");
  
  const isMe = data.senderId === userId;

  // تشغيل صوت إذا كانت رسالة جديدة من شخص آخر
  if (!isMe && (Date.now() - data.timestamp) < 10000) {
    notificationSound.play().catch(()=>{});
  }

  // إنشاء صف الرسالة
  const msgRow = document.createElement("div");
  msgRow.classList.add("msg-row");
  msgRow.classList.add(isMe ? "sent" : "received");
  msgRow.id = `msg-${key}`; // معرف خاص للحذف

  // الأفاتار (فقط للآخرين)
  if (!isMe) {
    const avatar = document.createElement("div");
    avatar.classList.add("avatar");
    avatar.innerText = data.senderName.charAt(0).toUpperCase();
    avatar.style.backgroundColor = getAvatarColor(data.senderName);
    msgRow.appendChild(avatar);
  }

  // الفقاعة
  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");

  // ميزة الحذف: نقر مزدوج
  if (isMe) {
    bubble.title = "انقر مرتين للحذف";
    bubble.addEventListener("dblclick", () => {
      if(confirm("حذف هذه الرسالة؟")) {
        remove(ref(db, `messages/${key}`));
      }
    });
  }

  // المحتوى الداخلي
  let htmlContent = "";
  if (!isMe) {
    htmlContent += `<span class="sender-name" style="color:${getAvatarColor(data.senderName)}">${data.senderName}</span>`;
  }

  if (data.type === "text") {
    htmlContent += `${data.text}`;
  } else if (data.type === "image") {
    htmlContent += `<img src="${data.imageUrl}" loading="lazy">`;
  }

  htmlContent += `<span class="time">${formatTime(data.timestamp)}</span>`;
  bubble.innerHTML = htmlContent;

  msgRow.appendChild(bubble);
  chatBox.appendChild(msgRow);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
});

// === 5. التعامل مع حذف الرسائل ===
onChildRemoved(messagesRef, snapshot => {
  const key = snapshot.key;
  const el = document.getElementById(`msg-${key}`);
  if (el) {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }
});

// === 6. مؤشر "جارِ الكتابة..." ===
const inputField = document.getElementById("message-input");

// إرسال حالتي
inputField.addEventListener("input", () => {
  if (currentUser) {
    set(ref(db, `typing/${userId}`), { name: currentUser });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      remove(ref(db, `typing/${userId}`));
    }, 1500);
  }
});

// استقبال حالات الآخرين
onValue(typingRef, snapshot => {
  const data = snapshot.val();
  const statusDiv = document.querySelector(".typing-status");
  
  if (data) {
    const writers = Object.keys(data).filter(id => id !== userId);
    if (writers.length > 0) {
      const name = data[writers[0]].name;
      statusDiv.innerHTML = `${name} يكتب <span class="typing-indicator"><span></span><span></span><span></span></span>`;
      statusDiv.style.opacity = "1";
    } else {
      statusDiv.style.opacity = "0";
    }
  } else {
    statusDiv.style.opacity = "0";
  }
});

// === 7. الأحداث العامة ===
document.addEventListener("DOMContentLoaded", () => {
  // زر الإرسال
  document.getElementById("send-btn").addEventListener("click", sendMessage);
  
  // زر إنتر للإرسال
  document.getElementById("message-input").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  // رفع الصور
  const fileInp = document.getElementById("file-input");
  fileInp.addEventListener("change", () => sendImage(fileInp.files[0]));

  // الوضع الليلي
  const themeBtn = document.getElementById("theme-toggle");
  if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-mode");
  
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  });
});
