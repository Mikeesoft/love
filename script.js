// استيراد Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

// تهيئة Firebase
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

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

// دالة إرسال الرسالة
function sendMessage() {
  let messageInput = document.getElementById("message-input");
  let message = messageInput.value.trim();
  
  if (message) {
    push(messagesRef, { text: message, timestamp: Date.now() })
      .then(() => {
        console.log("✅ تم إرسال الرسالة بنجاح!");
        messageInput.value = "";
      })
      .catch(error => console.error("❌ خطأ في إرسال الرسالة:", error));
  } else {
    console.warn("⚠️ لا يمكن إرسال رسالة فارغة!");
  }
}

// استقبال الرسائل وعرضها
onChildAdded(messagesRef, (snapshot) => {
  let chatBox = document.getElementById("chat-box");
  let messageData = snapshot.val();
  let messageElement = document.createElement("p");
  messageElement.textContent = messageData.text;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// ربط الزر بالوظيفة
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});