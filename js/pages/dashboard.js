document.addEventListener('DOMContentLoaded', () => {
  // Initialization logic for dashboard
  console.log("Dashboard loaded");
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }
});
