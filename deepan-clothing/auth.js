// AUTHENTICATION SYSTEM

// Get users from localStorage or initialize with demo users
function getUsers() {
  const storedUsers = localStorage.getItem('deepanUsers');
  if (storedUsers) {
    return JSON.parse(storedUsers);
  }
  // Initialize with demo users
  const demoUsers = {
    'admin@deepan.lk': { password: 'admin123', role: 'admin', name: 'Admin' },
    'user@deepan.lk': { password: 'user123', role: 'user', name: 'User Name' }
  };
  localStorage.setItem('deepanUsers', JSON.stringify(demoUsers));
  return demoUsers;
}

function saveUsers(users) {
  localStorage.setItem('deepanUsers', JSON.stringify(users));
}

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('currentUser') !== null;
}

// Get current user
function getCurrentUser() {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
}

// Login function
async function login(email, password) {
  try {
    const response = await fetch('http://localhost:3000/api/users');
    const users = await response.json();
    
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.Email.toLowerCase() === normalizedEmail);
    
    console.log('Login attempt for:', normalizedEmail);
    console.log('User found:', user);
    
    if (user && user.Password === password) {
      const userData = {
        email: normalizedEmail,
        name: user.Name,
        role: 'user',
        phone: user.Phone || '',
        address: user.Address || ''
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return { success: true, role: 'user' };
    }
    
    // Check for admin user (hardcoded for admin)
    if (normalizedEmail === 'admin@deepan.lk' && password === 'admin123') {
      const userData = {
        email: normalizedEmail,
        name: 'Admin',
        role: 'admin',
        phone: '',
        address: ''
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return { success: true, role: 'admin' };
    }
    
    return { success: false, message: 'Invalid email or password' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Error logging in. Please try again.' };
  }
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// Check authentication and redirect if needed
function checkAuth(requiredRole = null) {
  const user = getCurrentUser();
  
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    alert('Access denied. You do not have permission to access this page.');
    window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
    return false;
  }
  
  return true;
}

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;

      console.log('Login attempt:', email);
      const result = await login(email, password);
      console.log('Login result:', result);

      if (result.success) {
        if (result.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'user-dashboard.html';
        }
      } else {
        alert(result.message);
      }
    });
  }

  // Register form handler
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim().toLowerCase();
      const phone = document.getElementById('registerPhone').value.trim();
      const address = document.getElementById('registerAddress').value.trim();
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;

      console.log('Registration attempt for:', email);

      // Validate phone number is exactly 10 digits
      if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number!');
        return;
      }

      // Validate passwords match
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      try {
        // Save user to SQL Server via API
        const response = await fetch('http://localhost:3000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, phone, address })
        });

        const result = await response.json();

        if (result.success) {
          alert('Account created successfully! Please login.');
          window.location.href = 'login.html';
        } else {
          alert(result.message || 'Error creating account. Email may already exist.');
        }
      } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating account. Please make sure server is running.');
      }
    });
  }
});

// Check authentication on dashboard pages
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === 'admin-dashboard.html') {
    checkAuth('admin');
  } else if (currentPage === 'user-dashboard.html') {
    checkAuth('user');
  } else if (currentPage === 'checkout.html') {
    checkAuth('user');
  }
});

// Update navigation based on login status
function updateNavigation() {
  const user = getCurrentUser();
  const navLinks = document.querySelector('.nav-links');
  
  if (navLinks && user) {
    // Check if dashboard link already exists
    if (navLinks.querySelector('a[href*="dashboard.html"]')) {
      return;
    }
    
    // Add dashboard link
    const dashboardLink = user.role === 'admin' 
      ? '<li><a href="admin-dashboard.html">Dashboard</a></li>'
      : '<li><a href="user-dashboard.html">Dashboard</a></li>';
    
    // Insert dashboard link after Contact
    const links = navLinks.querySelectorAll('li');
    if (links.length > 0) {
      const lastLink = links[links.length - 1];
      lastLink.insertAdjacentHTML('afterend', dashboardLink);
    }
  }
}

// Initialize navigation update
document.addEventListener('DOMContentLoaded', () => {
  updateNavigation();
});
