const verifyForm = document.getElementById('verify-form');
const registrationInput = document.getElementById('registration-id');
const verifyButton = document.getElementById('verify-button');
const verifyMessage = document.getElementById('verify-message');
const verifiedTeam = document.getElementById('verified-team');
const teamFacts = document.getElementById('team-facts');
const alreadySubmitted = document.getElementById('already-submitted');
const submissionForm = document.getElementById('submission-form');
const themeInput = document.getElementById('theme');
const abstractInput = document.getElementById('abstract');
const wordCount = document.getElementById('word-count');
const presentationInput = document.getElementById('presentation');
const submitButton = document.getElementById('submit-button');
const submissionMessage = document.getElementById('submission-message');
const successState = document.getElementById('success-state');
const successSummary = document.getElementById('success-summary');

let verifiedRegistration = null;
let submissionState = 'INITIAL';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function getWordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function setMessage(element, message, error = true) {
  element.textContent = message;
  element.classList.toggle('success', !error);
}

function setState(nextState) {
  submissionState = nextState;
  verifyForm.hidden = nextState !== 'INITIAL';
  verifiedTeam.hidden = nextState !== 'VERIFIED';
  submissionForm.hidden = nextState !== 'VERIFIED' || alreadySubmitted.hidden === false;
  successState.hidden = nextState !== 'SUBMITTED';
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

verifyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submissionState === 'SUBMITTED') return;
  verifyButton.disabled = true;
  setMessage(verifyMessage, 'Verifying registration…', false);
  try {
    const response = await fetch('/api/idea-submission/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId: registrationInput.value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Registration could not be verified');
    verifiedRegistration = result.registration;
    renderFacts(verifiedRegistration);
    themeInput.value = verifiedRegistration.theme || '';
    alreadySubmitted.hidden = !result.alreadySubmitted;
    setState('VERIFIED');
  } catch (error) {
    setState('INITIAL');
    setMessage(verifyMessage, error.message, true);
  } finally {
    verifyButton.disabled = false;
  }
});

abstractInput.addEventListener('input', () => {
  const count = getWordCount(abstractInput.value);
  wordCount.textContent = `${count} / 200 words`;
  wordCount.classList.toggle('over-limit', count > 200);
});

submissionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submissionState === 'SUBMITTED') return;
  const file = presentationInput.files[0];
  const count = getWordCount(abstractInput.value);
  if (!file || !/\.(ppt|pptx)$/i.test(file.name)) {
    setMessage(submissionMessage, 'Please choose a PPT or PPTX presentation.', true);
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    setMessage(submissionMessage, 'The presentation must be smaller than 8 MB.', true);
    return;
  }
  if (count > 200 || count === 0) {
    setMessage(submissionMessage, 'Abstract must contain 1 to 200 words.', true);
    return;
  }
  submitButton.disabled = true;
  setMessage(submissionMessage, 'Uploading and saving your idea…', false);
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const response = await fetch('/api/idea-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationId: verifiedRegistration.registrationId,
        projectTitle: document.getElementById('project-title').value,
        abstract: abstractInput.value,
        presentation: { fileName: file.name, fileType: file.type, dataUrl },
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to submit your idea');
    successSummary.innerHTML = `
      <span><b>Registration ID</b>${escapeHtml(result.submission.registrationId)}</span>
      <span><b>Team Name</b>${escapeHtml(result.submission.teamName)}</span>
      <span><b>Project Title</b>${escapeHtml(result.submission.projectTitle)}</span>`;
    verifyMessage.textContent = '';
    verifyButton.disabled = true;
    submitButton.disabled = true;
    setState('SUBMITTED');
  } catch (error) {
    setMessage(submissionMessage, error.message || 'Network error. Please try again.', true);
    submitButton.disabled = false;
  }
});
