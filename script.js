import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, remove, onChildRemoved, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// ⚠️⚠️ استبدل النقاط بمفتاحك
const firebaseConfig = {
  apiKey: "AIzaSyBm5C...", 
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

// المراجع
const messagesRef = ref(db, "messages");
const typingRef = ref(db, "typing");
const presenceRef = ref(db, "presence"); // لحالة الاتصال
const connectedRef = ref(db, ".info/connected");

const notificationSound = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_8b472d845c.mp3");

let currentUser = localStorage.getItem("chat_username") || "";
let userId = localStorage.getItem("chat_user_id");
let typingTimeout = null;
let replyData = null; // لتخزين بيانات الرد
let lastMessageDate = null; // لتتبع فواصل التواريخ
let mediaRecorder = null;
let audioChunks = [];

if (!userId) {
  userId = "user_" + Date.now();
  localStorage.setItem("chat_user_id", userId);
}

// === 1. الدخول والحضور ===
const loginScreen = document.getElementById("login-screen");
const joinBtn = document.getElementById("join-btn");

if (currentUser) {
  loginScreen.style.display = "none";
  setupPresence();
}

joinBtn.addEventListener("click", () => {
  const val = document.getElementById("username-input").value.trim();
  if (val) {
    currentUser = val;
    localStorage.setItem("chat_username", val);
    loginScreen.style.display = "none";
    setupPresence();
  }
});

// نظام الأونلاين (Connected)
function setupPresence() {
  const userStatusRef = ref(db, `presence/${userId}`);
  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      set(userStatusRef, { name: currentUser, online: true });
      onDisconnect(userStatusRef).remove(); // حذف الحالة عند الخروج
    }
  });
}

// === 2. أدوات مساعدة ===
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

function formatTime(ts) { return new Date(ts).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'}); }

function getDateString(ts) {
  const d = new Date(ts);
  const today = new Date();
  if(d.toDateString() === today.toDateString()) return "اليوم";
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if(d.toDateString() === yesterday.toDateString()) return "أمس";
  return d.toLocaleDateString('ar-EG');
}

// === 3. الردود والإيموجي ===
const replyPreview = document.getElementById("reply-preview");
const messageInput = document.getElementById("message-input");

function setReply(id, text, sender) {
  replyData = { id, text, sender };
  document.getElementById("reply-text-preview").innerText = text;
  replyPreview.classList.remove("hidden");
  messageInput.focus();
}

document.getElementById("close-reply").addEventListener("click", () => {
  replyData = null;
  replyPreview.classList.add("hidden");
});

// إيموجي
const emojiBtn = document.getElementById("emoji-btn");
const emojiPicker = document.getElementById("emoji-picker");
emojiBtn.addEventListener("click", () => emojiPicker.classList.toggle("hidden"));
emojiPicker.querySelectorAll("span").forEach(span => {
  span.addEventListener("click", () => {
    messageInput.value += span.innerText;
    updateInputState();
  });
});

// === 4. الإرسال (نص، صور، صوت) ===
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");

messageInput.addEventListener("input", updateInputState);

function updateInputState() {
  if(messageInput.value.trim()) {
    sendBtn.classList.remove("hidden");
    micBtn.classList.add("hidden");
    // إرسال "يكتب..."
    set(ref(db, `typing/${userId}`), { name: currentUser });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => remove(ref(db, `typing/${userId}`)), 1500);
  } else {
    sendBtn.classList.add("hidden");
    micBtn.classList.remove("hidden");
  }
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const payload = {
    senderId: userId, senderName: currentUser,
    text: text, type: "text", timestamp: Date.now()
  };

  if (replyData) {
    payload.replyTo = replyData; // إرفاق الرد
    replyData = null;
    replyPreview.classList.add("hidden");
  }

  push(messagesRef, payload);
  messageInput.value = "";
  updateInputState();
}

// تسجيل الصوت
micBtn.addEventListener("click", toggleRecording);

async function toggleRecording() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        uploadAudio(audioBlob);
      };
      
      mediaRecorder.start();
      micBtn.classList.add("recording");
    } catch(err) { alert("يرجى السماح بالميكروفون"); }
  } else {
    mediaRecorder.stop();
    micBtn.classList.remove("recording");
  }
}

function uploadAudio(blob) {
  const uniqueName = Date.now() + ".mp3";
  const fileRef = storageRef(storage, `audio/${uniqueName}`);
  uploadBytes(fileRef, blob).then(snap => getDownloadURL(snap.ref)).then(url => {
    push(messagesRef, {
      senderId: userId, senderName: currentUser,
      audioUrl: url, type: "audio", timestamp: Date.now()
    });
  });
}

// === 5. استقبال الرسائل ===
const chatBox = document.getElementById("chat-box");

onChildAdded(messagesRef, snapshot => {
  const data = snapshot.val();
  const key = snapshot.key;
  const isMe = data.senderId === userId;

  // 1. فاصل التاريخ
  const msgDate = getDateString(data.timestamp);
  if (msgDate !== lastMessageDate) {
    const dateDiv = document.createElement("div");
    dateDiv.className = "date-separator";
    dateDiv.innerText = msgDate;
    chatBox.appendChild(dateDiv);
    lastMessageDate = msgDate;
  }

  // 2. الصوت
  if (!isMe && (Date.now() - data.timestamp) < 10000) notificationSound.play().catch(()=>{});

  const row = document.createElement("div");
  row.className = `msg-row ${isMe ? "sent" : "received"}`;
  row.id = `msg-${key}`;

  // الأفاتار
  if (!isMe) {
    const avDiv = document.createElement("div");
    avDiv.className = "avatar-container";
    avDiv.innerHTML = `<div class="avatar" style="background:${getAvatarColor(data.senderName)}">${data.senderName.charAt(0)}</div><div class="online-dot" id="status-${data.senderId}"></div>`;
    row.appendChild(avDiv);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  // حدث الرد (سحب/نقر)
  bubble.addEventListener("dblclick", () => {
      if(isMe) {
          if(confirm("حذف؟")) remove(ref(db, `messages/${key}`));
      } else {
          setReply(key, data.text || "رسالة صوتية/صورة", data.senderName);
      }
  });

  let html = "";
  if(!isMe) html += `<span class="sender-name" style="color:${getAvatarColor(data.senderName)}">${data.senderName}</span>`;
  
  // عرض الرد المقتبس
  if(data.replyTo) {
    html += `<div class="reply-quote"><span class="reply-sender">${data.replyTo.sender}</span><span class="reply-text">${data.replyTo.text}</span></div>`;
  }

  if (data.type === "text") html += data.text;
  else if (data.type === "image") html += `<img src="${data.imageUrl}">`;
  else if (data.type === "audio") html += `<audio controls src="${data.audioUrl}"></audio>`;

  html += `<span class="time">${formatTime(data.timestamp)}</span>`;
  bubble.innerHTML = html;

  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
});

// تحديث حالة الأونلاين للآخرين
onValue(presenceRef, snap => {
  const users = snap.val() || {};
  document.querySelectorAll(".online-dot").forEach(dot => dot.style.display = "none");
  Object.keys(users).forEach(uid => {
    if(users[uid].online) {
       const dots = document.querySelectorAll(`#status-${uid}`);
       dots.forEach(d => d.style.display = "block");
    }
  });
});

// أحداث عامة
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("keypress", e => { if(e.key==="Enter") sendMessage() });
document.getElementById("file-input").addEventListener("change", e => {
    if(e.target.files[0]) {
        const uniqueName = Date.now() + '-' + e.target.files[0].name;
        const refImg = storageRef(storage, `images/${uniqueName}`);
        uploadBytes(refImg, e.target.files[0]).then(s => getDownloadURL(s.ref)).then(url => {
            push(messagesRef, { senderId: userId, senderName: currentUser, imageUrl: url, type: "image", timestamp: Date.now() });
        });
    }
});
document.getElementById("theme-toggle").addEventListener("click", () => document.body.classList.toggle("dark-mode"));
