// تكوين Firebase باستخدام بيانات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyDC_vJjM8u_k2RKjj1fnaxx...stlo",
  authDomain: "arise-849d6.firebaseapp.com",
  projectId: "arise-849d6",
  storageBucket: "arise-849d6.appspot.com",
  messagingSenderId: "1076836340556",
  appId: "1:1076836340556:web:xxxxxxxxxxxxxx"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// مرجع لنظام المصادقة
const auth = firebase.auth();

// زر تسجيل الدخول
document.getElementById("loginBtn").addEventListener("click", function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      console.log("تم تسجيل الدخول بنجاح", result.user);
      window.location.href = "index.html"; // توجيه المستخدم للصفحة الرئيسية
    })
    .catch((error) => {
      console.error("خطأ أثناء تسجيل الدخول:", error.message);
    });
});