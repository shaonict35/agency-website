// Insight Creative Studio - Admin Panel Core Script

let allPages = [];
let currentPage = null;
let currentPageRawContent = '';
let currentSections = [];
let mediaList = [];

// Target data for active file replacement triggers
let activeReplaceTarget = null;
let activeTestimonialVideoIndex = null;
let activePartnerIndex = null;
let allSiteMediaCache = [];

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupTabs();
  setupEventListeners();
  setupSearchFilters();
  setupFilePickers();
  await loadPages();
  await loadMedia();
  await loadAllSiteMediaCounts();
  
  // Load homepage by default
  const home = allPages.find(p => p.id === 'home') || allPages[0];
  if (home) {
    selectPage(home.id);
  }
});

// Setup navigation clicks
function setupNavigation() {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.dataset.page;
      const view = item.dataset.view;
      
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

            if (view === 'media') {
        openMediaView();
      } else if (view === 'global') {
        openGlobalSettings();
      } else if (pageId) {
        selectPage(pageId);
      }
    });
  });
}

// Setup view tabs (Visual Editor vs Images/Videos vs Code Editor)
function setupTabs() {
  document.querySelectorAll('.topbar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.topbar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      
      document.querySelectorAll('.editor-view').forEach(v => v.classList.remove('active'));
      const activeView = document.getElementById(target);
      if (activeView) activeView.classList.add('active');

      if (target === 'view-page-media') {
        renderPageMediaInspector();
      } else if (target === 'view-code') {
        // Sync visual to raw code if needed
        syncVisualToCode();
      }
    });
  });
}

function setupEventListeners() {
  // Save button
  const saveBtn = document.getElementById('btn-save-all');
  if (saveBtn) saveBtn.addEventListener('click', saveCurrentPage);

  // Raw code change
  const rawTextarea = document.getElementById('raw-code-editor');
  if (rawTextarea) {
    rawTextarea.addEventListener('input', () => {
      currentPageRawContent = rawTextarea.value;
    });
  }

  // Upload dropzone
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('media-file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleFileUpload(fileInput.files[0]);
      }
    });
  }

  // Logout Actions
  const logoutAction = () => {
    if (confirm('Are you sure you want to sign out from the Admin CMS?')) {
      sessionStorage.removeItem('insight_admin_logged_in');
      sessionStorage.removeItem('insight_admin_user');
      sessionStorage.removeItem('insight_admin_token');
      localStorage.removeItem('insight_admin_logged_in');
      localStorage.removeItem('insight_admin_user');
      window.location.replace('/admin/login.html');
    }
  };

  const topbarLogout = document.getElementById('btn-topbar-logout');
  if (topbarLogout) topbarLogout.addEventListener('click', logoutAction);

  const sidebarLogout = document.getElementById('btn-sidebar-logout');
  if (sidebarLogout) sidebarLogout.addEventListener('click', logoutAction);
}

function setupSearchFilters() {
  // Filter for active page media
  const pageMediaSearch = document.getElementById('page-media-search');
  if (pageMediaSearch) {
    pageMediaSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#page-videos-container .video-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
      document.querySelectorAll('#page-images-container .page-image-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }



  // Filter for Library
  const libFilter = document.getElementById('library-filter');
  if (libFilter) {
    libFilter.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#media-items-grid .media-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  }
}

function setupFilePickers() {
  // Page Image Replacement File Input
  const imgInput = document.getElementById('page-img-replace-input');
  if (imgInput) {
    imgInput.addEventListener('change', async () => {
      if (imgInput.files.length > 0 && activeReplaceTarget) {
        const file = imgInput.files[0];
        await handleImageReplacement(file, activeReplaceTarget);
        imgInput.value = '';
      }
    });
  }

  // Page Video Replacement File Input
  const vidInput = document.getElementById('page-vid-replace-input');
  if (vidInput) {
    vidInput.addEventListener('change', async () => {
      if (vidInput.files.length > 0 && activeReplaceTarget) {
        const file = vidInput.files[0];
        await handleVideoReplacement(file, activeReplaceTarget);
        vidInput.value = '';
      }
    });
  }



  // Partner Logo Replacement File Input
  const partnerUploadInput = document.getElementById('partner-logo-upload-input');
  if (partnerUploadInput) {
    partnerUploadInput.addEventListener('change', async () => {
      if (partnerUploadInput.files.length > 0 && activePartnerIndex !== null) {
        const file = partnerUploadInput.files[0];
        await handlePartnerLogoFileReplacement(file, activePartnerIndex);
        partnerUploadInput.value = '';
      }
    });
  }

  // Partner Logo Add New File Input
  const partnerAddInput = document.getElementById('partner-logo-add-input');
  if (partnerAddInput) {
    partnerAddInput.addEventListener('change', async () => {
      if (partnerAddInput.files.length > 0) {
        const file = partnerAddInput.files[0];
        await handlePartnerLogoFileAdd(file);
        partnerAddInput.value = '';
      }
    });
  }

  // Testimonial Video Upload File Input
  const testiVidInput = document.getElementById('testi-vid-upload-input');
  if (testiVidInput) {
    testiVidInput.addEventListener('change', async () => {
      if (testiVidInput.files.length > 0 && activeTestimonialVideoIndex !== null) {
        const file = testiVidInput.files[0];
        await handleTestimonialVideoUpload(file, activeTestimonialVideoIndex);
        testiVidInput.value = '';
      }
    });
  }

  // Pricing Showcase Video Upload File Input
  const pricingVidInput = document.getElementById('pricing-vid-upload-input');
  if (pricingVidInput) {
    pricingVidInput.addEventListener('change', async () => {
      if (pricingVidInput.files.length > 0) {
        const file = pricingVidInput.files[0];
        await handlePricingVideoUpload(file);
        pricingVidInput.value = '';
      }
    });
  }
}

async function loadAllSiteMediaCounts() {
  try {
    const res = await fetch('/api/all-site-media');
    if (res.ok) {
      allSiteMediaCache = await res.json();
      let totalVids = 0;
      let totalImgs = 0;
      allSiteMediaCache.forEach(p => {
        totalVids += (p.videos ? p.videos.length : 0);
        totalImgs += (p.images ? p.images.length : 0);
      });
      const vidBadge = document.getElementById('sidebar-video-count');
      if (vidBadge) vidBadge.textContent = totalVids + ' vids';
      const imgBadge = document.getElementById('sidebar-image-count');
      if (imgBadge) imgBadge.textContent = totalImgs + ' imgs';
    }
  } catch (err) {
    console.error('Count load error:', err);
  }
}

// Fetch pages list from API or fallback
async function loadPages() {
  try {
    const res = await fetch('/api/pages');
    if (res.ok) {
      allPages = await res.json();
    } else {
      throw new Error('API failed');
    }
  } catch (err) {
    // Standard pages list fallback
    allPages = [
      { id: 'home', title: 'Home Page', path: 'index.html', icon: '🏠', url: '/' },
      { id: 'about', title: 'About Us', path: 'about/index.html', icon: 'ℹ️', url: '/about/' },
      { id: 'interior-design', title: 'Interior Design', path: 'interior-design/index.html', icon: '🛋️', url: '/interior-design/' },
      { id: 'digital-marketing', title: 'Digital Marketing', path: 'digital-marketing/index.html', icon: '📈', url: '/digital-marketing/' },
      { id: 'graphic-design', title: 'Graphic Design', path: 'graphic-design/index.html', icon: '🎨', url: '/graphic-design/' },
      { id: 'video-editing', title: 'Video Editing', path: 'video-editing/index.html', icon: '🎬', url: '/video-editing/' },
      { id: 'branding', title: 'Branding & Identity', path: 'branding/index.html', icon: '✨', url: '/branding/' },
      { id: 'pricing', title: 'Pricing Plans', path: 'pricing/index.html', icon: '💰', url: '/pricing/' },
      { id: 'team', title: 'Team Members', path: 'team/index.html', icon: '👥', url: '/team/' },
      { id: 'faqs', title: 'FAQs', path: 'faqs/index.html', icon: '❓', url: '/faqs/' },
      { id: 'testimonial', title: 'Testimonials', path: 'testimonial/index.html', icon: '⭐', url: '/testimonial/' },
      { id: 'features', title: 'Features & Process', path: 'features/index.html', icon: '⚡', url: '/features/' },
      { id: 'blog', title: 'Blog', path: 'blog/index.html', icon: '📝', url: '/blog/' },
      { id: 'contact', title: 'Contact Us', path: 'contact/index.html', icon: '📞', url: '/contact/' },
      { id: 'privacy-policy', title: 'Privacy Policy', path: 'privacy-policy/index.html', icon: '🔒', url: '/privacy-policy/' },
      { id: 'terms-and-conditions', title: 'Terms & Conditions', path: 'terms-and-conditions/index.html', icon: '⚖️', url: '/terms-and-conditions/' },
      { id: 'cookie-policy', title: 'Cookie Policy', path: 'cookie-policy/index.html', icon: '🍪', url: '/cookie-policy/' }
    ];
  }
}

// Select a page and load its content
async function selectPage(pageId) {
  const page = allPages.find(p => p.id === pageId);
  if (!page) return;
  currentPage = page;

  // Update topbar
  document.getElementById('current-page-title').textContent = page.title;
  document.getElementById('current-file-badge').textContent = page.path;
  document.getElementById('live-preview-link').href = page.url || '/' + page.path;

  // Switch to visual view
  document.querySelectorAll('.topbar-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.topbar-tab[data-target="view-visual"]').classList.add('active');
  document.querySelectorAll('.editor-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-visual').classList.add('active');

  // Fetch page content
  try {
    const res = await fetch(`/api/page?path=${encodeURIComponent(page.path)}`);
    if (res.ok) {
      const data = await res.json();
      currentPageRawContent = data.content;
    } else {
      // Fallback: direct fetch from static file
      const fetchRes = await fetch('/' + page.path);
      currentPageRawContent = await fetchRes.text();
    }
  } catch (err) {
    const fetchRes = await fetch('/' + page.path);
    currentPageRawContent = await fetchRes.text();
  }

  // Populate Raw Editor
  document.getElementById('raw-code-editor').value = currentPageRawContent;

  const currTitle = document.getElementById('page-media-curr-page');
  if (currTitle) currTitle.textContent = page.title;

  // Parse sections and render visual editor
  parseAndRenderSections();

  // If Images & Videos tab was open, refresh it as well
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
}

// Parse HTML content into sections
function parseAndRenderSections() {
  const container = document.getElementById('visual-sections-container');
  if (!container) return;
  container.innerHTML = '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');

  currentSections = [];

  const safeRender = (fn, ...args) => {
    try {
      fn(...args);
    } catch (e) {
      console.warn('Section render error:', e);
    }
  };

  // 1. SEO & Headings
  const title = doc.querySelector('title')?.innerText || '';
  const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  safeRender(renderSEOSection, container, title, desc, canonical);

  // 2. Hero Section (if exists)
  const heroArea = doc.querySelector('.as-hero-1-area') || doc.querySelector('.as-breadcrumb-area');
  if (heroArea) safeRender(renderHeroSection, container, heroArea);

  // 3. About / Process
  const aboutSec = doc.querySelector('.as-about-1-area') || doc.querySelector('.as-about-2-area') || doc.querySelector('.tx_about');
  if (aboutSec) safeRender(renderGeneralSection, container, 'About & Highlights', 'ℹ️', aboutSec, 'about');

  // 3.5. Features Section
  const featuresSec = doc.querySelector('.as-features-1-area') || doc.querySelector('#features');
  if (featuresSec) safeRender(renderFeaturesSection, container, featuresSec);

  // 4. Services Grid
  const servicesSec = doc.querySelector('.as-services-1-area') || doc.querySelector('.as-service-1-area') || doc.querySelector('.tx_services') || doc.querySelector('.tx_service_section');
  if (servicesSec) safeRender(renderServicesSection, container, servicesSec);

  // 4.5. Partners & Brand Collaboration Logos
  const partnerSec = doc.querySelector('.as-partner-1-area') || doc.querySelector('.tx_brand');
  if (partnerSec) safeRender(renderPartnerSection, container, partnerSec);

  // 4.7. Portfolio Showcase (Crafting Success Through Design & Strategy)
  const portfolioSec = doc.querySelector('.as-portfolio-1-area') || doc.querySelector('.as-portfolio-1-wrap');
  if (portfolioSec) safeRender(renderPortfolioSection, container, portfolioSec);

  // 4.8. Testimonial Videos (2 Video fields)
  const testimonialSec = doc.querySelector('.as-testimonial-1-area') || doc.querySelector('.tx_testimonial') || doc.querySelector('#testimonial');
  if (testimonialSec) safeRender(renderTestimonialVideoSection, container, testimonialSec);

  // 5. Pricing Section & Left Video Showcase
  const pricingSec = doc.querySelector('.as-price-1-area') || doc.querySelector('.as-pricing-1-area') || doc.querySelector('.tx_pricing') || doc.querySelector('.tx_pricing_section');
  if (pricingSec) safeRender(renderPricingSection, container, pricingSec);

  // 5.5. Team Members (Experts Who Care About Your Growth)
  const teamSec = doc.querySelector('.as-team-1-area') || doc.querySelector('.tx_team_lists') || doc.querySelector('.as-team-1-wrap');
  if (teamSec) safeRender(renderTeamSection, container, teamSec);

  // 6. FAQs Section
  const faqSec = doc.querySelector('.as-faqs-1-area') || doc.querySelector('.as-faq-1-area') || doc.querySelector('.tx_tabs') || doc.querySelector('.tx_faq');
  if (faqSec) safeRender(renderFAQSection, container, faqSec);

  // 6.5. Blog & Articles Section
  const blogSec = doc.querySelector('.as-blog-1-area') || doc.querySelector('.tz-blog-item') || doc.querySelector('.tx-blog-box');
  if (blogSec) safeRender(renderBlogSection, container, blogSec);

  // 7. CTA / Contact Banner
  const ctaSec = doc.querySelector('.as-cta-1-area') || doc.querySelector('.as-cta-2-area') || doc.querySelector('.tx_cta');
  if (ctaSec) safeRender(renderGeneralSection, container, 'Call To Action (CTA)', '📣', ctaSec, 'cta');

  // 8. Footer Section
  const footerSec = doc.querySelector('.as-footer-1-area') || doc.querySelector('footer');
  if (footerSec) safeRender(renderFooterSection, container, footerSec);

  // Add collapsible toggle functionality
  safeRender(setupSectionAccordions);
}

function renderSEOSection(container, title, desc, canonical) {
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">🔍</div>
        <div>
          <h3>SEO & Meta Information</h3>
          <p>Search engine rankings, title tag, and canonical URL</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-grid">
        <div class="form-group full-width">
          <label>Browser Page Title (&lt;title&gt;)</label>
          <input type="text" class="form-control" id="seo-title" value="${escapeHtml(title)}">
        </div>
        <div class="form-group full-width">
          <label>Meta Description</label>
          <textarea class="form-control" id="seo-desc">${escapeHtml(desc)}</textarea>
        </div>
        <div class="form-group full-width">
          <label>Canonical URL</label>
          <input type="text" class="form-control" id="seo-canonical" value="${escapeHtml(canonical)}">
        </div>
      </div>
      <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('SEO Settings')">💾 Save SEO Settings</button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function renderHeroSection(container, el) {
  const title = el.querySelector('.hero-title')?.innerHTML || el.querySelector('.as-breadcrumb-title')?.innerText || '';
  const disc = el.querySelector('.hero-disc')?.innerText || '';
  const btn = el.querySelector('.as-pr-btn-1-v2') || el.querySelector('.as-pr-btn-1');
  const btnText = btn?.querySelector('.text')?.innerText || btn?.innerText || '';
  const btnHref = btn?.getAttribute('href') || '';
  const emailLink = el.querySelector('.box-address a')?.getAttribute('href') || '';

  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">🚀</div>
        <div>
          <h3>Hero / Main Header Banner</h3>
          <p>Primary headline, intro description, and schedule action</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-grid">
        <div class="form-group full-width">
          <label>Hero Headline (H1)</label>
          <input type="text" class="form-control" id="hero-title-input" value="${escapeHtml(title.replace(/<br\s*\/?>/gi, ' '))}">
        </div>
        <div class="form-group full-width">
          <label>Introduction Description</label>
          <textarea class="form-control" id="hero-disc-input">${escapeHtml(disc)}</textarea>
        </div>
        <div class="form-group">
          <label>Button Label</label>
          <input type="text" class="form-control" id="hero-btn-text" value="${escapeHtml(btnText)}">
        </div>
        <div class="form-group">
          <label>Button Target URL</label>
          <input type="text" class="form-control" id="hero-btn-href" value="${escapeHtml(btnHref)}">
        </div>
        <div class="form-group full-width">
          <label>Booking Box Email</label>
          <input type="text" class="form-control" id="hero-email-input" value="${escapeHtml(emailLink.replace('mailto:', ''))}">
        </div>
      </div>
      <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('Hero Section')">💾 Save Hero Section</button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function renderGeneralSection(container, name, icon, el, key) {
  const heading = el.querySelector('h2, h3, .title, .as-h-1')?.innerText || '';
  const p = el.querySelector('p, .disc, .as-p-1')?.innerText || '';

  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">${icon}</div>
        <div>
          <h3>${name}</h3>
          <p>Section headlines, body content, and callouts</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-grid">
        <div class="form-group full-width">
          <label>Section Heading</label>
          <input type="text" class="form-control sec-heading-${key}" value="${escapeHtml(heading)}">
        </div>
        <div class="form-group full-width">
          <label>Section Paragraph / Description</label>
          <textarea class="form-control sec-desc-${key}">${escapeHtml(p)}</textarea>
        </div>
      </div>
      <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('${escapeHtml(name)}')">💾 Save ${escapeHtml(name)}</button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function renderServicesSection(container, el) {
  const services = el.querySelectorAll('.as-services-1-item, .as-service-1-item, .service-item');
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">🛠️</div>
        <div>
          <h3>Services Showcase</h3>
          <p>List of creative, marketing, and interior design services</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 15px;">Found ${services.length} service item(s) on this page.</p>
      <div class="form-grid">
        ${Array.from(services).slice(0, 6).map((s, idx) => `
          <div class="form-group">
            <label>Service #${idx + 1} Name</label>
            <input type="text" class="form-control service-name-input" value="${escapeHtml(s.querySelector('h4, h3, .title')?.innerText || '')}">
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('Services Showcase')">💾 Save Services</button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

// ==========================================
// PARTNERS & COLLABORATION LOGOS SECTION
// ==========================================
function renderPartnerSection(container, el) {
  const heading = el.querySelector('.as-sec-title-1, h2')?.innerText || 'We believe in the power of collaboration';
  const logoElements = el.querySelectorAll('.as-partner-1-logo-single');
  const logos = [];

  logoElements.forEach((single, idx) => {
    const img = single.querySelector('img');
    const num = single.querySelector('.number')?.innerText || String(idx + 1).padStart(2, '0');
    logos.push({
      src: img?.getAttribute('src') || '',
      alt: img?.getAttribute('alt') || '',
      number: num
    });
  });

  const card = document.createElement('div');
  card.className = 'section-card';
  card.id = 'sec-card-partners';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">🤝</div>
        <div>
          <h3>Partners & Collaboration Logos</h3>
          <p>Section title and ${logos.length} partner logos (upload, change or add new logos)</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-group full-width">
        <label>Section Heading</label>
        <input type="text" class="form-control" id="partner-sec-heading" value="${escapeHtml(heading)}">
      </div>

      <div style="margin-top: 15px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <label style="font-size: 13px; font-weight: 700; color: var(--text-main);">
            Partner Logo Items (${logos.length} Logos Currently):
          </label>
          <span style="font-size: 11px; color: var(--text-muted);">Changes save and reflect live on the website</span>
        </div>
        
        <div class="partner-logos-admin-grid" id="partner-logos-grid-container">
          ${logos.map((logo, i) => `
            <div class="partner-logo-admin-card" id="partner-card-${i}">
              <div class="partner-logo-admin-thumb">
                <span class="partner-logo-number-badge">#${escapeHtml(logo.number)}</span>
                <button type="button" class="btn-remove-partner" title="Remove this partner logo" onclick="removePartnerLogo(${i})">✕</button>
                <img src="${logo.src}" id="partner-thumb-${i}" alt="Partner Logo">
              </div>
              <input type="text" class="form-control" style="font-size: 11px;" id="partner-input-${i}" value="${escapeHtml(logo.src)}">
              <div class="partner-logo-actions">
                <button type="button" class="btn-update-src" style="flex: 1; padding: 6px; font-size: 11px;" onclick="updatePartnerLogoPathFromCard(${i})">
                  🔄 Save
                </button>
                <button type="button" class="btn-upload-pc" style="flex: 2; padding: 6px; font-size: 11px;" onclick="triggerPartnerLogoUpload(${i})">
                  💻 Upload PC
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; padding-top: 15px; border-top: 1px dashed var(--border-color);">
          <button type="button" class="btn-add-partner-logo" onclick="triggerAddNewPartnerLogo()">
            <span>➕ Upload & Add New Partner Logo from PC</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="addNewPartnerLogoPlaceholder()">
            <span>➕ Add Item from Existing Path</span>
          </button>
          <button type="button" class="btn btn-primary" style="margin-left: auto;" onclick="saveSectionDirectly('Partners Section')">
            💾 Save Partners Section
          </button>
        </div>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function triggerPartnerLogoUpload(index) {
  activePartnerIndex = index;
  document.getElementById('partner-logo-upload-input').click();
}

async function handlePartnerLogoFileReplacement(file, index) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    showToast('info', `Uploading partner logo ${file.name}...`);
    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          data: base64Data
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newUrl = data.url;
        showToast('success', `Uploaded ${file.name}! Updating partner #${index + 1}...`);
        
        await updatePartnerLogoInHtml(index, newUrl);
        showToast('success', `Partner logo updated successfully!`);
      } else {
        throw new Error('Upload error');
      }
    } catch (err) {
      showToast('error', `Failed: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

function triggerAddNewPartnerLogo() {
  document.getElementById('partner-logo-add-input').click();
}

async function handlePartnerLogoFileAdd(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    showToast('info', `Uploading new partner logo ${file.name}...`);
    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          data: base64Data
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newUrl = data.url;
        showToast('success', `Uploaded ${file.name}! Adding to Partners section...`);
        
        await appendPartnerLogoToHtml(newUrl);
        showToast('success', `New partner logo added successfully!`);
      } else {
        throw new Error('Upload error');
      }
    } catch (err) {
      showToast('error', `Failed: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

async function updatePartnerLogoPathFromCard(index) {
  const input = document.getElementById(`partner-input-${index}`);
  if (!input) return;
  const newUrl = input.value.trim();
  await updatePartnerLogoInHtml(index, newUrl);
  showToast('success', `Partner #${index + 1} path updated and saved!`);
}

async function updatePartnerLogoInHtml(index, newUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const partnerLogoSingles = doc.querySelectorAll('.as-partner-1-logo .as-partner-1-logo-single');
  
  if (partnerLogoSingles[index]) {
    const img = partnerLogoSingles[index].querySelector('img');
    if (img) img.setAttribute('src', newUrl);
  }

  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  document.getElementById('raw-code-editor').value = currentPageRawContent;
  await saveCurrentPage();

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
}

async function appendPartnerLogoToHtml(newUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const partnerContainer = doc.querySelector('.as-partner-1-logo');
  
  if (partnerContainer) {
    const existingCount = partnerContainer.querySelectorAll('.as-partner-1-logo-single').length;
    const nextNum = String(existingCount + 1).padStart(2, '0');
    
    const div = doc.createElement('div');
    div.className = 'as-partner-1-logo-single wa-p-relative wow fadeInRight2';
    div.setAttribute('data-wow-delay', '.1s');
    div.innerHTML = `\n                        <img decoding="async" src="${newUrl}" alt="">\n                        <p class="as-p-1 number">${nextNum}</p>\n                    `;
    partnerContainer.appendChild(div);
  }

  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  document.getElementById('raw-code-editor').value = currentPageRawContent;
  await saveCurrentPage();

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
}

async function addNewPartnerLogoPlaceholder() {
  const path = prompt('Enter image path for new partner logo:', '/assets/images/p1-logo-1.webp');
  if (path && path.trim()) {
    await appendPartnerLogoToHtml(path.trim());
    showToast('success', 'New partner logo item added!');
  }
}

async function removePartnerLogo(index) {
  if (!confirm(`Are you sure you want to remove partner logo #${index + 1}?`)) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const partnerLogoSingles = doc.querySelectorAll('.as-partner-1-logo .as-partner-1-logo-single');
  
  if (partnerLogoSingles[index]) {
    partnerLogoSingles[index].remove();
  }

  const remaining = doc.querySelectorAll('.as-partner-1-logo .as-partner-1-logo-single');
  remaining.forEach((single, i) => {
    const numP = single.querySelector('.number');
    if (numP) numP.textContent = String(i + 1).padStart(2, '0');
  });

  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  document.getElementById('raw-code-editor').value = currentPageRawContent;
  await saveCurrentPage();

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
  showToast('success', 'Partner logo removed and list updated!');
}

// ==========================================
// TESTIMONIAL VIDEOS SECTION (Client Stories)
// ==========================================
function renderTestimonialVideoSection(container, el) {
  const card = document.createElement('div');
  card.className = 'section-card';

  // Find all .as-testimonial-1-video elements
  const vidWrappers = Array.from(el.querySelectorAll('.as-testimonial-1-video')).filter(w => !w.parentElement.closest('.as-testimonial-1-video'));
  const vids = [];
  vidWrappers.forEach(wrap => {
    const iframe = wrap.querySelector('iframe');
    const video = wrap.querySelector('video');
    if (iframe) {
      vids.push({ type: 'iframe', src: iframe.getAttribute('src') || '', elem: wrap });
    } else if (video) {
      vids.push({ type: 'video', src: video.getAttribute('src') || '', elem: wrap });
    }
  });

  // Default fallback if none found in DOM
  if (vids.length === 0) {
    vids.push({ type: 'iframe', src: 'https://www.youtube.com/embed/ea6Hd25PobQ?autoplay=1&mute=1&loop=1' });
    vids.push({ type: 'iframe', src: 'https://www.youtube.com/embed/FvSn_2LtFNg?autoplay=1&mute=1&loop=1' });
  } else if (vids.length === 1) {
    vids.push({ type: 'iframe', src: 'https://www.youtube.com/embed/FvSn_2LtFNg?autoplay=1&mute=1&loop=1' });
  }

  // Ensure 2 distinct testimonial video slots (Slot 1 in left column, Slot 2 in right column)
  const displayedVids = vids.slice(0, 2);

  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">🎬</div>
        <div>
          <h3>{★} Testimonials: Client Success Story Videos</h3>
          <p>Directly change YouTube links or upload .mp4 videos from PC for both video slots</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div style="margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 13px; color: var(--text-secondary);">
          <strong>Section:</strong> <code>Our clients' success stories inspire us every day.</code>
        </span>
        <span class="badge" style="background: rgba(253,63,0,0.15); color: #fd3f00; border: 1px solid rgba(253,63,0,0.3); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">
          2 Video Fields Active
        </span>
      </div>

      <div class="videos-grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px;">
        ${displayedVids.map((vid, idx) => {
          const isYouTube = vid.src.includes('youtube') || vid.src.includes('youtu.be');
          const isLocal = vid.src.endsWith('.mp4') || vid.src.endsWith('.webm') || vid.src.includes('/assets/videos/');
          const badgeText = isYouTube ? 'YouTube Embed' : (isLocal ? 'Uploaded MP4 Video' : 'Video Source');
          const labelTitle = idx === 0 ? 'Video #1 (Left Column)' : 'Video #2 (Right Column)';

          let previewSrc = vid.src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
          previewSrc = previewSrc.replace(/[?&]autoplay=[0-9]/g, '').replace(/[?&]loop=[0-9]/g, '');

          const mediaPreviewHtml = isYouTube 
            ? `<iframe src="${escapeHtml(previewSrc)}" style="width: 100%; height: 100%; border: none;" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`
            : `<video src="${escapeHtml(vid.src)}" controls playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>`;

          return `
            <div class="video-card">
              <div class="video-preview-wrap" style="height: 200px; background: #000; position: relative;">
                <span class="video-type-badge">${badgeText}</span>
                ${mediaPreviewHtml}
              </div>
              <div class="video-details">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 13px; color: #fff;">${labelTitle}</strong>
                  <span style="font-size: 11px; color: var(--accent); font-weight: 600;">Slot ${idx + 1}</span>
                </div>
                <div class="video-url-label">Video URL or File Path</div>
                <input type="text" class="form-control" id="testi-vid-url-${idx}" value="${escapeHtml(vid.src)}" placeholder="Paste YouTube link or /assets/videos/...">
                <div class="video-actions-row">
                  <button type="button" class="btn-update-src" onclick="updateTestimonialVideoUrl(${idx})">
                    🔄 Update Link
                  </button>
                  <button type="button" class="btn-upload-pc" onclick="triggerTestimonialVideoUpload(${idx})">
                    💻 Upload Video (.mp4) from PC
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('Testimonial Videos')">💾 Save Testimonial Videos</button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function triggerTestimonialVideoUpload(idx) {
  activeTestimonialVideoIndex = idx;
  document.getElementById('testi-vid-upload-input').click();
}

async function handleTestimonialVideoUpload(file, idx) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    showToast('info', `Uploading video ${file.name}... Please wait...`);
    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          data: base64Data
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newUrl = data.url;
        showToast('success', `Video uploaded! Updating Testimonial Video #${idx + 1}...`);
        
        await applyTestimonialVideoToHtml(idx, newUrl, true);
        showToast('success', `Testimonial Video #${idx + 1} updated and saved!`);
      } else {
        throw new Error('Upload error');
      }
    } catch (err) {
      showToast('error', `Failed: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

async function updateTestimonialVideoUrl(idx) {
  const input = document.getElementById(`testi-vid-url-${idx}`);
  if (!input) return;
  const rawUrl = input.value.trim();
  if (!rawUrl) {
    showToast('error', 'Please enter a valid video link or file path');
    return;
  }
  const isYouTube = rawUrl.includes('youtube') || rawUrl.includes('youtu.be');
  const finalUrl = isYouTube ? normalizeVideoEmbedUrl(rawUrl) : rawUrl;
  input.value = finalUrl;

  await applyTestimonialVideoToHtml(idx, finalUrl, !isYouTube);
  showToast('success', `Testimonial Video #${idx + 1} updated and page saved!`);
}

async function applyTestimonialVideoToHtml(idx, videoUrl, isNativeVideo) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const vidWrappers = Array.from(doc.querySelectorAll('.as-testimonial-1-video')).filter(w => !w.parentElement.closest('.as-testimonial-1-video'));

  // Find the target wrapper
  const targetWrap = vidWrappers[idx === 0 ? 0 : (vidWrappers.length > 1 ? vidWrappers.length - 1 : 0)];

  if (targetWrap) {
    if (isNativeVideo) {
      targetWrap.innerHTML = `\n                              <video src="${videoUrl}" autoplay loop muted playsinline controls style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px; min-height: 280px;"></video>\n                          `;
    } else {
      targetWrap.innerHTML = `\n                              <iframe src="${videoUrl}" frameborder="0" allow="autoplay; fullscreen"></iframe>\n                          `;
    }
  }

  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  document.getElementById('raw-code-editor').value = currentPageRawContent;
  await saveCurrentPage();

  // Also sync to testimonial/index.html if we are editing index.html
  if (currentPage && (currentPage.id === 'home' || currentPage.id === 'testimonial')) {
    try {
      const otherPagePath = currentPage.id === 'home' ? 'testimonial/index.html' : 'index.html';
      const res = await fetch(`/api/page?path=${otherPagePath}`);
      if (res.ok) {
        const otherData = await res.json();
        const otherDoc = parser.parseFromString(otherData.content, 'text/html');
        const otherWrappers = Array.from(otherDoc.querySelectorAll('.as-testimonial-1-video')).filter(w => !w.parentElement.closest('.as-testimonial-1-video'));
        const otherTarget = otherWrappers[idx === 0 ? 0 : (otherWrappers.length > 1 ? otherWrappers.length - 1 : 0)];
        if (otherTarget) {
          if (isNativeVideo) {
            otherTarget.innerHTML = `\n                              <video src="${videoUrl}" autoplay loop muted playsinline controls style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px; min-height: 280px;"></video>\n                          `;
          } else {
            otherTarget.innerHTML = `\n                              <iframe src="${videoUrl}" frameborder="0" allow="autoplay; fullscreen"></iframe>\n                          `;
          }
          const updatedOtherHtml = '<!DOCTYPE html>\n' + otherDoc.documentElement.outerHTML;
          await fetch('/api/save-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: otherPagePath, content: updatedOtherHtml })
          });
        }
      }
    } catch (e) {
      console.warn('Sync to other testimonial page failed', e);
    }
  }

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
}

// ==========================================
// PRICING SECTION VIDEO & SHOWCASE MANAGER
// ==========================================
function renderPricingSection(container, el) {
  const card = document.createElement('div');
  card.className = 'section-card';

  const leftBox = el.querySelector('.as-price-1-left');
  let isVideoMode = false;
  let currentVideoSrc = '';
  let isNativeVideo = false;

  if (leftBox) {
    const video = leftBox.querySelector('video');
    const iframe = leftBox.querySelector('iframe');
    if (video) {
      isVideoMode = true;
      currentVideoSrc = video.getAttribute('src') || '';
      isNativeVideo = true;
    } else if (iframe) {
      isVideoMode = true;
      currentVideoSrc = iframe.getAttribute('src') || '';
      isNativeVideo = false;
    }
  }

  // Find the 3 screenshots if in screenshot mode
  const ssImgs = leftBox ? Array.from(leftBox.querySelectorAll('.as-price-1-ss img')).map(img => img.getAttribute('src') || '') : [];

  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">💰</div>
        <div>
          <h3>{★} Pricing Plans Video & Media Showcase</h3>
          <p>Manage the video player or scrolling screenshots on the left of Pricing Plans</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div style="margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 13px; color: var(--text-secondary);">
          Left Showcase Media Column (Next to Starter, Growth & Premium Plans)
        </span>
        <span class="badge" style="background: ${isVideoMode ? 'rgba(253,63,0,0.2)' : 'rgba(56,189,248,0.2)'}; color: ${isVideoMode ? '#fd3f00' : '#38bdf8'}; border: 1px solid ${isVideoMode ? 'rgba(253,63,0,0.4)' : 'rgba(56,189,248,0.4)'}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">
          ${isVideoMode ? (isNativeVideo ? '📹 Uploaded MP4 Video Active' : '📺 YouTube Video Active') : '🖼️ Animated Screenshots (3 Images) Active'}
        </span>
      </div>

      <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; margin-bottom: 20px;">
        <h4 style="font-size: 13px; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>Live Media Preview</span>
        </h4>

        ${isVideoMode ? `
          <div style="width: 100%; max-width: 440px; height: 240px; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1);">
            ${isNativeVideo ? `
              <video src="${escapeHtml(currentVideoSrc)}" controls playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
            ` : `
              <iframe src="${escapeHtml(currentVideoSrc.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/').replace(/[?&]autoplay=[0-9]/g, '').replace(/[?&]loop=[0-9]/g, ''))}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style="width: 100%; height: 100%; border: none;"></iframe>
            `}
          </div>
        ` : `
          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 15px;">
            ${(ssImgs.length > 0 ? ssImgs : ['/assets/images/p1-ss-1.webp', '/assets/images/p1-ss-2.webp', '/assets/images/p1-ss-3.webp']).map((src, i) => `
              <div style="width: 110px; height: 140px; background: #000; border-radius: 8px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.1);">
                <img src="${src}" alt="Screenshot ${i+1}" style="width: 100%; height: 100%; object-fit: cover;">
                <span style="position: absolute; bottom: 4px; left: 4px; font-size: 10px; background: rgba(0,0,0,0.8); color: #fff; padding: 2px 6px; border-radius: 4px;">SS #${i+1}</span>
              </div>
            `).join('')}
          </div>
        `}

        <div class="form-group" style="margin-bottom: 15px;">
          <label style="font-size: 12px; font-weight: 600; color: #fff;">Pricing Showcase Video URL or Local Path</label>
          <input type="text" class="form-control" id="pricing-vid-url-input" value="${escapeHtml(currentVideoSrc)}" placeholder="Paste YouTube link (https://youtube.com/...) or /assets/videos/file.mp4">
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          <button type="button" class="btn-update-src" onclick="applyPricingVideoUrl()">
            🎬 Set Video URL
          </button>
          <button type="button" class="btn-upload-pc" onclick="triggerPricingVideoUpload()">
            💻 Upload Video (.mp4) from PC
          </button>
          <button type="button" class="btn btn-secondary" style="font-size: 12px;" onclick="restorePricingScreenshots()">
            🔄 Switch to Animated Screenshots
          </button>
          <button type="button" class="btn btn-primary" style="margin-left: auto;" onclick="saveSectionDirectly('Pricing Showcase')">
            💾 Save Pricing Video
          </button>
        </div>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function triggerPricingVideoUpload() {
  document.getElementById('pricing-vid-upload-input').click();
}

async function handlePricingVideoUpload(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    showToast('info', `Uploading video ${file.name} for Pricing section...`);
    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          data: base64Data
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newUrl = data.url;
        showToast('success', `Video uploaded! Setting as Pricing showcase video...`);
        
        await applyPricingMediaToHtml(newUrl, true);
        showToast('success', `Pricing video updated and saved successfully!`);
      } else {
        throw new Error('Upload error');
      }
    } catch (err) {
      showToast('error', `Failed: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

async function applyPricingVideoUrl() {
  const input = document.getElementById('pricing-vid-url-input');
  if (!input) return;
  const rawUrl = input.value.trim();
  if (!rawUrl) {
    showToast('error', 'Please enter a video URL or upload from PC');
    return;
  }
  const isYouTube = rawUrl.includes('youtube') || rawUrl.includes('youtu.be');
  const finalUrl = isYouTube ? normalizeVideoEmbedUrl(rawUrl) : rawUrl;
  input.value = finalUrl;

  await applyPricingMediaToHtml(finalUrl, !isYouTube);
  showToast('success', 'Pricing section video applied successfully!');
}

async function applyPricingMediaToHtml(videoUrl, isNativeVideo) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const leftBox = doc.querySelector('.as-price-1-left');

  if (leftBox) {
    if (isNativeVideo) {
      leftBox.innerHTML = `\n                <video src="${videoUrl}" autoplay loop muted playsinline controls style="width: 100%; height: 100%; min-height: 520px; object-fit: cover; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);"></video>\n            `;
    } else {
      leftBox.innerHTML = `\n                <iframe src="${videoUrl}" frameborder="0" allow="autoplay; fullscreen" style="width: 100%; height: 100%; min-height: 520px; border-radius: 24px; border: none; box-shadow: 0 20px 40px rgba(0,0,0,0.4);"></iframe>\n            `;
    }
  }

  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  document.getElementById('raw-code-editor').value = currentPageRawContent;
  await saveCurrentPage();

  // Sync to pricing/index.html if on home page, or index.html if on pricing page
  if (currentPage && (currentPage.id === 'home' || currentPage.id === 'pricing')) {
    try {
      const otherPagePath = currentPage.id === 'home' ? 'pricing/index.html' : 'index.html';
      const res = await fetch(`/api/page?path=${otherPagePath}`);
      if (res.ok) {
        const otherData = await res.json();
        const otherDoc = parser.parseFromString(otherData.content, 'text/html');
        const otherLeft = otherDoc.querySelector('.as-price-1-left');
        if (otherLeft) {
          if (isNativeVideo) {
            otherLeft.innerHTML = `\n                <video src="${videoUrl}" autoplay loop muted playsinline controls style="width: 100%; height: 100%; min-height: 520px; object-fit: cover; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);"></video>\n            `;
          } else {
            otherLeft.innerHTML = `\n                <iframe src="${videoUrl}" frameborder="0" allow="autoplay; fullscreen" style="width: 100%; height: 100%; min-height: 520px; border-radius: 24px; border: none; box-shadow: 0 20px 40px rgba(0,0,0,0.4);"></iframe>\n            `;
          }
          const updatedOtherHtml = '<!DOCTYPE html>\n' + otherDoc.documentElement.outerHTML;
          await fetch('/api/save-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: otherPagePath, content: updatedOtherHtml })
          });
        }
      }
    } catch (e) {
      console.warn('Sync to other pricing page failed', e);
    }
  }

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
}

async function restorePricingScreenshots() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const leftBox = doc.querySelector('.as-price-1-left');

  if (leftBox) {
    leftBox.innerHTML = `\n                <div class="as-price-1-ss wa_marquee_down_top">\n                    <div class="as-price-1-ss-single wa-fix wa-img-cover">\n                        <img decoding="async" src="/assets/images/p1-ss-1.webp" alt="p1-ss-1">\n                    </div>\n                    <div class="as-price-1-ss-single wa-fix wa-img-cover">\n                        <img decoding="async" src="/assets/images/p1-ss-2.webp" alt="p1-ss-2">\n                    </div>\n                    <div class="as-price-1-ss-single wa-fix wa-img-cover">\n                        <img decoding="async" src="/assets/images/p1-ss-3.webp" alt="p1-ss-3">\n                    </div>\n                </div>\n            `;
  }

  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  document.getElementById('raw-code-editor').value = currentPageRawContent;
  await saveCurrentPage();

  // Sync to pricing/index.html
  if (currentPage && (currentPage.id === 'home' || currentPage.id === 'pricing')) {
    try {
      const otherPagePath = currentPage.id === 'home' ? 'pricing/index.html' : 'index.html';
      const res = await fetch(`/api/page?path=${otherPagePath}`);
      if (res.ok) {
        const otherData = await res.json();
        const otherDoc = parser.parseFromString(otherData.content, 'text/html');
        const otherLeft = otherDoc.querySelector('.as-price-1-left');
        if (otherLeft) {
          otherLeft.innerHTML = `\n                <div class="as-price-1-ss wa_marquee_down_top">\n                    <div class="as-price-1-ss-single wa-fix wa-img-cover">\n                        <img decoding="async" src="/assets/images/p1-ss-1.webp" alt="p1-ss-1">\n                    </div>\n                    <div class="as-price-1-ss-single wa-fix wa-img-cover">\n                        <img decoding="async" src="/assets/images/p1-ss-2.webp" alt="p1-ss-2">\n                    </div>\n                    <div class="as-price-1-ss-single wa-fix wa-img-cover">\n                        <img decoding="async" src="/assets/images/p1-ss-3.webp" alt="p1-ss-3">\n                    </div>\n                </div>\n            `;
          const updatedOtherHtml = '<!DOCTYPE html>\n' + otherDoc.documentElement.outerHTML;
          await fetch('/api/save-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: otherPagePath, content: updatedOtherHtml })
          });
        }
      }
    } catch (e) {
      console.warn('Sync screenshots failed', e);
    }
  }

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
  showToast('success', 'Pricing section restored to animated screenshots showcase!');
}

// ==========================================
// UNIVERSAL FILE PICKER & UPLOAD HELPER
// ==========================================
function pickFileAndUpload(acceptType, onUploaded) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = acceptType || 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  fileInput.onchange = () => {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      showToast('info', `Uploading "${file.name}"... Please wait...`);
      reader.onload = async (e) => {
        try {
          const res = await fetch('/api/upload-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              data: e.target.result
            })
          });
          if (res.ok) {
            const data = await res.json();
            showToast('success', `File uploaded successfully: ${data.url}`);
            if (typeof onUploaded === 'function') {
              onUploaded(data.url);
            }
          } else {
            const errTxt = await res.text();
            showToast('error', `Upload failed: ${errTxt}`);
          }
        } catch (err) {
          showToast('error', `Upload error: ${err.message}`);
        }
      };
      reader.readAsDataURL(file);
    }
    fileInput.remove();
  };
  fileInput.click();
}

async function saveCurrentPageSilently() {
  if (!currentPage) return;
  try {
    await fetch('/api/save-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentPage.path,
        content: currentPageRawContent
      })
    });
  } catch (err) {
    console.error('Silent save failed:', err);
  }
}

// ==========================================
// FEATURES SECTION ({ } Features / Why Choose Us)
// ==========================================
function renderFeaturesSection(container, el) {
  const secTitleEl = el.querySelector('.as-features-1-sec-title .as-sec-title-1, .as-features-1-sec-title h2');
  const secDiscEl = el.querySelector('.as-features-1-sec-title .sec-disc, .as-features-1-sec-title p');
  const secTitle = secTitleEl ? secTitleEl.innerText.trim() : 'Why should You choose Insight Creative Studio?';
  const secDisc = secDiscEl ? secDiscEl.innerText.trim() : 'We blend design, strategy, and technology to craft solutions that truly stand out.';

  // Feature 1: Creative
  const creativeBox = el.querySelector('.as-features-1-creative');
  const creativeBg = creativeBox ? (creativeBox.getAttribute('data-background') || '') : '';
  const creativeTitle = creativeBox ? (creativeBox.querySelector('.title')?.innerText.trim() || '24/7 Creativity') : '24/7 Creativity';
  const creativeDisc = creativeBox ? (creativeBox.querySelector('.disc')?.innerText.trim() || '') : '';
  const creativeImg = creativeBox ? (creativeBox.querySelector('.img-elm img')?.getAttribute('src') || '') : '';

  // Feature 2: Quality
  const qualityBox = el.querySelector('.as-features-1-quality');
  const qualityTitle = qualityBox ? (qualityBox.querySelector('.title')?.innerText.trim() || 'Best Quality Product Guaranteed') : 'Best Quality Product Guaranteed';
  const qualityDisc = qualityBox ? (qualityBox.querySelector('.disc')?.innerText.trim() || '') : '';
  const qualityImg = qualityBox ? (qualityBox.querySelector('.img-elm img')?.getAttribute('src') || '') : '';

  // Feature 3: Result
  const resultBox = el.querySelector('.as-features-1-result');
  const resultBg = resultBox ? (resultBox.getAttribute('data-background') || '') : '';
  const resultTitle = resultBox ? (resultBox.querySelector('.title')?.innerText.trim() || 'Result-Oriented Delivery') : 'Result-Oriented Delivery';
  const resultDisc = resultBox ? (resultBox.querySelector('.disc')?.innerText.trim() || '') : '';

  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">⚡</div>
        <div>
          <h3>{★} Features: Why should You choose Insight Creative Studio?</h3>
          <p>Manage feature headlines, illustrations, background images & satisfaction statistics</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-grid mb-20">
        <div class="form-group full-width">
          <label>Features Section Main Headline</label>
          <input type="text" class="form-control" id="feature-main-title" value="${escapeHtml(secTitle)}">
        </div>
        <div class="form-group full-width">
          <label>Features Section Description</label>
          <textarea class="form-control" id="feature-main-desc" rows="2">${escapeHtml(secDisc)}</textarea>
        </div>
      </div>

      <div class="features-admin-grid">
        <!-- Feature 1: 24/7 Creativity -->
        <div class="item-admin-card">
          <div class="item-card-header">
            <h4>💡 Feature 1: Creativity</h4>
            <span class="badge" style="background: rgba(253,63,0,0.15); color: #fd3f00; padding: 3px 8px; border-radius: 6px; font-size: 11px;">Card 1</span>
          </div>
          <div class="item-admin-thumb">
            <img src="${creativeImg || '/assets/images/f1-img-2.webp'}" id="feat-creative-img-preview" alt="Creativity Preview">
          </div>
          <button type="button" class="btn-upload-pc" onclick="uploadFeatureCreativeImage()">
            💻 Upload Illustration from PC
          </button>
          <div class="form-group" style="margin-top: 10px;">
            <label>Illustration Image URL</label>
            <input type="text" class="form-control" id="feat-creative-img-inp" value="${escapeHtml(creativeImg)}">
          </div>
          <div class="form-group">
            <label>Feature Title</label>
            <input type="text" class="form-control feature-card-title-inp" id="feat-creative-title" value="${escapeHtml(creativeTitle)}">
          </div>
          <div class="form-group">
            <label>Feature Description</label>
            <textarea class="form-control feature-card-disc-inp" id="feat-creative-disc" rows="2">${escapeHtml(creativeDisc)}</textarea>
          </div>
          <div class="form-group">
            <label>Background Texture URL</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-control" id="feat-creative-bg-inp" value="${escapeHtml(creativeBg)}">
              <button type="button" class="btn-secondary" style="padding: 0 12px; white-space: nowrap; font-size: 12px;" onclick="uploadFeatureCreativeBg()">PC Bg</button>
            </div>
          </div>
        </div>

        <!-- Feature 2: Best Quality Product Guaranteed -->
        <div class="item-admin-card">
          <div class="item-card-header">
            <h4>🏆 Feature 2: Quality Guarantee</h4>
            <span class="badge" style="background: rgba(253,63,0,0.15); color: #fd3f00; padding: 3px 8px; border-radius: 6px; font-size: 11px;">Card 2</span>
          </div>
          <div class="item-admin-thumb">
            <img src="${qualityImg || '/assets/images/f1-img-3.webp'}" id="feat-quality-img-preview" alt="Quality Preview">
          </div>
          <button type="button" class="btn-upload-pc" onclick="uploadFeatureQualityImage()">
            💻 Upload Illustration from PC
          </button>
          <div class="form-group" style="margin-top: 10px;">
            <label>Illustration Image URL</label>
            <input type="text" class="form-control" id="feat-quality-img-inp" value="${escapeHtml(qualityImg)}">
          </div>
          <div class="form-group">
            <label>Feature Title</label>
            <input type="text" class="form-control feature-card-title-inp" id="feat-quality-title" value="${escapeHtml(qualityTitle)}">
          </div>
          <div class="form-group">
            <label>Feature Description</label>
            <textarea class="form-control feature-card-disc-inp" id="feat-quality-disc" rows="2">${escapeHtml(qualityDisc)}</textarea>
          </div>
        </div>

        <!-- Feature 3: Result-Oriented Delivery -->
        <div class="item-admin-card">
          <div class="item-card-header">
            <h4>🎯 Feature 3: Result-Oriented</h4>
            <span class="badge" style="background: rgba(253,63,0,0.15); color: #fd3f00; padding: 3px 8px; border-radius: 6px; font-size: 11px;">Card 3</span>
          </div>
          <div class="item-admin-thumb">
            <img src="${resultBg || '/assets/images/f1-img-4.webp'}" id="feat-result-bg-preview" alt="Result Bg Preview">
          </div>
          <button type="button" class="btn-upload-pc" onclick="uploadFeatureResultBg()">
            💻 Upload Card Background from PC
          </button>
          <div class="form-group" style="margin-top: 10px;">
            <label>Card Background URL</label>
            <input type="text" class="form-control" id="feat-result-bg-inp" value="${escapeHtml(resultBg)}">
          </div>
          <div class="form-group">
            <label>Feature Title</label>
            <input type="text" class="form-control feature-card-title-inp" id="feat-result-title" value="${escapeHtml(resultTitle)}">
          </div>
          <div class="form-group">
            <label>Feature Description</label>
            <textarea class="form-control feature-card-disc-inp" id="feat-result-disc" rows="2">${escapeHtml(resultDisc)}</textarea>
          </div>
        </div>
      </div>
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed var(--border-color); display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('Features Section')">💾 Save Features Section</button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function uploadFeatureCreativeImage() {
  pickFileAndUpload('image/*', async (url) => {
    const inp = document.getElementById('feat-creative-img-inp');
    if (inp) inp.value = url;
    const prev = document.getElementById('feat-creative-img-preview');
    if (prev) prev.src = url;
    await applyFeatureUpdate('.as-features-1-creative .img-elm img', 'src', url);
  });
}

function uploadFeatureCreativeBg() {
  pickFileAndUpload('image/*', async (url) => {
    const inp = document.getElementById('feat-creative-bg-inp');
    if (inp) inp.value = url;
    await applyFeatureUpdate('.as-features-1-creative', 'data-background', url);
  });
}

function uploadFeatureQualityImage() {
  pickFileAndUpload('image/*', async (url) => {
    const inp = document.getElementById('feat-quality-img-inp');
    if (inp) inp.value = url;
    const prev = document.getElementById('feat-quality-img-preview');
    if (prev) prev.src = url;
    await applyFeatureUpdate('.as-features-1-quality .img-elm img', 'src', url);
  });
}

function uploadFeatureResultBg() {
  pickFileAndUpload('image/*', async (url) => {
    const inp = document.getElementById('feat-result-bg-inp');
    if (inp) inp.value = url;
    const prev = document.getElementById('feat-result-bg-preview');
    if (prev) prev.src = url;
    await applyFeatureUpdate('.as-features-1-result', 'data-background', url);
  });
}

async function applyFeatureUpdate(selector, attrName, val) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const target = doc.querySelector(selector);
  if (target) {
    target.setAttribute(attrName, val);
    currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    const ed = document.getElementById('raw-code-editor');
    if (ed) ed.value = currentPageRawContent;
    await saveCurrentPageSilently();
    showToast('success', 'Feature image updated and saved to page!');
  }
}

// ==========================================
// PORTFOLIO SECTION (Crafting Success Through Design & Strategy)
// ==========================================
function renderPortfolioSection(container, el) {
  const secTitleEl = el.querySelector('.as-portfolio-1-sec-title .as-sec-title-1, .as-portfolio-1-sec-title h2');
  const secTitle = secTitleEl ? secTitleEl.innerText.trim() : 'Crafting Success Through Design & Strategy';
  
  const items = Array.from(el.querySelectorAll('.as-portfolio-1-item'));

  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">🎨</div>
        <div>
          <h3>{★} Portfolio: Crafting Success Through Design & Strategy</h3>
          <p>Add/remove projects, change titles, tags, links and upload artwork from PC (${items.length} projects)</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-grid mb-20">
        <div class="form-group full-width">
          <label>Portfolio Section Title</label>
          <input type="text" class="form-control" id="portfolio-main-title" value="${escapeHtml(secTitle)}">
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 13px; color: var(--text-secondary);">
          Total <strong>${items.length}</strong> active portfolio projects listed
        </span>
        <button type="button" class="btn-add-section-item" onclick="addNewPortfolioProject()">
          ➕ Add New Project
        </button>
      </div>

      <div class="portfolio-admin-grid">
        ${items.map((item, idx) => {
          const imgEl = item.querySelector('.item-img img');
          const imgSrc = imgEl ? (imgEl.getAttribute('src') || '') : '';
          const titleLink = item.querySelector('.content-wrap .title a');
          const title = titleLink ? titleLink.innerText.trim() : (item.querySelector('.title')?.innerText.trim() || `Project #${idx + 1}`);
          const linkHref = titleLink ? (titleLink.getAttribute('href') || '/interior-design/') : '/interior-design/';
          const disc = item.querySelector('.content-wrap .disc')?.innerText.trim() || '';
          const tagEls = Array.from(item.querySelectorAll('.item-tags a'));
          const tags = tagEls.map(t => t.innerText.trim()).filter(Boolean).join(', ') || 'Web Design, UI/UX';

          return `
            <div class="item-admin-card" data-portfolio-idx="${idx}">
              <div class="item-card-header">
                <h4>Project #${idx + 1}: ${escapeHtml(title.slice(0, 24))}${title.length > 24 ? '...' : ''}</h4>
                <button type="button" class="btn-remove-item" onclick="removePortfolioProject(${idx})" title="Delete project">🗑️ Delete</button>
              </div>
              <div class="item-admin-thumb">
                <img src="${imgSrc || '/assets/images/p1-img-1.webp'}" id="portfolio-img-preview-${idx}" alt="Project Preview">
              </div>
              <button type="button" class="btn-upload-pc" onclick="uploadPortfolioImage(${idx})">
                💻 Upload Project Artwork from PC
              </button>
              <div class="form-group" style="margin-top: 10px;">
                <label>Image URL</label>
                <input type="text" class="form-control portfolio-item-img-inp" id="portfolio-img-inp-${idx}" value="${escapeHtml(imgSrc)}">
              </div>
              <div class="form-group">
                <label>Project Title</label>
                <input type="text" class="form-control portfolio-item-title-inp" id="portfolio-title-inp-${idx}" value="${escapeHtml(title)}">
              </div>
              <div class="form-group">
                <label>Tags / Categories (comma separated)</label>
                <input type="text" class="form-control portfolio-item-tags-inp" id="portfolio-tags-inp-${idx}" value="${escapeHtml(tags)}">
              </div>
              <div class="form-group">
                <label>Project Description</label>
                <textarea class="form-control portfolio-item-disc-inp" id="portfolio-disc-inp-${idx}" rows="2">${escapeHtml(disc)}</textarea>
              </div>
              <div class="form-group">
                <label>Target Page Link</label>
                <input type="text" class="form-control portfolio-item-link-inp" id="portfolio-link-inp-${idx}" value="${escapeHtml(linkHref)}">
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="text-align: center; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-top: 15px; border-top: 1px dashed var(--border-color);">
        <button type="button" class="btn-add-section-item" onclick="addNewPortfolioProject()">
          ➕ Add Another Portfolio Project
        </button>
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('Portfolio Section')">
          💾 Save Portfolio Section
        </button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function uploadPortfolioImage(idx) {
  pickFileAndUpload('image/*', async (url) => {
    const input = document.getElementById(`portfolio-img-inp-${idx}`);
    if (input) input.value = url;
    const preview = document.getElementById(`portfolio-img-preview-${idx}`);
    if (preview) preview.src = url;

    // Apply directly into HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentPageRawContent, 'text/html');
    const items = doc.querySelectorAll('.as-portfolio-1-item');
    if (items[idx]) {
      const img = items[idx].querySelector('.item-img img');
      if (img) img.setAttribute('src', url);
      currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      const ed = document.getElementById('raw-code-editor');
      if (ed) ed.value = currentPageRawContent;
      await saveCurrentPageSilently();
      showToast('success', `Artwork for project #${idx + 1} updated and saved!`);
    }
  });
}

async function addNewPortfolioProject() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const wrap = doc.querySelector('.as-portfolio-1-wrap .left') || doc.querySelector('.as-portfolio-1-wrap');
  if (!wrap) {
    showToast('error', 'Portfolio container not found on this page.');
    return;
  }

  const newProjectHtml = `
    <div class="as-portfolio-1-item has-v2 wa_magnetic_1_trigger">
        <div class="item-img wa-fix wa-img-cover wa-p-relative">
            <img decoding="async" class="wa_magnetic_1_elm" src="/assets/images/p1-img-1.webp" alt="Portfolio Artwork">
            <div class="item-tags">
                <a href="/interior-design/" class="link-elm as-p-1">Brand Identity</a>
                <a href="/interior-design/" class="link-elm as-p-1">Creative</a>
            </div>
        </div>
        <div class="content-wrap">
            <h4 class="as-h-1 title wa_magnetic_btn_1">
                <a href="/interior-design/">New Creative Project</a>
            </h4>
            <p class="as-p-1 disc">Modern bespoke creative solutions crafted to inspire and elevate.</p>
        </div>
    </div>
  `;

  wrap.insertAdjacentHTML('beforeend', newProjectHtml);
  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  const ed = document.getElementById('raw-code-editor');
  if (ed) ed.value = currentPageRawContent;
  await saveCurrentPageSilently();

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
  showToast('success', 'New portfolio project added! You can now edit its title, tags, and upload custom artwork.');
}

async function removePortfolioProject(idx) {
  if (!confirm(`Are you sure you want to remove project #${idx + 1}?`)) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const items = doc.querySelectorAll('.as-portfolio-1-item');
  if (items[idx]) {
    items[idx].remove();
    currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    const ed = document.getElementById('raw-code-editor');
    if (ed) ed.value = currentPageRawContent;
    await saveCurrentPageSilently();

    parseAndRenderSections();
    if (document.getElementById('view-page-media')?.classList.contains('active')) {
      renderPageMediaInspector();
    }
    showToast('success', `Project #${idx + 1} removed successfully!`);
  }
}

// ==========================================
// TEAM MEMBERS SECTION (Experts Who Care About Your Growth)
// ==========================================
function renderTeamSection(container, el) {
  const secTitleEl = el.querySelector('.as-team-1-sec-title .as-sec-title-1, .as-team-1-sec-title h2');
  const secTitle = secTitleEl ? secTitleEl.innerText.trim() : 'Experts Who Care About Your Growth';

  const memberWrappers = (el.querySelectorAll('.as-team-1-member-ani').length > 0 
    ? Array.from(el.querySelectorAll('.as-team-1-member-ani')) 
    : Array.from(el.querySelectorAll('.as-team-1-member')));

  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">👥</div>
        <div>
          <h3>{★} Team Members: Experts Who Care About Your Growth</h3>
          <p>Change team photos, member names, roles & designations, or add new experts (${memberWrappers.length} members)</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-grid mb-20">
        <div class="form-group full-width">
          <label>Team Section Title</label>
          <input type="text" class="form-control" id="team-main-title" value="${escapeHtml(secTitle)}">
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: gap; gap: 10px;">
        <span style="font-size: 13px; color: var(--text-secondary);">
          Total <strong>${memberWrappers.length}</strong> team members currently active
        </span>
        <button type="button" class="btn-add-section-item" onclick="addNewTeamMember()">
          ➕ Add New Team Member
        </button>
      </div>

      <div class="team-members-admin-grid">
        ${memberWrappers.map((memWrap, idx) => {
          const imgEl = memWrap.querySelector('.member-img img');
          const imgSrc = imgEl ? (imgEl.getAttribute('src') || '') : '';
          const nameLink = memWrap.querySelector('.member-name a');
          const name = nameLink ? nameLink.innerText.trim() : (memWrap.querySelector('.member-name')?.innerText.trim() || `Team Member #${idx + 1}`);
          const dg = memWrap.querySelector('.member-dg')?.innerText.trim() || 'Creative Specialist';

          return `
            <div class="item-admin-card" data-team-idx="${idx}">
              <div class="item-card-header">
                <h4>${escapeHtml(name)}</h4>
                <button type="button" class="btn-remove-item" onclick="removeTeamMember(${idx})" title="Delete member">🗑️ Delete</button>
              </div>
              <div class="item-admin-thumb" style="aspect-ratio: 1/1.1;">
                <img src="${imgSrc || '/assets/images/t1-img-1.webp'}" id="team-img-preview-${idx}" alt="Team Photo">
              </div>
              <button type="button" class="btn-upload-pc" onclick="uploadTeamPhoto(${idx})">
                💻 Upload Member Photo from PC
              </button>
              <div class="form-group" style="margin-top: 10px;">
                <label>Photo URL</label>
                <input type="text" class="form-control team-item-img-inp" id="team-img-inp-${idx}" value="${escapeHtml(imgSrc)}">
              </div>
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="form-control team-item-name-inp" id="team-name-inp-${idx}" value="${escapeHtml(name)}">
              </div>
              <div class="form-group">
                <label>Designation / Role</label>
                <input type="text" class="form-control team-item-dg-inp" id="team-dg-inp-${idx}" value="${escapeHtml(dg)}">
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="text-align: center; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-top: 15px; border-top: 1px dashed var(--border-color);">
        <button type="button" class="btn-add-section-item" onclick="addNewTeamMember()">
          ➕ Add Another Team Member
        </button>
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('Team Members Section')">
          💾 Save Team Members Section
        </button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function uploadTeamPhoto(idx) {
  pickFileAndUpload('image/*', async (url) => {
    const input = document.getElementById(`team-img-inp-${idx}`);
    if (input) input.value = url;
    const preview = document.getElementById(`team-img-preview-${idx}`);
    if (preview) preview.src = url;

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentPageRawContent, 'text/html');
    const members = (doc.querySelectorAll('.as-team-1-member-ani').length > 0
      ? doc.querySelectorAll('.as-team-1-member-ani')
      : doc.querySelectorAll('.as-team-1-member'));
    if (members[idx]) {
      const img = members[idx].querySelector('.member-img img');
      if (img) img.setAttribute('src', url);
      currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      const ed = document.getElementById('raw-code-editor');
      if (ed) ed.value = currentPageRawContent;
      await saveCurrentPageSilently();
      showToast('success', `Photo for team member #${idx + 1} updated and saved!`);
    }
  });
}
    if (members[idx]) {
      const img = members[idx].querySelector('.member-img img');
      if (img) img.setAttribute('src', url);
      currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      const ed = document.getElementById('raw-code-editor');
      if (ed) ed.value = currentPageRawContent;
      await saveCurrentPageSilently();
      showToast('success', `Photo for team member #${idx + 1} updated and saved!`);
    }
  });
}

async function addNewTeamMember() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const wrap = doc.querySelector('.as-team-1-wrap');
  if (!wrap) {
    showToast('error', 'Team members container not found.');
    return;
  }

  const newMemberHtml = `
    <div class="as-team-1-member-ani">
        <div class="as-team-1-member wa_magnetic_1_trigger">
            <div class="member-img wa-fix wa-img-cover wa-p-relative">
                <img decoding="async" class="wa_magnetic_1_elm" src="/assets/images/t1-img-1.webp" alt="Team Member">
                <div class="content-wrap">
                    <h5 class="as-h-1 member-name">
                        <a href="/team/">New Member Name</a>
                    </h5>
                    <p class="as-p-1 member-dg">Creative Director</p>
                </div>
            </div>
            <div class="member-social">
                <a class="link-elm" href="#0"><i aria-hidden="true" class="fab fa-linkedin-in"></i></a>
                <a class="link-elm" href="#0"><i aria-hidden="true" class="fab fa-instagram"></i></a>
                <a class="link-elm" href="#0"><i aria-hidden="true" class="fab fa-x-twitter"></i></a>
            </div>
        </div>
    </div>
  `;

  wrap.insertAdjacentHTML('beforeend', newMemberHtml);
  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  const ed = document.getElementById('raw-code-editor');
  if (ed) ed.value = currentPageRawContent;
  await saveCurrentPageSilently();

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
  showToast('success', 'New team member added! You can now edit their name, role, and upload photo.');
}

async function removeTeamMember(idx) {
  if (!confirm(`Are you sure you want to remove team member #${idx + 1}?`)) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const members = (doc.querySelectorAll('.as-team-1-member-ani').length > 0
    ? doc.querySelectorAll('.as-team-1-member-ani')
    : doc.querySelectorAll('.as-team-1-member'));
  if (members[idx]) {
    members[idx].remove();
    currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    const ed = document.getElementById('raw-code-editor');
    if (ed) ed.value = currentPageRawContent;
    await saveCurrentPageSilently();

    parseAndRenderSections();
    if (document.getElementById('view-page-media')?.classList.contains('active')) {
      renderPageMediaInspector();
    }
    showToast('success', `Team member #${idx + 1} removed!`);
  }
}

// ==========================================
// BLOG SECTION (Add, Edit, Upload Post Images)
// ==========================================
function renderBlogSection(container, el) {
  const isHomepage = Boolean(el.querySelector('.as-blog-1-item') || el.classList.contains('as-blog-1-area'));
  
  // Collect articles from homepage or standalone blog page
  const articles = isHomepage 
    ? Array.from(el.querySelectorAll('.as-blog-1-item'))
    : (el.querySelectorAll('.tx-blog-box').length > 0 ? Array.from(el.querySelectorAll('.tx-blog-box')) : Array.from(el.querySelectorAll('.tz-blog-item')));

  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">📝</div>
        <div>
          <h3>{★} Blog & Articles: Add, Edit & Upload Images</h3>
          <p>Manage article headlines, excerpts, category tags, and upload featured images from PC (${articles.length} posts)</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 13px; color: var(--text-secondary);">
          Total <strong>${articles.length}</strong> blog articles found
        </span>
        <button type="button" class="btn-add-section-item" onclick="addNewBlogArticle(${isHomepage})">
          ➕ Add New Blog Post
        </button>
      </div>

      <div class="blog-admin-grid">
        ${articles.map((art, idx) => {
          const imgEl = art.querySelector('.item-img img');
          const imgSrc = imgEl ? (imgEl.getAttribute('src') || '') : '';
          const titleLink = art.querySelector('.title a, .blog_title a');
          const title = titleLink ? titleLink.innerText.trim() : (art.querySelector('.title, .blog_title')?.innerText.trim() || `Article #${idx + 1}`);
          const linkHref = titleLink ? (titleLink.getAttribute('href') || '/blog/') : '/blog/';
          const cat = art.querySelector('.categories a, .item-meta a')?.innerText.trim() || 'Brand Design Identity';
          const disc = art.querySelector('.disc, p')?.innerText.trim() || '';

          return `
            <div class="item-admin-card" data-blog-idx="${idx}">
              <div class="item-card-header">
                <h4>Article #${idx + 1}: ${escapeHtml(title.slice(0, 24))}${title.length > 24 ? '...' : ''}</h4>
                <button type="button" class="btn-remove-item" onclick="removeBlogArticle(${idx}, ${isHomepage})" title="Delete article">🗑️ Delete</button>
              </div>
              <div class="item-admin-thumb" style="aspect-ratio: 16/9;">
                <img src="${imgSrc || '/assets/images/b1-img-1.webp'}" id="blog-img-preview-${idx}" alt="Featured Preview">
              </div>
              <button type="button" class="btn-upload-pc" onclick="uploadBlogImage(${idx}, ${isHomepage})">
                💻 Upload Featured Image from PC
              </button>
              <div class="form-group" style="margin-top: 10px;">
                <label>Featured Image URL</label>
                <input type="text" class="form-control blog-item-img-inp" id="blog-img-inp-${idx}" value="${escapeHtml(imgSrc)}">
              </div>
              <div class="form-group">
                <label>Article Title</label>
                <input type="text" class="form-control blog-item-title-inp" id="blog-title-inp-${idx}" value="${escapeHtml(title)}">
              </div>
              <div class="form-group">
                <label>Category / Date</label>
                <input type="text" class="form-control blog-item-cat-inp" id="blog-cat-inp-${idx}" value="${escapeHtml(cat)}">
              </div>
              <div class="form-group">
                <label>Article Excerpt / Description</label>
                <textarea class="form-control blog-item-disc-inp" id="blog-disc-inp-${idx}" rows="3">${escapeHtml(disc)}</textarea>
              </div>
              <div class="form-group">
                <label>Article URL / Link</label>
                <input type="text" class="form-control blog-item-link-inp" id="blog-link-inp-${idx}" value="${escapeHtml(linkHref)}">
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="text-align: center; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-top: 15px; border-top: 1px dashed var(--border-color);">
        <button type="button" class="btn-add-section-item" onclick="addNewBlogArticle(${isHomepage})">
          ➕ Add Another Blog Post
        </button>
        <button type="button" class="btn btn-primary" onclick="saveSectionDirectly('Blog Section')">
          💾 Save Blog Section
        </button>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function uploadBlogImage(idx, isHomepage) {
  pickFileAndUpload('image/*', async (url) => {
    const input = document.getElementById(`blog-img-inp-${idx}`);
    if (input) input.value = url;
    const preview = document.getElementById(`blog-img-preview-${idx}`);
    if (preview) preview.src = url;

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentPageRawContent, 'text/html');
    const articles = isHomepage 
      ? doc.querySelectorAll('.as-blog-1-item')
      : (doc.querySelectorAll('.tx-blog-box').length > 0 ? doc.querySelectorAll('.tx-blog-box') : doc.querySelectorAll('.tz-blog-item'));

    if (articles[idx]) {
      const img = articles[idx].querySelector('.item-img img');
      if (img) img.setAttribute('src', url);
      currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      const ed = document.getElementById('raw-code-editor');
      if (ed) ed.value = currentPageRawContent;
      await saveCurrentPageSilently();
      showToast('success', `Featured image for article #${idx + 1} updated and saved!`);
    }
  });
}

async function addNewBlogArticle(isHomepage) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');

  if (isHomepage) {
    const wrap = doc.querySelector('.as-blog-1-right');
    if (!wrap) {
      showToast('error', 'Blog container not found.');
      return;
    }
    const newHtml = `
      <div class="as-blog-1-item wa_magnetic_1_trigger">
          <div class="item-img wa-fix wa-img-cover">
              <img decoding="async" class="wa_magnetic_1_elm" src="/assets/images/b1-img-1.webp" alt="Blog Post">
          </div>
          <div class="content-wrap">
              <h6 class="as-p-1 categories">
                  <a href="/blog/">Brand Design Identity</a>
              </h6>
              <h4 class="as-h-1 title wa_magnetic_btn_1">
                  <a class="wa-line-limit has-line-2" href="/blog/">How Great Design Drives Business Growth</a>
              </h4>
              <p class="as-p-1 disc wa-line-limit has-line-3">
                  Great design is more than aesthetics—it is a powerful tool that directly influences customer perception and conversions.
              </p>
              <div class="btn-wrap">
                  <a href="/blog/" class="as-pr-btn-1-v2">
                      <span class="text">Read More</span>
                      <span class="icon"><svg xmlns="http://www.w3.org/2000/svg" height="100" viewBox="0 0 100 100" width="100"><g><circle cx="90.5" cy="50" r="4.5"></circle><circle cx="77" cy="50" r="4.5"></circle><circle cx="77" cy="63.5" r="4.5"></circle><circle cx="77" cy="36.5" r="4.5"></circle><circle cx="63.5" cy="50" r="4.5"></circle><circle cx="50" cy="50" r="4.5"></circle><circle cx="36.5" cy="50" r="4.5"></circle><circle cx="23" cy="50" r="4.5"></circle><circle cx="9.5" cy="50" r="4.5"></circle><circle cx="63.5" cy="77" r="4.5"></circle><circle cx="63.5" cy="23" r="4.5"></circle></g></svg></span>
                  </a>
              </div>
          </div>
      </div>
    `;
    wrap.insertAdjacentHTML('beforeend', newHtml);
  } else {
    const wrap = doc.querySelector('.blog__wrapper') || doc.querySelector('.tz-blog-list-sec');
    if (!wrap) {
      showToast('error', 'Blog listing container not found.');
      return;
    }
    const newHtml = `
      <article class="tx-blog-box mt-30 post type-post status-publish format-standard has-post-thumbnail">
          <div class="tz-blog-item list-view-item">
              <div class="item-img">
                  <img width="1824" height="839" src="/assets/images/p2-img-3.webp" class="img-responsive w-100 wp-post-image" alt="" decoding="async">
              </div>
              <div class="item-text headline pera-content">
                  <div class="item-meta">
                      <a href="#0"><i class="fa-regular fa-calendar"></i> May 25, 2025</a>
                      <a href="#0"><i class="fa-regular fa-user"></i> Insight</a>
                      <a href="#0"><i class="fa-solid fa-comments"></i> Comments(0)</a>
                  </div>
                  <h3 class="blog_title">
                      <a href="/blog/">New Insightful Article for Creative Minds</a>
                  </h3>
                  <p>
                      Learn key strategies and techniques to scale your digital presence with human-centric design and effective marketing.
                  </p>
                  <a class="read_more" href="/blog/">Read More <i class="fa-solid fa-angles-right"></i></a>
              </div>
          </div>
      </article>
    `;
    const pag = wrap.querySelector('.tx-pagination');
    if (pag) {
      pag.insertAdjacentHTML('beforebegin', newHtml);
    } else {
      wrap.insertAdjacentHTML('beforeend', newHtml);
    }
  }

  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  const ed = document.getElementById('raw-code-editor');
  if (ed) ed.value = currentPageRawContent;
  await saveCurrentPageSilently();

  parseAndRenderSections();
  if (document.getElementById('view-page-media')?.classList.contains('active')) {
    renderPageMediaInspector();
  }
  showToast('success', 'New blog post added! You can now edit its title, excerpt, and upload a featured image.');
}

async function removeBlogArticle(idx, isHomepage) {
  if (!confirm(`Are you sure you want to remove blog article #${idx + 1}?`)) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');
  const articles = isHomepage 
    ? doc.querySelectorAll('.as-blog-1-item')
    : (doc.querySelectorAll('.tx-blog-box').length > 0 ? doc.querySelectorAll('.tx-blog-box') : doc.querySelectorAll('.tz-blog-item'));

  if (articles[idx]) {
    articles[idx].remove();
    currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    const ed = document.getElementById('raw-code-editor');
    if (ed) ed.value = currentPageRawContent;
    await saveCurrentPageSilently();

    parseAndRenderSections();
    if (document.getElementById('view-page-media')?.classList.contains('active')) {
      renderPageMediaInspector();
    }
    showToast('success', `Blog article #${idx + 1} removed!`);
  }
}

function renderFAQSection(container, el) {
  const faqs = el.querySelectorAll('.accordion-item, .faq-item');
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">❓</div>
        <div>
          <h3>FAQ Accordion Items</h3>
          <p>Frequently asked questions and answers (${faqs.length} items)</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-grid">
        ${Array.from(faqs).slice(0, 5).map((f, i) => `
          <div class="form-group full-width">
            <label>Question #${i+1}</label>
            <input type="text" class="form-control faq-question-input" value="${escapeHtml(f.querySelector('.accordion-button, .title')?.innerText || '')}">
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.appendChild(card);
}

function renderFooterSection(container, el) {
  const copyright = el.querySelector('.copyright-text, .as-footer-1-copyright')?.innerText || '';
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="sec-icon">⚓</div>
        <div>
          <h3>Footer & Contact Information</h3>
          <p>Copyright bar, contact details, and policy links</p>
        </div>
      </div>
      <div class="section-toggle">▼</div>
    </div>
    <div class="section-body">
      <div class="form-grid">
        <div class="form-group full-width">
          <label>Copyright Text</label>
          <input type="text" class="form-control" id="footer-copyright" value="${escapeHtml(copyright)}">
        </div>
        <div class="form-group">
          <label>Agency Contact Email</label>
          <input type="text" class="form-control" value="contact@insightcreativebd.com">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" class="form-control" value="+880 1971708689">
        </div>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function setupSectionAccordions() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.section-card');
      card.classList.toggle('collapsed');
    });
  });
}

// Helper for saving from individual section cards
async function saveSectionDirectly(sectionName) {
  showToast('info', `Saving ${sectionName}...`);
  await saveCurrentPage();
  showToast('success', `✅ ${sectionName} changes saved successfully!`);
}

// Synchronize changes made in Visual Editor back to raw HTML
function syncVisualToCode() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');

  // 1. Sync SEO Title
  const seoTitle = document.getElementById('seo-title')?.value;
  if (seoTitle) {
    let tEl = doc.querySelector('title');
    if (!tEl) {
      tEl = doc.createElement('title');
      doc.head.appendChild(tEl);
    }
    tEl.textContent = seoTitle;
  }

  // 2. Sync SEO Description
  const seoDesc = document.getElementById('seo-desc')?.value;
  if (seoDesc) {
    let dEl = doc.querySelector('meta[name="description"]');
    if (dEl) dEl.setAttribute('content', seoDesc);
  }

  // 3. Sync Hero Title, Disc, Button & Email
  const heroTitle = document.getElementById('hero-title-input')?.value;
  if (heroTitle) {
    const ht = doc.querySelector('.hero-title') || doc.querySelector('.as-hero-1-content h1');
    if (ht) ht.innerHTML = heroTitle;
  }
  const heroDisc = document.getElementById('hero-disc-input')?.value;
  if (heroDisc) {
    const hd = doc.querySelector('.hero-disc') || doc.querySelector('.as-hero-1-content p');
    if (hd) hd.textContent = heroDisc;
  }
  const heroBtnText = document.getElementById('hero-btn-text')?.value;
  if (heroBtnText) {
    const btnSpan = doc.querySelector('.as-hero-1-content-box .as-pr-btn-1-v2 span.text') || doc.querySelector('.as-hero-1-content-box .as-pr-btn-1-v2');
    if (btnSpan) btnSpan.textContent = heroBtnText;
  }
  const heroBtnHref = document.getElementById('hero-btn-href')?.value;
  if (heroBtnHref) {
    const btnLink = doc.querySelector('.as-hero-1-content-box .as-pr-btn-1-v2');
    if (btnLink) btnLink.setAttribute('href', heroBtnHref);
  }
  const heroEmail = document.getElementById('hero-email-input')?.value;
  if (heroEmail) {
    const emailLink = doc.querySelector('.as-hero-1-content-box a[href^="mailto:"]');
    if (emailLink) emailLink.setAttribute('href', 'mailto:' + heroEmail);
  }

  // 4. Sync About Section
  const aboutHeading = document.querySelector('.sec-heading-about')?.value;
  if (aboutHeading) {
    const ah = doc.querySelector('.as-about-1-area h2') || doc.querySelector('.as-about-1-area h3') || doc.querySelector('.tx_about h2') || doc.querySelector('.as-about-2-area h2');
    if (ah) ah.textContent = aboutHeading;
  }
  const aboutDesc = document.querySelector('.sec-desc-about')?.value;
  if (aboutDesc) {
    const ad = doc.querySelector('.as-about-1-area p') || doc.querySelector('.tx_about p') || doc.querySelector('.as-about-2-area p');
    if (ad) ad.textContent = aboutDesc;
  }

  // 5. Sync CTA Section
  const ctaHeading = document.querySelector('.sec-heading-cta')?.value;
  if (ctaHeading) {
    const ch = doc.querySelector('.as-cta-2-area h4') || doc.querySelector('.as-cta-1-area h2') || doc.querySelector('.tx_cta h2') || doc.querySelector('.tx_cta h4');
    if (ch) ch.textContent = ctaHeading;
  }
  const ctaDesc = document.querySelector('.sec-desc-cta')?.value;
  if (ctaDesc) {
    const cd = doc.querySelector('.as-cta-2-area p') || doc.querySelector('.as-cta-1-area p') || doc.querySelector('.tx_cta p');
    if (cd) cd.textContent = ctaDesc;
  }

  // 6. Sync Partner Section Title & Logos
  const partnerHeading = document.getElementById('partner-sec-heading')?.value;
  if (partnerHeading) {
    const ph = doc.querySelector('.as-partner-1-sec-title .as-sec-title-1') || doc.querySelector('.tx_brand h2');
    if (ph) ph.textContent = partnerHeading;
  }
  const partnerInputs = document.querySelectorAll('[id^="partner-input-"]');
  if (partnerInputs.length > 0) {
    const partnerLogos = doc.querySelectorAll('.as-partner-1-logo .as-partner-1-logo-single img');
    partnerInputs.forEach((inp, idx) => {
      if (partnerLogos[idx] && inp.value.trim()) {
        partnerLogos[idx].setAttribute('src', inp.value.trim());
      }
    });
  }

  // 7. Sync Footer Copyright
  const footerCopy = document.getElementById('footer-copyright')?.value;
  if (footerCopy) {
    const fc = doc.querySelector('.as-footer-1-copyright') || doc.querySelector('.copyright-text') || doc.querySelector('.as-footer-1-bottom-p');
    if (fc) fc.textContent = footerCopy;
  }

  // 8. Sync Services item titles if present
  const serviceInputs = document.querySelectorAll('.service-name-input');
  if (serviceInputs.length > 0) {
    const serviceItems = doc.querySelectorAll('.as-services-1-item, .as-service-1-item, .service-item');
    serviceInputs.forEach((inp, idx) => {
      if (serviceItems[idx]) {
        const titleEl = serviceItems[idx].querySelector('h4, h3, .title');
        if (titleEl && inp.value.trim()) titleEl.textContent = inp.value.trim();
      }
    });
  }

  // 9. Sync FAQ questions if present
  const faqInputs = document.querySelectorAll('.faq-question-input');
  if (faqInputs.length > 0) {
    const faqItems = doc.querySelectorAll('.as-accordion-item, .accordion-item');
    faqInputs.forEach((inp, idx) => {
      if (faqItems[idx]) {
        const btn = faqItems[idx].querySelector('.item-title, .accordion-button');
        if (btn && inp.value.trim()) {
          const numSpan = btn.querySelector('.text');
          const iconSpan = btn.querySelector('.icon');
          if (numSpan && iconSpan) {
            btn.innerHTML = `${numSpan.outerHTML} ${escapeHtml(inp.value.trim())} ${iconSpan.outerHTML}`;
          } else {
            btn.textContent = inp.value.trim();
          }
        }
      }
    });
  }

  // 10. Sync Features Section inputs
  const featMainTitle = document.getElementById('feature-main-title')?.value;
  if (featMainTitle) {
    const el = doc.querySelector('.as-features-1-sec-title .as-sec-title-1, .as-features-1-sec-title h2');
    if (el) el.textContent = featMainTitle;
  }
  const featMainDesc = document.getElementById('feature-main-desc')?.value;
  if (featMainDesc) {
    const el = doc.querySelector('.as-features-1-sec-title .sec-disc, .as-features-1-sec-title p');
    if (el) el.textContent = featMainDesc;
  }
  const featCreativeTitle = document.getElementById('feat-creative-title')?.value;
  if (featCreativeTitle) {
    const el = doc.querySelector('.as-features-1-creative .title');
    if (el) el.textContent = featCreativeTitle;
  }
  const featCreativeDisc = document.getElementById('feat-creative-disc')?.value;
  if (featCreativeDisc) {
    const el = doc.querySelector('.as-features-1-creative .disc');
    if (el) el.textContent = featCreativeDisc;
  }
  const featCreativeImg = document.getElementById('feat-creative-img-inp')?.value;
  if (featCreativeImg) {
    const el = doc.querySelector('.as-features-1-creative .img-elm img');
    if (el) el.setAttribute('src', featCreativeImg);
  }
  const featCreativeBg = document.getElementById('feat-creative-bg-inp')?.value;
  if (featCreativeBg) {
    const el = doc.querySelector('.as-features-1-creative');
    if (el) el.setAttribute('data-background', featCreativeBg);
  }
  const featQualityTitle = document.getElementById('feat-quality-title')?.value;
  if (featQualityTitle) {
    const el = doc.querySelector('.as-features-1-quality .title');
    if (el) el.textContent = featQualityTitle;
  }
  const featQualityDisc = document.getElementById('feat-quality-disc')?.value;
  if (featQualityDisc) {
    const el = doc.querySelector('.as-features-1-quality .disc');
    if (el) el.textContent = featQualityDisc;
  }
  const featQualityImg = document.getElementById('feat-quality-img-inp')?.value;
  if (featQualityImg) {
    const el = doc.querySelector('.as-features-1-quality .img-elm img');
    if (el) el.setAttribute('src', featQualityImg);
  }
  const featResultTitle = document.getElementById('feat-result-title')?.value;
  if (featResultTitle) {
    const el = doc.querySelector('.as-features-1-result .title');
    if (el) el.textContent = featResultTitle;
  }
  const featResultDisc = document.getElementById('feat-result-disc')?.value;
  if (featResultDisc) {
    const el = doc.querySelector('.as-features-1-result .disc');
    if (el) el.textContent = featResultDisc;
  }
  const featResultBg = document.getElementById('feat-result-bg-inp')?.value;
  if (featResultBg) {
    const el = doc.querySelector('.as-features-1-result');
    if (el) el.setAttribute('data-background', featResultBg);
  }

  // 11. Sync Portfolio Section inputs
  const portMainTitle = document.getElementById('portfolio-main-title')?.value;
  if (portMainTitle) {
    const el = doc.querySelector('.as-portfolio-1-sec-title .as-sec-title-1, .as-portfolio-1-sec-title h2');
    if (el) el.textContent = portMainTitle;
  }
  const portCards = document.querySelectorAll('.portfolio-admin-grid .item-admin-card');
  if (portCards.length > 0) {
    const portItems = doc.querySelectorAll('.as-portfolio-1-item');
    portCards.forEach((card, idx) => {
      if (portItems[idx]) {
        const titleVal = card.querySelector('.portfolio-item-title-inp')?.value;
        if (titleVal) {
          const tLink = portItems[idx].querySelector('.content-wrap .title a') || portItems[idx].querySelector('.title');
          if (tLink) tLink.textContent = titleVal;
        }
        const discVal = card.querySelector('.portfolio-item-disc-inp')?.value;
        if (discVal) {
          const dEl = portItems[idx].querySelector('.content-wrap .disc');
          if (dEl) dEl.textContent = discVal;
        }
        const linkVal = card.querySelector('.portfolio-item-link-inp')?.value;
        if (linkVal) {
          const tLink = portItems[idx].querySelector('.content-wrap .title a');
          if (tLink) tLink.setAttribute('href', linkVal);
        }
        const imgVal = card.querySelector('.portfolio-item-img-inp')?.value;
        if (imgVal) {
          const iEl = portItems[idx].querySelector('.item-img img');
          if (iEl) iEl.setAttribute('src', imgVal);
        }
        const tagsVal = card.querySelector('.portfolio-item-tags-inp')?.value;
        if (tagsVal) {
          const tagsWrap = portItems[idx].querySelector('.item-tags');
          if (tagsWrap) {
            const splitted = tagsVal.split(',').map(s => s.trim()).filter(Boolean);
            if (splitted.length > 0) {
              tagsWrap.innerHTML = splitted.map(tag => `<a href="#" class="link-elm as-p-1">${escapeHtml(tag)}</a>`).join('\n');
            }
          }
        }
      }
    });
  }

  // 12. Sync Team Section inputs
  const teamMainTitle = document.getElementById('team-main-title')?.value;
  if (teamMainTitle) {
    const el = doc.querySelector('.as-team-1-sec-title .as-sec-title-1, .as-team-1-sec-title h2');
    if (el) el.textContent = teamMainTitle;
  }
  const teamCards = document.querySelectorAll('.team-members-admin-grid .item-admin-card');
  if (teamCards.length > 0) {
    const teamMembers = (doc.querySelectorAll('.as-team-1-member-ani').length > 0
      ? doc.querySelectorAll('.as-team-1-member-ani')
      : doc.querySelectorAll('.as-team-1-member'));
    teamCards.forEach((card, idx) => {
      if (teamMembers[idx]) {
        const nameVal = card.querySelector('.team-item-name-inp')?.value;
        if (nameVal) {
          const nLink = teamMembers[idx].querySelector('.member-name a') || teamMembers[idx].querySelector('.member-name');
          if (nLink) nLink.textContent = nameVal;
        }
        const dgVal = card.querySelector('.team-item-dg-inp')?.value;
        if (dgVal) {
          const dgEl = teamMembers[idx].querySelector('.member-dg');
          if (dgEl) dgEl.textContent = dgVal;
        }
        const imgVal = card.querySelector('.team-item-img-inp')?.value;
        if (imgVal) {
          const iEl = teamMembers[idx].querySelector('.member-img img');
          if (iEl) iEl.setAttribute('src', imgVal);
        }
      }
    });
  }

  // 13. Sync Blog Section inputs
  const blogCards = document.querySelectorAll('.blog-admin-grid .item-admin-card');
  if (blogCards.length > 0) {
    const isHomepage = Boolean(doc.querySelector('.as-blog-1-item'));
    const blogItems = isHomepage 
      ? doc.querySelectorAll('.as-blog-1-item') 
      : (doc.querySelectorAll('.tx-blog-box').length > 0 ? doc.querySelectorAll('.tx-blog-box') : doc.querySelectorAll('.tz-blog-item'));
    blogCards.forEach((card, idx) => {
      if (blogItems[idx]) {
        const titleVal = card.querySelector('.blog-item-title-inp')?.value;
        if (titleVal) {
          const tLink = blogItems[idx].querySelector('.title a, .blog_title a') || blogItems[idx].querySelector('.title, .blog_title');
          if (tLink) tLink.textContent = titleVal;
        }
        const discVal = card.querySelector('.blog-item-disc-inp')?.value;
        if (discVal) {
          const dEl = blogItems[idx].querySelector('.disc, p');
          if (dEl) dEl.textContent = discVal;
        }
        const catVal = card.querySelector('.blog-item-cat-inp')?.value;
        if (catVal) {
          const cEl = blogItems[idx].querySelector('.categories a, .item-meta a');
          if (cEl) cEl.textContent = catVal;
        }
        const linkVal = card.querySelector('.blog-item-link-inp')?.value;
        if (linkVal) {
          const lEl = blogItems[idx].querySelector('.title a, .blog_title a, .btn-wrap a, .read_more');
          if (lEl) lEl.setAttribute('href', linkVal);
        }
        const imgVal = card.querySelector('.blog-item-img-inp')?.value;
        if (imgVal) {
          const iEl = blogItems[idx].querySelector('.item-img img');
          if (iEl) iEl.setAttribute('src', imgVal);
        }
      }
    });
  }

  // 14. Sync Testimonials Videos (Slot 1 & Slot 2)
  const testiVid0 = document.getElementById('testi-vid-url-0')?.value?.trim();
  const testiVid1 = document.getElementById('testi-vid-url-1')?.value?.trim();
  const testiWrappers = Array.from(doc.querySelectorAll('.as-testimonial-1-video')).filter(w => !w.parentElement.closest('.as-testimonial-1-video'));
  if (testiVid0 && testiWrappers[0]) {
    const isYt0 = testiVid0.includes('youtube.com') || testiVid0.includes('youtu.be');
    let finalUrl0 = testiVid0;
    if (isYt0 && !finalUrl0.includes('/embed/')) {
      const vidMatch = finalUrl0.match(/(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
      if (vidMatch) finalUrl0 = `https://www.youtube-nocookie.com/embed/${vidMatch[1]}?autoplay=1&mute=1&loop=1`;
    }
    if (isYt0) {
      testiWrappers[0].innerHTML = `\n                            <iframe src="${finalUrl0}" frameborder="0" allow="autoplay; fullscreen"></iframe>\n                        `;
    } else {
      testiWrappers[0].innerHTML = `\n                            <video src="${finalUrl0}" autoplay loop muted playsinline controls style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px; min-height: 280px;"></video>\n                        `;
    }
  }
  if (testiVid1 && (testiWrappers[1] || (testiWrappers.length > 0 && testiWrappers[testiWrappers.length - 1]))) {
    const targetWrap1 = testiWrappers[1] || testiWrappers[testiWrappers.length - 1];
    const isYt1 = testiVid1.includes('youtube.com') || testiVid1.includes('youtu.be');
    let finalUrl1 = testiVid1;
    if (isYt1 && !finalUrl1.includes('/embed/')) {
      const vidMatch = finalUrl1.match(/(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
      if (vidMatch) finalUrl1 = `https://www.youtube-nocookie.com/embed/${vidMatch[1]}?autoplay=1&mute=1&loop=1`;
    }
    if (isYt1) {
      targetWrap1.innerHTML = `\n                            <iframe src="${finalUrl1}" frameborder="0" allow="autoplay; fullscreen"></iframe>\n                        `;
    } else {
      targetWrap1.innerHTML = `\n                            <video src="${finalUrl1}" autoplay loop muted playsinline controls style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px; min-height: 280px;"></video>\n                        `;
    }
  }

  // 15. Sync Pricing Showcase Video
  const pricingVidUrl = document.getElementById('pricing-vid-url-input')?.value?.trim();
  if (pricingVidUrl) {
    const priceLeft = doc.querySelector('.as-price-1-left');
    if (priceLeft) {
      const isYt = pricingVidUrl.includes('youtube.com') || pricingVidUrl.includes('youtu.be');
      let finalPriceUrl = pricingVidUrl;
      if (isYt && !finalPriceUrl.includes('/embed/')) {
        const vidMatch = finalPriceUrl.match(/(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
        if (vidMatch) finalPriceUrl = `https://www.youtube-nocookie.com/embed/${vidMatch[1]}?autoplay=1&mute=1&loop=1`;
      }
      if (isYt) {
        priceLeft.innerHTML = `\n                <div class="pricing-showcase-video-wrap" style="width: 100%; height: 100%; min-height: 440px; border-radius: 24px; overflow: hidden; background: #000;">\n                    <iframe src="${finalPriceUrl}" style="width: 100%; height: 100%; min-height: 440px; border: none;" allow="autoplay; fullscreen"></iframe>\n                </div>\n            `;
      } else {
        priceLeft.innerHTML = `\n                <div class="pricing-showcase-video-wrap" style="width: 100%; height: 100%; min-height: 440px; border-radius: 24px; overflow: hidden; background: #000;">\n                    <video src="${finalPriceUrl}" autoplay loop muted playsinline controls style="width: 100%; height: 100%; min-height: 440px; object-fit: cover; border-radius: 24px;"></video>\n                </div>\n            `;
      }
    }
  }

  currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  const rawTextarea = document.getElementById('raw-code-editor');
  if (rawTextarea) rawTextarea.value = currentPageRawContent;
}

// Save current page changes
async function saveCurrentPage() {
  if (!currentPage) return;
  const btn = document.getElementById('btn-save-all');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Saving...';
  btn.disabled = true;

  // Ensure latest visual inputs are synced
  syncVisualToCode();

  try {
    const res = await fetch('/api/save-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentPage.path,
        content: currentPageRawContent
      })
    });

    if (res.ok) {
      showToast('success', `Saved ${currentPage.title} successfully!`);
    } else {
      throw new Error('Save failed');
    }
  } catch (err) {
    showToast('error', `Failed to save ${currentPage.title}: ` + err.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Media Library functions
async function loadMedia() {
  try {
    const res = await fetch('/api/media');
    if (res.ok) {
      mediaList = await res.json();
    }
  } catch (e) {
    mediaList = [];
  }
}

function openMediaView() {
  document.querySelectorAll('.topbar-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.editor-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-media').classList.add('active');

  document.getElementById('current-page-title').textContent = 'Media Library & File Uploads';
  document.getElementById('current-file-badge').textContent = 'assets/images/';

  renderMediaGrid();
}

function renderMediaGrid() {
  const grid = document.getElementById('media-items-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (mediaList.length === 0) {
    grid.innerHTML = '<p style="color: var(--text-muted); grid-column: span 4; text-align: center; padding: 30px;">No images loaded. Upload your first image above!</p>';
    return;
  }

  mediaList.forEach(item => {
    const div = document.createElement('div');
    div.className = 'media-item';
    div.innerHTML = `
      <img src="${item.url}" class="media-thumb" loading="lazy" alt="${escapeHtml(item.name)}">
      <div class="media-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      <div class="media-size">${item.size ? Math.round(item.size / 1024) + ' KB' : ''}</div>
      <div class="media-actions">
        <button class="btn btn-secondary" onclick="copyToClipboard('${item.url}')">📋 Copy URL</button>
      </div>
    `;
    grid.appendChild(div);
  });
}

async function handleFileUpload(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    showToast('info', `Uploading ${file.name}...`);
    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          data: base64Data
        })
      });
      if (res.ok) {
        showToast('success', `Uploaded ${file.name} successfully!`);
        await loadMedia();
        renderMediaGrid();
      } else {
        throw new Error('Upload error');
      }
    } catch (err) {
      showToast('error', `Failed to upload: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

// Global settings view
function openGlobalSettings() {
  document.querySelectorAll('.topbar-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.editor-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-global').classList.add('active');

  document.getElementById('current-page-title').textContent = 'Global Website Settings';
  document.getElementById('current-file-badge').textContent = 'All 19 Pages';
}

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  showToast('success', `Copied to clipboard: ${text}`);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeJs(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ==========================================
// ACTIVE PAGE MEDIA & VIDEO INSPECTOR
// ==========================================
function renderPageMediaInspector() {
  if (!currentPage) return;
  const currTitle = document.getElementById('page-media-curr-page');
  if (currTitle) currTitle.textContent = currentPage.title;

  const vidsContainer = document.getElementById('page-videos-container');
  const imgsContainer = document.getElementById('page-images-container');
  const vidCountEl = document.getElementById('page-video-count-text');
  const imgCountEl = document.getElementById('page-image-count-text');

  vidsContainer.innerHTML = '';
  imgsContainer.innerHTML = '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');

  // Find all Videos
  const videos = [];

  // Iframes
  doc.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.getAttribute('src') || '';
    if (src.includes('youtube') || src.includes('vimeo') || src.includes('.mp4')) {
      videos.push({
        type: src.includes('youtube') ? 'YouTube Embed' : (src.includes('vimeo') ? 'Vimeo Embed' : 'Iframe Video'),
        src: src,
        tag: 'iframe',
        alt: iframe.getAttribute('title') || 'Video Embed'
      });
    }
  });

  // Video tags
  doc.querySelectorAll('video').forEach(vid => {
    const src = vid.getAttribute('src') || vid.querySelector('source')?.getAttribute('src') || '';
    if (src) {
      videos.push({
        type: 'Local HTML5 Video',
        src: src,
        tag: 'video',
        alt: 'HTML5 Video'
      });
    }
  });

  // A links to videos
  doc.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.match(/(?:youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm)/i)) {
      videos.push({
        type: 'Video Link / Popup',
        src: href,
        tag: 'a',
        alt: a.textContent.trim() || 'Video Link'
      });
    }
  });

  vidCountEl.textContent = `Found ${videos.length} video(s) on ${currentPage.title}`;

  if (videos.length === 0) {
    vidsContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📹</div>
        <p>No video player or video embed found on this page.</p>
      </div>
    `;
  } else {
    videos.forEach((vid, idx) => {
      const card = document.createElement('div');
      card.className = 'video-card';
      
      let previewHtml = '';
      if (vid.src.includes('youtube.com') || vid.src.includes('youtu.be')) {
        let cleanSrc = vid.src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/').replace(/[?&]autoplay=[0-9]/g, '').replace(/[?&]loop=[0-9]/g, '');
        previewHtml = `<iframe src="${escapeHtml(cleanSrc)}" style="width: 100%; height: 100%; border: none;" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
      } else if (vid.src.endsWith('.mp4') || vid.src.endsWith('.webm') || vid.src.endsWith('.mov')) {
        previewHtml = `<video src="${escapeHtml(vid.src)}" controls></video>`;
      } else {
        previewHtml = `<iframe src="${escapeHtml(vid.src)}" style="width: 100%; height: 100%; border: none;"></iframe>`;
      }

      card.innerHTML = `
        <div class="video-preview-wrap">
          <span class="video-type-badge">${escapeHtml(vid.type)}</span>
          ${previewHtml}
        </div>
        <div class="video-details">
          <div class="video-url-label">Video #${idx + 1} Source / Embed URL</div>
          <input type="text" class="form-control" id="vid-input-${idx}" value="${escapeHtml(vid.src)}">
          <div class="video-actions-row">
            <button class="btn-update-src" onclick="updateVideoUrlFromCard('${escapeJs(vid.src)}', 'vid-input-${idx}')">
              🔄 Update URL
            </button>
            <button class="btn-upload-pc" onclick="triggerVideoUpload('${escapeJs(vid.src)}')">
              💻 Upload Video from PC (.mp4)
            </button>
          </div>
        </div>
      `;
      vidsContainer.appendChild(card);
    });
  }

  // Find all Images (both <img> tags and CSS data-background/data-heroImgUrl)
  const seenSrcs = new Set();
  const images = [];

  // Helper to categorize images
  const categorizeImage = (src, parentSection, alt) => {
    let contextLabel = 'Page Graphic';
    let catKey = 'general';
    const cls = parentSection ? (parentSection.className || '') : '';
    const srcLower = src.toLowerCase();

    if (cls.includes('hero') || srcLower.includes('h1-') || srcLower.includes('active-bg')) {
      contextLabel = 'Hero Banner';
      catKey = 'hero';
    } else if (cls.includes('partner') || srcLower.includes('p1-logo')) {
      contextLabel = 'Partners Logo';
      catKey = 'partners';
    } else if (cls.includes('about') || srcLower.includes('a1-') || srcLower.includes('author-')) {
      contextLabel = 'About & Process';
      catKey = 'about';
    } else if (cls.includes('service') || srcLower.includes('s1-')) {
      contextLabel = 'Services Showcase';
      catKey = 'services';
    } else if (cls.includes('team') || srcLower.includes('t1-')) {
      contextLabel = 'Team Portrait';
      catKey = 'team';
    } else if (cls.includes('testimonial') || srcLower.includes('author')) {
      contextLabel = 'Testimonials / Feedback';
      catKey = 'testimonials';
    } else if (cls.includes('blog') || srcLower.includes('b1-')) {
      contextLabel = 'Blog Article';
      catKey = 'blog';
    } else if (cls.includes('header') || srcLower.includes('logo')) {
      contextLabel = 'Header Branding';
      catKey = 'hero';
    } else if (cls.includes('footer')) {
      contextLabel = 'Footer Element';
      catKey = 'general';
    }

    return { contextLabel, catKey };
  };

  // 1. Scan standard <img> tags
  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:') || seenSrcs.has(src)) return;
    seenSrcs.add(src);

    const alt = img.getAttribute('alt') || '';
    const parentSection = img.closest('section, header, footer, div[class*="-area"], div[class*="hero"], div[class*="about"], div[class*="partner"]');
    const { contextLabel, catKey } = categorizeImage(src, parentSection, alt);

    images.push({
      src: src,
      alt: alt,
      context: contextLabel,
      category: catKey
    });
  });

  // 2. Scan background images (data-background and data-heroImgUrl)
  doc.querySelectorAll('[data-background], [data-heroImgUrl]').forEach(el => {
    const bgSrc = el.getAttribute('data-background') || el.getAttribute('data-heroImgUrl');
    if (!bgSrc || bgSrc.startsWith('data:') || seenSrcs.has(bgSrc)) return;
    seenSrcs.add(bgSrc);

    const { contextLabel, catKey } = categorizeImage(bgSrc, el, 'Background Graphic');
    images.push({
      src: bgSrc,
      alt: 'Background Graphic',
      context: contextLabel + ' (BG)',
      category: catKey
    });
  });

  imgCountEl.textContent = `Found ${images.length} image(s) on ${currentPage.title}`;

  if (images.length === 0) {
    imgsContainer.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-state-icon">🖼️</div><p>No images found on this page.</p></div>';
  } else {
    images.forEach((img, idx) => {
      const card = document.createElement('div');
      card.className = 'page-image-card';
      card.setAttribute('data-category', img.category);
      const filename = img.src.split('/').pop().split('?')[0];

      // File size lookup from mediaList
      let sizeStr = 'Calculating...';
      const matched = mediaList.find(m => m.name === filename || m.url === img.src || (m.url && m.url.endsWith(filename)));
      if (matched && matched.size) {
        sizeStr = formatBytes(matched.size);
      }

      card.innerHTML = `
        <div class="page-image-thumb-wrap">
          <img src="${img.src}" class="page-image-thumb" id="img-preview-${idx}" loading="lazy" alt="${escapeHtml(img.alt)}" onload="window.onThumbLoad(${idx}, this)">
        </div>
        <div class="image-dimensions-bar">
          <span class="dim-pill" id="dim-pill-${idx}">📐 Measuring...</span>
          <span class="filesize-pill" id="filesize-pill-${idx}">💾 ${sizeStr}</span>
        </div>
        <div class="page-image-body">
          <div class="page-image-name" title="${escapeHtml(filename)}">${escapeHtml(filename)}</div>
          <div class="page-image-context">
            <span>🏷️</span>
            <span>${escapeHtml(img.context)} ${img.alt ? '(' + escapeHtml(img.alt) + ')' : ''}</span>
          </div>
          <div class="page-image-input-wrap">
            <input type="text" class="form-control" id="img-path-input-${idx}" value="${escapeHtml(img.src)}">
          </div>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <button class="btn-update-src" style="flex: 1;" onclick="updateImagePathFromCard('${escapeJs(img.src)}', 'img-path-input-${idx}')">
              🔄 Change
            </button>
            <button class="btn-upload-pc" style="flex: 2;" onclick="triggerImageUpload('${escapeJs(img.src)}')">
              💻 Upload from PC
            </button>
          </div>
        </div>
      `;
      imgsContainer.appendChild(card);

      // Async fallback if size not found in mediaList
      if (sizeStr === 'Calculating...') {
        fetch(img.src, { method: 'HEAD' }).then(res => {
          const cl = res.headers.get('content-length');
          if (cl) {
            const pill = document.getElementById(`filesize-pill-${idx}`);
            if (pill) pill.textContent = '💾 ' + formatBytes(parseInt(cl, 10));
          }
        }).catch(() => {});
      }
    });

    setupCategoryFilterPills();
  }
}

// Global Image Thumbnail Load Callback
window.onThumbLoad = function(idx, imgEl) {
  const pill = document.getElementById(`dim-pill-${idx}`);
  if (pill && imgEl.naturalWidth && imgEl.naturalHeight) {
    pill.innerHTML = `📐 <strong>${imgEl.naturalWidth} × ${imgEl.naturalHeight}</strong> px`;
  }
};

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function switchToMediaTab() {
  document.querySelectorAll('.topbar-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.topbar-tab[data-target="view-page-media"]').classList.add('active');
  document.querySelectorAll('.editor-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-page-media').classList.add('active');
  renderPageMediaInspector();
}

function setupCategoryFilterPills() {
  document.querySelectorAll('#page-image-filter-pills .filter-pill').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#page-image-filter-pills .filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('#page-images-container .page-image-card').forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    };
  });
}

function normalizeVideoEmbedUrl(url) {
  if (!url) return '';
  url = url.trim();
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    const vidId = watchMatch[1];
    return `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&mute=1&loop=1`;
  }
  return url;
}

function triggerImageUpload(oldSrc) {
  activeReplaceTarget = {
    type: 'page-image',
    oldSrc: oldSrc,
    pagePath: currentPage.path
  };
  document.getElementById('page-img-replace-input').click();
}

function triggerVideoUpload(oldSrc) {
  activeReplaceTarget = {
    type: 'page-video',
    oldSrc: oldSrc,
    pagePath: currentPage.path
  };
  document.getElementById('page-vid-replace-input').click();
}

async function handleImageReplacement(file, target) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    showToast('info', `Uploading replacement image ${file.name}...`);
    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          data: base64Data
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newUrl = data.url;
        showToast('success', `Uploaded ${file.name}! Updating page...`);
        
        await replaceMediaInCurrentPage(target.oldSrc, newUrl);
        showToast('success', `Image replaced and saved successfully!`);
        await loadAllSiteMediaCounts();
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      showToast('error', `Failed to replace image: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

async function handleVideoReplacement(file, target) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    showToast('info', `Uploading video ${file.name}... Please wait...`);
    try {
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          data: base64Data
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newUrl = data.url;
        showToast('success', `Video uploaded! Updating page...`);
        
        await replaceMediaInCurrentPage(target.oldSrc, newUrl);
        showToast('success', `Video replaced and saved successfully!`);
        await loadAllSiteMediaCounts();
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      showToast('error', `Failed to upload video: ${err.message}`);
    }
  };
  reader.readAsDataURL(file);
}

async function updateVideoUrlFromCard(oldSrc, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const rawUrl = input.value;
  const newUrl = normalizeVideoEmbedUrl(rawUrl);
  input.value = newUrl;
  await replaceMediaInCurrentPage(oldSrc, newUrl);
  showToast('success', 'Video URL updated and page saved!');
}

async function updateImagePathFromCard(oldSrc, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const newUrl = input.value.trim();
  await replaceMediaInCurrentPage(oldSrc, newUrl);
  showToast('success', 'Image path updated and page saved!');
}

async function replaceMediaInCurrentPage(oldSrc, newUrl) {
  const cleanOld = oldSrc.trim();
  const withoutSlash = cleanOld.replace(/^\//, '');
  const withSlash = '/' + withoutSlash;

  const isNewVideo = /\.(mp4|webm|mov|m4v)$/i.test(newUrl);
  const isNewYouTube = /youtube\.com|youtu\.be/i.test(newUrl);

  const parser = new DOMParser();
  const doc = parser.parseFromString(currentPageRawContent, 'text/html');

  let domHandled = false;
  // If replacing an iframe with a local video file
  if (isNewVideo) {
    const iframes = doc.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.getAttribute('src') || '';
      if (src.includes(cleanOld) || src.includes(withoutSlash) || src.includes(withSlash)) {
        const vid = doc.createElement('video');
        vid.setAttribute('src', newUrl);
        vid.setAttribute('autoplay', '');
        vid.setAttribute('loop', '');
        vid.setAttribute('muted', '');
        vid.setAttribute('playsinline', '');
        vid.setAttribute('controls', '');
        vid.setAttribute('style', 'width: 100%; height: 100%; object-fit: cover; border-radius: 24px; min-height: 280px;');
        iframe.parentNode.replaceChild(vid, iframe);
        domHandled = true;
      }
    });
  } else if (isNewYouTube) {
    const normUrl = normalizeVideoEmbedUrl(newUrl);
    const videos = doc.querySelectorAll('video');
    videos.forEach(vid => {
      const src = vid.getAttribute('src') || '';
      if (src.includes(cleanOld) || src.includes(withoutSlash) || src.includes(withSlash)) {
        const iframe = doc.createElement('iframe');
        iframe.setAttribute('src', normUrl);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; fullscreen');
        iframe.setAttribute('style', 'width: 100%; height: 100%; border-radius: 24px; border: none; min-height: 280px;');
        vid.parentNode.replaceChild(iframe, vid);
        domHandled = true;
      }
    });
  }

  if (domHandled) {
    currentPageRawContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  } else {
    const escapedClean = escapeRegex(cleanOld);
    const escapedWith = escapeRegex(withSlash);
    const escapedWithout = escapeRegex(withoutSlash);
    const pattern = "(src|href|data-background|data-heroImgUrl)=[\"'](?:" + escapedClean + "|" + escapedWith + "|" + escapedWithout + ")[\"']";
    const regex = new RegExp(pattern, 'gi');
    currentPageRawContent = currentPageRawContent.replace(regex, '$1="' + newUrl + '"');
  }
  
  document.getElementById('raw-code-editor').value = currentPageRawContent;
  await saveCurrentPage();
  parseAndRenderSections();
  renderPageMediaInspector();
}

// Explicit global attachments for HTML inline onclick handlers
window.pickFileAndUpload = pickFileAndUpload;
window.saveCurrentPageSilently = saveCurrentPageSilently;
window.saveCurrentPage = saveCurrentPage;
window.saveSectionDirectly = saveSectionDirectly;
window.selectPage = selectPage;
window.openMediaView = openMediaView;
window.openGlobalSettings = openGlobalSettings;
window.renderPageMediaInspector = renderPageMediaInspector;
window.parseAndRenderSections = parseAndRenderSections;
window.syncVisualToCode = syncVisualToCode;

// Features
window.uploadFeatureCreativeImage = uploadFeatureCreativeImage;
window.uploadFeatureCreativeBg = uploadFeatureCreativeBg;
window.uploadFeatureQualityImage = uploadFeatureQualityImage;
window.uploadFeatureResultBg = uploadFeatureResultBg;
window.applyFeatureUpdate = applyFeatureUpdate;

// Portfolio
window.uploadPortfolioImage = uploadPortfolioImage;
window.addNewPortfolioProject = addNewPortfolioProject;
window.removePortfolioProject = removePortfolioProject;

// Team
window.uploadTeamPhoto = uploadTeamPhoto;
window.addNewTeamMember = addNewTeamMember;
window.removeTeamMember = removeTeamMember;

// Blog
window.uploadBlogImage = uploadBlogImage;
window.addNewBlogArticle = addNewBlogArticle;
window.removeBlogArticle = removeBlogArticle;

// Testimonials & Pricing Videos
window.updateTestimonialVideoUrl = updateTestimonialVideoUrl;
window.triggerTestimonialVideoUpload = triggerTestimonialVideoUpload;
window.applyTestimonialVideoToHtml = applyTestimonialVideoToHtml;
window.applyPricingVideoUrl = applyPricingVideoUrl;
window.triggerPricingVideoUpload = triggerPricingVideoUpload;
window.restorePricingScreenshots = restorePricingScreenshots;
window.applyPricingMediaToHtml = applyPricingMediaToHtml;

// Partners
window.removePartnerLogo = removePartnerLogo;
window.updatePartnerLogoPathFromCard = updatePartnerLogoPathFromCard;
window.triggerPartnerLogoUpload = triggerPartnerLogoUpload;
window.triggerAddNewPartnerLogo = triggerAddNewPartnerLogo;
window.addNewPartnerLogoPlaceholder = addNewPartnerLogoPlaceholder;
window.handlePartnerLogoFileAdd = handlePartnerLogoFileAdd;

// Media Library & Inspector
window.triggerImageReplace = triggerImageReplace;
window.triggerVideoUpload = triggerVideoUpload;
window.updateVideoUrlFromCard = updateVideoUrlFromCard;
window.updateImageSrcFromCard = updateImageSrcFromCard;
window.copyToClipboard = copyToClipboard;
window.showToast = showToast;


