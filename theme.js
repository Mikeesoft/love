document.addEventListener("DOMContentLoaded", () => {
  const ball = document.getElementById("ball");
  const body = document.body;
  
  // التحقق إذا كان المستخدم اختار الوضع المظلم من قبل
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
});