// Global JavaScript functions and utilities

// Import Bootstrap
const bootstrap = window.bootstrap

// Show loading state
function showLoading(element) {
  const originalText = element.innerHTML
  element.innerHTML = '<span class="loading"></span> Đang xử lý...'
  element.disabled = true
  return originalText
}

// Hide loading state
function hideLoading(element, originalText) {
  element.innerHTML = originalText
  element.disabled = false
}

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer") || createToastContainer()

  const toast = document.createElement("div")
  toast.className = `toast align-items-center text-white bg-${type} border-0`
  toast.setAttribute("role", "alert")
  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `

  toastContainer.appendChild(toast)

  const bsToast = new bootstrap.Toast(toast)
  bsToast.show()

  // Remove toast after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove()
  })
}

// Create toast container if it doesn't exist
function createToastContainer() {
  const container = document.createElement("div")
  container.id = "toastContainer"
  container.className = "toast-container position-fixed top-0 end-0 p-3"
  container.style.zIndex = "9999"
  document.body.appendChild(container)
  return container
}

// Format date to Vietnamese format
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

// Format currency to Vietnamese format
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

// Confirm dialog with custom message
function confirmAction(message, callback) {
  if (confirm(message)) {
    callback()
  }
}

// Debounce function for search inputs
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Auto-submit search form with debounce
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search")
  if (searchInput) {
    const debouncedSubmit = debounce(() => {
      searchInput.closest("form").submit()
    }, 500)

    searchInput.addEventListener("input", debouncedSubmit)
  }

  // Add fade-in animation to cards
  const cards = document.querySelectorAll(".card")
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`
    card.classList.add("fade-in")
  })

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))

  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  popoverTriggerList.map((popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl))
})

// Handle form submissions with loading states
document.addEventListener("submit", (e) => {
  const form = e.target
  const submitBtn = form.querySelector('button[type="submit"]')

  if (submitBtn && !form.hasAttribute("data-no-loading")) {
    const originalText = showLoading(submitBtn)

    // Restore button state after 5 seconds (fallback)
    setTimeout(() => {
      hideLoading(submitBtn, originalText)
    }, 5000)
  }
})

// Handle AJAX errors globally
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason)
  showToast("Có lỗi xảy ra. Vui lòng thử lại.", "danger")
})

// Utility function for making API calls
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API call failed:", error)
    throw error
  }
}

// Book rating functionality
function initializeRating() {
  const ratingInputs = document.querySelectorAll('.star-rating input[type="radio"]')
  ratingInputs.forEach((input) => {
    input.addEventListener("change", function () {
      const rating = this.value
      const stars = this.closest(".star-rating").querySelectorAll("label")

      stars.forEach((star, index) => {
        if (index >= stars.length - rating) {
          star.style.color = "#ffc107"
        } else {
          star.style.color = "#ddd"
        }
      })
    })
  })
}

// Initialize rating on page load
document.addEventListener("DOMContentLoaded", initializeRating)

// Search functionality
function initializeSearch() {
  const searchForm = document.querySelector('form[action="/books"]')
  if (searchForm) {
    const inputs = searchForm.querySelectorAll("input, select")
    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.type !== "text") {
          searchForm.submit()
        }
      })
    })
  }
}

// Initialize search on page load
document.addEventListener("DOMContentLoaded", initializeSearch)

// Image lazy loading
function initializeLazyLoading() {
  const images = document.querySelectorAll("img[data-src]")

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        img.classList.remove("lazy")
        imageObserver.unobserve(img)
      }
    })
  })

  images.forEach((img) => imageObserver.observe(img))
}

// Initialize lazy loading if supported
if ("IntersectionObserver" in window) {
  document.addEventListener("DOMContentLoaded", initializeLazyLoading)
}

// Back to top button
function initializeBackToTop() {
  const backToTopBtn = document.createElement("button")
  backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>'
  backToTopBtn.className = "btn btn-primary position-fixed"
  backToTopBtn.style.cssText = `
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: none;
    `

  document.body.appendChild(backToTopBtn)

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  })

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.style.display = "block"
    } else {
      backToTopBtn.style.display = "none"
    }
  })
}

// Initialize back to top button
document.addEventListener("DOMContentLoaded", initializeBackToTop)

// Form validation helpers
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePhone(phone) {
  const re = /^[0-9]{10,11}$/
  return re.test(phone.replace(/\s/g, ""))
}

// Local storage helpers
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

function getFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Failed to get from localStorage:", error)
    return null
  }
}

// Export functions for use in other scripts
window.LibraryApp = {
  showLoading,
  hideLoading,
  showToast,
  formatDate,
  formatCurrency,
  confirmAction,
  apiCall,
  validateEmail,
  validatePhone,
  saveToLocalStorage,
  getFromLocalStorage,
}
