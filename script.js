const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PROJECT_ID.firebaseio.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');

// تحميل الرسائل من Firebase
function loadMessages() {
  database.ref('messages').on('value', (snapshot) => {
    chatBox.innerHTML = ''; // مسح الرسائل القديمة
    const messages = snapshot.val() || [];
    Object.values(messages).forEach((message, index) => {
      addMessageToChatBox(message, index);
    });
  });
}

// إضافة رسالة جديدة إلى واجهة المحادثة
function addMessageToChatBox(message, index) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.classList.add('message');
  messageElement.setAttribute('data-index', index); // إضافة معرف للرسالة
  
  // إضافة إيموجي القائمة المنسدلة
  const menuIcon = document.createElement('span');
  menuIcon.textContent = '💬';
  menuIcon.classList.add('menu-icon');
  menuIcon.addEventListener('click', function(e) {
    e.stopPropagation(); // منع انتشار الحدث
    showMessageMenu(messageElement, index);
  });
  
  messageElement.appendChild(menuIcon);
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // التمرير لأسفل تلقائيًا
}

// إرسال رسالة جديدة
function sendMessage() {
  const message = messageInput.value.trim();
  if (message !== "") {
    // حفظ الرسالة في Firebase
    const messagesRef = database.ref('messages');
    messagesRef.push(message);
    
    // عرض الرسالة في واجهة المحادثة
    addMessageToChatBox(message);
    messageInput.value = '';
  }
}

// تحميل الرسائل عند فتح الصفحة
loadMessages();

// إرسال الرسالة عند الضغط على Enter
messageInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
