const state = { registrations: [], filtered: [], sortKey: 'registeredAt', sortDirection: 'desc' };
const body = document.getElementById('registrations-body');
const search = document.getElementById('search');
const paymentFilter = document.getElementById('payment-filter');
const accommodationFilter = document.getElementById('accommodation-filter');
const count = document.getElementById('result-count');
const empty = document.getElementById('empty-state');
const loadError = document.getElementById('load-error');
const detailsDialog = document.getElementById('details-dialog');
const detailsContent = document.getElementById('details-content');
const verifyButton = document.getElementById('verify-payment');
const rejectButton = document.getElementById('reject-payment');
let selectedRegistration = null;

const PAYMENT_STATUS_LABELS = {
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

function normaliseRegistration(item) {
  const paymentStatus = item.status || 'pending_verification';
  return { ...item, paymentStatus };
}

function readableStatus(status) {
  return PAYMENT_STATUS_LABELS[status] || status;
}

function populateFilters() {
  const values = (key) => [...new Set(state.registrations.map(item => item[key]).filter(Boolean))].sort();
  for (const [select, key] of [[paymentFilter, 'paymentStatus'], [accommodationFilter, 'accommodation']]) {
    select.innerHTML = `<option value="">${key === 'paymentStatus' ? 'All statuses' : 'All options'}</option>${values(key).map(value => `<option value="${escapeHtml(value)}">${escapeHtml(key === 'paymentStatus' ? readableStatus(value) : value)}</option>`).join('')}`;
  }
}

function applyFilters() {
  const term = search.value.trim().toLowerCase();
  state.filtered = state.registrations.filter((item) => {
    const searchable = [item.leaderName, item.leaderEmail, item.teamName, item.institution].join(' ').toLowerCase();
    return (!term || searchable.includes(term))
      && (!paymentFilter.value || item.paymentStatus === paymentFilter.value)
      && (!accommodationFilter.value || item.accommodation === accommodationFilter.value);
  });
  state.filtered.sort((a, b) => {
    const left = displayValue(a[state.sortKey]).toLowerCase();
    const right = displayValue(b[state.sortKey]).toLowerCase();
    return left.localeCompare(right, undefined, { numeric: true }) * (state.sortDirection === 'asc' ? 1 : -1);
  });
  renderTable();
}

function renderTable() {
  body.innerHTML = state.filtered.map((item, index) => `
    <tr>
      <td>${escapeHtml(item.leaderName)}</td>
      <td>${escapeHtml(item.leaderEmail)}</td>
      <td>${escapeHtml(item.teamName)}</td>
      <td>${escapeHtml(item.institution)}</td>
      <td><span class="status-badge">${escapeHtml(readableStatus(item.paymentStatus))}</span></td>
      <td>${escapeHtml(item.accommodation)}</td>
      <td>${escapeHtml(item.registeredAt ? new Date(item.registeredAt).toLocaleString() : '—')}</td>
      <td><button class="details-button" data-index="${index}">View</button></td>
    </tr>`).join('');
  count.textContent = `${state.filtered.length} of ${state.registrations.length} registrations`;
  empty.hidden = state.filtered.length > 0;
}

function renderDetails(item) {
  selectedRegistration = item;
  detailsContent.innerHTML = Object.entries(item)
    .filter(([key]) => key !== 'paymentStatus' && (key !== 'paymentSlip' || item.paymentSlip))
    .map(([key, value]) => {
      if (key === 'paymentSlip' && value?.dataUrl) {
        return `<div class="detail-row"><strong>Payment proof</strong><span><img class="payment-proof" src="${escapeHtml(value.dataUrl)}" alt="Uploaded payment proof"><a href="${escapeHtml(value.dataUrl)}" target="_blank" rel="noopener">Open full image</a></span></div>`;
      }
      if (key === 'status') return `<div class="detail-row"><strong>Payment status</strong><span>${escapeHtml(readableStatus(value))}</span></div>`;
      return `<div class="detail-row"><strong>${escapeHtml(key)}</strong><span>${escapeHtml(displayValue(value))}</span></div>`;
    }).join('');
  const hasPendingPayment = item.paymentStatus === 'pending_verification';
  verifyButton.disabled = !hasPendingPayment;
  rejectButton.disabled = !hasPendingPayment;
  if (!detailsDialog.open) detailsDialog.showModal();
}

function csvValue(value) {
  const text = displayValue(value);
  return `"${text.replaceAll('"', '""').replace(/\r?\n/g, ' ')}"`;
}

function readableFieldName(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
}

function exportCsv() {
  if (!state.filtered.length) return;
  const columns = [
    ['Registration ID', item => item._id],
    ['Team Name', item => item.teamName],
    ['Leader Name', item => item.leaderName],
    ['Leader Phone', item => item.leaderPhone],
    ['Leader Email', item => item.leaderEmail],
    ['College', item => item.institution],
    ['Accommodation', item => item.accommodation],
    ['Payment Status', item => readableStatus(item.paymentStatus)],
    ['Registered At', item => item.registeredAt],
    ...Array.from({ length: 4 }, (_, index) => [
      ['Member ' + (index + 1) + ' Name', item => item.members?.[index]?.name],
      ['Member ' + (index + 1) + ' Email', item => item.members?.[index]?.email],
      ['Member ' + (index + 1) + ' Phone', item => item.members?.[index]?.phone],
    ]).flat(),
  ];
  const reservedKeys = new Set([
    '_id', 'teamName', 'leaderName', 'leaderPhone', 'leaderEmail',
    'institution', 'accommodation', 'status', 'paymentStatus',
    'registeredAt', 'members', 'paymentSlip',
  ]);
  const extraKeys = [...new Set(state.filtered.flatMap(item => Object.keys(item)))]
    .filter(key => !reservedKeys.has(key));
  columns.push(...extraKeys.map(key => [readableFieldName(key), item => item[key]]));
  const rows = [
    columns.map(([label]) => csvValue(label)),
    ...state.filtered.map(item => columns.map(([, getValue]) => csvValue(getValue(item)))),
  ];
  const csv = rows.map(row => row.join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `odyssey-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function updatePaymentStatus(status) {
  if (!selectedRegistration?._id) return;
  verifyButton.disabled = true;
  rejectButton.disabled = true;
  try {
    const response = await fetch(`/api/admin/registrations/${encodeURIComponent(selectedRegistration._id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to update payment status');
    selectedRegistration.status = result.status;
    selectedRegistration.paymentStatus = result.status;
    applyFilters();
    renderDetails(selectedRegistration);
  } catch (err) {
    loadError.textContent = err.message;
    verifyButton.disabled = false;
    rejectButton.disabled = false;
  }
}

async function loadRegistrations() {
  try {
    const response = await fetch('/api/admin/registrations', { credentials: 'same-origin' });
    if (response.status === 401) {
      window.location.replace('/admin/login.html');
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to load registrations');
    state.registrations = result.registrations.map(normaliseRegistration);
    populateFilters();
    applyFilters();
  } catch (err) {
    loadError.textContent = err.message;
  }
}

search.addEventListener('input', applyFilters);
paymentFilter.addEventListener('change', applyFilters);
accommodationFilter.addEventListener('change', applyFilters);
document.getElementById('export-button').addEventListener('click', exportCsv);
document.getElementById('close-dialog').addEventListener('click', () => detailsDialog.close());
verifyButton.addEventListener('click', () => updatePaymentStatus('verified'));
rejectButton.addEventListener('click', () => updatePaymentStatus('rejected'));
body.addEventListener('click', (event) => {
  const button = event.target.closest('[data-index]');
  if (button) renderDetails(state.filtered[Number(button.dataset.index)]);
});
document.querySelectorAll('th[data-sort]').forEach((header) => {
  header.addEventListener('click', () => {
    const key = header.dataset.sort;
    state.sortDirection = state.sortKey === key && state.sortDirection === 'asc' ? 'desc' : 'asc';
    state.sortKey = key;
    applyFilters();
  });
});
document.getElementById('logout-button').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/admin/login.html');
});

loadRegistrations();
