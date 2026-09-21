/**
 * Odyssey Admin Dashboard Controller
 * Full data access, KPI statistics, smart search & filtering, and bulk CSV Smart Importer.
 */

const state = {
  registrations: [],
  filtered: [],
  activeStatusTab: '',
  sortKey: 'registeredAt',
  sortDirection: 'desc',
  selectedRegistration: null,
  parsedImportRows: [],
};

// DOM References
const body = document.getElementById('registrations-body');
const searchInput = document.getElementById('search');
const clearSearchBtn = document.getElementById('clear-search');
const accommodationFilter = document.getElementById('accommodation-filter');
const resultCount = document.getElementById('result-count');
const loadError = document.getElementById('load-error');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const refreshBtn = document.getElementById('refresh-button');
const logoutBtn = document.getElementById('logout-button');
const exportBtn = document.getElementById('export-button');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// KPI elements
const kpiTotal = document.getElementById('kpi-total');
const kpiTotalSub = document.getElementById('kpi-total-sub');
const kpiVerified = document.getElementById('kpi-verified');
const kpiVerifiedSub = document.getElementById('kpi-verified-sub');
const kpiSelected = document.getElementById('kpi-selected');
const kpiSelectedSub = document.getElementById('kpi-selected-sub');
const kpiPending = document.getElementById('kpi-pending');
const kpiAccommodation = document.getElementById('kpi-accommodation');
const kpiParticipants = document.getElementById('kpi-participants');

// Tab count elements
const countAll = document.getElementById('count-all');
const countPending = document.getElementById('count-pending');
const countVerified = document.getElementById('count-verified');
const countSelected = document.getElementById('count-selected');
const countRejected = document.getElementById('count-rejected');
const statusTabs = document.querySelectorAll('.status-tab');

// Details Dialog
const detailsDialog = document.getElementById('details-dialog');
const closeDialogBtn = document.getElementById('close-dialog');
const modalRegId = document.getElementById('modal-reg-id');
const modalTeamName = document.getElementById('modal-team-name');
const modalStatusBadge = document.getElementById('modal-status-badge');
const modalCollege = document.getElementById('modal-college');
const modalAccommodation = document.getElementById('modal-accommodation');
const modalDate = document.getElementById('modal-date');
const modalLeaderName = document.getElementById('modal-leader-name');
const modalLeaderPhone = document.getElementById('modal-leader-phone');
const modalLeaderEmail = document.getElementById('modal-leader-email');
const modalMemberCount = document.getElementById('modal-member-count');
const modalMembersList = document.getElementById('modal-members-list');
const paymentProofImg = document.getElementById('payment-proof-img');
const viewFullSlipBtn = document.getElementById('view-full-slip-btn');
const noProofText = document.getElementById('no-proof-text');
const paymentVerifyStatus = document.getElementById('payment-verify-status');
const paymentStatusBanner = document.getElementById('payment-status-banner');
const bannerStatusTitle = document.getElementById('banner-status-title');
const bannerStatusDesc = document.getElementById('banner-status-desc');
const statusHint = document.getElementById('status-hint');
const verifyBtn = document.getElementById('verify-payment');
const selectBtn = document.getElementById('select-team-btn');
const rejectBtn = document.getElementById('reject-payment');
const resetBtn = document.getElementById('reset-payment');
const deleteBtn = document.getElementById('delete-registration-btn');
const copyTeamSummaryBtn = document.getElementById('copy-team-summary');

// Smart Import Dialog
const openImportBtn = document.getElementById('open-import-btn');
const importDialog = document.getElementById('import-dialog');
const closeImportBtn = document.getElementById('close-import-dialog');
const cancelImportBtn = document.getElementById('cancel-import-btn');
const confirmImportBtn = document.getElementById('confirm-import-btn');
const tabFileUpload = document.getElementById('tab-file-upload');
const tabPasteCsv = document.getElementById('tab-paste-csv');
const fileUploadSection = document.getElementById('file-upload-section');
const pasteSection = document.getElementById('paste-section');
const csvFileInput = document.getElementById('csv-file-input');
const dropZone = document.getElementById('drop-zone');
const browseFileBtn = document.getElementById('browse-file-btn');
const csvPasteInput = document.getElementById('csv-paste-input');
const parsePastedBtn = document.getElementById('parse-pasted-btn');
const downloadSampleCsvBtn = document.getElementById('download-sample-csv');
const importStatusMsg = document.getElementById('import-status-msg');
const importPreviewWrapper = document.getElementById('import-preview-wrapper');
const previewCount = document.getElementById('preview-count');
const previewBody = document.getElementById('preview-body');

// Lightbox Dialog
const lightboxDialog = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightboxBtn = document.getElementById('close-lightbox');
const lightboxDownloadLink = document.getElementById('lightbox-download-link');

// Toast
const toastBanner = document.getElementById('toast-banner');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');
const PAYMENT_STATUS_LABELS = {
  pending_verification: 'Pending',
  verified: 'Verified',
  selected: 'Selected',
  rejected: 'Rejected',
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toastBanner.style.borderColor = type === 'error' ? 'var(--danger)' : 'var(--success)';
  toastBanner.style.color = type === 'error' ? '#fca5a5' : '#6ee7b7';
  toastBanner.style.background = type === 'error' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)';
  toastBanner.hidden = false;
  setTimeout(() => {
    toastBanner.hidden = true;
  }, 4500);
}

if (toastClose) {
  toastClose.addEventListener('click', () => { toastBanner.hidden = true; });
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

function normaliseRegistration(item) {
  const paymentStatus = item.status || 'pending_verification';
  const members = Array.isArray(item.members) ? item.members : [];
  const teamSize = Number(item.teamSize) || (members.length + 1);
  return {
    ...item,
    paymentStatus,
    members,
    teamSize,
    regId: item.regId || (item._id ? 'OD' + item._id.slice(-4).toUpperCase() : 'OD----'),
    accommodation: item.accommodation || 'No',
  };
}

// Update KPI cards and Filter tab counts
function updateKpiCards() {
  const total = state.registrations.length;
  // Teams with verified payments include both 'verified' teams and 'selected' teams
  const verified = state.registrations.filter(r => r.paymentStatus === 'verified' || r.paymentStatus === 'selected').length;
  const selected = state.registrations.filter(r => r.paymentStatus === 'selected').length;
  const pending = state.registrations.filter(r => r.paymentStatus === 'pending_verification').length;
  const rejected = state.registrations.filter(r => r.paymentStatus === 'rejected').length;
  const accommodation = state.registrations.filter(r => String(r.accommodation).toLowerCase().includes('yes')).length;
  
  const totalParticipants = state.registrations.reduce((acc, curr) => {
    return acc + (Number(curr.teamSize) || ((curr.members?.length || 0) + 1));
  }, 0);

  kpiTotal.textContent = total;
  kpiTotalSub.textContent = total === 1 ? '1 team registered' : `${total} teams registered`;
  
  kpiVerified.textContent = verified;
  const verifiedPercent = total > 0 ? Math.round((verified / total) * 100) : 0;
  kpiVerifiedSub.textContent = `${verifiedPercent}% approval rate`;

  if (kpiSelected) kpiSelected.textContent = selected;
  if (kpiSelectedSub) kpiSelectedSub.textContent = `${selected} team${selected === 1 ? '' : 's'} shortlisted`;

  kpiPending.textContent = pending;
  kpiAccommodation.textContent = accommodation;
  kpiParticipants.textContent = totalParticipants;

  countAll.textContent = total;
  countPending.textContent = pending;
  countVerified.textContent = verified;
  if (countSelected) countSelected.textContent = selected;
  countRejected.textContent = rejected;
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  clearSearchBtn.hidden = !term;

  state.filtered = state.registrations.filter((item) => {
    const searchable = [
      item.regId,
      item.leaderName,
      item.leaderEmail,
      item.leaderPhone,
      item.teamName,
      item.institution,
      ...(item.members || []).map(m => `${m.name} ${m.email} ${m.phone}`),
    ].join(' ').toLowerCase();

    const matchesSearch = !term || searchable.includes(term);

    // Filter by status tab:
    // When 'verified' section is chosen, include both 'verified' and 'selected' teams
    let matchesStatus = true;
    if (state.activeStatusTab === 'verified') {
      matchesStatus = item.paymentStatus === 'verified' || item.paymentStatus === 'selected';
    } else if (state.activeStatusTab) {
      matchesStatus = item.paymentStatus === state.activeStatusTab;
    }
    
    let matchesAccommodation = true;
    if (accommodationFilter.value === 'Yes') {
      matchesAccommodation = String(item.accommodation).toLowerCase().includes('yes');
    } else if (accommodationFilter.value === 'No') {
      matchesAccommodation = !String(item.accommodation).toLowerCase().includes('yes');
    }

    return matchesSearch && matchesStatus && matchesAccommodation;
  });

  // Sort
  state.filtered.sort((a, b) => {
    let left = a[state.sortKey] ?? '';
    let right = b[state.sortKey] ?? '';
    if (typeof left === 'string') left = left.toLowerCase();
    if (typeof right === 'string') right = right.toLowerCase();
    if (left < right) return state.sortDirection === 'asc' ? -1 : 1;
    if (left > right) return state.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  renderTable();
}

function renderTable() {
  loadingState.hidden = true;
  loadingState.style.display = 'none';

  if (state.filtered.length === 0) {
    body.innerHTML = '';
    emptyState.hidden = false;
    emptyState.style.display = 'flex';
    resultCount.textContent = `0 of ${state.registrations.length} registrations`;
    return;
  }

  emptyState.hidden = true;
  emptyState.style.display = 'none';
  resultCount.textContent = `Showing ${state.filtered.length} of ${state.registrations.length} registered teams`;

  body.innerHTML = state.filtered.map((item, index) => {
    const hasStay = String(item.accommodation).toLowerCase().includes('yes');
    const memberCount = item.teamSize || ((item.members?.length || 0) + 1);
    const statusClass = item.paymentStatus === 'verified' ? 'status-verified' :
      (item.paymentStatus === 'rejected' ? 'status-rejected' :
      (item.paymentStatus === 'selected' ? 'status-selected' : 'status-pending'));
    const statusLabel = PAYMENT_STATUS_LABELS[item.paymentStatus] || item.paymentStatus;

    return `
      <tr>
        <td class="reg-id-cell">
          <span class="reg-id-badge copy-trigger" data-copy="${escapeHtml(item.regId)}" title="Click to copy Reg ID">
            ${escapeHtml(item.regId)}
          </span>
        </td>
        <td>
          <div class="team-title-wrap">
            <span class="team-name-text">${escapeHtml(item.teamName || 'Unnamed Squad')}</span>
            <span class="college-text">${escapeHtml(item.institution || '—')}</span>
          </div>
        </td>
        <td>
          <div class="contact-info-wrap">
            <span class="leader-name-text">${escapeHtml(item.leaderName || '—')}</span>
            <div class="contact-sub-text">
              ${item.leaderPhone ? `<a href="tel:${escapeHtml(item.leaderPhone)}">📞 ${escapeHtml(item.leaderPhone)}</a>` : ''}
              ${item.leaderEmail ? `<a href="mailto:${escapeHtml(item.leaderEmail)}">✉️ ${escapeHtml(item.leaderEmail)}</a>` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="member-chip" title="${(item.members || []).map(m => m.name).join(', ') || 'Only leader'}">
            👥 ${memberCount}
          </span>
        </td>
        <td>
          <span class="acc-badge ${hasStay ? 'acc-yes' : 'acc-no'}">
            ${hasStay ? '🏨 Required' : 'No'}
          </span>
        </td>
        <td>
          <span class="status-badge ${statusClass}">
            ${escapeHtml(statusLabel)}
          </span>
        </td>
        <td>
          <span style="font-size: 12px; color: var(--text-muted);">${formatDisplayDate(item.registeredAt)}</span>
        </td>
        <td>
          <div class="row-actions-group">
            <button class="view-row-btn" data-view-index="${index}">View</button>
            ${item.paymentStatus === 'pending_verification' ? `
              <button class="quick-action-btn quick-verify-btn" data-quick-verify="${item._id}" title="Quick Verify">✓</button>
              <button class="quick-action-btn quick-reject-btn" data-quick-reject="${item._id}" title="Quick Reject">✕</button>
            ` : ''}
            ${item.paymentStatus === 'selected' ? `
              <button class="quick-action-btn quick-unselect-btn" data-quick-unselect="${item._id}" title="Selected team! Click to unselect">★ Selected</button>
            ` : `
              <button class="quick-action-btn quick-select-btn" data-quick-select="${item._id}" title="Move team to Selected section">★ Select</button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Registration Details Dialog
function renderDetails(item) {
  state.selectedRegistration = item;
  modalRegId.textContent = item.regId;
  modalRegId.dataset.copy = item.regId;
  modalTeamName.textContent = item.teamName || 'Registration Details';

  const statusClass = item.paymentStatus === 'verified' ? 'status-verified' :
    (item.paymentStatus === 'rejected' ? 'status-rejected' :
    (item.paymentStatus === 'selected' ? 'status-selected' : 'status-pending'));
  const statusLabel = PAYMENT_STATUS_LABELS[item.paymentStatus] || item.paymentStatus;
  modalStatusBadge.className = `status-badge ${statusClass}`;
  modalStatusBadge.textContent = statusLabel;

  // On the payment proof card header: if the team is selected or verified, payment proof is verified!
  if (item.paymentStatus === 'selected') {
    paymentVerifyStatus.className = 'status-badge status-verified';
    paymentVerifyStatus.textContent = 'Verified';
  } else {
    paymentVerifyStatus.className = `status-badge ${statusClass}`;
    paymentVerifyStatus.textContent = statusLabel;
  }

  modalCollege.textContent = item.institution || '—';
  modalAccommodation.textContent = item.accommodation || 'No';
  modalDate.textContent = formatDisplayDate(item.registeredAt);

  // Leader
  modalLeaderName.textContent = item.leaderName || '—';
  modalLeaderPhone.querySelector('.text').textContent = item.leaderPhone || '—';
  modalLeaderPhone.href = item.leaderPhone ? `tel:${item.leaderPhone}` : '#';
  modalLeaderEmail.querySelector('.text').textContent = item.leaderEmail || '—';
  modalLeaderEmail.href = item.leaderEmail ? `mailto:${item.leaderEmail}` : '#';

  // Members
  const members = item.members || [];
  modalMemberCount.textContent = `${members.length} additional member${members.length === 1 ? '' : 's'}`;
  
  if (members.length === 0) {
    modalMembersList.innerHTML = '<div class="muted-notice" style="padding:12px; border:1px dashed var(--border-line-subtle);">No additional team members listed.</div>';
  } else {
    modalMembersList.innerHTML = members.map((m, idx) => `
      <div class="member-item-card">
        <div class="member-card-top-row">
          <span class="member-slot-tag">MEMBER SLOT ${m.memberSlot || idx + 2}</span>
          <span class="member-name-text">${escapeHtml(m.name || 'Member')}</span>
        </div>
        <div class="contact-sub-text">
          ${m.phone ? `<a href="tel:${escapeHtml(m.phone)}">📞 ${escapeHtml(m.phone)}</a>` : ''}
          ${m.email ? `<a href="mailto:${escapeHtml(m.email)}">✉️ ${escapeHtml(m.email)}</a>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Payment Slip Proof
  const slipUrl = item.paymentSlip?.dataUrl;
  if (slipUrl) {
    paymentProofImg.src = slipUrl;
    paymentProofImg.hidden = false;
    viewFullSlipBtn.parentElement.hidden = false;
    noProofText.hidden = true;
  } else {
    paymentProofImg.hidden = true;
    viewFullSlipBtn.parentElement.hidden = true;
    noProofText.hidden = false;
  }

  // Dynamic payment status state
  const status = item.paymentStatus || 'pending_verification';
  const isSelected = status === 'selected';
  const isPaymentVerified = status === 'verified' || isSelected; // When selected, payment is already verified!
  const isRejected = status === 'rejected';
  const isPending = status === 'pending_verification';

  // Live status banner updates
  if (paymentStatusBanner) {
    paymentStatusBanner.className = `payment-status-banner status-${isPending ? 'pending' : status}`;
  }
  if (bannerStatusTitle) {
    if (isSelected) bannerStatusTitle.textContent = 'TEAM SELECTED & VERIFIED';
    else if (status === 'verified') bannerStatusTitle.textContent = 'PAYMENT VERIFIED';
    else if (isRejected) bannerStatusTitle.textContent = 'PAYMENT REJECTED';
    else bannerStatusTitle.textContent = 'PENDING VERIFICATION';
  }
  if (bannerStatusDesc) {
    if (isSelected) bannerStatusDesc.textContent = 'Payment verified ✓ • Shortlisted for final round';
    else if (status === 'verified') bannerStatusDesc.textContent = 'Slip verified by administrator • Registration active';
    else if (isRejected) bannerStatusDesc.textContent = 'Slip rejected • Registration not confirmed';
    else bannerStatusDesc.textContent = 'Awaiting slip verification by administrator';
  }
  if (statusHint) {
    if (isSelected) statusHint.textContent = 'Current: Selected & Verified ★✓';
    else if (status === 'verified') statusHint.textContent = 'Current: Verified ✓';
    else if (isRejected) statusHint.textContent = 'Current: Rejected ✕';
    else statusHint.textContent = 'Awaiting review';
  }

  // Button states and dynamic labels
  // Note: When a team is Selected, verifyBtn remains in the Verified state (green active)
  if (verifyBtn) {
    verifyBtn.classList.toggle('active', isPaymentVerified);
    verifyBtn.innerHTML = isPaymentVerified
      ? '<span class="btn-icon">✓</span><span class="btn-text">Verified</span>'
      : '<span class="btn-icon">✓</span><span class="btn-text">Verify Payment</span>';
    verifyBtn.disabled = isPaymentVerified;
    verifyBtn.title = isPaymentVerified ? 'Payment is verified' : 'Verify payment';
  }

  if (selectBtn) {
    selectBtn.classList.toggle('active', isSelected);
    selectBtn.disabled = isRejected;
    selectBtn.innerHTML = isSelected
      ? '<span class="btn-icon">★</span><span class="btn-text">Selected</span>'
      : '<span class="btn-icon">★</span><span class="btn-text">Select Team</span>';
    selectBtn.title = isSelected
      ? 'Team is selected! Click to unselect'
      : 'Select this team for the final round';
  }

  if (rejectBtn) {
    rejectBtn.classList.toggle('active', isRejected);
    rejectBtn.disabled = isRejected;
    rejectBtn.innerHTML = isRejected
      ? '<span class="btn-icon">✕</span><span class="btn-text">Rejected</span>'
      : '<span class="btn-icon">✕</span><span class="btn-text">Reject Payment</span>';
  }

  if (resetBtn) {
    resetBtn.disabled = isPending;
    resetBtn.innerHTML = '<span class="btn-icon">↺</span><span class="btn-text">Reset to Pending</span>';
  }

  if (!detailsDialog.open) detailsDialog.showModal();
}

// Copy Team Dossier to clipboard
function copyTeamSummary() {
  const item = state.selectedRegistration;
  if (!item) return;

  const lines = [
    `=== ODYSSEY 2026 REGISTRATION DOSSIER ===`,
    `Reg ID: ${item.regId}`,
    `Team: ${item.teamName}`,
    `College: ${item.institution}`,
    `Status: ${PAYMENT_STATUS_LABELS[item.paymentStatus] || item.paymentStatus}`,
    `Accommodation: ${item.accommodation}`,
    `Registered: ${formatDisplayDate(item.registeredAt)}`,
    ``,
    `TEAM LEADER:`,
    `Name: ${item.leaderName}`,
    `Phone: ${item.leaderPhone}`,
    `Email: ${item.leaderEmail}`,
    ``,
    `MEMBERS (${(item.members || []).length}):`,
    ...(item.members || []).map((m, idx) => `Slot ${m.memberSlot || idx + 2}: ${m.name} | ${m.phone} | ${m.email}`),
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    showToast('Team dossier copied to clipboard!');
  }).catch(() => {
    showToast('Unable to copy to clipboard', 'error');
  });
}

// Update payment status via API
async function updatePaymentStatus(id, status) {
  try {
    const response = await fetch(`/api/admin/registrations/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to update payment status');

    const target = state.registrations.find(r => r._id === id);
    if (target) {
      target.paymentStatus = status;
      target.status = status;
    }

    if (state.selectedRegistration && state.selectedRegistration._id === id) {
      renderDetails(target);
    }

    updateKpiCards();
    applyFilters();
    showToast(`Payment marked as ${PAYMENT_STATUS_LABELS[status] || status}`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete registration via API
async function deleteRegistration(id) {
  if (!confirm('Are you sure you want to permanently delete this registration? This action cannot be undone.')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/registrations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to delete registration');

    state.registrations = state.registrations.filter(r => r._id !== id);
    detailsDialog.close();
    updateKpiCards();
    applyFilters();
    showToast('Registration deleted successfully');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Export full CSV
function exportCsv() {
  if (!state.filtered.length) {
    showToast('No registrations match current filter to export', 'error');
    return;
  }

  const columns = [
    ['Registration ID', item => item.regId],
    ['Team Name', item => item.teamName],
    ['Leader Name', item => item.leaderName],
    ['Leader Phone', item => item.leaderPhone],
    ['Leader Email', item => item.leaderEmail],
    ['College', item => item.institution],
    ['Accommodation', item => item.accommodation],
    ['Payment Status', item => PAYMENT_STATUS_LABELS[item.paymentStatus] || item.paymentStatus],
    ['Registered At', item => item.registeredAt],
    ['Team Size', item => item.teamSize],
    ...Array.from({ length: 4 }, (_, index) => [
      ['Member ' + (index + 1) + ' Name', item => item.members?.[index]?.name || ''],
      ['Member ' + (index + 1) + ' Email', item => item.members?.[index]?.email || ''],
      ['Member ' + (index + 1) + ' Phone', item => item.members?.[index]?.phone || ''],
    ]).flat(),
  ];

  const csvValue = (value) => {
    const str = String(value ?? '');
    return `"${str.replaceAll('"', '""').replace(/\r?\n/g, ' ')}"`;
  };

  const rows = [
    columns.map(([label]) => csvValue(label)),
    ...state.filtered.map(item => columns.map(([, getValue]) => csvValue(getValue(item)))),
  ];

  const csv = rows.map(row => row.join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `odyssey-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${state.filtered.length} registrations to CSV`);
}

/* ==========================================================================
   SMART CSV IMPORTER
   ========================================================================== */

function parseCsvText(text) {
  const lines = text.split(/\r\n|\n|\r/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Parse CSV line handling quotes
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rawHeaders = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const parsedRows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every(v => !v)) continue;

    const rowObj = {};
    rawHeaders.forEach((header, idx) => {
      rowObj[header] = values[idx] || '';
    });

    // Smart Column Matchers
    const teamName = rowObj.teamname || rowObj.team || rowObj.squad || rowObj.groupname || `Imported Team ${i}`;
    const leaderName = rowObj.leadername || rowObj.leader || rowObj.captain || rowObj.fullname || rowObj.name || '';
    const leaderPhone = rowObj.leaderphone || rowObj.phone || rowObj.mobile || rowObj.contact || '';
    const leaderEmail = rowObj.leaderemail || rowObj.email || rowObj.mail || '';
    const institution = rowObj.institution || rowObj.college || rowObj.university || rowObj.institute || '';
    const accommodation = (rowObj.accommodation || rowObj.stay || rowObj.hostel || 'No').toLowerCase().includes('yes') ? 'Yes' : 'No';
    const regId = rowObj.regid || rowObj.id || '';

    // Members extraction (up to 4 members)
    const members = [];
    for (let m = 1; m <= 4; m++) {
      const mName = rowObj[`member${m}name`] || rowObj[`member${m}`] || rowObj[`m${m}name`];
      const mEmail = rowObj[`member${m}email`] || rowObj[`m${m}email`];
      const mPhone = rowObj[`member${m}phone`] || rowObj[`m${m}phone`];
      if (mName || mEmail || mPhone) {
        members.push({
          memberSlot: m + 1,
          name: mName || `Member ${m}`,
          email: mEmail || '',
          phone: mPhone || '',
        });
      }
    }

    if (leaderName || teamName) {
      parsedRows.push({
        teamName,
        leaderName,
        leaderPhone,
        leaderEmail,
        institution,
        accommodation,
        regId,
        members,
        teamSize: members.length + 1,
        paymentStatus: 'pending_verification',
      });
    }
  }

  return parsedRows;
}

function handleParsedData(rows) {
  state.parsedImportRows = rows;
  if (rows.length === 0) {
    importStatusMsg.className = 'import-status-msg form-error';
    importStatusMsg.textContent = 'No valid rows found. Check your CSV headers (e.g., Team Name, Leader Name, Phone, Email, College).';
    importStatusMsg.hidden = false;
    importPreviewWrapper.hidden = true;
    confirmImportBtn.disabled = true;
    return;
  }

  importStatusMsg.className = 'import-status-msg';
  importStatusMsg.style.color = '#34d399';
  importStatusMsg.textContent = `Successfully parsed ${rows.length} registration entries ready for database import.`;
  importStatusMsg.hidden = false;

  previewCount.textContent = rows.length;
  previewBody.innerHTML = rows.slice(0, 10).map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="font-weight:600; color:#fff;">${escapeHtml(r.teamName)}</td>
      <td>${escapeHtml(r.leaderName)}</td>
      <td>${escapeHtml(r.leaderEmail)}</td>
      <td>${escapeHtml(r.leaderPhone)}</td>
      <td>${escapeHtml(r.institution)}</td>
      <td>${r.members.length + 1}</td>
      <td>${r.accommodation}</td>
    </tr>
  `).join('');

  importPreviewWrapper.hidden = false;
  confirmImportBtn.disabled = false;
  confirmImportBtn.querySelector('span').textContent = `Import ${rows.length} Registrations into Database`;
}

// Download Sample Template CSV
function downloadSampleCsv() {
  const headers = [
    'Team Name',
    'Leader Name',
    'Leader Email',
    'Leader Phone',
    'College',
    'Accommodation',
    'Member 1 Name',
    'Member 1 Email',
    'Member 1 Phone',
    'Member 2 Name',
    'Member 2 Email',
    'Member 2 Phone',
  ];

  const sampleRows = [
    [
      'Cyber Titans',
      'Aarav Sharma',
      'aarav.sharma@example.com',
      '9876543210',
      'BCET Balasore',
      'Yes',
      'Priya Patel',
      'priya.p@example.com',
      '9876543211',
      'Rohan Das',
      'rohan.d@example.com',
      '9876543212',
    ],
    [
      'Code Alchemists',
      'Ananya Sen',
      'ananya.sen@example.com',
      '9123456780',
      'NIT Rourkela',
      'No',
      'Vikram Rao',
      'vikram.r@example.com',
      '9123456781',
      '',
      '',
      '',
    ],
  ];

  const csv = [
    headers.join(','),
    ...sampleRows.map(r => r.map(v => `"${v}"`).join(',')),
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'odyssey-registration-sample-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// Batch Import via API
async function executeBatchImport() {
  if (state.parsedImportRows.length === 0) return;
  confirmImportBtn.disabled = true;
  confirmImportBtn.querySelector('span').textContent = 'Importing...';

  try {
    const response = await fetch('/api/admin/registrations/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ items: state.parsedImportRows }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Import failed');

    importDialog.close();
    showToast(`🎉 ${result.count} registrations successfully imported into database!`);
    await loadRegistrations();
  } catch (err) {
    importStatusMsg.className = 'import-status-msg form-error';
    importStatusMsg.textContent = err.message;
    confirmImportBtn.disabled = false;
    confirmImportBtn.querySelector('span').textContent = 'Retry Import';
  }
}

// Load registrations from server
async function loadRegistrations() {
  loadingState.hidden = false;
  loadingState.style.display = 'flex';
  emptyState.hidden = true;
  emptyState.style.display = 'none';
  loadError.textContent = '';
  try {
    const response = await fetch('/api/admin/registrations', { credentials: 'same-origin' });
    if (response.status === 401) {
      window.location.replace('/admin/login');
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to load registrations');

    state.registrations = (result.registrations || []).map(normaliseRegistration);
    updateKpiCards();
    applyFilters();
  } catch (err) {
    loadingState.hidden = true;
    loadingState.style.display = 'none';
    loadError.textContent = err.message;
    showToast(err.message, 'error');
  }
}

/* ==========================================================================
   EVENT LISTENERS
   ========================================================================== */

// Search and Filter Events
searchInput.addEventListener('input', applyFilters);
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  applyFilters();
});
accommodationFilter.addEventListener('change', applyFilters);

// Status Tab buttons
statusTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    statusTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeStatusTab = tab.dataset.status;
    applyFilters();
  });
});

// KPI Card Clicks (Filter shortcuts)
document.querySelectorAll('.kpi-card[data-kpi-filter]').forEach(card => {
  card.addEventListener('click', () => {
    const filter = card.dataset.kpiFilter;
    if (filter === 'accommodation') {
      accommodationFilter.value = 'Yes';
      state.activeStatusTab = '';
    } else {
      accommodationFilter.value = '';
      state.activeStatusTab = filter;
    }
    statusTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.status === state.activeStatusTab);
    });
    applyFilters();
  });
});

// Reset Filters
resetFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  state.activeStatusTab = '';
  accommodationFilter.value = '';
  statusTabs.forEach(t => t.classList.toggle('active', t.dataset.status === ''));
  applyFilters();
});

// Table Sorting
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortDirection = 'asc';
    }
    document.querySelectorAll('th[data-sort]').forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
    th.classList.add(state.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
    applyFilters();
  });
});

// Table Row Actions (Delegate)
body.addEventListener('click', (e) => {
  const copyEl = e.target.closest('.copy-trigger');
  if (copyEl && copyEl.dataset.copy) {
    navigator.clipboard.writeText(copyEl.dataset.copy).then(() => {
      showToast(`Copied ${copyEl.dataset.copy} to clipboard!`);
    });
    return;
  }

  const viewBtn = e.target.closest('[data-view-index]');
  if (viewBtn) {
    const item = state.filtered[Number(viewBtn.dataset.viewIndex)];
    if (item) renderDetails(item);
    return;
  }

  const quickVerify = e.target.closest('[data-quick-verify]');
  if (quickVerify) {
    updatePaymentStatus(quickVerify.dataset.quickVerify, 'verified');
    return;
  }

  const quickSelect = e.target.closest('[data-quick-select]');
  if (quickSelect) {
    updatePaymentStatus(quickSelect.dataset.quickSelect, 'selected');
    return;
  }

  const quickUnselect = e.target.closest('[data-quick-unselect]');
  if (quickUnselect) {
    updatePaymentStatus(quickUnselect.dataset.quickUnselect, 'verified');
    return;
  }

  const quickReject = e.target.closest('[data-quick-reject]');
  if (quickReject) {
    updatePaymentStatus(quickReject.dataset.quickReject, 'rejected');
    return;
  }
});

// Modal Actions
closeDialogBtn.addEventListener('click', () => detailsDialog.close());
verifyBtn.addEventListener('click', () => {
  if (!state.selectedRegistration) return;
  const current = state.selectedRegistration.paymentStatus;
  // If already verified or selected, do nothing - do NOT downgrade selected status!
  if (current === 'verified' || current === 'selected') return;
  updatePaymentStatus(state.selectedRegistration._id, 'verified');
});
selectBtn?.addEventListener('click', () => {
  if (!state.selectedRegistration) return;
  // Toggle: if already selected, clicking unselects back to verified; otherwise selects team
  const current = state.selectedRegistration.paymentStatus;
  const targetStatus = current === 'selected' ? 'verified' : 'selected';
  updatePaymentStatus(state.selectedRegistration._id, targetStatus);
});
rejectBtn.addEventListener('click', () => {
  if (state.selectedRegistration) updatePaymentStatus(state.selectedRegistration._id, 'rejected');
});
resetBtn.addEventListener('click', () => {
  if (state.selectedRegistration) updatePaymentStatus(state.selectedRegistration._id, 'pending_verification');
});
deleteBtn.addEventListener('click', () => {
  if (state.selectedRegistration) deleteRegistration(state.selectedRegistration._id);
});
copyTeamSummaryBtn.addEventListener('click', copyTeamSummary);

// Lightbox for payment slip
viewFullSlipBtn.addEventListener('click', () => {
  if (state.selectedRegistration?.paymentSlip?.dataUrl) {
    lightboxImg.src = state.selectedRegistration.paymentSlip.dataUrl;
    lightboxDownloadLink.href = state.selectedRegistration.paymentSlip.dataUrl;
    lightboxDialog.showModal();
  }
});
closeLightboxBtn.addEventListener('click', () => lightboxDialog.close());

// Smart Import Dialog (if present)
if (openImportBtn && importDialog) {
  openImportBtn.addEventListener('click', () => {
    state.parsedImportRows = [];
    if (importStatusMsg) importStatusMsg.hidden = true;
    if (importPreviewWrapper) importPreviewWrapper.hidden = true;
    if (confirmImportBtn) {
      confirmImportBtn.disabled = true;
      confirmImportBtn.querySelector('span').textContent = 'Import into Database';
    }
    if (csvFileInput) csvFileInput.value = '';
    if (csvPasteInput) csvPasteInput.value = '';
    importDialog.showModal();
  });
  if (closeImportBtn) closeImportBtn.addEventListener('click', () => importDialog.close());
  if (cancelImportBtn) cancelImportBtn.addEventListener('click', () => importDialog.close());
  if (confirmImportBtn) confirmImportBtn.addEventListener('click', executeBatchImport);
  if (downloadSampleCsvBtn) downloadSampleCsvBtn.addEventListener('click', downloadSampleCsv);

  if (tabFileUpload && tabPasteCsv && fileUploadSection && pasteSection) {
    tabFileUpload.addEventListener('click', () => {
      tabFileUpload.classList.add('active');
      tabPasteCsv.classList.remove('active');
      fileUploadSection.hidden = false;
      pasteSection.hidden = true;
    });
    tabPasteCsv.addEventListener('click', () => {
      tabPasteCsv.classList.add('active');
      tabFileUpload.classList.remove('active');
      fileUploadSection.hidden = true;
      pasteSection.hidden = false;
    });
  }

  if (browseFileBtn && csvFileInput) {
    browseFileBtn.addEventListener('click', () => csvFileInput.click());
  }
  if (dropZone && csvFileInput) {
    dropZone.addEventListener('click', () => csvFileInput.click());
    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });
    dropZone.addEventListener('drop', (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) handleCsvFile(file);
    });
    csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleCsvFile(file);
    });
  }

  if (parsePastedBtn && csvPasteInput) {
    parsePastedBtn.addEventListener('click', () => {
      const text = csvPasteInput.value.trim();
      if (!text) {
        showToast('Please paste CSV or JSON content first', 'error');
        return;
      }
      if (text.startsWith('[') && text.endsWith(']')) {
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            handleParsedData(json.map(item => ({
              teamName: item.teamName || item.team || '',
              leaderName: item.leaderName || item.name || '',
              leaderPhone: item.leaderPhone || item.phone || '',
              leaderEmail: item.leaderEmail || item.email || '',
              institution: item.institution || item.college || '',
              accommodation: item.accommodation || 'No',
              members: Array.isArray(item.members) ? item.members : [],
              teamSize: item.teamSize || (item.members?.length ? item.members.length + 1 : 1),
              paymentStatus: item.paymentStatus || 'pending_verification',
            })));
            return;
          }
        } catch {
          // Fallback to CSV
        }
      }
      const rows = parseCsvText(text);
      handleParsedData(rows);
    });
  }
}

// Refresh & Export & Logout
refreshBtn.addEventListener('click', async () => {
  refreshBtn.classList.add('rotating');
  await loadRegistrations();
  setTimeout(() => refreshBtn.classList.remove('rotating'), 600);
  showToast('Database refreshed successfully');
});

exportBtn.addEventListener('click', exportCsv);

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/admin/login');
});

// Initial Load
loadRegistrations();
