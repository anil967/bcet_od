// DOM Elements
const ideasBody = document.getElementById('ideas-body');
const ideaSearch = document.getElementById('idea-search');
const clearSearchBtn = document.getElementById('clear-search');
const themeFilter = document.getElementById('theme-filter');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const resultCount = document.getElementById('result-count');
const loadError = document.getElementById('load-error');
const refreshBtn = document.getElementById('refresh-button');
const exportBtn = document.getElementById('export-button');
const logoutBtn = document.getElementById('logout-button');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// KPI elements
const kpiTotal = document.getElementById('kpi-total');
const kpiInstitutions = document.getElementById('kpi-institutions');
const kpiThemes = document.getElementById('kpi-themes');
const kpiPpts = document.getElementById('kpi-ppts');
const kpiCardAll = document.getElementById('kpi-card-all');

// Toast Elements
const toastBanner = document.getElementById('toast-banner');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

// Dossier Dialog Elements
const dossierDialog = document.getElementById('idea-dossier-dialog');
const closeDossierDialog = document.getElementById('close-dossier-dialog');
const dossierRegId = document.getElementById('dossier-reg-id');
const dossierTeamName = document.getElementById('dossier-team-name');
const dossierThemeTag = document.getElementById('dossier-theme-tag');
const dossierInstitution = document.getElementById('dossier-institution');
const dossierLeaderName = document.getElementById('dossier-leader-name');
const dossierLeaderPhone = document.getElementById('dossier-leader-phone');
const dossierLeaderEmail = document.getElementById('dossier-leader-email');
const dossierSubmittedAt = document.getElementById('dossier-submitted-at');
const dossierProjectTitle = document.getElementById('dossier-project-title');
const dossierAbstract = document.getElementById('dossier-abstract');
const dossierPptName = document.getElementById('dossier-ppt-name');
const dossierPptSize = document.getElementById('dossier-ppt-size');
const dossierDownloadBtn = document.getElementById('dossier-download-btn');

// Delete Dialog Elements
const ideaDeleteDialog = document.getElementById('idea-delete-dialog');
const closeIdeaDeleteDialog = document.getElementById('close-idea-delete-dialog');
const cancelIdeaDelete = document.getElementById('cancel-idea-delete');
const confirmIdeaDelete = document.getElementById('confirm-idea-delete');
const deleteIdeaRegId = document.getElementById('delete-idea-reg-id');
const deleteIdeaTeam = document.getElementById('delete-idea-team');
const deleteIdeaProject = document.getElementById('delete-idea-project');

// State
let ideaSubmissions = [];
let pendingIdeaDeletion = null;
let toastTimeout = null;

// Helpers
const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function showToast(message, type = 'success') {
  if (!toastBanner || !toastMessage) return;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMessage.textContent = message;
  toastBanner.style.borderColor = type === 'error' ? 'var(--danger)' : 'var(--success)';
  toastBanner.style.color = type === 'error' ? '#fca5a5' : '#6ee7b7';
  toastBanner.style.background = type === 'error' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)';
  toastBanner.hidden = false;
  toastTimeout = setTimeout(() => {
    toastBanner.hidden = true;
  }, 4500);
}

if (toastClose) {
  toastClose.addEventListener('click', () => {
    if (toastBanner) toastBanner.hidden = true;
  });
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatFileSize(bytes) {
  if (!bytes || typeof bytes !== 'number') return 'PPT file';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function updateKpis() {
  const total = ideaSubmissions.length;
  const institutions = new Set(ideaSubmissions.map((s) => (s.institution || '').trim().toLowerCase()).filter(Boolean)).size;
  const themes = new Set(ideaSubmissions.map((s) => (s.theme || '').trim().toLowerCase()).filter(Boolean)).size;
  const ppts = ideaSubmissions.filter((s) => s.ppt && (s.ppt.fileName || s.ppt.mimeType)).length;

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiInstitutions) kpiInstitutions.textContent = institutions;
  if (kpiThemes) kpiThemes.textContent = themes;
  if (kpiPpts) kpiPpts.textContent = ppts;
}

function populateThemeFilter() {
  if (!themeFilter) return;
  const currentVal = themeFilter.value;
  const uniqueThemes = Array.from(new Set(
    ideaSubmissions.map((s) => (s.theme || '').trim()).filter(Boolean)
  )).sort();

  themeFilter.innerHTML = '<option value="">All Themes</option>' +
    uniqueThemes.map((theme) => `<option value="${escapeHtml(theme)}">${escapeHtml(theme)}</option>`).join('');

  if (uniqueThemes.includes(currentVal)) {
    themeFilter.value = currentVal;
  }
}

function getFilteredSubmissions() {
  const term = (ideaSearch?.value || '').trim().toLowerCase();
  const selectedTheme = (themeFilter?.value || '').trim().toLowerCase();

  return ideaSubmissions.filter((item) => {
    const matchesTerm = !term || [
      item.registrationId,
      item.teamName,
      item.institution,
      item.projectTitle,
      item.theme,
      item.leaderName,
      item.leaderEmail,
      item.leaderPhone,
    ].join(' ').toLowerCase().includes(term);

    const matchesTheme = !selectedTheme || (item.theme || '').trim().toLowerCase() === selectedTheme;

    return matchesTerm && matchesTheme;
  });
}

function renderIdeaSubmissions() {
  if (!ideasBody) return;
  const filtered = getFilteredSubmissions();

  if (clearSearchBtn) {
    clearSearchBtn.hidden = !(ideaSearch?.value || '').trim();
  }

  if (resultCount) {
    resultCount.textContent = `Showing ${filtered.length} of ${ideaSubmissions.length} idea submissions`;
  }

  if (emptyState) {
    emptyState.hidden = filtered.length > 0;
  }

  ideasBody.innerHTML = filtered.map((item) => {
    const regId = escapeHtml(item.registrationId || 'OD----');
    const teamName = escapeHtml(item.teamName || '—');
    const institution = escapeHtml(item.institution || '—');
    const leaderName = escapeHtml(item.leaderName || '—');
    const projectTitle = escapeHtml(item.projectTitle || 'Untitled Project');
    const theme = escapeHtml(item.theme || 'General');
    const submittedAt = escapeHtml(formatDisplayDate(item.submittedAt));
    const ideaId = escapeHtml(item._id);

    return `
      <tr data-idea-id="${ideaId}">
        <td>
          <span class="reg-id-badge copy-trigger" title="Click to copy Registration ID" data-copy="${regId}">${regId}</span>
        </td>
        <td>
          <strong>${teamName}</strong><br>
          <span class="college-text">${institution}</span><br>
          <span class="contact-sub-text">Lead: ${leaderName}</span>
        </td>
        <td>
          <strong>${projectTitle}</strong><br>
          <span class="theme-chip">${theme}</span>
          ${item.abstract ? `
            <details class="admin-abstract">
              <summary>View Abstract Snippet</summary>
              <p>${escapeHtml(item.abstract)}</p>
            </details>
          ` : ''}
        </td>
        <td>
          <span class="date-text">${submittedAt}</span>
        </td>
        <td class="idea-actions">
          <a class="btn-download-ppt" href="/api/admin/idea-submissions/${encodeURIComponent(item._id)}/download" title="Download PPT File">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>PPT</span>
          </a>
          <button class="btn-view-dossier view-dossier-btn" type="button" data-idea-id="${ideaId}" title="View Full Dossier">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Dossier</span>
          </button>
          <button class="danger-button idea-delete-button" type="button" data-idea-id="${ideaId}" title="Delete this proposal">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openDossierDialog(item) {
  if (!dossierDialog || !item) return;
  dossierRegId.textContent = item.registrationId || 'OD----';
  dossierRegId.dataset.copy = item.registrationId || '';
  dossierTeamName.textContent = item.teamName || '—';
  dossierThemeTag.textContent = item.theme || 'General Track';
  dossierInstitution.textContent = item.institution || '—';
  dossierLeaderName.textContent = item.leaderName || '—';

  if (dossierLeaderPhone) {
    const phone = item.leaderPhone || '';
    dossierLeaderPhone.href = phone ? `tel:${phone}` : '#';
    dossierLeaderPhone.querySelector('.text').textContent = phone || '—';
  }

  if (dossierLeaderEmail) {
    const email = item.leaderEmail || '';
    dossierLeaderEmail.href = email ? `mailto:${email}` : '#';
    dossierLeaderEmail.querySelector('.text').textContent = email || '—';
  }

  dossierSubmittedAt.textContent = formatDisplayDate(item.submittedAt);
  dossierProjectTitle.textContent = item.projectTitle || 'Untitled Proposal';
  dossierAbstract.textContent = item.abstract || 'No abstract text provided.';

  if (dossierPptName) {
    dossierPptName.textContent = item.ppt?.fileName || 'Presentation Deck';
  }
  if (dossierPptSize) {
    dossierPptSize.textContent = item.ppt?.size ? formatFileSize(item.ppt.size) : 'PPT / PPTX presentation';
  }
  if (dossierDownloadBtn) {
    dossierDownloadBtn.href = `/api/admin/idea-submissions/${encodeURIComponent(item._id)}/download`;
  }

  dossierDialog.showModal();
}

function openIdeaDeleteDialog(item) {
  if (!ideaDeleteDialog || !item) return;
  pendingIdeaDeletion = item;
  deleteIdeaRegId.textContent = item.registrationId || '—';
  deleteIdeaTeam.textContent = item.teamName || '—';
  deleteIdeaProject.textContent = item.projectTitle || '—';
  confirmIdeaDelete.disabled = false;
  confirmIdeaDelete.textContent = 'Delete Submission';
  ideaDeleteDialog.showModal();
}

async function deleteIdeaSubmission() {
  if (!pendingIdeaDeletion || confirmIdeaDelete.disabled) return;
  confirmIdeaDelete.disabled = true;
  confirmIdeaDelete.textContent = 'Deleting...';
  try {
    const response = await fetch(`/api/admin/idea-submissions/${encodeURIComponent(pendingIdeaDeletion._id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const result = await response.json();
    if (response.status === 401) {
      window.location.replace('/admin/login');
      return;
    }
    if (!response.ok) throw new Error(result.message || 'Unable to delete idea submission');

    ideaSubmissions = ideaSubmissions.filter((item) => item._id !== pendingIdeaDeletion._id);
    ideaDeleteDialog.close();
    pendingIdeaDeletion = null;
    updateKpis();
    populateThemeFilter();
    renderIdeaSubmissions();
    showToast('Idea submission deleted successfully.');
  } catch (error) {
    confirmIdeaDelete.disabled = false;
    confirmIdeaDelete.textContent = 'Delete Submission';
    showToast(error.message || 'Unable to delete idea submission', 'error');
  }
}

async function loadIdeaSubmissions() {
  if (loadingState) loadingState.hidden = false;
  if (loadError) loadError.textContent = '';
  try {
    const response = await fetch('/api/admin/idea-submissions', { credentials: 'same-origin' });
    if (response.status === 401) {
      window.location.replace('/admin/login');
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to load idea submissions');

    ideaSubmissions = result.submissions || [];
    updateKpis();
    populateThemeFilter();
    renderIdeaSubmissions();
  } catch (error) {
    if (loadError) loadError.textContent = error.message;
    showToast(error.message || 'Failed to load idea submissions', 'error');
  } finally {
    if (loadingState) loadingState.hidden = true;
  }
}

function exportCsv() {
  const filtered = getFilteredSubmissions();
  if (!filtered.length) {
    showToast('No submissions available to export', 'error');
    return;
  }

  const headers = [
    'Registration ID',
    'Team Name',
    'Institution',
    'Leader Name',
    'Leader Email',
    'Leader Phone',
    'Project Title',
    'Theme',
    'Abstract',
    'Presentation File',
    'Submitted At',
  ];

  const escapeCsv = (str) => `"${String(str ?? '').replace(/"/g, '""')}"`;

  const rows = filtered.map((item) => [
    escapeCsv(item.registrationId),
    escapeCsv(item.teamName),
    escapeCsv(item.institution),
    escapeCsv(item.leaderName),
    escapeCsv(item.leaderEmail),
    escapeCsv(item.leaderPhone),
    escapeCsv(item.projectTitle),
    escapeCsv(item.theme),
    escapeCsv(item.abstract),
    escapeCsv(item.ppt?.fileName || 'Attached'),
    escapeCsv(item.submittedAt),
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `odyssey-idea-submissions-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(`Exported ${filtered.length} submissions to CSV`);
}

// Event Listeners
ideaSearch?.addEventListener('input', renderIdeaSubmissions);

clearSearchBtn?.addEventListener('click', () => {
  if (ideaSearch) ideaSearch.value = '';
  renderIdeaSubmissions();
  ideaSearch?.focus();
});

themeFilter?.addEventListener('change', renderIdeaSubmissions);

resetFiltersBtn?.addEventListener('click', () => {
  if (ideaSearch) ideaSearch.value = '';
  if (themeFilter) themeFilter.value = '';
  renderIdeaSubmissions();
});

kpiCardAll?.addEventListener('click', () => {
  if (ideaSearch) ideaSearch.value = '';
  if (themeFilter) themeFilter.value = '';
  renderIdeaSubmissions();
});

ideasBody?.addEventListener('click', (event) => {
  // Copy Reg ID trigger
  const copyBadge = event.target.closest('.copy-trigger');
  if (copyBadge) {
    const textToCopy = copyBadge.dataset.copy || copyBadge.textContent.trim();
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`Copied ${textToCopy} to clipboard`);
      }).catch(() => {
        showToast('Unable to copy to clipboard', 'error');
      });
      return;
    }
  }

  // View Dossier
  const dossierBtn = event.target.closest('.view-dossier-btn');
  if (dossierBtn) {
    const item = ideaSubmissions.find((s) => s._id === dossierBtn.dataset.ideaId);
    if (item) openDossierDialog(item);
    return;
  }

  // Delete Idea
  const deleteBtn = event.target.closest('.idea-delete-button');
  if (deleteBtn) {
    const item = ideaSubmissions.find((s) => s._id === deleteBtn.dataset.ideaId);
    if (item) openIdeaDeleteDialog(item);
  }
});

// Dossier dialog
closeDossierDialog?.addEventListener('click', () => dossierDialog?.close());
dossierDialog?.addEventListener('click', (e) => {
  if (e.target === dossierDialog) dossierDialog.close();
});

// Delete dialog
closeIdeaDeleteDialog?.addEventListener('click', () => ideaDeleteDialog?.close());
cancelIdeaDelete?.addEventListener('click', () => ideaDeleteDialog?.close());
confirmIdeaDelete?.addEventListener('click', deleteIdeaSubmission);
ideaDeleteDialog?.addEventListener('click', (e) => {
  if (e.target === ideaDeleteDialog) ideaDeleteDialog.close();
});

// Refresh
refreshBtn?.addEventListener('click', async () => {
  refreshBtn.classList.add('rotating');
  await loadIdeaSubmissions();
  setTimeout(() => refreshBtn.classList.remove('rotating'), 600);
  showToast('Idea submissions updated');
});

// Export
exportBtn?.addEventListener('click', exportCsv);

// Logout
logoutBtn?.addEventListener('click', async () => {
  try {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    window.location.replace('/admin/login');
  }
});

// Initial Load
loadIdeaSubmissions();
