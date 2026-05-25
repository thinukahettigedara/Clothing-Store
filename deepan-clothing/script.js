// LOADER
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.querySelector('.loader');
    if (loader) loader.classList.add('hidden');
  }, 1800);
});

// NAV SCROLL
const nav = document.querySelector('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ACTIVE NAV LINK
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    a.classList.add('active');
  }
});

// HAMBURGER MENU
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileClose = document.querySelector('.mobile-close');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// SCROLL REVEAL
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => revealObserver.observe(el));

// FILTER TABS (Collections page)
let currentFilter = 'all';
let currentSearch = '';

function initializeFilters() {
  console.log('initializeFilters called');
  const filterTabs = document.querySelectorAll('.filter-tab');
  console.log('Filter tabs found:', filterTabs.length);
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      console.log('Filter clicked:', currentFilter);
      applyFilters();
    });
  });

  // SEARCH FUNCTIONALITY
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // SORT FUNCTIONALITY
  const sortSelect = document.getElementById('sortSelect');
  console.log('Sort select found:', sortSelect);
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      console.log('Sort changed to:', e.target.value);
      applySort(e.target.value);
    });
  } else {
    console.log('Sort select NOT found');
  }
}

function applySort(sortValue) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.product-card'));
  console.log('Sorting by:', sortValue);
  console.log('Total cards:', cards.length);

  cards.sort((a, b) => {
    const priceA = parsePrice(a.querySelector('.product-price').textContent);
    const priceB = parsePrice(b.querySelector('.product-price').textContent);
    console.log('Comparing:', priceA, 'vs', priceB);

    if (sortValue === 'Price: Low to High') {
      return priceA - priceB;
    } else if (sortValue === 'Price: High to Low') {
      return priceB - priceA;
    } else if (sortValue === 'Newest First') {
      return -1; // Keep original order (newest first based on HTML order)
    } else {
      return 0; // Featured - keep original order
    }
  });

  cards.forEach(card => grid.appendChild(card));
  console.log('Sorting complete');
}

function applyFilters() {
  const cards = document.querySelectorAll('.product-card');
  console.log('Applying filters - Total cards:', cards.length, 'Current filter:', currentFilter);
  let visibleCount = 0;

  cards.forEach(card => {
    const productName = card.querySelector('.product-name').textContent.toLowerCase();
    const category = card.dataset.cat;
    console.log('Card:', productName, 'Category:', category);

    const matchesFilter = currentFilter === 'all' || category === currentFilter;
    const matchesSearch = currentSearch === '' || productName.includes(currentSearch);

    if (matchesFilter && matchesSearch) {
      card.style.display = 'block';
      card.style.animation = 'fadeIn 0.4s ease';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  console.log('Visible cards after filter:', visibleCount);

  // Show/hide no results message
  const noResults = document.getElementById('noResults');
  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

// Initialize filters when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  initializeFilters();
});

// MEMBER NEWSLETTER — 10% off first order
const MEMBER_DISCOUNT_PERCENT = 10;
const NEWSLETTER_STORAGE_KEY = 'deepanNewsletterSubscribers';

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function getLocalNewsletterSubscribers() {
  return JSON.parse(localStorage.getItem(NEWSLETTER_STORAGE_KEY) || '[]');
}

function saveLocalNewsletterSubscriber(email) {
  const normalized = normalizeEmail(email);
  const subscribers = getLocalNewsletterSubscribers();
  if (!subscribers.find((s) => s.email === normalized)) {
    subscribers.push({
      email: normalized,
      subscribedAt: new Date().toISOString(),
      discountUsed: false
    });
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(subscribers));
  }
}

window.subscribeNewsletter = async function(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { success: false };

  saveLocalNewsletterSubscriber(normalized);

  try {
    const response = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized })
    });
    if (response.ok) return await response.json();
  } catch (error) {
    console.warn('Newsletter API unavailable:', error);
  }

  return { success: true, eligible: true, discountPercent: MEMBER_DISCOUNT_PERCENT };
};

window.checkMemberDiscount = async function(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { eligible: false, percent: 0 };

  const local = getLocalNewsletterSubscribers().find(
    (s) => s.email === normalized && !s.discountUsed
  );
  if (local) {
    return { eligible: true, percent: MEMBER_DISCOUNT_PERCENT };
  }

  try {
    const response = await fetch(`/api/newsletter/discount?email=${encodeURIComponent(normalized)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.eligible) {
        return { eligible: true, percent: data.discountPercent || MEMBER_DISCOUNT_PERCENT };
      }
    }
  } catch (error) {
    console.warn('Discount check failed:', error);
  }

  return { eligible: false, percent: 0 };
};

window.markMemberDiscountUsed = async function(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  const subscribers = getLocalNewsletterSubscribers();
  const sub = subscribers.find((s) => s.email === normalized);
  if (sub) {
    sub.discountUsed = true;
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(subscribers));
  }

  try {
    await fetch('/api/newsletter/use-discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized })
    });
  } catch (error) {
    console.warn('Could not mark discount used:', error);
  }
};

document.querySelectorAll('.newsletter-form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.newsletter-btn');
    const input = form.querySelector('.newsletter-input');
    const email = input?.value?.trim();
    if (!email) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Subscribing...';

    const result = await window.subscribeNewsletter(email);

    if (result.success !== false) {
      btn.textContent = '✓ Subscribed!';
      btn.style.background = '#4CAF50';
      input.value = '';
      alert('10% off your first order! Use this same email at checkout.');
    } else {
      alert(result.message || 'Could not subscribe. Please try again.');
    }

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  });
});

// Sync admin replies from API into localStorage (for user dashboard & collections)
window.syncReviewsAdminReplies = async function() {
  const allReviews = JSON.parse(localStorage.getItem('deepanReviews') || '[]');
  let changed = false;

  function reviewMatchKey(email, itemName, reviewText) {
    const slug = (itemName || '').toLowerCase().replace(/\s+/g, '-');
    return `${(email || '').toLowerCase()}|${slug}|${(reviewText || '').trim()}`;
  }

  try {
    const response = await fetch('/api/reviews');
    if (!response.ok) return allReviews;

    const apiReviews = await response.json();

    allReviews.forEach((local) => {
      let apiMatch = apiReviews.find(
        (api) => String(api.ReviewId) === String(local.reviewId || local.id)
      );

      if (!apiMatch) {
        const localKey = reviewMatchKey(local.userEmail, local.itemName, local.review);
        apiMatch = apiReviews.find(
          (api) => reviewMatchKey(api.UserEmail, api.ProductName, api.Review) === localKey
        );
      }

      if (apiMatch?.AdminReply && local.adminReply !== apiMatch.AdminReply) {
        local.adminReply = apiMatch.AdminReply;
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem('deepanReviews', JSON.stringify(allReviews));
    }
  } catch (error) {
    console.warn('Could not sync admin replies:', error);
  }

  return allReviews;
};

// CONTACT FORM
const contactForm = document.querySelector('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    btn.textContent = 'Sending...';
    
    // Get form data using IDs
    const firstName = document.getElementById('contactFirstName').value;
    const lastName = document.getElementById('contactLastName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    console.log('Form data:', { firstName, lastName, email, phone, subject, message });
    
    // Save message to localStorage
    const messages = JSON.parse(localStorage.getItem('deepanMessages')) || [];
    const newMessage = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      date: new Date().toISOString(),
      status: 'unread',
      replies: []
    };
    messages.push(newMessage);
    localStorage.setItem('deepanMessages', JSON.stringify(messages));
    
    console.log('Message saved to localStorage:', newMessage);
    console.log('Total messages in localStorage:', messages.length);
    
    setTimeout(() => {
      btn.textContent = 'Message Sent ✓';
      btn.style.background = '#4CAF50';
      contactForm.reset();
      const msg = document.querySelector('.success-msg');
      if (msg) msg.style.display = 'block';
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        if (msg) msg.style.display = 'none';
      }, 4000);
    }, 1200);
  });
}

// WISHLIST
document.querySelectorAll('.product-wishlist').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.textContent = btn.textContent === '♡' ? '♥' : '♡';
    btn.style.color = btn.textContent === '♥' ? '#e53935' : '';
  });
});

// SIZE SELECTION
function selectSize(element) {
  console.log('selectSize called', element);
  const productCard = element.closest('.product-card');
  console.log('productCard:', productCard);
  if (productCard) {
    const sizeDots = productCard.querySelectorAll('.size-dot');
    console.log('sizeDots:', sizeDots);
    sizeDots.forEach(d => {
      d.classList.remove('selected');
    });
    element.classList.add('selected');
    productCard.setAttribute('data-selected-size', element.textContent);
    console.log('Selected size:', element.textContent);
  }
}



// PARALLAX HERO (subtle)
const heroRight = document.querySelector('.hero-right');
if (heroRight) {
  window.addEventListener('scroll', () => {
    const s = window.scrollY;
    if (s < window.innerHeight) {
      heroRight.style.transform = `translateY(${s * 0.08}px)`;
    }
  });
}

// CART FUNCTIONALITY
let cart = JSON.parse(localStorage.getItem('deepanCart')) || [];

function saveCart() {
  localStorage.setItem('deepanCart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
  });
}

function addToCart(product) {
  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

function updateQuantity(productId, change) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      saveCart();
    }
  }
}

function parsePrice(priceText) {
  // Handle sale prices: extract the current price (not the crossed-out one)
  const delMatch = priceText.match(/<del>.*?(\d[\d,]*)/);
  if (delMatch) {
    // If there's a <del> tag, extract the price after it (the current sale price)
    const afterDel = priceText.split('</del>')[1] || '';
    const salePrice = afterDel.replace(/[^0-9]/g, '');
    return parseInt(salePrice) || 0;
  }
  // Regular price
  return parseInt(priceText.replace(/[^0-9]/g, ''));
}

function renderCart() {
  const cartItems = document.querySelector('.cart-items');
  const cartEmpty = document.querySelector('.cart-empty');
  const cartTotal = document.querySelector('.cart-total');
  
  if (!cartItems) return;
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
    if (cartTotal) cartTotal.textContent = 'Rs. 0';
    return;
  }
  
  let total = 0;
  cartItems.innerHTML = cart.map(item => {
    const price = parsePrice(item.price);
    total += price * item.quantity;
    return `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${item.price}</div>
            ${item.size ? `<div class="cart-item-size" style="font-size: 0.8rem; color: var(--gray); margin-top: 2px;">Size: ${item.size}</div>` : ''}
          </div>
          <div class="cart-item-quantity">
            <button class="cart-qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
            <span class="cart-qty-value">${item.quantity}</span>
            <button class="cart-qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if (cartTotal) cartTotal.textContent = `Rs. ${total.toLocaleString()}`;
}

// CART DRAWER
const cartBtn = document.querySelector('.cart-btn');
const cartDrawer = document.querySelector('.cart-drawer');
const cartOverlay = document.querySelector('.cart-overlay');
const cartClose = document.querySelector('.cart-close');

if (cartBtn && cartDrawer) {
  cartBtn.addEventListener('click', () => {
    cartDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

if (cartOverlay && cartDrawer) {
  cartOverlay.addEventListener('click', () => {
    cartDrawer.classList.remove('open');
    document.body.style.overflow = '';
  });
}

if (cartClose && cartDrawer) {
  cartClose.addEventListener('click', () => {
    cartDrawer.classList.remove('open');
    document.body.style.overflow = '';
  });
}

// CHECKOUT BUTTON
const checkoutBtn = document.querySelector('.cart-checkout');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Add some products before checkout.');
      return;
    }
    
    // Close cart drawer
    if (cartDrawer) {
      cartDrawer.classList.remove('open');
      document.body.style.overflow = '';
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
  });
}

// ADMIN PANEL - ADD PRODUCT MODAL
// Note: Product form handling is done in admin-dashboard.html to prevent duplicate submissions
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.querySelector('.product-modal');
const modalOverlay = document.querySelector('.modal-overlay');
const modalClose = document.querySelector('.modal-close');

// Open modal when Add Product button is clicked
if (addProductBtn && productModal) {
  addProductBtn.addEventListener('click', () => {
    productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

// Close modal functions
function closeProductModal() {
  if (productModal) {
    productModal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', closeProductModal);
}

if (modalClose) {
  modalClose.addEventListener('click', closeProductModal);
}

// Load and display product ratings
async function loadProductRatings() {
  try {
    const response = await fetch('http://localhost:3000/api/reviews');
    const reviews = await response.json();

    document.querySelectorAll('.product-rating').forEach(ratingEl => {
      const productId = ratingEl.dataset.productId;
      const productReviews = reviews.filter(r => r.ItemId === productId);

      if (productReviews.length > 0) {
        const averageRating = productReviews.reduce((sum, r) => sum + r.Rating, 0) / productReviews.length;
        const roundedRating = Math.round(averageRating);

        // Update star display
        const starsEl = ratingEl.querySelector('.rating-stars');
        let starsDisplay = '';
        for (let i = 1; i <= 5; i++) {
          if (i <= roundedRating) {
            starsDisplay += '★';
          } else {
            starsDisplay += '☆';
          }
        }
        starsEl.textContent = starsDisplay;
        starsEl.style.color = '#FFD700';

        // Update review count
        const countEl = ratingEl.querySelector('.rating-count');
        countEl.textContent = `(${productReviews.length} review${productReviews.length > 1 ? 's' : ''})`;
      }
    });
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

// Load ratings when page loads
document.addEventListener('DOMContentLoaded', loadProductRatings);

// DYNAMIC PRODUCT LOADING FOR COLLECTIONS PAGE
async function loadDynamicProducts() {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  console.log('Loading dynamic products...');

  try {
    // Get products from SQL Server via API
    const response = await fetch('http://localhost:3000/api/products');
    const userProducts = await response.json();

    console.log('Products loaded:', userProducts);

    // Clear existing dynamic products (keep static products if any)
    const existingDynamicProducts = productsGrid.querySelectorAll('.product-card[data-cat]');
    existingDynamicProducts.forEach(card => card.remove());

    // If there are user products, append them to the grid
    if (userProducts.length > 0) {
    userProducts.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card reveal';
      productCard.dataset.cat = product.Category;
      productCard.dataset.description = product.Description || '';

      // Parse sizes from JSON string
      const sizes = product.Sizes ? JSON.parse(product.Sizes) : ['S', 'M', 'L'];

      // Generate product ID for reviews
      const productId = product.Name.toLowerCase().replace(/\s+/g, '-');

      productCard.innerHTML = `
        <div class="product-img-wrap">
          <img class="product-img-full" src="${product.Image}" alt="${product.Name}" />
          <span class="product-badge" style="background:var(--gold)">New</span>
          <button class="product-wishlist">♡</button>
          <button class="product-quick">Add to Cart</button>
        </div>
        <div class="product-name">${product.Name}</div>
        <div class="product-meta">
          <div class="product-price">Rs. ${parseInt(product.Price).toLocaleString()}</div>
          <div class="product-sizes">${sizes.map(size => `<div class="size-dot">${size}</div>`).join('')}</div>
        </div>
        <div class="product-rating" data-product-id="${productId}" style="margin-top: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.85rem;">
          <span class="rating-stars">☆☆☆☆☆</span>
          <span class="rating-count" style="color: #666;">(0 reviews)</span>
        </div>
      `;

      productsGrid.appendChild(productCard);
    });

    // Re-initialize scroll reveal for new elements
    const newReveals = productsGrid.querySelectorAll('.reveal:not(.visible)');
    newReveals.forEach(el => revealObserver.observe(el));

    // Re-apply current filters after loading dynamic products
    applyFilters();

    // Load product ratings after dynamic products are loaded
    if (typeof loadProductRatings === 'function') {
      loadProductRatings();
    }

    productsGrid.querySelectorAll('.product-rating').forEach((ratingEl) => {
      ratingEl.style.cursor = 'pointer';
      ratingEl.title = 'View reviews';
      ratingEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = ratingEl.dataset.productId;
        const card = ratingEl.closest('.product-card');
        const productName = card?.querySelector('.product-name')?.textContent || productId;
        if (typeof window.showProductReviews === 'function') {
          window.showProductReviews(productId, productName);
        }
      });
    });

    // Attach event listeners to new product buttons
    productsGrid.querySelectorAll('.product-wishlist').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.textContent = btn.textContent === '♡' ? '♥' : '♡';
        btn.style.color = btn.textContent === '♥' ? '#e53935' : '';
      });
    });

    productsGrid.querySelectorAll('.size-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        selectSize(dot);
      });
    });

    productsGrid.querySelectorAll('.product-quick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        btn.disabled = true;

        const card = btn.closest('.product-card');
        const selectedSize = card.getAttribute('data-selected-size');

        if (!selectedSize) {
          alert('Please select a size before adding to cart');
          btn.disabled = false;
          return;
        }

        const name = card.querySelector('.product-name').textContent;
        const price = card.querySelector('.product-price').textContent;
        const image = card.querySelector('img').src;
        const id = name.toLowerCase().replace(/\s+/g, '-');

        addToCart({ id, name, price, image, size: selectedSize });

        const orig = btn.textContent;
        btn.textContent = '✓ Added to Cart';
        btn.style.background = '#4CAF50';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = '';
          btn.disabled = false;
        }, 1800);
      });
    });
  }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Flag to ensure event listener is only attached once
let cartEventListenerAttached = false;

function setupCartEventListeners() {
  if (cartEventListenerAttached) return;
  cartEventListenerAttached = true;

  // Wishlist buttons
  document.querySelectorAll('.product-wishlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.textContent = btn.textContent === '♡' ? '♥' : '♡';
      btn.style.color = btn.textContent === '♥' ? '#e53935' : '';
    });
  });

  // Size selection
  document.querySelectorAll('.size-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      selectSize(dot);
    });
  });

  // Add to cart buttons
  document.querySelectorAll('.product-quick').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Prevent double-click
      if (btn.disabled) return;
      btn.disabled = true;

      const card = btn.closest('.product-card');
      const selectedSize = card.getAttribute('data-selected-size');

      if (!selectedSize) {
        alert('Please select a size before adding to cart');
        btn.disabled = false;
        return;
      }

      const name = card.querySelector('.product-name').textContent;
      const price = card.querySelector('.product-price').textContent;
      const image = card.querySelector('img').src;
      const id = name.toLowerCase().replace(/\s+/g, '-');

      addToCart({ id, name, price, image, size: selectedSize });

      const orig = btn.textContent;
      btn.textContent = '✓ Added to Cart';
      btn.style.background = '#4CAF50';
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
        btn.disabled = false;
      }, 1800);
    });
  });
}

// Setup event listeners
setupCartEventListeners();

// Load dynamic products when collections page loads
if (window.location.pathname.includes('collections.html') || window.location.pathname.endsWith('collections')) {
  loadDynamicProducts();
}

// ADMIN DASHBOARD - LOAD ORDERS
async function loadAdminOrders() {
  const ordersTableBody = document.getElementById('ordersTableBody');
  if (!ordersTableBody) return;

  try {
    // Load orders from database via API
    const response = await fetch('http://localhost:3000/api/orders');
    const orders = await response.json();

    if (orders.length > 0) {
      // Clear existing rows
      ordersTableBody.innerHTML = '';

      // Add orders from database (newest first)
      orders.forEach(order => {
        // Safely parse shipping data
        let shipping = {};
        let customerName = 'Unknown';
        try {
          shipping = JSON.parse(order.Shipping || '{}');
          if (shipping.firstName || shipping.lastName) {
            customerName = `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || 'Unknown';
          } else if (shipping.name) {
            customerName = shipping.name;
          }
        } catch (e) {
          console.error('Error parsing shipping data:', e);
          customerName = 'Unknown';
        }

        // Safely parse items data
        let items = [];
        try {
          items = JSON.parse(order.Items || '[]');
        } catch (e) {
          console.error('Error parsing items data:', e);
          items = [];
        }

        const products = items.map(item => `${item.name} (Size: ${item.size || 'N/A'}) x${item.quantity}`).join(', ');
        const total = `Rs. ${(parseFloat(order.Total) || 0).toLocaleString()}`;
        const status = (order.Status || 'pending').toLowerCase();
        const statusClass = status === 'completed' ? 'completed' : status === 'processing' ? 'processing' : 'pending';
        const orderId = 'ORD-' + order.OrderId;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${orderId}</td>
          <td>${customerName}</td>
          <td>${products}</td>
          <td>${total}</td>
          <td><span class="status ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
          <td>
            ${status === 'pending' ? `
              <button class="action-btn" style="padding: 6px 12px; font-size: 0.85rem;" onclick="confirmOrder('${orderId}')">Confirm</button>
              <button class="action-btn" style="padding: 6px 12px; font-size: 0.85rem; background: #e53935; color: white;" onclick="deleteOrder('${orderId}')">Delete</button>
            ` : status === 'processing' ? `
              <button class="action-btn" style="padding: 6px 12px; font-size: 0.85rem;" onclick="completeOrder('${orderId}')">Complete</button>
              <button class="action-btn" style="padding: 6px 12px; font-size: 0.85rem; background: #e53935; color: white;" onclick="deleteOrder('${orderId}')">Delete</button>
            ` : `
              <span style="color: #4CAF50;">✓ Done</span>
              <button class="action-btn" style="padding: 6px 12px; font-size: 0.85rem; background: #e53935; color: white;" onclick="deleteOrder('${orderId}')">Delete</button>
            `}
          </td>
        `;
        ordersTableBody.appendChild(row);
      });

      // Update stats
      updateAdminStats(orders);
    } else {
      ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No orders found</td></tr>';
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">Error loading orders. Make sure server is running.</td></tr>';
  }
}

async function confirmOrder(orderId) {
  // Extract numeric ID from string like 'ORD-7' -> 7
  const numericId = orderId.replace(/\D/g, '');
  
  try {
    // Update status in database via API
    await fetch(`http://localhost:3000/api/orders/${numericId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'processing' })
    });
    
    // Reload orders from database
    loadAdminOrders();
    
    // Refresh sales report if function exists
    if (typeof loadReportsData === 'function') {
      try {
        loadReportsData();
      } catch (error) {
        console.error('Error refreshing sales report:', error);
      }
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('Error updating order status. Make sure server is running.');
  }
}

async function completeOrder(orderId) {
  // Extract numeric ID from string like 'ORD-7' -> 7
  const numericId = orderId.replace(/\D/g, '');
  
  try {
    // Update status in database via API
    await fetch(`http://localhost:3000/api/orders/${numericId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    
    // Reload orders from database
    loadAdminOrders();
    
    // Refresh sales report if function exists
    if (typeof loadReportsData === 'function') {
      try {
        loadReportsData();
      } catch (error) {
        console.error('Error refreshing sales report:', error);
      }
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('Error updating order status. Make sure server is running.');
  }
}

async function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order?')) {
    return;
  }
  
  // Extract numeric ID from string like 'ORD-7' -> 7
  const numericId = orderId.replace(/\D/g, '');
  
  try {
    // Delete from database via API
    await fetch(`http://localhost:3000/api/orders/${numericId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Reload orders from database
    loadAdminOrders();
    
    // Refresh sales report if function exists
    if (typeof loadReportsData === 'function') {
      try {
        loadReportsData();
      } catch (error) {
        console.error('Error refreshing sales report:', error);
      }
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    alert('Error deleting order. Make sure server is running.');
  }
}

function updateAdminStats(orders) {
  const totalOrdersEl = document.querySelector('.stat-number');
  const revenueEl = document.querySelectorAll('.stat-number')[1];
  
  if (totalOrdersEl) {
    totalOrdersEl.textContent = orders.length;
  }
  
  if (revenueEl) {
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.Total) || 0), 0);
    revenueEl.textContent = `Rs. ${(totalRevenue / 1000).toFixed(0)}K`;
  }
}

// Load orders when admin dashboard loads
if (window.location.pathname.includes('admin-dashboard.html')) {
  loadAdminOrders();
}

// INITIALIZE CART ON PAGE LOAD
updateCartCount();
renderCart();
