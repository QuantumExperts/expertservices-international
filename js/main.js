/* ============================================
   Expert Services International
   Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // --- Header scroll effect ---
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('header--scrolled', window.scrollY > 40);
    });
  }

  // --- Mobile menu toggle ---
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      nav.classList.toggle('nav--open');
      menuToggle.classList.toggle('active');
    });

    // Mobile dropdown toggles
    const dropdownParents = document.querySelectorAll('.nav__item--has-dropdown');
    dropdownParents.forEach(function (item) {
      const link = item.querySelector('.nav__link');
      link.addEventListener('click', function (e) {
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          item.classList.toggle('nav__item--open');
        }
      });
    });

    // Close mobile menu on link click
    const navLinks = document.querySelectorAll('.nav__dropdown-link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('nav--open');
        menuToggle.classList.remove('active');
      });
    });
  }

  // --- Scroll-triggered fade-up animations ---
  const fadeElements = document.querySelectorAll('.fade-up');
  if (fadeElements.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    fadeElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Active nav link highlighting ---
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const allNavLinks = document.querySelectorAll('.nav__link, .nav__dropdown-link');
  allNavLinks.forEach(function (link) {
    const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, '') || '/';
    if (linkPath === currentPath) {
      link.classList.add('nav__link--active');
    }
  });

  // --- Contact form handling ---
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const subject = encodeURIComponent(formData.get('subject') || 'Website Enquiry');
      const body = encodeURIComponent(
        'Name: ' + formData.get('name') + '\n' +
        'Email: ' + formData.get('email') + '\n' +
        'Phone: ' + formData.get('phone') + '\n\n' +
        formData.get('message')
      );
      window.location.href = 'mailto:contact@expertservices.com.au?subject=' + subject + '&body=' + body;
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
