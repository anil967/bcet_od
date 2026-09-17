// Main Odyssey Application Controller — Managing Serial Unlock & Brown Foot Path Trails

import { SYMBOLS_DATA } from './data.js';
import { OdysseyMap } from './map.js';
import { audioSystem } from './audio.js';

class OdysseyApp {
  constructor() {
    this.currentSymbolId = null;
    this.activeTab = 'lore';
    this.odysseyMap = null;
    this.unlockedStep = 1; // 1 to 5
    this.symbolOrder = ['voyage', 'realms', 'protocols', 'legions', 'odyssey'];
  }

  init() {
    // 1. Initialize Interactive Map
    this.odysseyMap = new OdysseyMap('map-container', 'map-wrapper', (symbolId) => {
      this.handleSymbolClick(symbolId);
    });

    // 1.1 Opening Page Screen & Entrance Trigger
    const mapWrapper = document.getElementById('map-wrapper');
    const introScreen = document.getElementById('intro-opening-screen');
    const introVideo = document.getElementById('intro-bg-video');

    const transitionToMap = () => {
      audioSystem.playBackgroundMusic();
      if (introScreen && !introScreen.classList.contains('fade-out')) {
        introScreen.classList.add('fade-out');
        setTimeout(() => {
          introScreen.style.display = 'none';
          mapWrapper?.classList.add('slide-in');
        }, 600);
      }
    };

    if (introVideo) {
      introVideo.muted = false;
      introVideo.play().catch(() => {
        introVideo.muted = true;
        introVideo.play().catch(() => {});
      });

      audioSystem.playBackgroundMusic();

      // When opening page video finishes, automatically transition to map
      introVideo.addEventListener('ended', () => {
        transitionToMap();
      });
    }

    // Optional click on intro screen to transition to map
    introScreen?.addEventListener('click', () => {
      audioSystem.playBackgroundMusic();
      transitionToMap();
    });

    // 2. Setup Top Header Nav Pill Click Handlers
    const navPills = document.querySelectorAll('.symbol-nav .nav-pill');
    navPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const symbolId = pill.getAttribute('data-symbol');
        const stepIdx = this.symbolOrder.indexOf(symbolId) + 1;

        if (stepIdx <= this.unlockedStep) {
          audioSystem.playClick();
          this.openSymbolPage(symbolId);
        } else {
          audioSystem.playClick();
          this.showLockedNotice(stepIdx);
        }
      });
    });

    // 3. Brand Logo Click -> Return to Map
    document.getElementById('brand-logo')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });



    // 5. Guide Modal Toggle
    const guideBtn = document.getElementById('guide-btn');
    const guideModal = document.getElementById('guide-modal');
    const guideCloseBtn = document.getElementById('guide-close-btn');
    const guideConfirmBtn = document.getElementById('guide-confirm-btn');

    guideBtn?.addEventListener('click', () => {
      audioSystem.playClick();
      guideModal?.classList.add('active');
    });

    [guideCloseBtn, guideConfirmBtn].forEach(btn => {
      btn?.addEventListener('click', () => {
        audioSystem.playClick();
        guideModal?.classList.remove('active');
      });
    });

    // 6. Artifact Modal Handlers
    const artModal = document.getElementById('artifact-modal');
    const artCloseBtn = document.getElementById('modal-close-btn');
    const artConfirmBtn = document.getElementById('art-confirm-btn');

    [artCloseBtn, artConfirmBtn].forEach(btn => {
      btn?.addEventListener('click', () => {
        audioSystem.playClick();
        artModal?.classList.remove('active');
      });
    });

    // 6b. Registration Modal Handlers
    const regModal = document.getElementById('registration-modal');
    const regCloseBtn = document.getElementById('reg-close-btn');
    const regForm = document.getElementById('reg-form');
    const regSuccessMsg = document.getElementById('reg-success-msg');
    const teamSizeSelect = document.getElementById('reg-team-size');
    const memberCards = [...document.querySelectorAll('.member-card[data-member-slot]')];

    const updateMemberPanels = () => {
      const teamSize = Number(teamSizeSelect?.value || 3);
      const additionalMemberCount = teamSize - 1;
      memberCards.forEach((card) => {
        const slot = Number(card.dataset.memberSlot);
        card.hidden = slot > additionalMemberCount;
      });
    };

    teamSizeSelect?.addEventListener('change', updateMemberPanels);
    updateMemberPanels();

    regCloseBtn?.addEventListener('click', () => {
      audioSystem.playClick();
      regModal?.classList.remove('active');
    });

    regForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('reg-submit-btn');
      const errorEl = document.getElementById('reg-error-msg');
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }

      // Gather team & leader data
      const teamName = document.getElementById('reg-team-name')?.value?.trim() || '';
      const leaderName = document.getElementById('reg-leader-name')?.value?.trim() || '';
      const leaderPhone = document.getElementById('reg-leader-phone')?.value?.trim() || '';
      const leaderEmail = document.getElementById('reg-email')?.value?.trim() || '';
      const teamSize = Number(teamSizeSelect?.value || 0);

      // Gather team members
      const members = [];
      for (let i = 1; i <= teamSize - 1; i++) {
        const mName = document.getElementById(`reg-m${i}-name`)?.value?.trim() || '';
        const mEmail = document.getElementById(`reg-m${i}-email`)?.value?.trim() || '';
        const mPhone = document.getElementById(`reg-m${i}-phone`)?.value?.trim() || '';
        if (mName || mEmail || mPhone) {
          members.push({ memberSlot: i, name: mName, email: mEmail, phone: mPhone });
        }
      }

      const accommodation = document.getElementById('reg-accommodation')?.value || '';
      const institution = document.getElementById('reg-institution')?.value?.trim() || '';
      const paymentSlipInput = document.getElementById('reg-payment-slip');
      const paymentSlipFile = paymentSlipInput?.files?.[0];

      if (paymentSlipFile) {
        const fileName = paymentSlipFile.name.toLowerCase();
        const isJpg = /\.(jpg|jpeg)$/.test(fileName) && paymentSlipFile.type === 'image/jpeg';
        if (!isJpg) {
          if (errorEl) {
            errorEl.textContent = '⚠️ Please upload the payment slip in JPG format only.';
            errorEl.style.display = 'block';
          }
          return;
        }
      }

      // Helper to read file as Base64 data URL
      const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          dataUrl: reader.result
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let paymentSlip = null;
      if (paymentSlipFile) {
        try {
          paymentSlip = await readFileAsBase64(paymentSlipFile);
        } catch (fileErr) {
          console.warn('Could not read payment slip file:', fileErr);
        }
      }

      const payload = {
        teamName,
        leaderName,
        leaderPhone,
        leaderEmail,
        teamSize,
        members,
        accommodation,
        institution,
        paymentSlip
      };

      // Set loading state on button
      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⚔️ ENLISTING YOUR LEGION INTO ODYSSEY...';
      }

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const responseBody = await response.text();
        let result;
        try {
          result = JSON.parse(responseBody);
        } catch {
          throw new Error(
            response.status === 404
              ? 'Registration service is not available on this server. Please deploy the Node.js server and try again.'
              : `Registration service returned an unexpected response (${response.status}).`
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Registration submission failed');
        }

        audioSystem.playTriumph();
        const teamNameEl = document.getElementById('odysseus-team-name');
        if (teamNameEl) teamNameEl.textContent = teamName || 'your team';
        const registrationIdEl = document.getElementById('odyssey-registration-id');
        if (registrationIdEl) registrationIdEl.textContent = result.insertedId || '';
        regForm.style.display = 'none';
        if (regSuccessMsg) regSuccessMsg.style.display = 'flex';
      } catch (err) {
        console.error('Registration failed:', err);
        if (errorEl) {
          errorEl.textContent = `⚠️ Error saving registration: ${err.message || 'Please check connection'}`;
          errorEl.style.display = 'block';
        } else {
          alert(`Registration Error: ${err.message}`);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });

    // 6c. Payment QR Scanner Modal Handlers
    const paymentQrTrigger = document.getElementById('payment-qr-trigger');
    const paymentQrModal = document.getElementById('payment-qr-modal');
    const paymentQrCloseBtn = document.getElementById('payment-qr-close-btn');
    const paymentQrDoneBtn = document.getElementById('payment-qr-done-btn');

    const openPaymentQrModal = () => {
      audioSystem?.playClick();
      paymentQrModal?.classList.add('active');
    };

    const closePaymentQrModal = () => {
      audioSystem?.playClick();
      paymentQrModal?.classList.remove('active');
    };

    paymentQrTrigger?.addEventListener('click', openPaymentQrModal);
    paymentQrTrigger?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPaymentQrModal();
      }
    });

    [paymentQrCloseBtn, paymentQrDoneBtn].forEach(btn => {
      btn?.addEventListener('click', closePaymentQrModal);
    });

    paymentQrModal?.addEventListener('click', (e) => {
      if (e.target === paymentQrModal) {
        closePaymentQrModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && paymentQrModal?.classList.contains('active')) {
        closePaymentQrModal();
      }
    });

    // 7. Background Particle Canvas
    this.initParticleCanvas();

    // 8. Handle Hash Router
    window.addEventListener('hashchange', () => this.handleHashRoute());
    this.handleHashRoute();

    // Initialize UI states
    this.updateSerialUnlockState();
  }

  handleSymbolClick(symbolId) {
    const stepIdx = this.symbolOrder.indexOf(symbolId) + 1;

    if (stepIdx <= this.unlockedStep) {
      // Progressively unlock next step if clicking current maximum step
      if (stepIdx === this.unlockedStep && this.unlockedStep < 5) {
        this.unlockedStep++;
        this.updateSerialUnlockState();
      }
      this.openSymbolPage(symbolId);
    } else {
      this.showLockedNotice(stepIdx);
    }
  }

  updateSerialUnlockState() {
    // 1. Update Map Pins & Nav Pills
    this.symbolOrder.forEach((id, idx) => {
      const step = idx + 1;
      const pin = document.getElementById(`pin-${id}`);
      const pill = document.getElementById(`pill-${id}`);

      if (step <= this.unlockedStep) {
        pin?.classList.remove('locked');
        pin?.classList.add('unlocked');
        pill?.classList.remove('locked');
        pill?.classList.add('unlocked');

        // Update Tooltip Action Prompt
        const promptEl = pin?.querySelector('.action-prompt');
        if (promptEl) {
          promptEl.classList.remove('prompt-status');
          if (id === 'voyage') {
            promptEl.textContent = `Click Here \u2192`;
          } else {
            promptEl.textContent = `Open Realm ${step} \u2192`;
          }
        }
      } else {
        pin?.classList.remove('unlocked');
        pin?.classList.add('locked');
        pill?.classList.remove('unlocked');
        pill?.classList.add('locked');
      }
    });

    // 2. Animate Brown Footpath Trail Segments
    for (let i = 1; i <= 4; i++) {
      const trail = document.getElementById(`trail-seg-${i}`);
      if (i < this.unlockedStep) {
        trail?.classList.add('active');
      } else {
        trail?.classList.remove('active');
      }
    }

    // 3. Update Status Bar Text
    const statusText = document.getElementById('trail-status-text');
    if (statusText) {
      if (this.unlockedStep >= 5) {
        statusText.textContent = `🎉 All 5 Realms Unlocked! Complete Journey to Innovation Foot Path Trail Active.`;
      } else {
        const nextSymbolName = SYMBOLS_DATA[this.symbolOrder[this.unlockedStep - 1]].name;
        statusText.textContent = `Step ${this.unlockedStep - 1} of 5 Completed \u2022 Foot Path Trail Extended to ${nextSymbolName}!`;
      }
    }
  }

  showLockedNotice(stepIdx) {
    const prevName = SYMBOLS_DATA[this.symbolOrder[stepIdx - 2]]?.name;
    alert(`🔒 This symbol is locked! Complete ${prevName} (Symbol ${stepIdx - 1}) first to extend the brown foot path trail!`);
  }

  handleHashRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'register' || hash.startsWith('register-')) {
      const trackName = hash.includes('-') ? decodeURIComponent(hash.split('-').slice(1).join('-')) : '';
      this.openRegistrationPage(trackName, false);
      return;
    }
    if (SYMBOLS_DATA[hash]) {
      const stepIdx = this.symbolOrder.indexOf(hash) + 1;
      if (stepIdx <= this.unlockedStep) {
        this.openSymbolPage(hash, false);
      } else {
        this.showMapView(false);
      }
    } else {
      this.showMapView(false);
    }
  }

  openRegistrationPage(trackTitle, updateHash = true) {
    document.body.classList.remove('home-view-active');

    // Auto-unfold map container if navigating directly
    const mapContainer = document.getElementById('map-container');
    const mapWrapper = document.getElementById('map-wrapper');
    if (mapContainer && !mapContainer.classList.contains('unfolded')) {
      mapContainer.classList.add('unfolded');
      mapWrapper?.classList.add('slide-in');
    }

    this.currentSymbolId = 'register';

    if (updateHash) {
      window.location.hash = trackTitle ? `register-${encodeURIComponent(trackTitle)}` : 'register';
    }

    // Highlight top header pill (none active)
    document.querySelectorAll('.symbol-nav .nav-pill').forEach(pill => pill.classList.remove('active'));

    const container = document.getElementById('subpage-content');
    if (container) {
      this.renderRegistrationPageContent(container, trackTitle);
      container.scrollTop = 0;
    }

    const mapView = document.getElementById('map-view');
    const subpageView = document.getElementById('subpage-view');

    mapView?.classList.remove('active');
    subpageView?.classList.add('active');

    audioSystem.playLyreArpeggio();
  }


  showMapView(updateHash = true) {
    if (updateHash) {
      window.history.pushState(null, '', ' ');
    }

    document.body.classList.add('home-view-active');

    const mapView = document.getElementById('map-view');
    const subpageView = document.getElementById('subpage-view');

    mapView?.classList.add('active');
    subpageView?.classList.remove('active');

    // Highlight active pill
    document.querySelectorAll('.symbol-nav .nav-pill').forEach(pill => {
      const id = pill.getAttribute('data-symbol');
      if (id === this.currentSymbolId) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  openSymbolPage(symbolId, updateHash = true) {
    const data = SYMBOLS_DATA[symbolId];
    if (!data) return;

    document.body.classList.remove('home-view-active');

    // Auto-unfold map container if navigating directly to a subpage
    const mapContainer = document.getElementById('map-container');
    const mapWrapper = document.getElementById('map-wrapper');
    if (mapContainer && !mapContainer.classList.contains('unfolded')) {
      mapContainer.classList.add('unfolded');
      mapWrapper?.classList.add('slide-in');
    }

    this.currentSymbolId = symbolId;
    this.activeTab = 'lore';

    if (updateHash) {
      window.location.hash = symbolId;
    }

    // Highlight top header pill
    document.querySelectorAll('.symbol-nav .nav-pill').forEach(pill => {
      if (pill.getAttribute('data-symbol') === symbolId) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Render Subpage HTML
    this.renderSubpageContent(data);

    // Switch View Visibility
    const mapView = document.getElementById('map-view');
    const subpageView = document.getElementById('subpage-view');

    mapView?.classList.remove('active');
    subpageView?.classList.add('active');

    // Scroll subpage to top
    const container = document.getElementById('subpage-content');
    if (container) container.scrollTop = 0;

    audioSystem.playLyreArpeggio();
  }

  renderSubpageContent(data) {
    const container = document.getElementById('subpage-content');
    if (!container) return;

    // Special "About Us" layout for the Voyage page
    if (data.id === 'voyage') {
      this.renderVoyageAboutUs(container, data);
      return;
    }

    // Special "Hackathon" layout for the Realms page
    if (data.id === 'realms') {
      this.renderRealmsHackathon(container, data);
      return;
    }

    // Special "Protocols" layout for the Protocols page
    if (data.id === 'protocols') {
      this.renderProtocolsPage(container, data);
      return;
    }

    // Special "Legions" layout for the Legions page
    if (data.id === 'legions') {
      this.renderLegionsPage(container, data);
      return;
    }

    // Special "Odyssey" layout for the Odyssey page
    if (data.id === 'odyssey') {
      this.renderOdysseyPage(container, data);
      return;
    }

    container.innerHTML = `
      <!-- Hero Section -->
      <section class="page-hero" style="background-image: url('${data.heroImg}');">
        <div class="hero-content">
          <button class="back-map-btn" id="back-to-map-btn">
            <span>&larr;</span> Return to Map & Foot Path
          </button>
          <h1 class="hero-main-title">
            <span class="hero-title-icon">${data.icon}</span>
            ${data.name}
          </h1>
          <div class="hero-greek-sub">${data.greekName}</div>
          <div class="hero-tagline">${data.tagline}</div>
        </div>

        <div class="hero-quote-box">
          <p class="quote-text">${data.quote}</p>
          <span class="quote-author">&mdash; ${data.quoteAuthor}</span>
        </div>
      </section>

      <!-- Main Body with Tabs -->
      <section class="page-body-container">
        <!-- Navigation Tab Bar -->
        <nav class="page-tab-bar">
          <button class="tab-btn active" data-tab="lore">
            <span>📜</span> Lore & Epic Tale
          </button>
          <button class="tab-btn" data-tab="artifacts">
            <span>🛡️</span> Artifact Vault (${data.artifacts.length})
          </button>
          <button class="tab-btn" data-tab="challenge">
            <span>⚔️</span> Realm Challenge
          </button>
          <button class="tab-btn" data-tab="stats">
            <span>🗺️</span> Chart Data
          </button>
        </nav>

        <!-- TAB 1: LORE CHAPTERS -->
        <div class="tab-panel active" id="panel-lore">
          <div class="lore-grid">
            <div class="lore-chapters-col">
              <div class="chapter-card">
                <h3 class="chapter-title">Overview of the Realm</h3>
                <p class="chapter-content">${data.overview}</p>
              </div>

              ${data.loreChapters.map((chap, idx) => `
                <div class="chapter-card">
                  <h3 class="chapter-title">Chapter ${idx + 1}: ${chap.title}</h3>
                  <p class="chapter-content">${chap.content}</p>
                </div>
              `).join('')}
            </div>

            <div class="lore-sidebar-col">
              <div class="sidebar-box">
                <h4 class="sidebar-title">Realms Coordinates</h4>
                <div class="stats-list">
                  <div class="stat-item">
                    <span class="stat-lbl">Chart Grid:</span>
                    <span class="stat-val">${data.coords}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-lbl">Symbol ID:</span>
                    <span class="stat-val">${data.id.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div class="sidebar-box">
                <h4 class="sidebar-title">Mythic Attributes</h4>
                <div class="stats-list">
                  ${data.stats.map(s => `
                    <div class="stat-item">
                      <span class="stat-lbl">${s.label}:</span>
                      <span class="stat-val">${s.value}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: ARTIFACT VAULT -->
        <div class="tab-panel" id="panel-artifacts">
          <div class="artifacts-grid">
            ${data.artifacts.map((art, idx) => `
              <div class="artifact-card">
                <div>
                  <span class="art-card-badge">${art.badge}</span>
                  <h3 class="art-card-title">${art.name}</h3>
                  <div class="art-card-origin">${art.origin}</div>
                  <p class="art-card-desc">${art.desc}</p>
                </div>
                <button class="inspect-btn" data-art-idx="${idx}">Inspect Relic &rarr;</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- TAB 3: REALM CHALLENGE -->
        <div class="tab-panel" id="panel-challenge">
          <div class="challenge-card">
            <h3 class="chapter-title" style="margin-bottom:1rem;">Trial of Cunning & Courage</h3>
            <p class="challenge-question">${data.challenge.question}</p>
            <div class="options-list">
              ${data.challenge.options.map((opt, i) => `
                <button class="option-btn" data-opt-idx="${i}">
                  ${i + 1}. ${opt.text}
                </button>
              `).join('')}
            </div>
            <div class="challenge-feedback" id="challenge-feedback"></div>
          </div>
        </div>

        <!-- TAB 4: CHART DATA -->
        <div class="tab-panel" id="panel-stats">
          <div class="chapter-card">
            <h3 class="chapter-title">Geographical & Strategic Charting</h3>
            <div class="stats-list" style="margin-top:1.5rem; gap:1.2rem;">
              <div class="stat-item" style="padding-bottom:0.8rem;">
                <span class="stat-lbl">Realm Name:</span>
                <span class="stat-val">${data.name} (${data.greekName})</span>
              </div>
              <div class="stat-item" style="padding-bottom:0.8rem;">
                <span class="stat-lbl">Primary Coordinates:</span>
                <span class="stat-val">${data.coords}</span>
              </div>
              <div class="stat-item" style="padding-bottom:0.8rem;">
                <span class="stat-lbl">Navigational Risk Level:</span>
                <span class="stat-val" style="color:var(--color-gold-bright);">High Mythic Peril</span>
              </div>
              <div class="stat-item" style="padding-bottom:0.8rem;">
                <span class="stat-lbl">Divine Patronage:</span>
                <span class="stat-val">Olympian Council</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    // Attach Back to Map Listener
    document.getElementById('back-to-map-btn')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });

    // Attach Tab Switch Handlers
    const tabBtns = container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        audioSystem.playClick();
        const tabName = btn.getAttribute('data-tab');

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        container.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });

        const targetPanel = container.querySelector(`#panel-${tabName}`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // Attach Artifact Inspect Listeners
    container.querySelectorAll('.inspect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audioSystem.playClick();
        const idx = parseInt(btn.getAttribute('data-art-idx'), 10);
        const art = data.artifacts[idx];
        if (art) this.openArtifactModal(art);
      });
    });

    // Attach Challenge Choice Listeners
    container.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-opt-idx'), 10);
        const opt = data.challenge.options[idx];
        const feedbackEl = container.querySelector('#challenge-feedback');

        if (feedbackEl && opt) {
          feedbackEl.className = 'challenge-feedback ' + (opt.correct ? 'success' : 'failure');
          feedbackEl.textContent = opt.feedback;

          if (opt.correct) {
            audioSystem.playTriumph();
          } else {
            audioSystem.playClick();
          }
        }
      });
    });
  }

  /* ─── Voyage: "About Us" Special Page ─── */
  renderVoyageAboutUs(container, data) {
    container.innerHTML = `
      <div class="voyage-cover-wrapper" style="background-image: url('${data.heroImg}');">
        <div class="voyage-cover-overlay">
          <div class="voyage-header-bar">
            <button class="back-map-btn" id="back-to-map-btn">
              <span>&larr;</span> Return to Map
            </button>
          </div>

          <!-- About Us Section with Slow Pop-up from Bottom -->
          <section class="aboutus-section">
            <h1 class="aboutus-heading">ABOUT US</h1>

            <div class="aboutus-divider">
              <span class="aboutus-divider-icon">⚓</span>
            </div>

            <div class="aboutus-body">
              <p class="aboutus-paragraph">
                Every journey begins with a vision, and every vision begins with a spark. At <strong>BCET</strong>, <strong>ODYSSEY</strong> turns that spark into a journey of innovation.
              </p>
              <p class="aboutus-paragraph">
                This is not just a destination—it is the beginning of something yet to be discovered.
              </p>
              <p class="aboutus-paragraph">
                Where curiosity becomes courage, and ideas become possibilities.
              </p>
              <p class="aboutus-paragraph">
                Where aspiration becomes reality.
              </p>
            </div>

            <!-- Extended KPI Cards with Background Images -->
            <div class="aboutus-kpi-row">
              <a href="https://bcetodisha.ac.in/" target="_blank" class="aboutus-kpi-card kpi-card-1" id="kpi-card-1" title="The Unbindable Bow - BCET">
                <div class="kpi-card-bg-layer" style="background-image: url('/images/bcet.jpg');"></div>
                <div class="kpi-card-overlay"></div>
                <div class="kpi-card-content">
                  <div class="kpi-badge">PILLAR I</div>
                  <h2 class="kpi-title">The Unbindable Bow</h2>
                  <h3 class="kpi-subheading">BCET</h3>
                  <p class="kpi-desc">
                    Like an unbindable bow that never loses its strength, BCET stands firm in its pursuit of knowledge and innovation. With every challenge, we draw stronger; with every idea, we aim higher—turning vision into action and possibilities into reality.
                  </p>
                  <div class="kpi-link-label">Visit BCET &rarr;</div>
                </div>
              </a>

              <a href="https://falconclub.xyz/" target="_blank" class="aboutus-kpi-card kpi-card-2" id="kpi-card-2" title="Hephaestus Forge - FALCON CLUB">
                <div class="kpi-card-bg-layer" style="background-image: url('/images/falcon.jpeg');"></div>
                <div class="kpi-card-overlay"></div>
                <div class="kpi-card-content">
                  <div class="kpi-badge">PILLAR II</div>
                  <h2 class="kpi-title">Hephaestus Forge</h2>
                  <h3 class="kpi-subheading">FALCON CLUB</h3>
                  <p class="kpi-desc">
                    Like Hephaestus, the master of the forge, FALCON Communities turns passion into strength and ideas into creation. With the courage to rise, the vision to soar, and the spirit to create—Aim High, Fly High.
                  </p>
                  <div class="kpi-link-label">Visit Falcon Club &rarr;</div>
                </div>
              </a>
            </div>

            <!-- Premium Contact Section -->
            <div class="aboutus-contact-section">
              <h2 class="aboutus-heading contact-section-heading">CONTACT</h2>

              <div class="aboutus-divider">
                <span class="aboutus-divider-icon">🏛️</span>
              </div>

              <div class="contact-grid">
                <article class="contact-card">
                  <div class="contact-card-badge">Event Organiser</div>
                  <h3 class="contact-name">Larence Ku. Khamurai</h3>
                  <p class="contact-role">Event Organiser</p>
                  <a class="contact-phone" href="tel:+918984485551">
                    <svg class="contact-phone-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    8984485551
                  </a>
                  <a class="contact-call-btn" href="tel:+918984485551">
                    <span>Call Now</span>
                    <span class="contact-btn-arrow">&rarr;</span>
                  </a>
                </article>

                <article class="contact-card">
                  <div class="contact-card-badge">Event Coordinator</div>
                  <h3 class="contact-name">Bijayalaxmi Swain</h3>
                  <p class="contact-role">Event Coordinator</p>
                  <a class="contact-phone" href="tel:+919438007678">
                    <svg class="contact-phone-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    9438007678
                  </a>
                  <a class="contact-call-btn" href="tel:+919438007678">
                    <span>Call Now</span>
                    <span class="contact-btn-arrow">&rarr;</span>
                  </a>
                </article>

                <article class="contact-card">
                  <div class="contact-card-badge">Creative &amp; Design Lead</div>
                  <h3 class="contact-name">Ariyan S.S. Acharya</h3>
                  <p class="contact-role">Creative &amp; Design Lead</p>
                  <a class="contact-phone" href="tel:+917735376968">
                    <svg class="contact-phone-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    7735376968
                  </a>
                  <a class="contact-call-btn" href="tel:+917735376968">
                    <span>Call Now</span>
                    <span class="contact-btn-arrow">&rarr;</span>
                  </a>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    // Back button
    document.getElementById('back-to-map-btn')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });

    // Contact call audio feedback
    container.querySelectorAll('.contact-call-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audioSystem.playClick();
      });
    });

    // KPI Card Click audio / interaction feedback disabled as requested
    // const card1 = document.getElementById('kpi-card-1');
    // const card2 = document.getElementById('kpi-card-2');
    // [card1, card2].forEach(card => {
    //   card?.addEventListener('click', () => {
    //     audioSystem.playTriumph();
    //   });
    // });
  }

  /* ─── Realms: "Hackathon" Special Page ─── */
  renderRealmsHackathon(container, data) {
    container.innerHTML = `
      <div class="realms-cover-wrapper" style="background-image: url('${data.heroImg}');">
        <div class="realms-cover-overlay">
          <div class="voyage-header-bar">
            <button class="back-map-btn" id="back-to-map-btn">
              <span>&larr;</span> Return to Map
            </button>
          </div>

          <!-- Hackathon Section -->
          <section class="hackathon-section">
            <h1 class="hackathon-heading">HACKATHON</h1>

            <div class="hackathon-tagline">Enter the Quest. Create the Future.</div>

            <div class="aboutus-divider">
              <span class="aboutus-divider-icon">🏛️</span>
            </div>

            <div class="hackathon-body">
              <p class="hackathon-paragraph">
                <strong>ODYSSEY</strong> is not just a hackathon; it is a journey where ideas turn into impact. It brings together creative minds, passionate innovators, and problem-solvers to tackle real-world challenges. Participants will explore new frontiers, transform bold ideas into working solutions, and learn through collaboration. Every challenge is a quest, every team is a legion, and every solution marks a step forward. With innovation as the compass and creativity as the driving force, the journey begins. Step into <strong>ODYSSEY</strong> — and begin your Journey to Innovation.
              </p>
            </div>

            <!-- Team Rules -->
            <div class="hackathon-rules-card">
              <h3 class="hackathon-rules-title">📌 Team Rules</h3>
              <ul class="hackathon-rules-list">
                <li><span class="rule-icon">🚫</span> Inter-college teams are not allowed.</li>
                <li><span class="rule-icon">🏫</span> All team members must belong to the same institution.</li>
                <li><span class="rule-icon">👥</span> Team size: 3–5 members per team.</li>
                <li><span class="rule-icon">👩</span> At least 1 female member is mandatory in every team</li>
                <li><span class="rule-icon">💰</span> The registration fee is ₹500 per team.</li>
              </ul>
            </div>

            <!-- 4 Hackathon KPI Cards -->
            <div class="hack-kpi-grid">
              <div class="hack-kpi-card">
                <div class="hack-kpi-number">I</div>
                <h2 class="hack-kpi-title">Software Deployment with AI Implementation</h2>
                <div class="hack-kpi-cta">Join the Quest</div>
              </div>

              <div class="hack-kpi-card">
                <div class="hack-kpi-number">II</div>
                <h2 class="hack-kpi-title">IOT with Software Solutions</h2>
                <div class="hack-kpi-cta">Join the Quest</div>
              </div>

              <div class="hack-kpi-card">
                <div class="hack-kpi-number">III</div>
                <h2 class="hack-kpi-title">Tech for Bharat & Social Impact</h2>
                <div class="hack-kpi-cta">Join the Quest</div>
              </div>

              <div class="hack-kpi-card">
                <div class="hack-kpi-number">IV</div>
                <h2 class="hack-kpi-title">Automation Development / Agentic AI Development</h2>
                <div class="hack-kpi-cta">Join the Quest</div>
              </div>
            </div>

            <!-- Quest Rewards Section -->
            <section class="quest-rewards-section">
              <h2 class="rewards-heading">QUEST REWARDS</h2>
              <div class="rewards-tagline">Glory, Honor & Legendary Treasures Await the Champions</div>

              <div class="aboutus-divider">
                <span class="aboutus-divider-icon">🏆</span>
              </div>

              <!-- 3 Main Prize Pools -->
              <div class="main-prizes-grid">
                <!-- 1st Prize: The Spear of Athena -->
                <div class="reward-card first-prize">
                  <div class="reward-crown-badge">1ST PLACE</div>
                  <div class="reward-img-frame">
                    <img src="/images/spear_of_athena.jpg" alt="The Spear of Athena" class="reward-artwork">
                    <div class="reward-art-glow"></div>
                  </div>
                  <h3 class="reward-title">The Spear of Athena</h3>
                  <div class="reward-amount">₹10,000</div>
                  <div class="reward-subtitle">Grand Champion Prize</div>
                </div>

                <!-- 2nd Prize: The Corinthian Helmet -->
                <div class="reward-card second-prize">
                  <div class="reward-crown-badge">2ND PLACE</div>
                  <div class="reward-img-frame">
                    <img src="/images/corinthian_helmet.jpg" alt="The Corinthian Helmet" class="reward-artwork">
                    <div class="reward-art-glow"></div>
                  </div>
                  <h3 class="reward-title">The Corinthian Helmet</h3>
                  <div class="reward-amount">₹7,000</div>
                  <div class="reward-subtitle">First Runner-Up Prize</div>
                </div>

                <!-- 3rd Prize: The Shield of Achilles -->
                <div class="reward-card third-prize">
                  <div class="reward-crown-badge">3RD PLACE</div>
                  <div class="reward-img-frame">
                    <img src="/images/shield_achilles.jpg" alt="The Shield of Achilles" class="reward-artwork">
                    <div class="reward-art-glow"></div>
                  </div>
                  <h3 class="reward-title">The Shield of Achilles</h3>
                  <div class="reward-amount">₹5,000</div>
                  <div class="reward-subtitle">Second Runner-Up Prize</div>
                </div>
              </div>

              <!-- 2 Special Category Prizes -->
              <div class="special-prizes-title-wrap">
                <h3 class="special-prizes-heading">SPECIAL CATEGORY LAURELS</h3>
              </div>

              <div class="special-prizes-grid">
                <!-- Special Prize 1: Business Potential -->
                <div class="special-reward-card midas-touch">
                  <div class="special-badge">BUSINESS POTENTIAL</div>
                  <div class="special-img-frame">
                    <img src="/images/midas_touch.jpg" alt="The Midas Touch" class="special-artwork">
                    <div class="special-art-glow"></div>
                  </div>
                  <h4 class="special-reward-title">The Midas Touch</h4>
                  <p class="special-reward-desc">Awarded for exceptional market viability, commercial strategy & economic potential.</p>
                </div>

                <!-- Special Prize 2: Best Innovation -->
                <div class="special-reward-card promethean-fire">
                  <div class="special-badge">BEST INNOVATION</div>
                  <div class="special-img-frame">
                    <img src="/images/promethean_fire.jpg" alt="The Promethean Fire" class="special-artwork">
                    <div class="special-art-glow"></div>
                  </div>
                  <h4 class="special-reward-title">The Promethean Fire</h4>
                  <p class="special-reward-desc">Awarded for groundbreaking technological spark, creative design & innovative impact.</p>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    `;

    // Back button
    document.getElementById('back-to-map-btn')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });

    // Scroll-triggered pop-up for KPI cards
    const kpiCards = container.querySelectorAll('.hack-kpi-card');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const delay = Array.from(kpiCards).indexOf(card) * 150;
          setTimeout(() => {
            card.classList.add('visible');
          }, delay);
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.15 });

    kpiCards.forEach(card => {
      observer.observe(card);

      // Click event for "Join the Quest" -> Shoot Weapon Arrow & Open Registration
      card.addEventListener('click', () => {
        const trackTitle = card.querySelector('.hack-kpi-title')?.textContent || 'Hackathon Track';
        this.triggerWeaponArrow(trackTitle);
      });
    });
  }

  /* ─── Protocols: Custom Protocols Page ─── */
  renderProtocolsPage(container, data) {
    container.innerHTML = `
      <div class="realms-cover-wrapper" style="background-image: url('${data.heroImg}');">
        <div class="realms-cover-overlay">
          <div class="voyage-header-bar">
            <button class="back-map-btn" id="back-to-map-btn">
              <span>&larr;</span> Return to Map
            </button>
          </div>

          <section class="protocols-section">
            <h1 class="hackathon-heading">PROTOCOLS</h1>

            <div class="aboutus-divider">
              <span class="aboutus-divider-icon">⚖️</span>
            </div>

            <div class="protocols-body">
              <ol class="protocols-list">
                <li>The ODYSSEY is a 24 hrs based hackathon event.</li>
                <li>Every team can have 3 to 5 members in their team. A girl team member is mandatory in the team.</li>
                <li>Every team should nominate a team leader. He/She will be responsible for communication purpose with the organizing committee. No change will be taken into consideration after the registration is completed. Check the information properly before you undergo registration.</li>
                <li>There will be a shortlisting round where out of all teams 20 to 25 teams will be selected.</li>
                <li>Please provide info about your arrival and accommodations.</li>
                <li>Fooding will be provided to the participants during the event.</li>
                <li>Carry the necessary documents for verification and identification process (AADHAR CARD, College ID cards, NOC from Authorized Individual).</li>
                <li>Wifi/Internet Access will be provided where required but the team is requested to have all the required technical components and dependencies with them (laptops, IoT components, etc). The organizing committee will not be held responsible for any kind of data loss of the team due to hardware or software glitch.</li>
                <li>Everyone is expected to maintain discipline and adhere to the rules provided by the organizers.</li>
                <li>Team members can belong to different academic year and department but of same college.</li>
                <li>On spot tasks will be provided by the judges during the event.</li>
                <li>Must be original work and any kind of plagiarism or malpractice activity will lead to disqualification.</li>
                <li>For any kind of problem, immediately contact the organizing team.</li>
                <li>There will be total 3 rounds in the event.</li>
              </ol>
            </div>

            <!-- Schedule Roadmap Section -->
            <div class="roadmap-container">
              <h2 class="roadmap-heading">EVENT ROADMAP & SCHEDULE</h2>
              <div class="roadmap-tagline">The Path of Innovation & Chronology of Quests</div>

              <div class="aboutus-divider">
                <span class="aboutus-divider-icon">📜</span>
              </div>

              <div class="roadmap-timeline">
                <!-- Milestone 1 -->
                <div class="timeline-item">
                  <div class="timeline-marker">1</div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h3 class="timeline-title">The Call to Quest</h3>
                      <span class="timeline-date">16th Sept 2026</span>
                    </div>
                    <p class="timeline-desc">The call has been made—step forward, embrace the challenge, and begin your journey to innovation.</p>
                  </div>
                </div>

                <!-- Milestone 2 -->
                <div class="timeline-item">
                  <div class="timeline-marker">2</div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h3 class="timeline-title">The Final Call</h3>
                      <span class="timeline-date">30th Sept 2026</span>
                    </div>
                    <p class="timeline-desc">The final call is here—take your last step forward and claim your place in the ODYSSEY.</p>
                  </div>
                </div>

                <!-- Milestone 3 -->
                <div class="timeline-item">
                  <div class="timeline-marker">3</div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h3 class="timeline-title">Interaction with Mortals</h3>
                      <span class="timeline-date">1st Oct & 2nd Oct 2026</span>
                    </div>
                    <p class="timeline-desc">Where innovators meet, ideas speak, and the worthy are chosen for the next quest.</p>
                  </div>
                </div>

                <!-- Milestone 4 -->
                <div class="timeline-item">
                  <div class="timeline-marker">4</div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h3 class="timeline-title">Call for Final Verdict</h3>
                      <span class="timeline-date">5th Oct 2026</span>
                    </div>
                    <p class="timeline-desc">The final verdict is cast—only the worthy shall advance to the next realm.</p>
                  </div>
                </div>

                <!-- Milestone 5 -->
                <div class="timeline-item highlight-item">
                  <div class="timeline-marker">5</div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h3 class="timeline-title">The ODYSSEY BEGINS</h3>
                      <span class="timeline-date">13th Oct & 14th Oct 2026</span>
                    </div>
                    <p class="timeline-desc">The hour has come—the chosen embark on their ultimate journey to innovation.</p>
                  </div>
                </div>

                <!-- Milestone 6 -->
                <div class="timeline-item champion-item">
                  <div class="timeline-marker">👑</div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h3 class="timeline-title">The Conquerors</h3>
                      <span class="timeline-date">14th Oct 2026</span>
                    </div>
                    <p class="timeline-desc">From mere mortals to mighty champions—their courage and vision have earned them a place among the legends.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    // Back button
    document.getElementById('back-to-map-btn')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });

    // Intersection Observer for Timeline Items (Footprint trail animation)
    const timelineItems = container.querySelectorAll('.timeline-item');
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -15% 0px',
      threshold: 0.1
    };

    const timelineObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    timelineItems.forEach(item => {
      timelineObserver.observe(item);
    });
  }

  /* ─── Odyssey: Custom Odyssey Promo Video Page ─── */
  renderOdysseyPage(container, data) {
    container.innerHTML = `
      <div class="realms-cover-wrapper" style="background-image: url('${data.heroImg}');">
        <div class="realms-cover-overlay">
          <div class="voyage-header-bar">
            <button class="back-map-btn" id="back-to-map-btn">
              <span>&larr;</span> Return to Map
            </button>
          </div>

          <section class="odyssey-promo-section" style="max-width: 1400px; margin: 1rem auto 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2.2rem; padding: 0 1.5rem;">
            <h1 class="hackathon-heading" style="margin-top: 1rem;">THE QUEST TRAILER</h1>

            <div class="aboutus-divider">
              <span class="aboutus-divider-icon">🏛️</span>
            </div>

            <div class="legion-kpi-card promo-video-card" style="width: 100%; max-width: 1300px; padding: 2rem; background: rgba(16, 10, 5, 0.85); border: 2px solid var(--border-gold); border-radius: 20px; box-shadow: 0 15px 45px rgba(0, 0, 0, 0.95); display: flex; flex-direction: column; align-items: center; gap: 1.5rem;">
              <div class="promo-video-wrapper" style="width: 100%; border-radius: 12px; overflow: hidden; border: 1.5px solid rgba(255, 215, 0, 0.2); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.9);">
                <video autoplay loop muted playsinline preload="auto" style="width: 100%; height: auto; display: block;">
                  <source src="/odysseynoaudio.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <!-- Allies / Sponsors Heading Section -->
            <div class="allies-header-section" style="margin-top: 2rem; width: 100%;">
              <h2 class="hackathon-heading" style="font-size: 2.2rem; margin-bottom: 0.5rem;">THE ALLIES OF ODYSSEY</h2>
              <p class="hackathon-tagline" style="font-size: 1.1rem; max-width: 800px; margin: 0 auto;">Every great voyage needs powerful allies—our sponsors make this journey possible</p>
              
              <div class="aboutus-divider" style="margin-top: 1.5rem;">
                <span class="aboutus-divider-icon">🛡️</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    // Back button
    document.getElementById('back-to-map-btn')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });
  }

  /* ─── Legions: Custom Legions & Leadership Page (15 KPI Cards) ─── */
  renderLegionsPage(container, data) {
    container.innerHTML = `
      <div class="realms-cover-wrapper" style="background-image: url('${data.heroImg}');">
        <div class="realms-cover-overlay">
          <div class="voyage-header-bar">
            <button class="back-map-btn" id="back-to-map-btn">
              <span>&larr;</span> Return to Map
            </button>
          </div>

          <section class="legions-section">
            <h1 class="hackathon-heading">THE LEGIONS</h1>
            <div class="hackathon-tagline">The High Command & Vanguard of ODYSSEY</div>

            <div class="aboutus-divider">
              <span class="aboutus-divider-icon">🏛️</span>
            </div>

            <!-- Supreme Leadership KPI Cards (Cards 1, 2, 3) -->
            <div class="legion-high-grid">
              <!-- KPI Card 1: The High King -->
              <div class="legion-kpi-card high-king-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/high_king.jpg" alt="Manmath Biswal" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <h2 class="legion-card-title">The High King</h2>
                  <div class="legion-name">Manmath Biswal</div>
                  <div class="legion-role">Chairman</div>
                </div>
              </div>

              <!-- KPI Card 2: The Commander -->
              <div class="legion-kpi-card commander-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/commander.jpg" alt="Jyoti Ranjan Rout" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <h2 class="legion-card-title">The Commander</h2>
                  <div class="legion-name">Jyoti Ranjan Rout</div>
                  <div class="legion-role">The Convenor</div>
                </div>
              </div>

              <!-- KPI Card 3: The Sovereign Queen -->
              <div class="legion-kpi-card queen-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/suhasini_queen.jpg" alt="Suhasini Choudhury" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <h2 class="legion-card-title">The Sovereign Queen</h2>
                  <div class="legion-name">Suhasini Choudhury</div>
                  <div class="legion-role">The Faculty Incharge</div>
                </div>
              </div>
            </div>

            <!-- Vanguard Heading Section (Card 4 Container) -->
            <div class="vanguard-banner">
              <span class="vanguard-badge">⚡ THE PLANNING COMMITTEE</span>
              <h2 class="vanguard-title">The Vanguard of Odyssey</h2>
              <p class="vanguard-subtitle">The Strategic Masterminds & Core Execution Officers</p>
            </div>

            <!-- Planning Committee Sub-KPI Cards (Sub-Cards 4A to 4F / Cards 4 - 9) -->
            <div class="vanguard-kpi-grid">
              <!-- Sub KPI Card 4A: HERA -->
              <div class="vanguard-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/hera_new.jpg" alt="A.S. Deepali" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="vanguard-deity-badge">HERA</div>
                  <h3 class="vanguard-person-name">A.S. Deepali</h3>
                  <div class="vanguard-person-role">The Chief Organizer</div>
                </div>
              </div>

              <!-- Sub KPI Card 4B: ATHENA -->
              <div class="vanguard-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/athena_new.jpg" alt="Ankita Das" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="vanguard-deity-badge">ATHENA</div>
                  <h3 class="vanguard-person-name">Ankita Das</h3>
                  <div class="vanguard-person-role">The Lead Organizer</div>
                </div>
              </div>

              <!-- Sub KPI Card 4C: APHRODITE -->
              <div class="vanguard-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/aphrodite_new.jpg" alt="Bijayalaxmi Swain" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="vanguard-deity-badge">APHRODITE</div>
                  <h3 class="vanguard-person-name">Bijayalaxmi Swain</h3>
                  <div class="vanguard-person-role">The Event Coordinator</div>
                </div>
              </div>

              <!-- Sub KPI Card 4D: KRATOS -->
              <div class="vanguard-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/kratos_new.jpg" alt="Lawrence Kumar Khamurai" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="vanguard-deity-badge">KRATOS</div>
                  <h3 class="vanguard-person-name">Lawrence Kumar Khamurai</h3>
                  <div class="vanguard-person-role">The Event Organizer</div>
                </div>
              </div>

              <!-- Sub KPI Card 4E: HEPHAESTUS -->
              <div class="vanguard-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/hephaestus_new.jpg" alt="Ariyan S.S. Acharya" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="vanguard-deity-badge">HEPHAESTUS</div>
                  <h3 class="vanguard-person-name">Ariyan S.S. Acharya</h3>
                  <div class="vanguard-person-role">The Creative & Design Lead</div>
                </div>
              </div>

              <!-- Sub KPI Card 4F: POSEIDON -->
              <div class="vanguard-kpi-card has-photo poseidon-lead-card">
                <div class="card-photo-side">
                  <img src="/images/poseidon_new.jpg" alt="Guru Gourav Panda" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="vanguard-deity-badge poseidon-badge">POSEIDON</div>
                  <h3 class="vanguard-person-name">Guru Gourav Panda</h3>
                  <div class="vanguard-person-role">The Outreach Lead</div>
                </div>
              </div>
            </div>

            <!-- Operational Legions Heading Section -->
            <div class="vanguard-banner ops-banner">
              <span class="vanguard-badge">🛡️ OPERATIONAL FORCES</span>
              <h2 class="vanguard-title">Legion Operational Divisions</h2>
            </div>

            <!-- Operational Squad KPI Cards (Cards 10 - 16) -->
            <div class="ops-kpi-grid">
              <!-- KPI Card 10 -->
              <div class="ops-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/iris_new.jpg" alt="IRIS" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="ops-num">X</div>
                  <h3 class="ops-title">IRIS</h3>
                  <div class="ops-role">Web Developers</div>
                </div>
              </div>

              <!-- KPI Card 11 -->
              <div class="ops-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/helios_new.jpg" alt="HELIOS" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="ops-num">XI</div>
                  <h3 class="ops-title">HELIOS</h3>
                  <div class="ops-role">Media Production</div>
                </div>
              </div>

              <!-- KPI Card 13 -->
              <div class="ops-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/atlas_new.jpg" alt="ATLAS CORE" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="ops-num">XIII</div>
                  <h3 class="ops-title">ATLAS CORE</h3>
                  <div class="ops-role">Technical team</div>
                </div>
              </div>

              <!-- KPI Card 14 -->
              <div class="ops-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/hermes_new.jpg" alt="HERMES PRODUCTION" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="ops-num">XIV</div>
                  <h3 class="ops-title">HERMES PRODUCTION</h3>
                  <div class="ops-role">Event Handling Team</div>
                </div>
              </div>

              <!-- KPI Card 15 -->
              <div class="ops-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/chiron_new.jpg" alt="CHIRON ALLIANCE" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="ops-num">XV</div>
                  <h3 class="ops-title">CHIRON ALLIANCE</h3>
                  <div class="ops-role">Volunteer team</div>
                </div>
              </div>

              <!-- KPI Card 16 -->
              <div class="ops-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/pheme_new.jpg" alt="PHEME" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="ops-num">XVI</div>
                  <h3 class="ops-title">PHEME</h3>
                  <div class="ops-role">Public Relation & Marketing</div>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>
    `;

    // Back button
    document.getElementById('back-to-map-btn')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });

    // Intersection Observer for Vanguard Cards Deck Spread animation
    const vanguardGrid = container.querySelector('.vanguard-kpi-grid');
    if (vanguardGrid) {
      const vanguardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            vanguardGrid.classList.add('spread');
          } else {
            vanguardGrid.classList.remove('spread');
          }
        });
      }, { threshold: 0.15 });
      vanguardObserver.observe(vanguardGrid);
    }

    // Intersection Observer for Supreme Leadership Cards (Commander and Queen sliding in from sides)
    const highGrid = container.querySelector('.legion-high-grid');
    if (highGrid) {
      const highObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            highGrid.classList.add('slide-in');
          } else {
            highGrid.classList.remove('slide-in');
          }
        });
      }, { threshold: 0.15 });
      highObserver.observe(highGrid);
    }
  }

  /* ─── Trigger Weapon Arrow Flight & Open Dedicated Registration Page ─── */
  triggerWeaponArrow(trackTitle) {
    const overlay = document.getElementById('weapon-arrow-overlay');
    const wrapper = document.getElementById('weapon-arrow-wrapper');

    if (!overlay || !wrapper) {
      this.openRegistrationPage(trackTitle);
      return;
    }

    // Reset arrow state
    overlay.classList.add('active');
    wrapper.classList.remove('shoot');
    void wrapper.offsetWidth; // force reflow
    wrapper.classList.add('shoot');

    // As arrow reaches target (~650ms), open registration page view
    setTimeout(() => {
      this.openRegistrationPage(trackTitle);
    }, 650);

    // Clean up arrow after animation ends
    setTimeout(() => {
      overlay.classList.remove('active');
      wrapper.classList.remove('shoot');
    }, 900);
  }

  openRegistrationModal(trackTitle) {
    this.openRegistrationPage(trackTitle);
  }

  renderRegistrationPageContent(container, trackTitle) {
    const displayTrack = trackTitle || 'All Tracks';
    container.innerHTML = `
      <div class="realms-cover-wrapper" style="background-image: url('/images/realms_hero.jpg');">
        <div class="realms-cover-overlay">
          <div class="voyage-header-bar">
            <button class="back-map-btn" id="reg-page-back-map-btn">
              <span>&larr;</span> Return to Map
            </button>
          </div>

          <section class="protocols-section reg-page-section">
            <h1 class="hackathon-heading">QUEST REGISTRATION</h1>
            <div class="registration-track-badge">TRACK: ${displayTrack}</div>

            <div class="aboutus-divider">
              <span class="aboutus-divider-icon">📜</span>
            </div>

            <div class="reg-page-card">
              <!-- Team Rules Banner -->
              <div class="reg-rules-banner">
                <div class="reg-rules-title">📌 Team Rules</div>
                <ul class="reg-rules-list">
                  <li>🚫 Inter-college teams are not allowed.</li>
                  <li>🏫 All team members must belong to the same institution.</li>
                  <li>👥 Team size: 3–5 members per team.</li>
                  <li>👩 At least 1 female member is mandatory in every team</li>
                  <li>💰 The registration fee is ₹500 per team.</li>
                </ul>
              </div>

              <form id="reg-page-form">
                <!-- Team & Leader Info -->
                <div class="reg-field">
                  <label for="reg-page-team-name">Legion / Team Name</label>
                  <input type="text" id="reg-page-team-name" placeholder="e.g. Achaean Innovators" required>
                </div>
                <div class="reg-grid-2">
                  <div class="reg-field">
                    <label for="reg-page-leader-name">Team Leader Name</label>
                    <input type="text" id="reg-page-leader-name" placeholder="e.g. Odysseus" required>
                  </div>
                  <div class="reg-field">
                    <label for="reg-page-leader-phone">Team Leader Phone No.</label>
                    <input type="tel" id="reg-page-leader-phone" placeholder="e.g. +91 9876543210" required>
                  </div>
                </div>
                <div class="reg-field">
                  <label for="reg-page-email">Team Leader Email Address</label>
                  <input type="email" id="reg-page-email" placeholder="leader@institution.edu" required>
                </div>

                <div class="reg-field">
                  <label for="reg-page-team-size">Number of Team Members (including team leader)</label>
                  <select id="reg-page-team-size" required>
                    <option value="3" selected>3 members</option>
                    <option value="4">4 members</option>
                    <option value="5">5 members</option>
                  </select>
                </div>

                <!-- Additional Team Members Section -->
                <div class="reg-members-section">
                  <h3 class="reg-members-title">🛡️ Additional Legion Team Members</h3>

                  <div class="member-card" data-member-slot="1">
                    <h4 class="member-card-heading">Member 1</h4>
                    <div class="reg-grid-3">
                      <div class="reg-field">
                        <label for="reg-page-m1-name">Name</label>
                        <input type="text" id="reg-page-m1-name" placeholder="Member 1 Name">
                      </div>
                      <div class="reg-field">
                        <label for="reg-page-m1-email">Email</label>
                        <input type="email" id="reg-page-m1-email" placeholder="member1@email.com">
                      </div>
                      <div class="reg-field">
                        <label for="reg-page-m1-phone">Phone No.</label>
                        <input type="tel" id="reg-page-m1-phone" placeholder="Phone No.">
                      </div>
                    </div>
                  </div>

                  <div class="member-card" data-member-slot="2">
                    <h4 class="member-card-heading">Member 2</h4>
                    <div class="reg-grid-3">
                      <div class="reg-field">
                        <label for="reg-page-m2-name">Name</label>
                        <input type="text" id="reg-page-m2-name" placeholder="Member 2 Name">
                      </div>
                      <div class="reg-field">
                        <label for="reg-page-m2-email">Email</label>
                        <input type="email" id="reg-page-m2-email" placeholder="member2@email.com">
                      </div>
                      <div class="reg-field">
                        <label for="reg-page-m2-phone">Phone No.</label>
                        <input type="tel" id="reg-page-m2-phone" placeholder="Phone No.">
                      </div>
                    </div>
                  </div>

                  <div class="member-card" data-member-slot="3" hidden>
                    <h4 class="member-card-heading">Member 3</h4>
                    <div class="reg-grid-3">
                      <div class="reg-field">
                        <label for="reg-page-m3-name">Name</label>
                        <input type="text" id="reg-page-m3-name" placeholder="Member 3 Name">
                      </div>
                      <div class="reg-field">
                        <label for="reg-page-m3-email">Email</label>
                        <input type="email" id="reg-page-m3-email" placeholder="member3@email.com">
                      </div>
                      <div class="reg-field">
                        <label for="reg-page-m3-phone">Phone No.</label>
                        <input type="tel" id="reg-page-m3-phone" placeholder="Phone No.">
                      </div>
                    </div>
                  </div>

                  <div class="member-card" data-member-slot="4" hidden>
                    <h4 class="member-card-heading">Member 4</h4>
                    <div class="reg-grid-3">
                      <div class="reg-field">
                        <label for="reg-page-m4-name">Name</label>
                        <input type="text" id="reg-page-m4-name" placeholder="Member 4 Name">
                      </div>
                      <div class="reg-field">
                        <label for="reg-page-m4-email">Email</label>
                        <input type="email" id="reg-page-m4-email" placeholder="member4@email.com">
                      </div>
                      <div class="reg-field">
                        <label for="reg-page-m4-phone">Phone No.</label>
                        <input type="tel" id="reg-page-m4-phone" placeholder="Phone No.">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Accommodation Option -->
                <div class="reg-field" style="margin-top: 1.2rem;">
                  <label for="reg-page-accommodation">Accommodation Required?</label>
                  <select id="reg-page-accommodation" required>
                    <option value="" disabled selected>Select Accommodation Choice</option>
                    <option value="Yes">Yes — Accommodation Required</option>
                    <option value="No">No — Self Arranged</option>
                  </select>
                </div>

                <!-- Institution Name -->
                <div class="reg-field">
                  <label for="reg-page-institution">Institution / Organization Name</label>
                  <input type="text" id="reg-page-institution" placeholder="e.g. BCET Odisha" required>
                </div>

                <!-- Payment Details -->
                <div class="reg-payment-section">
                  <h3 class="reg-payment-title">💳 Registration Fee & Payment Details</h3>
                  <div class="payment-info-box">
                    <div class="payment-qr-wrap" id="reg-page-payment-qr-trigger" role="button" tabindex="0" title="Click to open Payment QR Scanner">
                      <div class="payment-qr-thumbnail-box">
                        <img src="/images/payment-qr.png" alt="Payment QR Code" class="payment-qr-thumb">
                        <div class="qr-expand-overlay">
                          <span class="qr-expand-icon">🔍</span>
                        </div>
                      </div>
                      <span>Scan &amp; Pay UPI</span>
                      <span class="qr-click-hint">Click to enlarge</span>
                    </div>
                    <div class="payment-details-text">
                      <p><strong>UPI ID:</strong> <code>jrrout751@ybl</code></p>
                      <p><strong>Account Holder:</strong> Odyssey Hackathon BCET</p>
                      <p class="payment-note">⚡ Pay the registration fee via UPI and upload your payment slip photo below.</p>
                    </div>
                  </div>

                  <div class="reg-field" style="margin-top: 1.1rem;">
                    <label for="reg-page-payment-slip">Upload Payment Slip / Receipt (JPG only)</label>
                    <input type="file" id="reg-page-payment-slip" accept=".jpg,.jpeg,image/jpeg" required class="file-input-gold">
                  </div>
                </div>

                <div class="reg-submit-wrap">
                  <div id="reg-page-error-msg" style="display:none; color:#ff6b6b; margin-bottom:0.8rem; font-size:0.85rem; text-align:center;"></div>
                  <button type="submit" class="gold-action-btn" id="reg-page-submit-btn">🏹 Submit Quest Registration</button>
                </div>
              </form>

              <!-- Success Screen -->
              <div id="reg-page-success-msg" class="reg-success-box" style="display: none;">
                <div class="reg-success-icon">📜</div>
                <h2 class="reg-success-title">QUEST ENLISTMENT CONFIRMED!</h2>
                <p class="reg-success-desc">
                  Hail, Brave Innovators! Your legion <strong id="reg-page-team-name-success" style="color:#ffd700;">your team</strong> has been successfully recorded in the Odyssey database.
                </p>
                <div class="reg-id-card" style="margin: 1.2rem 0;">
                  <span class="reg-id-label">REGISTRATION ID</span>
                  <strong id="reg-page-id-success" class="reg-id-value"></strong>
                </div>
                <p class="reg-confirmation-copy">Your Legion has been registered for the <strong>ODYSSEY Hackathon</strong>. Prepare for the Journey to Innovation!</p>
                <div class="whatsapp-cta" style="margin-top: 1.5rem;">
                  <a class="gold-action-btn" href="https://chat.whatsapp.com/CGWQjE5HpHG5QmqTvZR1EB" target="_blank" rel="noopener noreferrer">JOIN OFFICIAL WHATSAPP GROUP</a>
                  <p class="whatsapp-supporting-text" style="margin-top:0.6rem;">After joining the official WhatsApp group, participants will receive a Google Form link to submit their project abstract and PPT for the shortlisting round.</p>
                </div>
                <button class="gold-action-btn" id="reg-page-return-btn" style="margin-top:1.5rem;">🗺️ Return to Odyssey Map</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    // Bind Back to Map Buttons
    document.getElementById('reg-page-back-map-btn')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });

    document.getElementById('reg-page-return-btn')?.addEventListener('click', () => {
      audioSystem.playClick();
      this.showMapView();
    });

    // Bind Payment QR Trigger
    document.getElementById('reg-page-payment-qr-trigger')?.addEventListener('click', () => {
      audioSystem.playClick();
      document.getElementById('payment-qr-modal')?.classList.add('active');
    });

    // Team Size Change Listener
    const teamSizeSelect = document.getElementById('reg-page-team-size');
    const memberCards = [...container.querySelectorAll('.member-card[data-member-slot]')];
    const updateMemberPanels = () => {
      const teamSize = Number(teamSizeSelect?.value || 3);
      const additionalMemberCount = teamSize - 1;
      memberCards.forEach((card) => {
        const slot = Number(card.dataset.memberSlot);
        const isVisible = slot <= additionalMemberCount;
        card.style.display = isVisible ? 'block' : 'none';
        card.hidden = !isVisible;

        const inputs = card.querySelectorAll('input');
        inputs.forEach((input) => {
          if (!isVisible) {
            input.required = false;
            input.value = '';
          }
        });
      });
    };
    teamSizeSelect?.addEventListener('change', updateMemberPanels);
    updateMemberPanels();

    // Form Submit Handler
    const regFormPage = document.getElementById('reg-page-form');
    regFormPage?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('reg-page-submit-btn');
      const errorEl = document.getElementById('reg-page-error-msg');
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }

      const teamName = document.getElementById('reg-page-team-name')?.value?.trim() || '';
      const leaderName = document.getElementById('reg-page-leader-name')?.value?.trim() || '';
      const leaderPhone = document.getElementById('reg-page-leader-phone')?.value?.trim() || '';
      const leaderEmail = document.getElementById('reg-page-email')?.value?.trim() || '';
      const teamSize = Number(teamSizeSelect?.value || 0);

      const members = [];
      for (let i = 1; i <= teamSize - 1; i++) {
        const mName = document.getElementById(`reg-page-m${i}-name`)?.value?.trim() || '';
        const mEmail = document.getElementById(`reg-page-m${i}-email`)?.value?.trim() || '';
        const mPhone = document.getElementById(`reg-page-m${i}-phone`)?.value?.trim() || '';
        if (mName || mEmail || mPhone) {
          members.push({ memberSlot: i, name: mName, email: mEmail, phone: mPhone });
        }
      }

      const accommodation = document.getElementById('reg-page-accommodation')?.value || '';
      const institution = document.getElementById('reg-page-institution')?.value?.trim() || '';
      const paymentSlipInput = document.getElementById('reg-page-payment-slip');
      const paymentSlipFile = paymentSlipInput?.files?.[0];

      if (paymentSlipFile) {
        const fileName = paymentSlipFile.name.toLowerCase();
        const isJpg = /\.(jpg|jpeg)$/.test(fileName) && paymentSlipFile.type === 'image/jpeg';
        if (!isJpg) {
          if (errorEl) {
            errorEl.textContent = '⚠️ Please upload the payment slip in JPG format only.';
            errorEl.style.display = 'block';
          }
          return;
        }
      }

      const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          dataUrl: reader.result
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let paymentSlip = null;
      if (paymentSlipFile) {
        try {
          paymentSlip = await readFileAsBase64(paymentSlipFile);
        } catch (fileErr) {
          console.warn('Could not read payment slip file:', fileErr);
        }
      }

      const payload = {
        teamName,
        leaderName,
        leaderPhone,
        leaderEmail,
        teamSize,
        members,
        accommodation,
        institution,
        paymentSlip
      };

      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⚔️ ENLISTING YOUR LEGION INTO ODYSSEY...';
      }

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const responseBody = await response.text();
        let result;
        try {
          result = JSON.parse(responseBody);
        } catch {
          throw new Error(
            response.status === 404
              ? 'Registration service is not available on this server. Please deploy the Node.js server and try again.'
              : `Registration service returned an unexpected response (${response.status}).`
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Registration submission failed');
        }

        audioSystem.playTriumph();
        const teamNameEl = document.getElementById('reg-page-team-name-success');
        if (teamNameEl) teamNameEl.textContent = teamName || 'your team';
        const registrationIdEl = document.getElementById('reg-page-id-success');
        if (registrationIdEl) registrationIdEl.textContent = result.insertedId || '';

        regFormPage.style.display = 'none';
        const successBox = document.getElementById('reg-page-success-msg');
        if (successBox) successBox.style.display = 'block';
      } catch (err) {
        console.error('Registration failed:', err);
        if (errorEl) {
          errorEl.textContent = `⚠️ Error saving registration: ${err.message || 'Please check connection'}`;
          errorEl.style.display = 'block';
        } else {
          alert(`Registration Error: ${err.message}`);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }


  openArtifactModal(artifact) {
    document.getElementById('art-badge').textContent = artifact.badge;
    document.getElementById('art-name').textContent = artifact.name;
    document.getElementById('art-origin').textContent = artifact.origin;
    document.getElementById('art-desc').textContent = artifact.desc;
    document.getElementById('art-power').textContent = artifact.power;

    document.getElementById('artifact-modal')?.classList.add('active');
  }

  initParticleCanvas() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 45;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.2
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243, 156, 18, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffd700';
        ctx.fill();
      });

      requestAnimationFrame(render);
    };

    render();
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new OdysseyApp();
  app.init();
});
