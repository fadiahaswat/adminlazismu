/**
 * =====================================================================
 * UTILITIES - Helper Functions
 * =====================================================================
 */

/**
 * Format number to Indonesian Rupiah currency
 * @param {number} value - The number to format
 * @returns {string} Formatted currency string
 */
export function formatRupiah(value) {
  if (!value || isNaN(value)) return 'Rp 0';
  
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(value);
}

/**
 * Format date to Indonesian format
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const options = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return d.toLocaleDateString('id-ID', options);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

/**
 * Validate admin email against allowed list
 * @param {string} email - Email to validate
 * @param {string[]} allowedEmails - List of allowed emails
 * @returns {boolean} True if email is allowed
 */
export function isAdminEmail(email, allowedEmails) {
  if (!email || !Array.isArray(allowedEmails)) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  const allowedEmailsLower = allowedEmails.map(e => e.toLowerCase().trim());
  
  return allowedEmailsLower.includes(normalizedEmail);
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Show loading state on button
 * @param {HTMLElement} button - Button element
 * @param {boolean} isLoading - Loading state
 * @param {string} loadingText - Text to show when loading
 */
export function setButtonLoading(button, isLoading, loadingText = 'Memproses...') {
  if (!button) return;
  
  if (isLoading) {
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    button.disabled = false;
    delete button.dataset.originalHtml;
  }
}

/**
 * Show error message in element
 * @param {HTMLElement} element - Element to show error in
 * @param {string} message - Error message
 * @param {boolean} show - Whether to show or hide
 */
export function showError(element, message, show = true) {
  if (!element) return;
  
  if (show) {
    element.textContent = message;
    element.classList.remove('hidden');
    element.classList.add('flex');
  } else {
    element.textContent = '';
    element.classList.add('hidden');
    element.classList.remove('flex');
  }
}
