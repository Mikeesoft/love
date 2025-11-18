import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, off } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// 1. إعدادات Firebase (بياناتك)
const firebaseConfig = {
  apiKey: "AIzaSyBm5CBE58jP10qj3-Jtfcj5KDZu90jRSbI", // ضع مفتاحك هنا
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// المتغيرات العامة
let currentUser = null;
let currentRoom = null;
let messagesRef = null;

// عناصر الواجهة
const loginModal = document.getElementById("login-modal");
const googleBtn = document.getElementById("google-login-btn");
const roomSection = document.getElementById("room-section");
const roomInput = document.getElementById("room-input");
const joinRoomBtn = document.getElementById("join-room-btn");
const chatBox = document.getElementById("chat-box");

// ==========================================
// 2. نظام الحماية وتسجيل الدخول
// ==========================================

// مراقبة حالة المستخدم (هل سجل دخوله أم لا؟)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        googleBtn.style.display = "none"; // إخفاء زر الدخول
        roomSection.style.display = "block"; // إظهار خانة الغرفة
        console.log("تم التعرف على المستخدم:", user.displayName);
    }
});

// زر تسجيل الدخول
// استبدل كود الزر القديم بهذا الكود للتجربة
googleBtn.addEventListener("click", () => {
    // تنبيه بسيط لنعرف أن الزر يعمل
    alert("جاري الاتصال بجوجل... انتظر قليلاً ⏳");

    signInWithPopup(auth, provider)
        .then((result) => {
            alert("✅ تم تسجيل الدخول بنجاح! مرحباً " + result.user.displayName);
            // سيقوم الكود تلقائياً بتفعيل onAuthStateChanged
        })
        .catch((error) => {
            // هنا سنكشف سبب المشكلة
            console.error(error); 
            
            if (error.code === 'auth/unauthorized-domain') {
                alert("🚫 خطأ: الدومين محظور!\nيجب إضافة رابط Netlify في إعدادات Firebase > Authentication > Authorized Domains");
            } else if (error.code === 'auth/popup-closed-by-user') {
                alert("⚠️ قمت بإغلاق النافذة قبل اكتمال التسجيل.");
            } else if (error.code === 'auth/popup-blocked') {
                alert("⚠️ المتصفح منع النافذة المنبثقة (Popup).\nيرجى السماح للنوافذ المنبثقة لهذا الموقع.");
            } else {
                alert("❌ خطأ غير معروف:\n" + error.message);
            }
        });
});


// زر دخول الغرفة
joinRoomBtn.addEventListener("click", () => {
    const roomCode = roomInput.value.trim();
    if (roomCode.length < 5) {
        alert("⚠️ كود الغرفة يجب أن يكون 5 أحرف/أرقام على الأقل ليكون صعب الاختراق!");
        return;
    }
    
    enterRoom(roomCode);
});

// دالة دخول الغرفة وتشغيل الشات
function enterRoom(roomId) {
    currentRoom = roomId;
    loginModal.style.display = "none";
    
    // تغيير مسار قاعدة البيانات ليكون خاصاً بالغرفة فقط
    // المسار يصبح: rooms/SECRET_CODE/messages
    messagesRef = ref(db, `rooms/${roomId}/messages`);

    // تنظيف الشات القديم (في حال التبديل)
    chatBox.innerHTML = "";
    
    // بدء استقبال الرسائل
    listenForMessages();
    
    alert(`🔒 تم تشفير المحادثة في الغرفة: ${roomId}`);
}

// ==========================================
// 3. الوظائف الأساسية (إرسال واستقبال)
// ==========================================

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

// إرسال نص
function sendMessage() {
    const input = document.getElementById("message-input");
    const text = input.value.trim();
    
    if (text && currentUser && messagesRef) {
        push(messagesRef, {
            text: text,
            senderId: currentUser.uid, // المعرف السري للمستخدم
            senderName: currentUser.displayName,
            photo: currentUser.photoURL,
            timestamp: Date.now(),
            type: 'text'
        });
        input.value = "";
    }
}

// إرسال صورة
window.sendImage = function(file) { // جعلناها global لتعمل مع HTML
    if (!file || !currentUser || !messagesRef) return;

    const uniqueName = `${currentRoom}_${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, `private_images/${uniqueName}`);

    uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref))
        .then(url => {
            push(messagesRef, {
                imageUrl: url,
                senderId: currentUser.uid,
                senderName: currentUser.displayName,
                photo: currentUser.photoURL,
                timestamp: Date.now(),
                type: 'image'
            });
        })
        .catch(err => console.error("خطأ رفع الصورة:", err));
};

// استقبال الرسائل
function listenForMessages() {
    onChildAdded(messagesRef, snapshot => {
        const data = snapshot.val();
        const msgDiv = document.createElement("div");
        const isMe = data.senderId === currentUser.uid;

        msgDiv.classList.add("message");
        msgDiv.classList.add(isMe ? "sent" : "received");

        let content = "";
        
        // عرض الاسم والصورة للطرف الآخر فقط
        if (!isMe) {
            content += `<div class="sender-info" style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                        <img src="${data.photo}" style="width:20px; height:20px; border-radius:50%;">
                        <span class="sender-name">${data.senderName}</span>
                       </div>`;
        }

        if (data.type === 'image') {
            content += `<img src="${data.imageUrl}" style="cursor:pointer;" onclick="window.open(this.src)">`;
        } else {
            content += `<p>${data.text}</p>`;
        }

        content += `<span class="time">${formatTimestamp(data.timestamp)}</span>`;
        
        msgDiv.innerHTML = content;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    });
}

// ==========================================
// 4. الأحداث
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("send-btn").addEventListener("click", sendMessage);
    
    document.getElementById("message-input").addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });

    document.getElementById("file-input").addEventListener("change", e => {
        if(e.target.files.length > 0) window.sendImage(e.target.files[0]);
    });

    // الوضع الليلي (نفس الكود السابق)
    const ball = document.getElementById("ball");
    if(ball) {
        ball.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
        });
    }
});
