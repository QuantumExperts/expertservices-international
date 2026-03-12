/**
 * Expert Services International - Main JavaScript
 * Production-ready, vanilla JavaScript with no external dependencies
 * Handles: header scroll effects, mobile menu, dropdowns, animations, forms, and more
 */

'use strict';

// ============================================================================
// 1. HEADER SCROLL EFFECT
// ============================================================================

const HeaderScrollEffect = (() => {
  const SCROLL_THRESHOLD = 50;
  const HEADER_CLASS = 'header--scrolled';
  let headerElement = null;

  const init = () => {
    headerElement = document.querySelector('header');
    if (!headerElement) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial state in case page is already scrolled
    handleScroll();
  };

  const handleScroll = () => {
    const isScrolled = window.scrollY > SCROLL_THRESHOLD;
    const hasClass = headerElement.classList.contains(HEADER_CLASS);

    if (isScrolled && !hasClass) {
      headerElement.classList.add(HEADER_CLASS);
    } else if (!isScrolled && hasClass) {
      headerElement.classList.remove(HEADER_CLASS);
    }
  };

  return { init };
})();

// ============================================================================
// 2. MOBILE MENU
// ============================================================================

const MobileMenu = (() => {
  const MENU_OPEN_CLASS = 'nav--open';
  const SCROLL_LOCK_CLASS = 'scroll-lock';
  let navToggle = null;
  let navMenu = null;
  let navLinks = null;
  let isOpen = false;

  const init = () => {
    navToggle = document.querySelector('.nav__toggle');
    navMenu = document.querySelector('nav');
    navLinks = document.querySelectorAll('nav a[href*="/"], nav a[href*="#"]');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', toggle);
    navLinks.forEach(link => {
      link.addEventListener('click', close);
    });

    // Close menu when clicking outside
    document.addEventListener('click', handleOutsideClick);
    // Close menu on escape key
    document.addEventListener('keydown', handleEscapeKey);
  };

  const toggle = (e) => {
    e.stopPropagation();
    isOpen ? close() : open();
  };

  const open = () => {
    navMenu.classList.add(MENU_OPEN_CLASS);
    document.body.classList.add(SCROLL_LOCK_CLASS);
    navToggle.setAttribute('aria-expanded', 'true');
    isOpen = true;
  };

  const close = () => {
    navMenu.classList.remove(MENU_OPEN_CLASS);
    document.body.classList.remove(SCROLL_LOCK_CLASS);
    navToggle.setAttribute('aria-expanded', 'false');
    isOpen = false;
  };

  const handleOutsideClick = (e) => {
    if (isOpen && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      close();
    }
  };

  const handleEscapeKey = (e) => {
    if (isOpen && e.key === 'Escape') {
      close();
    }
  };

  return { init, open, close };
})();

// ============================================================================
// 3. DROPDOWN MENUS
// ============================================================================

const DropdownMenus = (() => {
  const DROPDOWN_OPEN_CLASS = 'dropdown--open';
  const HOVER_DELAY = 200;
  let dropdownTriggers = null;
  let hoverTimeouts = {};
  let isMobile = false;

  const init = () => {
    dropdownTriggers = document.querySelectorAll('[data-dropdown]');
    if (dropdownTriggers.length === 0) return;

    dropdownTriggers.forEach((trigger) => {
      const dropdownId = trigger.getAttribute('data-dropdown');
      const dropdown = document.getElementById(dropdownId);
      if (!dropdown) return;

      trigger.addEventListener('mouseenter', () => handleMouseEnter(trigger, dropdown));
      trigger.addEventListener('mouseleave', () => handleMouseLeave(trigger));
      trigger.addEventListener('click', (e) => handleClick(e, trigger, dropdown));
    });

    // Detect mobile
    updateDeviceType();
    window.addEventListener('resize', updateDeviceType, { passive: true });

    // Close all dropdowns on outside click
    document.addEventListener('click', closeAllDropdowns);
  };

  const updateDeviceType = () => {
    isMobile = window.innerWidth < 768;
  };

  const handleMouseEnter = (trigger, dropdown) => {
    if (isMobile) return;

    clearTimeout(hoverTimeouts[trigger.id]);
    hoverTimeouts[trigger.id] = setTimeout(() => {
      closeAllDropdowns();
      openDropdown(dropdown, trigger);
    }, HOVER_DELAY);
  };

  const handleMouseLeave = (trigger) => {
    if (isMobile) return;
    clearTimeout(hoverTimeouts[trigger.id]);
  };

  const handleClick = (e, trigger, dropdown) => {
    if (!isMobile) return;

    e.preventDefault();
    const isOpen = dropdown.classList.contains(DROPDOWN_OPEN_CLASS);

    closeAllDropdowns();
    if (!isOpen) {
      openDropdown(dropdown, trigger);
    }
  };

  const openDropdown = (dropdown, trigger) => {
    dropdown.classList.add(DROPDOWN_OPEN_CLASS);
    trigger.setAttribute('aria-expanded', 'true');
  };

  const closeDropdown = (dropdown, trigger) => {
    dropdown.classList.remove(DROPDOWN_OPEN_CLASS);
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  };

  const closeAllDropdowns = () => {
    dropdownTriggers.forEach((trigger) => {
      const dropdownId = trigger.getAttribute('data-dropdown');
      const dropdown = document.getElementById(dropdownId);
      if (dropdown) {
        closeDropdown(dropdown, trigger);
      }
    });
  };

  return { init };
})();

// ============================================================================
// 4. SCROLL ANIMATIONS (IntersectionObserver)
// ============================================================================

const ScrollAnimations = (() => {
  const VISIBLE_CLASS = 'visible';
  const OBSERVER_OPTIONS = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
  };

  const init = () => {
    const elementsToAnimate = document.querySelectorAll('.fade-up');
    if (elementsToAnimate.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add staggered delay to children
          const children = entry.target.querySelectorAll('[data-stagger]');
          if (children.length > 0) {
            children.forEach((child, childIndex) => {
              setTimeout(() => {
                child.classList.add(VISIBLE_CLASS);
              }, childIndex * 100);
            });
          }

          // Add visible class to the element itself
          entry.target.classList.add(VISIBLE_CLASS);
          observer.unobserve(entry.target);
        }
      });
    }, OBSERVER_OPTIONS);

    elementsToAnimate.forEach(element => {
      observer.observe(element);
    });
  };

  return { init };
})();

// ============================================================================
// 5. ACTIVE NAV LINK
// ============================================================================

const ActiveNavLink = (() => {
  const ACTIVE_CLASS = 'nav__link--active';

  const init = () => {
    updateActiveLink();
    // Re-check on link click (for single-page nav)
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(updateActiveLink, 100);
      });
    });
  };

  const updateActiveLink = () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a[href]');

    navLinks.forEach(link => {
      link.classList.remove(ACTIVE_CLASS);
      const href = link.getAttribute('href');

      // Check if this link matches the current page
      if (
        (currentPath.includes(href) && href !== '/') ||
        (currentPath === '/' && href === 'index.html') ||
        (currentPath === '/' && href === '/')
      ) {
        link.classList.add(ACTIVE_CLASS);
      }
    });
  };

  return { init };
})();

// ============================================================================
// 6. SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================================================

const SmoothScroll = (() => {
  const HEADER_OFFSET = 80;

  const init = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });
  };

  const handleAnchorClick = (e) => {
    const href = e.currentTarget.getAttribute('href');

    // Skip if just a hash
    if (href === '#') {
      e.preventDefault();
      return;
    }

    const targetElement = document.querySelector(href);
    if (!targetElement) return;

    e.preventDefault();

    const targetPosition = targetElement.offsetTop - HEADER_OFFSET;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    let start = null;

    const easeInOutQuad = (t) => {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutQuad(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  return { init };
})();

// ============================================================================
// 7. CONTACT FORM VALIDATION & SUBMISSION
// ============================================================================

const ContactForm = (() => {
  const REQUIRED_FIELDS = ['name', 'email', 'phone'];
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[0-9\-\+\(\)\s]{10,}$/;
  const SUCCESS_CLASS = 'form--success';
  const ERROR_CLASS = 'form--error';
  const ERROR_TIMEOUT = 5000;

  let form = null;
  let statusElement = null;

  const init = () => {
    form = document.querySelector('form[id*="contact"], form[id*="inquiry"]');
    if (!form) return;

    statusElement = document.createElement('div');
    statusElement.className = 'form__status';
    form.appendChild(statusElement);

    form.addEventListener('submit', handleSubmit);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clear previous status
    clearStatus();

    // Validate form
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      showError(validationResult.errors.join(', '));
      return;
    }

    // Collect form data
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message') || '',
      company: formData.get('company') || '',
      service: formData.get('service') || ''
    };

    // Create mailto link with form data
    const mailtoLink = constructMailto(data);

    try {
      // Open mail client
      window.location.href = mailtoLink;

      // Show success message
      showSuccess('Your email client is opening. Please complete sending the email.');

      // Reset form
      form.reset();
    } catch (error) {
      showError('Unable to open mail client. Please try again.');
      console.error('Mailto error:', error);
    }
  };

  const validateForm = () => {
    const errors = [];
    const formData = new FormData(form);

    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      const value = formData.get(field);
      if (!value || value.trim() === '') {
        errors.push(`${capitalizeField(field)} is required`);
      }
    });

    // Validate email format
    const email = formData.get('email');
    if (email && !EMAIL_REGEX.test(email)) {
      errors.push('Please enter a valid email address');
    }

    // Validate phone format (basic)
    const phone = formData.get('phone');
    if (phone && !PHONE_REGEX.test(phone)) {
      errors.push('Please enter a valid phone number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const constructMailto = (data) => {
    const recipientEmail = 'info@esi-international.com'; // Update with actual email
    const subject = `Inquiry from ${data.name}`;

    const body = `
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
${data.company ? `Company: ${data.company}` : ''}
${data.service ? `Service Interest: ${data.service}` : ''}

Message:
${data.message}
    `.trim();

    return `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const showSuccess = (message) => {
    if (!statusElement) return;
    statusElement.textContent = message || 'Thank you! Your message has been sent.';
    statusElement.className = 'form__status form__status--success';
    form.classList.add(SUCCESS_CLASS);
  };

  const showError = (message) => {
    if (!statusElement) return;
    statusElement.textContent = message || 'An error occurred. Please try again.';
    statusElement.className = 'form__status form__status--error';
    form.classList.add(ERROR_CLASS);

    // Auto-clear error after timeout
    setTimeout(clearStatus, ERROR_TIMEOUT);
  };

  const clearStatus = () => {
    if (!statusElement) return;
    statusElement.textContent = '';
    statusElement.className = 'form__status';
    form.classList.remove(SUCCESS_CLASS, ERROR_CLASS);
  };

  const capitalizeField = (field) => {
    return field.charAt(0).toUpperCase() + field.slice(1);
  };

  return { init };
})();

// ============================================================================
// 8. PARALLAX EFFECT
// ============================================================================

const ParallaxEffect = (() => {
  const PARALLAX_ELEMENTS = '.parallax-hero, [data-parallax]';
  let parallaxElements = null;
  let animationFrameId = null;

  const init = () => {
    parallaxElements = document.querySelectorAll(PARALLAX_ELEMENTS);
    if (parallaxElements.length === 0) return;

    // Initial calculation
    updateParallax();

    // Use throttled scroll listener
    window.addEventListener('scroll', () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(updateParallax);
    }, { passive: true });
  };

  const updateParallax = () => {
    parallaxElements.forEach(element => {
      const scrolled = window.scrollY;
      const elementOffset = element.offsetTop;
      const distance = scrolled - elementOffset;
      const yPos = distance * 0.5; // 50% parallax speed

      // Only apply parallax if element is in viewport vicinity
      if (Math.abs(distance) < window.innerHeight * 1.5) {
        element.style.backgroundPosition = `center ${yPos}px`;
      }
    });
  };

  return { init };
})();

// ============================================================================
// 9. COUNTER ANIMATION
// ============================================================================

const CounterAnimation = (() => {
  const COUNTER_ELEMENTS = '.counter';
  const ANIMATION_DURATION = 2000;
  const UPDATE_INTERVAL = 30;

  const init = () => {
    const counters = document.querySelectorAll(COUNTER_ELEMENTS);
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          animateCounter(entry.target);
          entry.target.dataset.animated = 'true';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
      observer.observe(counter);
    });
  };

  const animateCounter = (element) => {
    const finalValue = parseInt(element.textContent, 10);
    let currentValue = 0;
    const startTime = Date.now();
    const steps = Math.ceil(ANIMATION_DURATION / UPDATE_INTERVAL);
    const increment = finalValue / steps;

    const counter = setInterval(() => {
      currentValue += increment;
      if (currentValue >= finalValue) {
        element.textContent = finalValue;
        clearInterval(counter);
      } else {
        element.textContent = Math.floor(currentValue);
      }
    }, UPDATE_INTERVAL);
  };

  return { init };
})();

// ============================================================================
// 10. BACK TO TOP BUTTON
// ============================================================================

const BackToTopButton = (() => {
  const SCROLL_THRESHOLD = 300;
  const ANIMATION_DURATION = 800;
  let backToTopBtn = null;

  const init = () => {
    // Create button if it doesn't exist
    backToTopBtn = document.getElementById('back-to-top') || createButton();
    if (!backToTopBtn) return;

    backToTopBtn.addEventListener('click', scrollToTop);
    window.addEventListener('scroll', toggleVisibility, { passive: true });

    // Initial state
    toggleVisibility();
  };

  const createButton = () => {
    const button = document.createElement('button');
    button.id = 'back-to-top';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = '&#8593;'; // Up arrow
    document.body.appendChild(button);
    return button;
  };

  const toggleVisibility = () => {
    const isScrolled = window.scrollY > SCROLL_THRESHOLD;
    const isVisible = backToTopBtn.classList.contains('visible');

    if (isScrolled && !isVisible) {
      backToTopBtn.classList.add('visible');
    } else if (!isScrolled && isVisible) {
      backToTopBtn.classList.remove('visible');
    }
  };

  const scrollToTop = () => {
    const startPosition = window.scrollY;
    const distance = -startPosition;
    let start = null;

    const easeInOutQuad = (t) => {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const ease = easeInOutQuad(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  return { init };
})();

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all modules when DOM is ready
 */
const initializeModules = () => {
  // Header
  HeaderScrollEffect.init();

  // Navigation
  MobileMenu.init();
  DropdownMenus.init();
  ActiveNavLink.init();

  // Animations
  ScrollAnimations.init();
  ParallaxEffect.init();
  CounterAnimation.init();

  // Interactions
  SmoothScroll.init();
  BackToTopButton.init();

  // Forms
  ContactForm.init();
};

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeModules);
} else {
  // DOM is already loaded
  initializeModules();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Debounce function for optimizing event handlers
 */
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Throttle function for performance-critical handlers
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Export utilities if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HeaderScrollEffect,
    MobileMenu,
    DropdownMenus,
    ScrollAnimations,
    ActiveNavLink,
    SmoothScroll,
    ContactForm,
    ParallaxEffect,
    CounterAnimation,
    BackToTopButton,
    debounce,
    throttle
  };
}
