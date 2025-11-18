// ==========================================
// 1. الاستيراد وتهيئة Firebase
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

// إعداد Firebase (بياناتك كما هي)
const firebaseConfig = {
  apiKey: "AIzaSyBm5C...", // تأكد من أن هذه البيانات صحيحة من الكونسول
  authDomain: "love-6f927.firebaseapp.com",
  databaseURL: "https://love-6f927-default-rtdb.firebaseio.com",
  projectId: "love-6f927",
  storageBucket: "love-6f927.appspot.com",
  messagingSenderId: "986690537911",
  appId: "1:986690537911:web:4d5f980f39090249250032",
  measurementId: "G-FVMS8SEGGF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app); // استخدام Realtime Database
const storage = getStorage(app);
const messagesRef = ref(db, "messages");

// ==========================================
// 2. إدارة الهوية والاسم
// ==========================================
let myId = localStorage.getItem("chat_user_id");
let myName = localStorage.getItem("chat_username");
const nameModal = document.getElementById("name-modal");
const usernameInput = document.getElementById("username-input");
const saveNameBtn = document.getElementById("save-name-btn");

// إنشاء ID فريد للمستخدم إذا لم يكن موجوداً
if (!myId) {
    myId = "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    localStorage.setItem("chat_user_id", myId);
}

// التحكم في ظهور نافذة الاسم
if (!myName) {
    if(nameModal) nameModal.style.display = "flex"; // إظهار النافذة
} else {
    if(nameModal) nameModal.style.display = "none"; // إخفاء النافذة
}

// حفظ الاسم عند الضغط على الزر
if(saveNameBtn) {
    saveNameBtn.addEventListener("click", () => {
        const nameVal = usernameInput.value.trim();
        if (nameVal) {
            myName = nameVal;
            localStorage.setItem("chat_username", myName);
            nameModal.style.display = "none";
        } else {
            alert("اكتب اسم عشان نعرفك 😃");
        }
    });
}

// ==========================================
// 3. دالة تنسيق الوقت الذكية
// ==========================================
function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  const now = new Date();

  // تنسيق الساعة (12 ساعة)
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeString = `${hours}:${minutes} ${ampm}`;

  // التحقق من التاريخ (اليوم / أمس)
  const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getFullYear() === yesterday.getFullYear();

  if (isToday) {
    return timeString;
  } else if (isYesterday) {
    return `أمس ${timeString}`;
  } else {
    return `${date.getDate()}/${date.getMonth() + 1} ${timeString}`;
  }
}

// ==========================================
// 4. إرسال الرسائل (نص وصور)
// ==========================================

// إرسال نص
function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();
  
  if (message && myName) {
    push(messagesRef, { 
        text: message, 
        timestamp: Date.now(), // نستخدم توقيت الجهاز مؤقتاً للعرض السريع
        senderId: myId,
        senderName: myName,
        type: 'text'
    });
    input.value = "";
  }
}

// إرسال صورة
function sendImage(file) {
  if (!file || !myName) return;

  // تعديل هام: إضافة توقيت لاسم الملف لمنع التكرار والحذف
  const uniqueName = Date.now() + '-' + file.name; 
  const fileRef = storageRef(storage, `images/${uniqueName}`);

  uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref))
    .then(url => {
      push(messagesRef, { 
          imageUrl: url, 
          timestamp: Date.now(), 
          senderId: myId,
          senderName: myName,
          type: 'image'
      });
    })
    .catch(err => {
        console.error("❌ خطأ في رفع الصورة:", err);
        alert("فشل رفع الصورة، تأكد من الانترنت");
    });
}

// ==========================================
// 5. استقبال الرسائل وعرضها
// ==========================================
onChildAdded(messagesRef, snapshot => {
  const chatBox = document.getElementById("chat-box");
  const data = snapshot.val();
  const msgDiv = document.createElement("div");

  // تحديد هل الرسالة مني أم من غيري لتطبيق كلاسات CSS
  const isMe = data.senderId === myId;
  
  // تطبيق كلاسات التصميم الأسطوري
  msgDiv.classList.add("message");
  msgDiv.classList.add(isMe ? "sent" : "received");

  // تنسيق الوقت
  const timeDisplay = formatTimestamp(data.timestamp);
  
  // محتوى HTML للرسالة
  let contentHtml = "";

  // إضافة الاسم (للآخرين فقط)
  if (!isMe) {
      contentHtml += `<span class="sender-name">${data.senderName || "مجهول"}</span>`;
  }

  // إضافة النص أو الصورة
  if (data.imageUrl) {
      contentHtml += `<img src="${data.imageUrl}" alt="صورة" style="cursor:pointer;" onclick="window.open(this.src)">`;
  } else if (data.text) {
      contentHtml += `<p style="margin:0;">${data.text}</p>`;
  }

  // إضافة الوقت
  contentHtml += `<span class="time">${timeDisplay}</span>`;

  msgDiv.innerHTML = contentHtml;
  chatBox.appendChild(msgDiv);
  
  // النزول لأسفل الشات بسلاسة
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
});

// ==========================================
// 6. تهيئة الصفحة والأحداث
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const ball = document.getElementById("ball");
  const body = document.body;
  const sendBtn = document.getElementById("send-btn");
  const msgInput = document.getElementById("message-input");
  const fileInp = document.getElementById("file-input");

  // استرجاع الوضع الليلي
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    if(ball) {
        ball.style.transform = "translateX(25px)"; // تعديل ليتوافق مع CSS
        ball.style.backgroundColor = "#333";
    }
  }

  // زر الوضع الليلي
  if(ball) {
      ball.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        const isDark = body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        
        if (isDark) {
            ball.style.transform = "translateX(25px)";
            ball.style.backgroundColor = "#333";
        } else {
            ball.style.transform = "translateX(0)";
            ball.style.backgroundColor = "#fff";
        }
      });
  }

  // أزرار الإرسال
  if(sendBtn) sendBtn.addEventListener("click", sendMessage);
  
  if(msgInput) {
      msgInput.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
      });
  }

  if(fileInp) {
      fileInp.addEventListener("change", e => {
        if(e.target.files.length > 0) {
            sendImage(e.target.files[0]);
            e.target.value = ""; // تفريغ الملف بعد الرفع
        }
      });
  }
});
