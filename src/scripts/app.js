// Main Odyssey Application Controller — Managing Serial Unlock & Brown Foot Path Trails

import { SYMBOLS_DATA } from './data.js';
import { OdysseyMap, updateTrailProgress } from './map.js';
import { audioSystem } from './audio.js';

export const TRACK_ABSTRACTS = {
  'Software Deployment with AI Implementation': 'Build, deploy, and scale intelligent software solutions that integrate Artificial Intelligence into real-world applications. This track focuses on taking AI models from development to production through robust software architectures, APIs, cloud platforms, and deployment pipelines.',
  'IOT with Software Solutions': 'Develop intelligent IoT ecosystems that connect physical devices with software platforms to collect, process, visualize, and act on real-time data. Participants can combine sensors, microcontrollers, communication protocols, edge computing, and cloud/software systems to solve practical problems.',
  'IoT with Software Solutions': 'Develop intelligent IoT ecosystems that connect physical devices with software platforms to collect, process, visualize, and act on real-time data. Participants can combine sensors, microcontrollers, communication protocols, edge computing, and cloud/software systems to solve practical problems.',
  'Tech for Bharat & Social Impact': 'Create technology-driven solutions addressing real-world challenges faced by communities across India. This track encourages the application of software, AI, IoT, data science, and emerging technologies to improve accessibility, sustainability, inclusion, and quality of life.',
  'Automation Development / Agentic AI Development': 'Build intelligent systems capable of automating workflows, making decisions, interacting with tools, and executing multi-step tasks with minimal human intervention. This track explores the convergence of AI agents, automation frameworks, APIs, and intelligent software systems.',
  'Automation Development & Agentic AI Development': 'Build intelligent systems capable of automating workflows, making decisions, interacting with tools, and executing multi-step tasks with minimal human intervention. This track explores the convergence of AI agents, automation frameworks, APIs, and intelligent software systems.'
};

export const TRACK_PDFS = {
  'Software Deployment with AI Implementation': {
    url: '/problem-statements/ps1-software-deployment-with-ai.pdf',
    filename: 'ODYSSEY_PS1_Software_Deployment_AI.pdf',
    title: 'AI in Production — Building & Scaling Real-World Intelligent Software Systems'
  },
  'IOT with Software Solutions': {
    url: '/problem-statements/ps2-iot-with-software-solutions.pdf',
    filename: 'ODYSSEY_PS2_IoT_Software_Solutions.pdf',
    title: 'Connecting the Physical & Digital — Intelligent IoT & Edge Solutions'
  },
  'IoT with Software Solutions': {
    url: '/problem-statements/ps2-iot-with-software-solutions.pdf',
    filename: 'ODYSSEY_PS2_IoT_Software_Solutions.pdf',
    title: 'Connecting the Physical & Digital — Intelligent IoT & Edge Solutions'
  },
  'Tech for Bharat & Social Impact': {
    url: '/problem-statements/ps3-tech-for-bharat-social-impact.pdf',
    filename: 'ODYSSEY_PS3_Tech_For_Bharat_Social_Impact.pdf',
    title: 'Tech for Bharat & Social Impact'
  },
  'Automation Development / Agentic AI Development': {
    url: '/problem-statements/ps4-automation-agentic-ai-development.pdf',
    filename: 'ODYSSEY_PS4_Automation_Agentic_AI_Development.pdf',
    title: 'Autonomous by Design — AI Agents for Multi-Step Task Automation'
  },
  'Automation Development & Agentic AI Development': {
    url: '/problem-statements/ps4-automation-agentic-ai-development.pdf',
    filename: 'ODYSSEY_PS4_Automation_Agentic_AI_Development.pdf',
    title: 'Autonomous by Design — AI Agents for Multi-Step Task Automation'
  }
};

class OdysseyApp {
  constructor() {
    this.currentSymbolId = null;
    this.selectedTrack = '';
    this.activeTab = 'lore';
    this.odysseyMap = null;
    this.unlockedStep = 1; // 1 to 5
    this.symbolOrder = ['voyage', 'realms', 'protocols', 'legions', 'odyssey'];
    this.sidebarPreviewStep = 1;
    this.introAutoTimer = null;
    window.__odysseyApp = this;
  }

  init() {
    // 1. Initialize Interactive Map
    this.odysseyMap = new OdysseyMap('map-container', 'map-wrapper', (symbolId) => {
      this.handleSymbolClick(symbolId);
    });

    // 1.1 Opening Page Screen & Entrance Trigger
    const mapWrapper = document.getElementById('map-wrapper');
    const introScreen = document.getElementById('intro-opening-screen');
    const introEnterBtn = document.getElementById('intro-enter-btn');

    const transitionToMap = () => {
      if (this.introAutoTimer) {
        clearTimeout(this.introAutoTimer);
        this.introAutoTimer = null;
      }
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      audioSystem.playBackgroundMusic();
      document.body.classList.remove('intro-active');
      if (introScreen && !introScreen.classList.contains('fade-out')) {
        introScreen.classList.add('fade-out');
        setTimeout(() => {
          introScreen.style.display = 'none';
          mapWrapper?.classList.add('slide-in');
          this.odysseyMap?.refreshLayout();
        }, 550);
      }
    };

    if (introScreen) {
      document.body.classList.add('intro-active');
      audioSystem.playBackgroundMusic();
      introEnterBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        audioSystem.playClick();
        transitionToMap();
      });
      document.getElementById('odyssey-flip-clock')?.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      introScreen.addEventListener('click', () => transitionToMap());
      this.introAutoTimer = setTimeout(() => transitionToMap(), 8500);
    }

    this.initCountdownClock();

    this.initMapSidebarControls();
    this.initMobileJourneyPanel();

    // 2. Brand Logo Click -> Return to Map
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

    // 6b. Registration Full-Page & Dynamic Member Handlers
    const regForm = document.getElementById('reg-form');
    const regSuccessMsg = document.getElementById('reg-success-msg');
    const addMemberBtn = document.getElementById('add-member-btn');
    const addMemberHint = document.getElementById('add-member-hint');
    const teamSizeCounter = document.getElementById('team-size-counter');
    const memberCards = [...document.querySelectorAll('.member-card[data-member-slot]')];
    const removeMemberBtns = document.querySelectorAll('.remove-member-btn');

    let currentTeamSize = 3; // Minimum 3 members (Leader + Member 2 + Member 3)

    const updateTeamMemberUI = () => {
      // Slot 1 (Member 2) and Slot 2 (Member 3) are always visible (team size 3)
      // Slot 3 (Member 4) is visible when currentTeamSize >= 4
      // Slot 4 (Member 5) is visible when currentTeamSize >= 5
      memberCards.forEach((card) => {
        const slot = Number(card.dataset.memberSlot);
        const shouldShow = slot <= currentTeamSize - 1;
        card.hidden = !shouldShow;
        const inputs = card.querySelectorAll('input');
        inputs.forEach((input) => {
          if (!shouldShow) {
            input.value = '';
            input.removeAttribute('required');
          } else {
            input.setAttribute('required', 'required');
          }
        });
      });

      if (teamSizeCounter) {
        teamSizeCounter.textContent = String(currentTeamSize);
      }

      if (addMemberBtn) {
        if (currentTeamSize < 5) {
          addMemberBtn.disabled = false;
          const nextMemberNum = currentTeamSize + 1;
          addMemberBtn.innerHTML = `<span class="add-plus-symbol">+</span><span class="add-btn-text">Add Member ${nextMemberNum}</span>`;
          if (addMemberHint) {
            addMemberHint.textContent = `Click + to add Member ${nextMemberNum} (maximum 5 members per team)`;
          }
        } else {
          addMemberBtn.disabled = true;
          addMemberBtn.innerHTML = `<span class="add-plus-symbol">✓</span><span class="add-btn-text">Maximum Limit (5 Members)</span>`;
          if (addMemberHint) {
            addMemberHint.textContent = `Legion team maximum capacity reached (5 members).`;
          }
        }
      }
    };

    addMemberBtn?.addEventListener('click', () => {
      if (currentTeamSize < 5) {
        audioSystem.playClick();
        currentTeamSize++;
        updateTeamMemberUI();
      }
    });

    removeMemberBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        audioSystem.playClick();
        const slotToRemove = Number(btn.dataset.removeSlot);
        if (slotToRemove === 4 && currentTeamSize === 5) {
          currentTeamSize = 4;
        } else if (slotToRemove === 3) {
          if (currentTeamSize === 5) {
            // Shift Member 5 values into Member 4 slot
            const m3Name = document.getElementById('reg-m3-name');
            const m3Email = document.getElementById('reg-m3-email');
            const m3Phone = document.getElementById('reg-m3-phone');
            const m4Name = document.getElementById('reg-m4-name');
            const m4Email = document.getElementById('reg-m4-email');
            const m4Phone = document.getElementById('reg-m4-phone');
            if (m3Name && m4Name) m3Name.value = m4Name.value;
            if (m3Email && m4Email) m3Email.value = m4Email.value;
            if (m3Phone && m4Phone) m3Phone.value = m4Phone.value;
          }
          currentTeamSize = Math.max(3, currentTeamSize - 1);
        }
        updateTeamMemberUI();
      });
    });

    updateTeamMemberUI();

    // Auto-strip non-digit chars from phone fields (real-time sanitizer)
    const phoneFieldIds = ['reg-leader-phone', 'reg-m1-phone', 'reg-m2-phone', 'reg-m3-phone', 'reg-m4-phone'];
    phoneFieldIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const cleaned = el.value.replace(/\D/g, '').slice(0, 10);
        if (el.value !== cleaned) el.value = cleaned;
      });
    });

    regForm?.addEventListener('submit', async (e) => {

      e.preventDefault();
      const submitBtn = document.getElementById('reg-submit-btn');
      const errorEl = document.getElementById('reg-error-msg');
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }

      // Gather leader & team data first
      const teamName = document.getElementById('reg-team-name')?.value?.trim() || '';
      const leaderName = document.getElementById('reg-leader-name')?.value?.trim() || '';
      const leaderPhone = document.getElementById('reg-leader-phone')?.value?.trim() || '';
      const leaderEmail = document.getElementById('reg-email')?.value?.trim() || '';
      const institution = document.getElementById('reg-institution')?.value?.trim() || '';
      const teamSize = currentTeamSize;

      // ── Validation helpers ──────────────────────────────────────────────
      const showError = (msg) => {
        if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
      };
      const isValidPhone = (p) => /^[6-9][0-9]{9}$/.test(p);
      const isValidEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
      const isValidName = (n) => n.length >= 2 && n.length <= 60;

      if (!teamName || teamName.length < 3) {
        showError('⚠️ Team name must be at least 3 characters.'); return;
      }
      if (!institution || institution.length < 3) {
        showError('⚠️ Institution name must be at least 3 characters.'); return;
      }
      if (!isValidName(leaderName)) {
        showError('⚠️ Leader name must be 2–60 characters.'); return;
      }
      if (!isValidPhone(leaderPhone)) {
        showError('⚠️ Leader phone must be a valid 10-digit Indian mobile number (starts with 6–9).'); return;
      }
      if (!isValidEmail(leaderEmail)) {
        showError('⚠️ Leader email is invalid. Please enter a valid email address.'); return;
      }

      // Gather team members
      const members = [];
      for (let i = 1; i <= teamSize - 1; i++) {
        const mName = document.getElementById(`reg-m${i}-name`)?.value?.trim() || '';
        const mEmail = document.getElementById(`reg-m${i}-email`)?.value?.trim() || '';
        const mPhone = document.getElementById(`reg-m${i}-phone`)?.value?.trim() || '';

        if (!mName && !mEmail && !mPhone) {
          showError(`⚠️ Please provide full name, email, and phone for Member ${i + 1}.`);
          return;
        }
        if (!isValidName(mName)) {
          showError(`⚠️ Member ${i + 1} name must be 2–60 characters.`); return;
        }
        if (!isValidEmail(mEmail)) {
          showError(`⚠️ Member ${i + 1} email is invalid.`); return;
        }
        if (!isValidPhone(mPhone)) {
          showError(`⚠️ Member ${i + 1} phone must be a valid 10-digit Indian mobile number.`); return;
        }
        members.push({ memberSlot: i, name: mName, email: mEmail, phone: mPhone });
      }

      const accommodation = document.getElementById('reg-accommodation')?.value || '';

      const paymentSlipInput = document.getElementById('reg-payment-slip');
      const paymentSlipFile = paymentSlipInput?.files?.[0];

      if (paymentSlipFile) {
        const fileName = paymentSlipFile.name.toLowerCase();
        const isJpg = /\.(jpg|jpeg)$/.test(fileName) && paymentSlipFile.type === 'image/jpeg';
        if (!isJpg) {
          showError('⚠️ Please upload the payment slip in JPG format only.');
          return;
        }
        // Pre-flight: reject files > 8MB before even trying to compress
        if (paymentSlipFile.size > 8 * 1024 * 1024) {
          showError('⚠️ Payment slip file is too large (max 8MB). Please use a smaller photo.');
          return;
        }
      }

      // Compress image via canvas to stay under Vercel's 4.5MB serverless body limit.
      // Resizes to max 1200px and re-encodes at JPEG quality 0.72 (~60-70% size reduction).
      const compressImage = (file) => new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
          const img = new Image();
          img.onerror = reject;
          img.onload = () => {
            const MAX = 1200;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
              if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
              else { width = Math.round(width * MAX / height); height = MAX; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
            resolve({ fileName: file.name, fileSize: file.size, fileType: 'image/jpeg', dataUrl });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });

      let paymentSlip = null;
      if (paymentSlipFile) {
        try {
          paymentSlip = await compressImage(paymentSlipFile);
        } catch (fileErr) {
          console.warn('Could not process payment slip file:', fileErr);
          showError('⚠️ Could not process the image. Please try a different file.');
          return;
        }
      }

      const problemStatement = document.getElementById('reg-track-input')?.value || this.selectedTrack || 'General Track';

      const payload = {
        teamName,
        leaderName,
        leaderPhone,
        leaderEmail,
        teamSize,
        members,
        accommodation,
        institution,
        paymentSlip,
        problemStatement,
        track: problemStatement
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
        const regId = result.regId || result.insertedId || '';
        if (registrationIdEl) registrationIdEl.textContent = regId;
        // Store for the copy button
        registrationIdEl?.setAttribute('data-reg-id', regId);
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
    this.updateMapSidebar(this.sidebarPreviewStep);

    requestAnimationFrame(() => {
      this.odysseyMap?.refreshLayout();
    });
  }

  initMobileJourneyPanel() {
    const sidebar = document.getElementById('map-journey-sidebar');
    const fab = document.getElementById('map-journey-fab');
    const closeBtn = document.getElementById('sidebar-mobile-close');

    const setOpen = (open) => {
      sidebar?.classList.toggle('sidebar-open', open);
      fab?.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    fab?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioSystem.playClick();
      setOpen(!sidebar?.classList.contains('sidebar-open'));
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      audioSystem.playClick();
      setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  initMapSidebarControls() {
    const prevBtn = document.getElementById('sidebar-prev-btn');
    const nextBtn = document.getElementById('sidebar-next-btn');
    const openBtn = document.getElementById('sidebar-open-btn');

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.sidebarPreviewStep > 1) {
        audioSystem.playClick();
        this.updateMapSidebar(this.sidebarPreviewStep - 1);
      }
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.sidebarPreviewStep < 5) {
        audioSystem.playClick();
        this.updateMapSidebar(this.sidebarPreviewStep + 1);
      }
    });

    openBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const symbolId = this.symbolOrder[this.sidebarPreviewStep - 1];
      const stepIdx = this.sidebarPreviewStep;
      if (stepIdx <= this.unlockedStep) {
        audioSystem.playClick();
        this.handleSymbolClick(symbolId);
      } else {
        this.showLockedNotice(stepIdx);
      }
    });
  }

  updateMapSidebar(stepNumber, shouldCenter = true) {
    this.sidebarPreviewStep = Math.min(5, Math.max(1, stepNumber));
    const symbolId = this.symbolOrder[this.sidebarPreviewStep - 1];
    const data = SYMBOLS_DATA[symbolId];
    if (!data) return;

    if (shouldCenter) {
      this.odysseyMap?.centerOnSymbol(symbolId);
    }
    this.symbolOrder.forEach((id, idx) => {
      const pin = document.getElementById(`pin-${id}`);
      pin?.classList.toggle('pin-selected', idx === (this.sidebarPreviewStep - 1));
    });

    const roman = ['I', 'II', 'III', 'IV', 'V'][this.sidebarPreviewStep - 1];
    const stepLabel = document.getElementById('sidebar-step-label');
    const realmTitle = document.getElementById('sidebar-realm-title');
    const greekEl = document.getElementById('sidebar-greek');
    const taglineEl = document.getElementById('sidebar-tagline');
    const overviewEl = document.getElementById('sidebar-overview');
    const coordsEl = document.getElementById('sidebar-coords');
    if (stepLabel) stepLabel.textContent = `Step ${roman}`;
    if (realmTitle) realmTitle.textContent = data.name;
    if (greekEl) greekEl.textContent = data.greekName;
    if (taglineEl) taglineEl.textContent = data.tagline;
    if (overviewEl) overviewEl.textContent = data.overview;
    if (coordsEl) coordsEl.textContent = data.coords;

    const isUnlocked = this.sidebarPreviewStep <= this.unlockedStep;
    const openBtn = document.getElementById('sidebar-open-btn');
    const lockNote = document.getElementById('sidebar-lock-note');
    if (openBtn) {
      openBtn.textContent = isUnlocked ? `Open ${data.name}` : 'Complete Prior Steps to Unlock';
      openBtn.classList.toggle('is-locked', !isUnlocked);
    }
    if (lockNote) lockNote.hidden = isUnlocked;

    document.getElementById('sidebar-prev-btn')?.toggleAttribute('disabled', this.sidebarPreviewStep <= 1);
    document.getElementById('sidebar-next-btn')?.toggleAttribute('disabled', this.sidebarPreviewStep >= 5);

    const dotsHost = document.getElementById('sidebar-dots');
    if (dotsHost) {
      dotsHost.innerHTML = '';
      for (let i = 1; i <= 5; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'sidebar-dot';
        if (i === this.sidebarPreviewStep) dot.classList.add('active');
        if (i > this.unlockedStep) dot.classList.add('locked');
        dotsHost.appendChild(dot);
      }
    }

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

  updateSerialUnlockState(syncSidebar = true) {
    // 1. Update map pins
    this.symbolOrder.forEach((id, idx) => {
      const step = idx + 1;
      const pin = document.getElementById(`pin-${id}`);

      pin?.classList.toggle('pin-current', step === this.unlockedStep);
      pin?.classList.toggle('pin-completed', step < this.unlockedStep);

      if (step <= this.unlockedStep) {
        pin?.classList.remove('locked');
        pin?.classList.add('unlocked');

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

        // Update pin-click-label: switch from node name to content name on unlock
        const labelEl = pin?.querySelector('.pin-click-label');
        if (labelEl) {
          const unlockedLabels = { voyage: 'About Us', realms: 'PS & Reg', protocols: 'Protocols', legions: 'Team', odyssey: 'Trailer' };
          labelEl.textContent = unlockedLabels[id] || id;
          labelEl.classList.remove('pin-click-label--locked');
        }
      } else {
        pin?.classList.remove('unlocked', 'pin-current', 'pin-completed');
        pin?.classList.add('locked');

        // Restore locked label to content name (same names, just amber style)
        const lockedLabels = { voyage: 'About Us', realms: 'PS & Reg', protocols: 'Protocols', legions: 'Team', odyssey: 'Trailer' };
        const labelEl = pin?.querySelector('.pin-click-label');
        if (labelEl) {
          labelEl.textContent = lockedLabels[id] || id;
          labelEl.classList.add('pin-click-label--locked');
        }
      }
    });

    // 2. Single voyage route — draw progressively (no overlapping segments)
    updateTrailProgress(this.unlockedStep);

    // 3. Update Status Bar Text
    const statusText = document.getElementById('trail-status-text');
    if (statusText) {
      if (this.unlockedStep >= 5) {
        statusText.textContent = `All 5 unlocked`;
      } else {
        const current = SYMBOLS_DATA[this.symbolOrder[this.unlockedStep - 1]].name;
        statusText.textContent = `Step ${this.unlockedStep} — ${current}`;
      }
    }

    if (syncSidebar) {
      this.updateMapSidebar(this.sidebarPreviewStep);
    }
  }

  showLockedNotice(stepIdx) {
    const prevName = SYMBOLS_DATA[this.symbolOrder[stepIdx - 2]]?.name;
    alert(`🔒 This symbol is locked! Complete ${prevName} (Symbol ${stepIdx - 1}) first to extend the brown foot path trail!`);
  }

  handleHashRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'register') {
      this.openRegistrationPage(this.selectedTrack || 'Software Deployment with AI Implementation', false);
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

  showMapView(updateHash = true) {
    if (updateHash) {
      window.history.pushState(null, '', ' ');
    }

    const mapView = document.getElementById('map-view');
    const subpageView = document.getElementById('subpage-view');
    const regView = document.getElementById('registration-view');

    mapView?.classList.add('active');
    subpageView?.classList.remove('active');
    regView?.classList.remove('active');

    // Auto redirect to next node when backing from a node
    const exitedNode = this.currentSymbolId || this.lastVisitedSymbolId;
    let nextStep = this.sidebarPreviewStep;

    if (exitedNode && this.symbolOrder.includes(exitedNode)) {
      const exitedStep = this.symbolOrder.indexOf(exitedNode) + 1;
      nextStep = Math.min(5, exitedStep + 1);
      if (this.unlockedStep < nextStep) {
        this.unlockedStep = nextStep;
      }
    } else if (this.unlockedStep) {
      nextStep = Math.min(5, this.unlockedStep);
    }

    this.currentSymbolId = null;
    this.sidebarPreviewStep = nextStep;

    // Update state visuals without redundant centering
    this.updateSerialUnlockState(false);
    this.updateMapSidebar(this.sidebarPreviewStep, false);

    // Smoothly pan camera once to bring next node front and center
    const targetSymbol = this.symbolOrder[this.sidebarPreviewStep - 1];
    if (targetSymbol && this.odysseyMap) {
      this.odysseyMap.ensureMapVideoPlaying();
      requestAnimationFrame(() => {
        this.odysseyMap?.centerOnSymbol(targetSymbol, true);
        updateTrailProgress(this.unlockedStep);
      });
    }
  }

  openSymbolPage(symbolId, updateHash = true) {
    const data = SYMBOLS_DATA[symbolId];
    if (!data) return;

    // Auto-unfold map container if navigating directly to a subpage
    const mapContainer = document.getElementById('map-container');
    const mapWrapper = document.getElementById('map-wrapper');
    if (mapContainer && !mapContainer.classList.contains('unfolded')) {
      mapContainer.classList.add('unfolded');
      mapWrapper?.classList.add('slide-in');
    }

    this.lastVisitedSymbolId = symbolId;
    this.currentSymbolId = symbolId;
    this.activeTab = 'lore';

    // Auto-unlock next step progressively when opening current step
    const stepIdx = this.symbolOrder.indexOf(symbolId) + 1;
    if (stepIdx === this.unlockedStep && this.unlockedStep < 5) {
      this.unlockedStep++;
      this.updateSerialUnlockState();
    }

    if (updateHash) {
      window.location.hash = symbolId;
    }

    // Render Subpage HTML
    this.renderSubpageContent(data);

    // Switch View Visibility
    const mapView = document.getElementById('map-view');
    const subpageView = document.getElementById('subpage-view');
    const regView = document.getElementById('registration-view');

    mapView?.classList.remove('active');
    subpageView?.classList.add('active');
    regView?.classList.remove('active');
    this.odysseyMap?.pauseMapVideo();

    // Scroll subpage to top
    const container = document.getElementById('subpage-content');
    if (container) container.scrollTop = 0;

    audioSystem.playLyreArpeggio();
  }

  openRegistrationPage(trackTitle, updateHash = true) {
    if (trackTitle && typeof trackTitle === 'string' && trackTitle.trim().length > 0) {
      this.selectedTrack = trackTitle.trim();
    } else if (!this.selectedTrack) {
      this.selectedTrack = 'Software Deployment with AI Implementation';
    }

    const currentTrack = this.selectedTrack;

    const trackHeading = document.getElementById('reg-track-title');
    if (trackHeading) {
      trackHeading.textContent = `REGISTER: ${currentTrack.toUpperCase()}`;
    }

    const trackInput = document.getElementById('reg-track-input');
    if (trackInput) {
      trackInput.value = currentTrack;
    }

    const regTrackAbstract = document.getElementById('reg-track-abstract');
    if (regTrackAbstract) {
      regTrackAbstract.textContent = TRACK_ABSTRACTS[currentTrack] || 'No abstract available for this track yet.';
    }

    const regTrackPdfLink = document.getElementById('reg-track-pdf-link');
    const pdfData = TRACK_PDFS[currentTrack];
    if (regTrackPdfLink && pdfData) {
      regTrackPdfLink.href = pdfData.url;
      regTrackPdfLink.setAttribute('download', pdfData.filename);
      regTrackPdfLink.style.display = 'inline-flex';
    } else if (regTrackPdfLink) {
      regTrackPdfLink.style.display = 'none';
    }

    const form = document.getElementById('reg-form');
    const successMsg = document.getElementById('reg-success-msg');
    const errorEl = document.getElementById('reg-error-msg');
    if (form) form.style.display = 'block';
    if (successMsg) successMsg.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }

    if (updateHash && window.location.hash !== '#register') {
      window.history.pushState(null, '', '#register');
    }

    // Switch View Visibility
    const mapView = document.getElementById('map-view');
    const subpageView = document.getElementById('subpage-view');
    const regView = document.getElementById('registration-view');

    mapView?.classList.remove('active');
    subpageView?.classList.remove('active');
    regView?.classList.add('active');
    this.odysseyMap?.pauseMapVideo();

    // Scroll registration page to top
    const container = document.getElementById('reg-page-content');
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

              <a href="https://falconclub-ebon.vercel.app/#about" target="_blank" class="aboutus-kpi-card kpi-card-2" id="kpi-card-2" title="Hephaestus Forge - FALCON CLUB">
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
                  <h3 class="contact-name">Bijaylaxmi Swain</h3>
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

            <!-- 4 Hackathon KPI Cards with Problem Statement PDF Links -->
            <div class="hack-kpi-grid">
              <div class="hack-kpi-card" data-track="Software Deployment with AI Implementation">
                <div class="hack-kpi-number">I</div>
                <h2 class="hack-kpi-title">Software Deployment with AI Implementation</h2>
                <div class="hack-kpi-actions">
                  <div class="hack-kpi-cta">Join the Quest</div>
                  <a href="/problem-statements/ps1-software-deployment-with-ai.pdf" download="ODYSSEY_PS1_Software_Deployment_AI.pdf" target="_blank" rel="noopener noreferrer" class="hack-pdf-btn" title="Download Problem Statement PDF">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download PS</span>
                  </a>
                </div>
              </div>

              <div class="hack-kpi-card" data-track="IOT with Software Solutions">
                <div class="hack-kpi-number">II</div>
                <h2 class="hack-kpi-title">IOT with Software Solutions</h2>
                <div class="hack-kpi-actions">
                  <div class="hack-kpi-cta">Join the Quest</div>
                  <a href="/problem-statements/ps2-iot-with-software-solutions.pdf" download="ODYSSEY_PS2_IoT_Software_Solutions.pdf" target="_blank" rel="noopener noreferrer" class="hack-pdf-btn" title="Download Problem Statement PDF">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download PS</span>
                  </a>
                </div>
              </div>

              <div class="hack-kpi-card" data-track="Tech for Bharat & Social Impact">
                <div class="hack-kpi-number">III</div>
                <h2 class="hack-kpi-title">Tech for Bharat & Social Impact</h2>
                <div class="hack-kpi-actions">
                  <div class="hack-kpi-cta">Join the Quest</div>
                  <a href="/problem-statements/ps3-tech-for-bharat-social-impact.pdf" download="ODYSSEY_PS3_Tech_For_Bharat_Social_Impact.pdf" target="_blank" rel="noopener noreferrer" class="hack-pdf-btn" title="Download Problem Statement PDF">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download PS</span>
                  </a>
                </div>
              </div>

              <div class="hack-kpi-card" data-track="Automation Development / Agentic AI Development">
                <div class="hack-kpi-number">IV</div>
                <h2 class="hack-kpi-title">Automation Development / Agentic AI Development</h2>
                <div class="hack-kpi-actions">
                  <div class="hack-kpi-cta">Join the Quest</div>
                  <a href="/problem-statements/ps4-automation-agentic-ai-development.pdf" download="ODYSSEY_PS4_Automation_Agentic_AI_Development.pdf" target="_blank" rel="noopener noreferrer" class="hack-pdf-btn" title="Download Problem Statement PDF">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download PS</span>
                  </a>
                </div>
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

      // Stop propagation on PDF link click so it doesn't trigger registration arrow
      card.querySelectorAll('.hack-pdf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          audioSystem.playClick();
        });
      });

      // Click event for "Join the Quest" -> Shoot Weapon Arrow & Open Registration
      card.addEventListener('click', (e) => {
        if (e.target.closest('.hack-pdf-btn')) return;
        const trackTitle = card.getAttribute('data-track') || card.querySelector('.hack-kpi-title')?.textContent || 'Hackathon Track';
        this.triggerWeaponArrow(trackTitle);
      });
    });
  }

  /* ─── Protocols: Custom Protocols Page ─── */
  renderProtocolsPage(container, data) {
    container.innerHTML = `
      <div class="realms-cover-wrapper" style="background-image: url('${data.heroImg}');">
        <div class="realms-cover-overlay">

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
                      <span class="timeline-date">17th Sept 2026</span>
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
  }

  /* ─── Legions: Custom Legions & Leadership Page (15 KPI Cards) ─── */
  renderLegionsPage(container, data) {
    container.innerHTML = `
      <div class="realms-cover-wrapper" style="background-image: url('${data.heroImg}');">
        <div class="realms-cover-overlay">

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
                  <img src="/images/high_king.jpg" alt="Dr. Manmath Kumar Biswal" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <h2 class="legion-card-title">The High King</h2>
<<<<<<< HEAD
                  <div class="legion-name">Dr. Manmath Biswal</div>
=======
                  <div class="legion-name">Dr. Manmath Kumar Biswal</div>
>>>>>>> d34eb853be1b19b346d84f1f4f9f936369da898c
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
                  <div class="legion-role">Co-Convenor</div>
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
                  <img src="/images/aphrodite_new.jpg" alt="Bijaylaxmi Swain" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="vanguard-deity-badge">APHRODITE</div>
                  <h3 class="vanguard-person-name">Bijaylaxmi Swain</h3>
                  <div class="vanguard-person-role">The Event Coordinator</div>
                </div>
              </div>

              <!-- Sub KPI Card 4D: KRATOS -->
              <div class="vanguard-kpi-card has-photo">
                <div class="card-photo-side">
                  <img src="/images/kratos_new.jpg" alt="Larence Kumar Khamurai" class="vanguard-photo">
                </div>
                <div class="card-text-side">
                  <div class="vanguard-deity-badge">KRATOS</div>
                  <h3 class="vanguard-person-name">Larence Kumar Khamurai</h3>
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

  /* ─── Trigger Weapon Arrow Flight & Open Registration Page ─── */
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

    // As arrow reaches target (~1300ms), open registration page
    setTimeout(() => {
      this.openRegistrationPage(trackTitle);
    }, 1300);

    // Clean up arrow after animation ends (~1900ms)
    setTimeout(() => {
      overlay.classList.remove('active');
      wrapper.classList.remove('shoot');
    }, 1900);
  }

  openRegistrationModal(trackTitle) {
    // Backward compatibility helper pointing to the full page registration
    this.openRegistrationPage(trackTitle);
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

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }, 150);
    }, { passive: true });

    const particles = [];
    const count = 32;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.5 + 0.25,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.45 - 0.15
      });
    }

    let isVisible = !document.hidden;
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible) requestAnimationFrame(render);
    });

    const render = () => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -5) {
          p.y = height + 5;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243, 166, 30, ${p.alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(render);
    };

    render();
  }

  initCountdownClock() {
    const cardDays = document.getElementById('card-days');
    const cardHours = document.getElementById('card-hours');
    const cardMinutes = document.getElementById('card-minutes');
    const cardSeconds = document.getElementById('card-seconds');
    if (!cardDays || !cardHours || !cardMinutes || !cardSeconds) return;

    // Hackathon Commencement: October 13, 2026, 09:00:00 AM IST
    const targetDate = new Date('2026-10-13T09:00:00+05:30').getTime();

    const flipCard = (cardEl, newVal, isInitial = false) => {
      if (!cardEl) return;
      const currentVal = cardEl.dataset.value;

      const topBackNum = cardEl.querySelector('.flap-top-back .flap-num');
      const bottomBackNum = cardEl.querySelector('.flap-bottom-back .flap-num');
      const topFrontNum = cardEl.querySelector('.flap-top-front .flap-num');
      const bottomFrontNum = cardEl.querySelector('.flap-bottom-front .flap-num');

      if (!topBackNum || !bottomBackNum || !topFrontNum || !bottomFrontNum) return;

      if (isInitial || !currentVal) {
        topBackNum.textContent = newVal;
        bottomBackNum.textContent = newVal;
        topFrontNum.textContent = newVal;
        bottomFrontNum.textContent = newVal;
        cardEl.dataset.value = newVal;
        return;
      }

      if (newVal === currentVal) return;

      // Set initial state before the 3D fold begins:
      // Top back flap has NEW value (revealed when top front folds down)
      topBackNum.textContent = newVal;
      // Bottom back flap has OLD value (visible at start)
      bottomBackNum.textContent = currentVal;
      // Top front flap has OLD value (folds down towards viewer)
      topFrontNum.textContent = currentVal;
      // Bottom front flap has NEW value (unfolds down to cover bottom back)
      bottomFrontNum.textContent = newVal;

      cardEl.classList.remove('flipping');
      void cardEl.offsetWidth; // Force reflow to restart CSS 3D animation
      cardEl.classList.add('flipping');

      // Once fold animation completes (560ms), lock in new value across all flaps
      clearTimeout(cardEl._flipTimer);
      cardEl._flipTimer = setTimeout(() => {
        topBackNum.textContent = newVal;
        bottomBackNum.textContent = newVal;
        topFrontNum.textContent = newVal;
        bottomFrontNum.textContent = newVal;
        cardEl.classList.remove('flipping');
        cardEl.dataset.value = newVal;
      }, 560);
    };

    let isFirstRun = true;

    const updateClock = () => {
      const now = Date.now();
      let diff = targetDate - now;
      if (diff < 0) {
        diff = 0;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const dStr = String(days).padStart(2, '0');
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');

      flipCard(cardDays, dStr, isFirstRun);
      flipCard(cardHours, hStr, isFirstRun);
      flipCard(cardMinutes, mStr, isFirstRun);
      flipCard(cardSeconds, sStr, isFirstRun);

      isFirstRun = false;
    };

    updateClock();
    this.countdownInterval = setInterval(updateClock, 1000);
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new OdysseyApp();
  app.init();
<<<<<<< HEAD

  // ── Poster Popup: auto-dismiss after 4 seconds ──
  const posterOverlay = document.getElementById('poster-popup-overlay');
  const posterCloseBtn = document.getElementById('poster-popup-close');

  if (posterOverlay) {
    const dismissPoster = () => {
      if (!posterOverlay.parentNode) return;
      posterOverlay.classList.add('hiding');
      posterOverlay.addEventListener('animationend', () => {
        posterOverlay.remove();
      }, { once: true });
    };

    // Auto-dismiss after 4 seconds
    const autoDismissTimer = setTimeout(dismissPoster, 4000);

    // Manual close button
    posterCloseBtn?.addEventListener('click', () => {
      clearTimeout(autoDismissTimer);
      dismissPoster();
    });

    // Click on backdrop also closes
    posterOverlay.addEventListener('click', (e) => {
      if (e.target === posterOverlay) {
        clearTimeout(autoDismissTimer);
        dismissPoster();
      }
    });
  }
});
=======
});
>>>>>>> d34eb853be1b19b346d84f1f4f9f936369da898c
