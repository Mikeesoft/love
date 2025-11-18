// Firebase - تهيئة
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// إعداد Firebase (نفس بياناتك القديمة)
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

// 1. إدارة الهوية والاسم
let myId = localStorage.getItem("chat_user_id");
let myName = localStorage.getItem("chat_username");
const nameModal = document.getElementById("name-modal");

// لو مفيش ID نعمل واحد
if (!myId) {
    myId = "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    localStorage.setItem("chat_user_id", myId);
}

// لو مفيش اسم، نظهر النافذة، ولو فيه نخفيها
if (!myName) {
    nameModal.style.display = "flex";
} else {
    nameModal.style.display = "none";
}

// زر حفظ الاسم
document.getElementById("save-name-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("username-input").value.trim();
    if (nameInput) {
        myName = nameInput;
        localStorage.setItem("chat_username", myName);
        nameModal.style.display = "none";
    } else {
        alert("اكتب اسم عشان نعرفك 😃");
    }
});


// تحويل الوقت
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// إرسال رسالة نصية (تعديل: إضافة الاسم)
function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  if (message && myName) { // لازم يكون فيه اسم
    push(messagesRef, { 
        text: message, 
        timestamp: Date.now(),
        senderId: myId,
        senderName: myName // بنبعت الاسم هنا
    });
    input.value = "";
  }
}

// إرسال صورة (تعديل: إضافة الاسم)
function sendImage(file) {
  if (!file || !myName) return;
  const fileRef = storageRef(storage, `images/${file.name}`);
  uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref))
    .then(url => {
      push(messagesRef, { 
          imageUrl: url, 
          timestamp: Date.now(), 
          senderId: myId,
          senderName: myName 
      });
    })
    .catch(err => console.error("❌ خطأ:", err));
}

// استقبال الرسائل (تعديل: عرض الاسم للآخرين فقط)
onChildAdded(messagesRef, snapshot => {
  const chatBox = document.getElementById("chat-box");
  const data = snapshot.val();
  const msg = document.createElement("div");

  const isMe = data.senderId === myId;
  const messageClass = isMe ? "sent" : "received";
  msg.classList.add("message", messageClass);

  const time = formatTimestamp(data.timestamp);
  
  // لو الرسالة من شخص تاني، نعرض اسمه، لو مني أنا مش لازم اشوف اسمي
  let nameHtml = "";
  if (!isMe) {
      nameHtml = `<span class="sender-name">${data.senderName || "مجهول"}</span>`;
  }

  if (data.text) {
    msg.innerHTML = `${nameHtml}<p>${data.text}<br><span class="time">${time}</span></p>`;
  } else if (data.imageUrl) {
    msg.innerHTML = `${nameHtml}<img src="${data.imageUrl}" alt="صورة"><br><span class="time">${time}</span>`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// الوضع الليلي والأحداث
document.addEventListener("DOMContentLoaded", () => {
  const ball = document.getElementById("ball");
  const body = document.body;

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

  document.getElementById("send-btn").addEventListener("click", sendMessage);
  document.getElementById("message-input").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });
  document.getElementById("file-input").addEventListener("change", e => {
    sendImage(e.target.files[0]);
  });
});
// Firebase - تهيئة
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// إعداد Firebase (نفس بياناتك القديمة)
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

// 1. إدارة الهوية والاسم
let myId = localStorage.getItem("chat_user_id");
let myName = localStorage.getItem("chat_username");
const nameModal = document.getElementById("name-modal");

// لو مفيش ID نعمل واحد
if (!myId) {
    myId = "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    localStorage.setItem("chat_user_id", myId);
}

// لو مفيش اسم، نظهر النافذة، ولو فيه نخفيها
if (!myName) {
    nameModal.style.display = "flex";
} else {
    nameModal.style.display = "none";
}

// زر حفظ الاسم
document.getElementById("save-name-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("username-input").value.trim();
    if (nameInput) {
        myName = nameInput;
        localStorage.setItem("chat_username", myName);
        nameModal.style.display = "none";
    } else {
        alert("اكتب اسم عشان نعرفك 😃");
    }
});


// تحويل الوقت
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// إرسال رسالة نصية (تعديل: إضافة الاسم)
function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  if (message && myName) { // لازم يكون فيه اسم
    push(messagesRef, { 
        text: message, 
        timestamp: Date.now(),
        senderId: myId,
        senderName: myName // بنبعت الاسم هنا
    });
    input.value = "";
  }
}

// إرسال صورة (تعديل: إضافة الاسم)
function sendImage(file) {
  if (!file || !myName) return;
  const fileRef = storageRef(storage, `images/${file.name}`);
  uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref))
    .then(url => {
      push(messagesRef, { 
          imageUrl: url, 
          timestamp: Date.now(), 
          senderId: myId,
          senderName: myName 
      });
    })
    .catch(err => console.error("❌ خطأ:", err));
}

// استقبال الرسائل (تعديل: عرض الاسم للآخرين فقط)
onChildAdded(messagesRef, snapshot => {
  const chatBox = document.getElementById("chat-box");
  const data = snapshot.val();
  const msg = document.createElement("div");

  const isMe = data.senderId === myId;
  const messageClass = isMe ? "sent" : "received";
  msg.classList.add("message", messageClass);

  const time = formatTimestamp(data.timestamp);
  
  // لو الرسالة من شخص تاني، نعرض اسمه، لو مني أنا مش لازم اشوف اسمي
  let nameHtml = "";
  if (!isMe) {
      nameHtml = `<span class="sender-name">${data.senderName || "مجهول"}</span>`;
  }

  if (data.text) {
    msg.innerHTML = `${nameHtml}<p>${data.text}<br><span class="time">${time}</span></p>`;
  } else if (data.imageUrl) {
    msg.innerHTML = `${nameHtml}<img src="${data.imageUrl}" alt="صورة"><br><span class="time">${time}</span>`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// الوضع الليلي والأحداث
document.addEventListener("DOMContentLoaded", () => {
  const ball = document.getElementById("ball");
  const body = document.body;

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

  document.getElementById("send-btn").addEventListener("click", sendMessage);
  document.getElementById("message-input").addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });
  document.getElementById("file-input").addEventListener("change", e => {
    sendImage(e.target.files[0]);
  });
});
