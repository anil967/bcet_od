const verifyForm = document.getElementById('verify-form');
const verificationIntro = document.getElementById('verification-intro');
const registrationInput = document.getElementById('registration-id');
const verifyButton = document.getElementById('verify-button');
const verifyMessage = document.getElementById('verify-message');
const verifiedTeam = document.getElementById('verified-team');
const teamFacts = document.getElementById('team-facts');
const alreadySubmitted = document.getElementById('already-submitted');
const submissionForm = document.getElementById('submission-form');
const themeInput = document.getElementById('theme');
const themeDisplay = document.getElementById('theme-display');
const projectTitleInput = document.getElementById('project-title');
const abstractInput = document.getElementById('abstract');
const wordCount = document.getElementById('word-count');
const presentationInput = document.getElementById('presentation');
const submitButton = document.getElementById('submit-button');
const submissionMessage = document.getElementById('submission-message');
const successState = document.getElementById('success-state');
const successSummary = document.getElementById('success-summary');
const verificationSuccess = document.getElementById('verification-success');

let verifiedRegistration = null;
let submissionState = 'INITIAL';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function getWordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Renders user-friendly status messages with icons and optional actionable tips.
 * @param {HTMLElement} element - Target container element
 * @param {string} message - Main friendly message
 * @param {'error'|'success'|'info'|'loading'} [type='error'] - Status type
 * @param {string} [helpText=''] - Optional actionable suggestion/tip
 */
function setMessage(element, message, type = 'error', helpText = '') {
  if (!element) return;

  if (!message) {
    element.innerHTML = '';
    element.className = 'idea-message';
    element.hidden = true;
    return;
  }

  element.hidden = false;
  element.className = `idea-message ${type}`;

  const icons = {
    error: '⚠️',
    success: '✓',
    info: 'ℹ️',
    loading: '⏳',
  };

  const titles = {
    error: 'Submission Issue',
    success: 'Success',
    info: 'Notice',
    loading: 'Processing',
  };

  const icon = icons[type] || 'ℹ️';
  const title = titles[type] || '';

  element.innerHTML = `
    <span class="msg-icon" aria-hidden="true">${icon}</span>
    <div class="msg-content">
      ${title && type !== 'loading' ? `<strong class="msg-title">${escapeHtml(title)}</strong>` : ''}
      <span class="msg-text">${escapeHtml(message)}</span>
      ${helpText ? `<span class="msg-help">${escapeHtml(helpText)}</span>` : ''}
    </div>
  `;
}

/**
 * Safely parses response without throwing JSON.parse SyntaxErrors on HTML or text.
 */
async function parseApiResponse(response) {
  let data = null;
  let text = '';
  try {
    text = await response.text();
    if (text) {
      data = JSON.parse(text);
    }
  } catch {
    // Non-JSON response (HTML error page, proxy 413/502 text, etc.)
  }
  return {
    ok: response.ok,
    status: response.status,
    data,
    text,
  };
}

/**
 * Translates raw exceptions, HTTP status codes, or network dropouts into empathetic,
 * user-friendly, and actionable messages.
 */
function formatUserError(error, responseResult = null, context = 'submission') {
  // If we have an HTTP response result
  if (responseResult && typeof responseResult.status === 'number') {
    const { status, data, text } = responseResult;

    // Use clean server message if provided and human-readable
    if (data?.message && typeof data.message === 'string') {
      const msg = data.message.trim();
      const isInternal = /json\.parse|syntaxerror|mongoservererror|cast to objectid|at\s+\w+/i.test(msg);
      if (!isInternal && msg.length > 0) {
        return {
          message: msg,
          help: status === 413 ? 'Tip: You can compress images or save the file as a compact PPTX to reduce size.' : '',
        };
      }
    }

    // 413 Payload Too Large (or response text mentions payload / entity size)
    if (status === 413 || /payload too large|entity too large|FUNCTION_PAYLOAD_TOO_LARGE/i.test(text || '')) {
      return {
        message: 'Your presentation file is too large for the upload server to process.',
        help: 'Tip: Please compress images within your slides or save with standard PPTX compression (recommended size under 4 MB).',
      };
    }

    // 404 Not Found
    if (status === 404) {
      return {
        message: context === 'verification'
          ? 'Registration ID not found. Please verify your team ID and try again.'
          : 'The submission service is currently unreachable (404).',
        help: 'Please refresh the page or try again in a few moments.',
      };
    }

    // 403 Forbidden / Verification required
    if (status === 403) {
      return {
        message: data?.message || 'Payment verification is pending. Idea submission unlocks once approved by the administrator.',
        help: 'If your payment was completed recently, please allow time for admin review.',
      };
    }

    // 409 Conflict / Already submitted
    if (status === 409) {
      return {
        message: data?.message || 'Your idea has already been submitted for this registration.',
        help: 'Each registered team may only submit one project abstract and presentation.',
      };
    }

    // 400 Bad Request
    if (status === 400) {
      return {
        message: data?.message || 'Please check that all submission fields and file requirements are met.',
        help: 'Ensure your project title, abstract (1-200 words), and PPT/PPTX file are valid.',
      };
    }

    // 502 / 503 / 504 Gateway / Service Unavailable
    if (status === 502 || status === 503 || status === 504) {
      return {
        message: 'The server is temporarily busy or undergoing maintenance.',
        help: 'Please wait a few seconds and click "Submit Idea" again.',
      };
    }

    // 500 Internal Server Error
    if (status >= 500) {
      return {
        message: 'A temporary server issue occurred while saving your idea.',
        help: 'Your details are safe. Please wait a moment and try submitting again.',
      };
    }

    return {
      message: `The server responded with status ${status}.`,
      help: 'Please check your inputs and try again.',
    };
  }

  // Handle JavaScript exceptions / network dropouts
  const rawMsg = String(error?.message || error || '');

  // JSON parse / SyntaxError
  if (/json\.parse|syntaxerror|unexpected (character|token)|valid json/i.test(rawMsg)) {
    return {
      message: 'The server returned an unexpected response instead of confirmation.',
      help: 'This usually happens if your presentation file is too heavy. Please compress your presentation slides and try submitting again.',
    };
  }

  // Network offline or fetch failed
  if (!navigator.onLine || /failed to fetch|networkerror|network request failed|connection refused|load failed|abort/i.test(rawMsg)) {
    return {
      message: 'Unable to connect to the server.',
      help: 'Please check your internet connection and try submitting again.',
    };
  }

  // File reading failure
  if (/presentation file|filereader/i.test(rawMsg)) {
    return {
      message: 'Unable to read your presentation file from your device.',
      help: 'Please re-select the presentation file and try again.',
    };
  }

  return {
    message: rawMsg && rawMsg.length < 120 && !rawMsg.includes('{')
      ? rawMsg
      : 'An unexpected issue occurred while processing your request.',
    help: 'Please refresh the page and try again.',
  };
}

function setState(nextState) {
  submissionState = nextState;
  const isInitial = nextState === 'INITIAL';
  const isVerified = nextState === 'VERIFIED';
  const isSubmitted = nextState === 'SUBMITTED';

  verificationIntro.hidden = !isInitial;
  verifyForm.hidden = !isInitial;
  verifiedTeam.hidden = !isVerified;
  verificationSuccess.hidden = !isVerified;
  submissionForm.hidden = !isVerified || alreadySubmitted.hidden === false;
  successState.hidden = !isSubmitted;

  if (isSubmitted) {
    verifyForm.hidden = true;
    verifiedTeam.hidden = true;
    verificationSuccess.hidden = true;
    submissionForm.hidden = true;
  }
}

setState('INITIAL');

registrationInput.addEventListener('input', () => {
  if (verifyMessage.textContent) setMessage(verifyMessage, '');
});

function renderFacts(registration) {
  teamFacts.innerHTML = [
    ['Registration ID', registration.registrationId],
    ['Team Name', registration.teamName],
    ['Team Leader', registration.leaderName],
    ['Institution', registration.institution],
    ['Theme', registration.theme || 'Not specified'],
    ['Payment Status', '✓ Verified by Administrator'],
  ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the presentation file'));
    reader.readAsDataURL(file);
  });
}

// Proactive client-side file selection validation
presentationInput.addEventListener('change', () => {
  const file = presentationInput.files[0];
  if (!file) {
    setMessage(submissionMessage, '');
    return;
  }

  if (!/\.(ppt|pptx)$/i.test(file.name)) {
    presentationInput.value = '';
    setMessage(
      submissionMessage,
      'Invalid file format. Only Microsoft PowerPoint (.ppt or .pptx) files are supported.',
      'error',
      'Please select a valid .ppt or .pptx presentation.'
    );
    return;
  }

  if (file.size > MAX_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    presentationInput.value = '';
    setMessage(
      submissionMessage,
      `The selected presentation is ${sizeMb} MB, which exceeds the 8 MB limit.`,
      'error',
      'Tip: Compress images inside your slides or remove large video embeds to reduce file size.'
    );
    return;
  }


  // Clean state for valid file
  setMessage(submissionMessage, '');
});

verifyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submissionState === 'SUBMITTED') return;

  const regId = registrationInput.value.trim().toUpperCase();
  if (!regId) {
    setMessage(verifyMessage, 'Please enter your Registration ID.', 'error');
    registrationInput.focus();
    return;
  }

  if (!/^[A-Z0-9]{4,20}$/.test(regId)) {
    setMessage(
      verifyMessage,
      'Invalid Registration ID format. Must contain 4 to 20 alphanumeric characters (e.g. OD1234).',
      'error'
    );
    registrationInput.focus();
    return;
  }

  verifyButton.disabled = true;
  const originalVerifyText = verifyButton.textContent;
  verifyButton.textContent = 'VERIFYING...';
  setMessage(verifyMessage, 'Verifying registration details…', 'loading');

  try {
    const response = await fetch('/api/idea-submission/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId: regId }),
    });

    const parsed = await parseApiResponse(response);

    if (!parsed.ok || !parsed.data?.success) {
      const errInfo = formatUserError(null, parsed, 'verification');
      setMessage(verifyMessage, errInfo.message, 'error', errInfo.help);
      setState('INITIAL');
      return;
    }

    const result = parsed.data;
    verifiedRegistration = result.registration;
    renderFacts(verifiedRegistration);

    const theme = verifiedRegistration.theme || '';
    themeInput.value = theme;
    themeDisplay.textContent = theme;

    setMessage(verifyMessage, '');
    registrationInput.value = '';
    alreadySubmitted.hidden = !result.alreadySubmitted;
    setState('VERIFIED');
  } catch (error) {
    const errInfo = formatUserError(error, null, 'verification');
    setState('INITIAL');
    setMessage(verifyMessage, errInfo.message, 'error', errInfo.help);
  } finally {
    verifyButton.disabled = false;
    verifyButton.textContent = originalVerifyText;
  }
});

abstractInput.addEventListener('input', () => {
  const count = getWordCount(abstractInput.value);
  wordCount.textContent = `${count} / 200 words`;
  wordCount.classList.toggle('over-limit', count > 200);
  if (count <= 200 && submissionMessage.classList.contains('error') && submissionMessage.textContent.includes('Abstract')) {
    setMessage(submissionMessage, '');
  }
});

projectTitleInput?.addEventListener('input', () => {
  if (submissionMessage.classList.contains('error') && submissionMessage.textContent.includes('title')) {
    setMessage(submissionMessage, '');
  }
});

submissionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submissionState === 'SUBMITTED') return;

  const projectTitle = (projectTitleInput ? projectTitleInput.value : '').trim();
  const abstractText = abstractInput.value.trim();
  const count = getWordCount(abstractText);
  const file = presentationInput.files[0];

  // Client-side validations with friendly guidance
  if (!projectTitle || projectTitle.length < 2) {
    setMessage(submissionMessage, 'Please enter a project title (at least 2 characters).', 'error');
    projectTitleInput?.focus();
    return;
  }

  if (projectTitle.length > 160) {
    setMessage(submissionMessage, 'Project title must be 160 characters or fewer.', 'error');
    projectTitleInput?.focus();
    return;
  }

  if (count === 0) {
    setMessage(submissionMessage, 'Please provide an abstract describing your project.', 'error');
    abstractInput.focus();
    return;
  }

  if (count > 200) {
    setMessage(
      submissionMessage,
      `Your abstract is currently ${count} words. Please shorten it to 200 words or fewer.`,
      'error',
      'Tip: Highlight key problem statement, proposed solution, and expected impact concisely.'
    );
    abstractInput.focus();
    return;
  }

  if (!file || !/\.(ppt|pptx)$/i.test(file.name)) {
    setMessage(
      submissionMessage,
      'Please select your presentation file (.ppt or .pptx).',
      'error'
    );
    presentationInput.focus();
    return;
  }

  if (file.size > MAX_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setMessage(
      submissionMessage,
      `Your presentation file is ${sizeMb} MB. The maximum allowed size is 8 MB.`,
      'error',
      'Tip: Compress images or remove embedded media to decrease file size.'
    );
    return;
  }

  // Set loading state
  submitButton.disabled = true;
  const originalSubmitText = submitButton.textContent;
  submitButton.textContent = 'UPLOADING & SUBMITTING...';
  setMessage(
    submissionMessage,
    'Uploading presentation and logging your submission... Please keep this tab open.',
    'loading'
  );

  try {
    let dataUrl = await readFileAsDataUrl(file);

    // Normalize presentation MIME type if browser provided generic octet-stream
    let fileType = file.type;
    const isPptx = /\.pptx$/i.test(file.name);
    const standardMime = isPptx
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : 'application/vnd.ms-powerpoint';

    if (!fileType || fileType === 'application/octet-stream') {
      fileType = standardMime;
    }

    // Ensure dataUrl has proper mime prefix so server validation succeeds
    if (typeof dataUrl === 'string' && (dataUrl.startsWith('data:;') || dataUrl.startsWith('data:application/octet-stream;'))) {
      const commaIdx = dataUrl.indexOf(',');
      if (commaIdx !== -1) {
        dataUrl = `data:${fileType};base64,${dataUrl.slice(commaIdx + 1)}`;
      }
    }

    const payload = {
      registrationId: verifiedRegistration.registrationId,
      projectTitle,
      theme: themeInput.value,
      abstract: abstractText,
      presentation: { fileName: file.name, fileType, dataUrl },
    };

    const response = await fetch('/api/idea-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const parsed = await parseApiResponse(response);

    if (!parsed.ok || !parsed.data?.success) {
      const errInfo = formatUserError(null, parsed, 'submission');
      setMessage(submissionMessage, errInfo.message, 'error', errInfo.help);
      submitButton.disabled = false;
      submitButton.textContent = originalSubmitText;
      submissionMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const result = parsed.data;
    successSummary.innerHTML = `
      <span><b>Registration ID</b>${escapeHtml(result.submission.registrationId)}</span>
      <span><b>Team Name</b>${escapeHtml(result.submission.teamName)}</span>
      <span><b>Project Title</b>${escapeHtml(result.submission.projectTitle)}</span>`;

    setMessage(verifyMessage, '');
    setMessage(submissionMessage, '');
    verifyButton.disabled = true;
    submitButton.disabled = true;
    setState('SUBMITTED');
  } catch (error) {
    const errInfo = formatUserError(error, null, 'submission');
    setMessage(submissionMessage, errInfo.message, 'error', errInfo.help);
    submitButton.disabled = false;
    submitButton.textContent = originalSubmitText;
    submissionMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
