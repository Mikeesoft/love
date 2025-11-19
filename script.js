// Firebase - تهيئة
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// إعداد Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBm5CBE58jP10qj3-Jtfcj5KDZu90jRSbI",
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

// إنشاء ID لو مش موجود
if (!myId) {
    myId = "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    localStorage.setItem("chat_user_id", myId);
}

// التحكم في نافذة الاسم
if (!myName) {
    nameModal.style.display = "flex";
} else {
    nameModal.style.display = "none";
}

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


// ==========================================
// دالة تنسيق الوقت الذكية (التعديل الجديد) 🕒
// ==========================================
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    // تجهيز الوقت بصيغة 12 ساعة (ص/م)
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "م" : "ص";
    hours = hours % 12;
    hours = hours ? hours : 12; // الساعة 0 تبقى 12
    const timeString = `${hours}:${minutes} ${ampm}`;
    
    // مقارنة التواريخ
    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
    
    // المنطق:
    // 1. لو النهاردة -> اعرض الوقت بس
    // 2. لو امبارح -> اكتب "أمس" + الوقت
    // 3. لو أقدم -> اعرض التاريخ كامل
    
    if (isToday) {
        return timeString;
    } else if (isYesterday) {
        return `أمس ${timeString}`;
    } else {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`; // التاريخ فقط للرسائل القديمة عشان الزحمة
    }
}


// إرسال رسالة نصية
function sendMessage() {
    const input = document.getElementById("message-input");
    const message = input.value.trim();
    if (message && myName) {
        push(messagesRef, {
            text: message,
            timestamp: Date.now(),
            senderId: myId,
            senderName: myName
        });
        input.value = "";
    }
}

// إرسال صورة
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

// استقبال وعرض الرسائل
onChildAdded(messagesRef, snapshot => {
    const chatBox = document.getElementById("chat-box");
    const data = snapshot.val();
    const msg = document.createElement("div");
    
    const isMe = data.senderId === myId;
    const messageClass = isMe ? "sent" : "received";
    msg.classList.add("message", messageClass);
    
    // استدعاء دالة الوقت الجديدة
    const timeDisplay = formatTimestamp(data.timestamp);
    
    let nameHtml = "";
    if (!isMe) {
        nameHtml = `<span class="sender-name">${data.senderName || "مجهول"}</span>`;
    }
    
    if (data.text) {
        msg.innerHTML = `${nameHtml}<p>${data.text}<br><span class="time">${timeDisplay}</span></p>`;
    } else if (data.imageUrl) {
        msg.innerHTML = `${nameHtml}<img src="${data.imageUrl}" alt="صورة"><br><span class="time">${timeDisplay}</span>`;
    }
    
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// الأحداث والوضع الليلي
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