/**
 * ระบบบริหารการจองพันธุ์ปลาและคิวจัดส่ง - ฟาร์มปลาผู้ใหญ่พร
 * Core Application Logic (app.js)
 */

// Application State
const state = {
  currentUser: DEFAULT_USERS[0], // ค่าเริ่มต้น: ผู้ใหญ่พร (CEO)
  users: DEFAULT_USERS,
  customers: [],
  orders: [],
  claims: [],
  activeTab: 'calendar',
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(), // 0-indexed
  selectedDate: getTodayString(),
  isServerOnline: false,
  permissions: null, // Will be initialized by loadLocalState()
  drivers: [] // List of active delivery drivers
};

// ====================================================================
// INITIALIZATION
// ====================================================================
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();
  await checkServerSync();
  renderUserBadge();
  setupRoleButtons();
  setupEventListeners();
  
  // Set date pickers default to today
  const todayStr = getTodayString();
  const dailyPicker = document.getElementById('daily-date-picker');
  if (dailyPicker) dailyPicker.value = todayStr;
  
  const orderDateInput = document.getElementById('order-delivery-date');
  if (orderDateInput) orderDateInput.value = todayStr;

  // Initial tab render
  switchTab(state.activeTab);
  updateBadges();
  lucide.createIcons();
});

// Helper: Format Date YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Thai Date Formatter
function formatThaiDate(dateStr, includeTime = false) {
  if (!dateStr) return '-';
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const parts = dateStr.split(' ');
  const dateParts = parts[0].split('-');
  if (dateParts.length !== 3) return dateStr;

  const year = parseInt(dateParts[0], 10) + 543;
  const month = thaiMonths[parseInt(dateParts[1], 10) - 1];
  const day = parseInt(dateParts[2], 10);

  let result = `${day} ${month} ${year}`;
  if (includeTime && parts[1]) {
    result += ` (${parts[1]} น.)`;
  }
  return result;
}

// Helper: Thai Full Month & Year
function formatThaiMonthYear(year, monthIndex) {
  const thaiFullMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return `${thaiFullMonths[monthIndex]} ${year + 543}`;
}

// Currency Formatter
function formatMoney(amount) {
  return '฿' + Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Number Formatter
function formatNumber(num) {
  return Number(num || 0).toLocaleString('th-TH');
}

// ====================================================================
// PERSISTENCE & STORAGE (Local & Server Sync)
// ====================================================================
function loadLocalState() {
  try {
    const savedCustomers = localStorage.getItem('phuyaiporn_customers');
    const savedOrders = localStorage.getItem('phuyaiporn_orders');
    const savedClaims = localStorage.getItem('phuyaiporn_claims');
    const savedUser = localStorage.getItem('phuyaiporn_current_user');
    const savedPerms = localStorage.getItem('phuyaiporn_permissions');
    const savedDrivers = localStorage.getItem('phuyaiporn_drivers');

    state.customers = savedCustomers ? JSON.parse(savedCustomers) : INITIAL_CUSTOMERS;
    state.orders = savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS;
    state.claims = savedClaims ? JSON.parse(savedClaims) : INITIAL_CLAIMS;
    state.permissions = savedPerms ? JSON.parse(savedPerms) : getDefaultPermissions();
    state.drivers = savedDrivers ? JSON.parse(savedDrivers) : getDefaultDrivers();

    if (savedUser) {
      const found = DEFAULT_USERS.find(u => u.id === savedUser);
      if (found) state.currentUser = found;
    }
  } catch (err) {
    console.warn('Using default seed data due to storage error:', err);
    state.customers = INITIAL_CUSTOMERS;
    state.orders = INITIAL_ORDERS;
    state.claims = INITIAL_CLAIMS;
    state.permissions = getDefaultPermissions();
    state.drivers = getDefaultDrivers();
  }
}

function saveState() {
  try {
    localStorage.setItem('phuyaiporn_customers', JSON.stringify(state.customers));
    localStorage.setItem('phuyaiporn_orders', JSON.stringify(state.orders));
    localStorage.setItem('phuyaiporn_claims', JSON.stringify(state.claims));
    localStorage.setItem('phuyaiporn_current_user', state.currentUser.id);
    if (state.permissions) {
      localStorage.setItem('phuyaiporn_permissions', JSON.stringify(state.permissions));
    }
    if (state.drivers) {
      localStorage.setItem('phuyaiporn_drivers', JSON.stringify(state.drivers));
    }
  } catch (err) {
    console.error('LocalStorage save error:', err);
  }

  // If server is available, sync in background
  if (state.isServerOnline) {
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customers: state.customers,
        orders: state.orders,
        claims: state.claims,
        drivers: state.drivers,
        permissions: state.permissions
      })
    }).catch(e => console.warn('Server sync error:', e));
  }

  updateBadges();
}

async function checkServerSync() {
  const syncBadge = document.getElementById('cloud-sync-indicator');
  const syncText = document.getElementById('cloud-sync-text');

  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const json = await res.json();
      state.isServerOnline = true;
      if (syncBadge && syncText) {
        syncBadge.className = 'hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
        syncText.textContent = 'คลาวด์ออนไลน์';
      }
      if (json.success && json.data) {
        if (json.data.orders && json.data.orders.length > 0) {
          state.orders = json.data.orders;
          localStorage.setItem('phuyaiporn_orders', JSON.stringify(state.orders));
        }
        if (json.data.customers && json.data.customers.length > 0) {
          state.customers = json.data.customers;
          localStorage.setItem('phuyaiporn_customers', JSON.stringify(state.customers));
        }
        if (json.data.claims && json.data.claims.length > 0) {
          state.claims = json.data.claims;
          localStorage.setItem('phuyaiporn_claims', JSON.stringify(state.claims));
        }
        if (json.data.drivers && json.data.drivers.length > 0) {
          state.drivers = json.data.drivers;
          localStorage.setItem('phuyaiporn_drivers', JSON.stringify(state.drivers));
        }
        if (json.data.permissions) {
          state.permissions = json.data.permissions;
          localStorage.setItem('phuyaiporn_permissions', JSON.stringify(state.permissions));
        }
      }
    } else {
      state.isServerOnline = false;
      if (syncBadge && syncText) {
        syncBadge.className = 'hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200';
        syncText.textContent = 'โหมดออฟไลน์';
      }
    }
  } catch (e) {
    // Running offline / client mode without server
    state.isServerOnline = false;
    if (syncBadge && syncText) {
      syncBadge.className = 'hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200';
      syncText.textContent = 'โหมดออฟไลน์';
    }
  }
}

// Update Header Notification Badges
function updateBadges() {
  const todayStr = getTodayString();
  const todayOrders = state.orders.filter(o => o.deliveryDate === todayStr);
  const todayCountBadge = document.getElementById('badge-today-count');
  if (todayCountBadge) todayCountBadge.textContent = todayOrders.length;

  const claimsCountBadge = document.getElementById('badge-claims-count');
  if (claimsCountBadge) claimsCountBadge.textContent = state.claims.length;
}

// ====================================================================
// AUTHENTICATION & ROLE MANAGEMENT
// ====================================================================
function renderUserBadge() {
  const avatarEl = document.getElementById('current-user-avatar');
  const nameEl = document.getElementById('current-user-name');
  const badgeEl = document.getElementById('current-user-badge');

  if (avatarEl) avatarEl.textContent = state.currentUser.avatar;
  if (nameEl) nameEl.textContent = state.currentUser.name;
  if (badgeEl) {
    badgeEl.textContent = state.currentUser.role;
    badgeEl.className = `badge-tag text-[10px] py-0 px-2 ${state.currentUser.badgeColor}`;
  }

  // Show/Hide Tabs based on Role:
  // สำหรับคนขับรถ (Driver): เห็นแค่ "คิวจัดส่งประจำวัน" และ "แจ้งเคลม & ปลาเสียหาย"
  const isDriver = state.currentUser.role === 'Driver';
  const isCeo = state.currentUser.role === 'CEO';

  const tabCalendar = document.getElementById('tab-btn-calendar');
  const tabOrders = document.getElementById('tab-btn-orders');
  const tabCustomers = document.getElementById('tab-btn-customers');
  const tabAnalytics = document.getElementById('tab-btn-analytics');
  const permBtn = document.getElementById('tab-btn-permissions');

  if (tabCalendar) tabCalendar.style.display = isDriver ? 'none' : '';
  if (tabOrders) tabOrders.style.display = isDriver ? 'none' : '';
  if (tabCustomers) tabCustomers.style.display = isDriver ? 'none' : '';
  if (tabAnalytics) tabAnalytics.style.display = isDriver ? 'none' : '';

  // Show/Hide CEO Permissions Tab Button (เฉพาะ CEO เท่านั้นที่เห็น)
  if (permBtn) {
    if (isCeo) {
      permBtn.classList.remove('hidden');
    } else {
      permBtn.classList.add('hidden');
      if (state.activeTab === 'permissions') {
        switchTab('calendar');
      }
    }
  }

  // ถ้าคนขับรถกำลังอยู่ในแท็บที่ถูกซ่อน ให้สลับไปที่ daily ทันที
  if (isDriver && !['daily', 'claims'].includes(state.activeTab)) {
    switchTab('daily');
  }

  // ซ่อนปุ่มเพิ่มคนขับในหน้าคิวประจำวันสำหรับบทบาทคนขับรถ
  const addDriverBtn = document.getElementById('btn-daily-add-driver');
  if (addDriverBtn) {
    addDriverBtn.style.display = isDriver ? 'none' : '';
  }

  // Update top new order button visibility based on permission / role
  const topNewOrderBtn = document.getElementById('btn-top-new-order');
  if (topNewOrderBtn) {
    topNewOrderBtn.style.display = (!isDriver && canCurrentUser('create_order')) ? '' : 'none';
  }
}

function setupRoleButtons() {
  const container = document.getElementById('quick-role-buttons');
  if (!container) return;
  container.innerHTML = '';

  DEFAULT_USERS.forEach(user => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `p-3 rounded-xl border text-left flex items-center space-x-2.5 transition ${
      state.currentUser.id === user.id ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
    }`;
    btn.onclick = () => switchUserRole(user.id);

    btn.innerHTML = `
      <span class="text-2xl">${user.avatar}</span>
      <div class="overflow-hidden">
        <div class="text-xs font-bold text-slate-800 truncate">${user.roleLabel}</div>
        <div class="text-[11px] text-slate-500 truncate">${user.email}</div>
      </div>
    `;
    container.appendChild(btn);
  });
}

function switchUserRole(userId) {
  const user = DEFAULT_USERS.find(u => u.id === userId);
  if (user) {
    state.currentUser = user;
    saveState();
    renderUserBadge();
    setupRoleButtons();
    closeModal('modal-login');
    showNotification(`สลับเป็นบทบาท: ${user.roleLabel} เรียบร้อยแล้ว`, 'success');

    // If driver, switch directly to daily queue tab for convenience
    if (user.role === 'Driver') {
      switchTab('daily');
    } else if (user.role === 'QC') {
      switchTab('claims');
    } else {
      // Re-render active tab with updated permissions
      switchTab(state.activeTab);
    }
  }
}

function handleEmailLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value.trim();
  const errEl = document.getElementById('login-error-msg');

  const user = DEFAULT_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
  if (user) {
    errEl.classList.add('hidden');
    switchUserRole(user.id);
  } else {
    errEl.classList.remove('hidden');
  }
}

function openLoginModal() {
  openModal('modal-login');
}

// ====================================================================
// TAB NAVIGATION
// ====================================================================
function switchTab(tabId) {
  // Guard: เฉพาะ CEO เท่านั้นที่เข้าถึงแท็บ permissions ได้
  if (tabId === 'permissions' && state.currentUser.role !== 'CEO') {
    showNotification('สิทธิ์เฉพาะ CEO / เจ้าของฟาร์มเท่านั้น', 'error');
    tabId = 'calendar';
  }

  state.activeTab = tabId;

  // Update tab buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.remove('bg-sky-600', 'text-white', 'shadow-sm', 'bg-amber-600');
    btn.classList.add('text-slate-600', 'hover:bg-sky-50');
  });

  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) {
    if (tabId === 'permissions') {
      activeBtn.classList.add('bg-amber-600', 'text-white', 'shadow-sm');
    } else {
      activeBtn.classList.add('bg-sky-600', 'text-white', 'shadow-sm');
    }
    activeBtn.classList.remove('text-slate-600', 'hover:bg-sky-50');
  }

  // Update tab content
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.add('hidden');
  });

  const activePane = document.getElementById(`tab-${tabId}`);
  if (activePane) {
    activePane.classList.remove('hidden');
  }

  // Re-render corresponding view
  if (tabId === 'calendar') renderMonthlyCalendar();
  if (tabId === 'daily') renderDailyQueue();
  if (tabId === 'orders') renderOrdersList();
  if (tabId === 'claims') renderClaimsList();
  if (tabId === 'customers') renderCustomersList();
  if (tabId === 'analytics') {
    initAnalyticsFilters();
    renderAnalyticsDashboard();
  }
  if (tabId === 'permissions') {
    renderPermissionsTable();
    renderDriversList();
  }

  lucide.createIcons();
}

// ====================================================================
// 1. MONTHLY CALENDAR VIEW (ปฏิทินคิวงานทั้งเดือน)
// ====================================================================
function changeMonth(delta) {
  state.currentMonth += delta;
  if (state.currentMonth < 0) {
    state.currentMonth = 11;
    state.currentYear -= 1;
  } else if (state.currentMonth > 11) {
    state.currentMonth = 0;
    state.currentYear += 1;
  }
  renderMonthlyCalendar();
}

function renderMonthlyCalendar() {
  const monthLabel = document.getElementById('calendar-month-label');
  if (monthLabel) {
    monthLabel.textContent = formatThaiMonthYear(state.currentYear, state.currentMonth);
  }

  const grid = document.getElementById('calendar-days-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
  const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(state.currentYear, state.currentMonth, 0).getDate();
  const todayStr = getTodayString();

  // Monthly stats counters
  let monthDeliveries = 0;
  let monthPickups = 0;
  let monthDelivered = 0;
  let monthProblems = 0;

  // Leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell p-2 text-slate-300 bg-slate-50/60 select-none';
    cell.innerHTML = `<span class="text-xs font-semibold">${dayNum}</span>`;
    grid.appendChild(cell);
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(state.currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${state.currentYear}-${monthStr}-${dayStr}`;

    const dayOrders = state.orders.filter(o => o.deliveryDate === dateKey);
    const isToday = dateKey === todayStr;
    const isSelected = dateKey === state.selectedDate;

    // Count monthly stats
    dayOrders.forEach(ord => {
      if (ord.deliveryType === 'delivery') monthDeliveries++;
      if (ord.deliveryType === 'pickup') monthPickups++;
      if (ord.status === 'delivered') monthDelivered++;
      if (ord.status === 'problem') monthProblems++;
    });

    const cell = document.createElement('div');
    cell.className = `calendar-day-cell p-2 flex flex-col justify-between cursor-pointer border-t border-slate-100 ${
      isSelected ? 'ring-2 ring-sky-500 bg-sky-50/50' : ''
    } ${isToday ? 'bg-amber-50/40' : ''}`;
    cell.onclick = () => selectCalendarDate(dateKey);

    // Header of cell
    let headerHtml = `
      <div class="flex items-center justify-between">
        <span class="text-xs sm:text-sm font-bold ${
          isToday ? 'bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'
        }">${day}</span>
        ${dayOrders.length > 0 ? `<span class="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 rounded-full">${dayOrders.length}</span>` : ''}
      </div>
    `;

    // Order pills inside calendar cell
    let badgesHtml = '<div class="space-y-1 mt-1">';
    if (dayOrders.length > 0) {
      const deliveryCount = dayOrders.filter(o => o.deliveryType === 'delivery').length;
      const pickupCount = dayOrders.filter(o => o.deliveryType === 'pickup').length;
      const hasProblem = dayOrders.some(o => o.status === 'problem');

      if (deliveryCount > 0) {
        badgesHtml += `
          <div class="bg-sky-100 text-sky-800 text-[11px] font-semibold px-1.5 py-0.5 rounded truncate flex items-center gap-1">
            <span>🚚</span> <span>ส่ง ${deliveryCount} เจ้า</span>
          </div>
        `;
      }
      if (pickupCount > 0) {
        badgesHtml += `
          <div class="bg-amber-100 text-amber-800 text-[11px] font-semibold px-1.5 py-0.5 rounded truncate flex items-center gap-1">
            <span>🏠</span> <span>รับเอง ${pickupCount} เจ้า</span>
          </div>
        `;
      }
      if (hasProblem) {
        badgesHtml += `
          <div class="bg-red-100 text-red-700 text-[10px] font-bold px-1 rounded flex items-center gap-0.5">
            <span>⚠️</span> <span>มีเคลม</span>
          </div>
        `;
      }
    } else {
      badgesHtml += `<div class="text-[11px] text-slate-300 italic hidden sm:block">คิวว่าง</div>`;
    }
    badgesHtml += '</div>';

    cell.innerHTML = headerHtml + badgesHtml;
    grid.appendChild(cell);
  }

  // Trailing days from next month to complete the 7-col grid
  const totalCells = firstDay + daysInMonth;
  const trailingDays = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= trailingDays; d++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell p-2 text-slate-300 bg-slate-50/60 select-none';
    cell.innerHTML = `<span class="text-xs font-semibold">${d}</span>`;
    grid.appendChild(cell);
  }

  // Update month stats counters
  const statDel = document.getElementById('stat-month-delivery');
  const statPick = document.getElementById('stat-month-pickup');
  const statDone = document.getElementById('stat-month-delivered');
  const statProb = document.getElementById('stat-month-problem');

  if (statDel) statDel.textContent = `${monthDeliveries} ออเดอร์`;
  if (statPick) statPick.textContent = `${monthPickups} ออเดอร์`;
  if (statDone) statDone.textContent = `${monthDelivered} ออเดอร์`;
  if (statProb) statProb.textContent = `${monthProblems} ออเดอร์`;

  // Render selected day inspector
  renderSelectedDayInspector();
}

function selectCalendarDate(dateKey) {
  state.selectedDate = dateKey;
  renderMonthlyCalendar();
}

function renderSelectedDayInspector() {
  const titleEl = document.getElementById('selected-day-title');
  const listContainer = document.getElementById('selected-day-orders-list');
  if (!titleEl || !listContainer) return;

  titleEl.textContent = `วันที่ ${formatThaiDate(state.selectedDate)}`;
  const dayOrders = state.orders.filter(o => o.deliveryDate === state.selectedDate);

  if (dayOrders.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-8 bg-white/70 rounded-xl border border-dashed border-sky-300">
        <p class="text-slate-500 text-sm">📅 วันนี้ยังไม่มีคิวจัดส่งหรือรับสินค้า (คิวว่าง)</p>
        <button onclick="openNewOrderWithDate('${state.selectedDate}')" class="btn-large btn-farm-yellow text-sm py-2 px-4 mt-3">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>เพิ่มการจองในวันนี้</span>
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  let html = '';
  dayOrders.forEach(order => {
    const statusBadge = getStatusBadgeHtml(order.status);
    const isPickup = order.deliveryType === 'pickup';

    html += `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-sky-300 transition">
        <div class="space-y-1 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${isPickup ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-sky-100 text-sky-900 border border-sky-300'}">
              ${isPickup ? '🏠 มารับเองหน้าฟาร์ม' : '🚚 ฟาร์มจัดส่ง'}
            </span>
            <span class="font-bold text-slate-800 text-base">${order.customerName}</span>
            <span class="text-xs text-slate-500">(${order.customerPhone})</span>
            ${order.editHistory && order.editHistory.length > 0 ? `
              <button onclick="viewOrderHistory('${order.id}')" title="คลิกดูประวัติการแก้ไข" class="badge-tag bg-purple-100 text-purple-800 text-[10px] py-0.5 px-2 hover:bg-purple-200 cursor-pointer">
                📝 แก้ไขแล้ว (${order.editHistory.length})
              </button>
            ` : ''}
          </div>

          <div class="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>⏰ ${order.deliveryTimeSlot || 'ตามนัดหมาย'}</span>
            <span>📍 ${isPickup ? 'บ่ออนุบาลหน้าฟาร์ม' : (order.deliveryAddress || '-')}</span>
          </div>

          <div class="text-xs font-semibold text-sky-800 pt-1">
            📦 รายการ: ${order.items.map(i => `${i.name} (${i.size || ''}) x ${formatNumber(i.qty)} ${i.unit}`).join(', ')}
          </div>
        </div>

        <div class="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2 md:pt-0">
          <div class="text-right">
            <div class="text-xs text-slate-500">ยอดคงเหลือวันส่ง</div>
            <div class="text-base font-bold text-amber-700">${formatMoney(order.remainingBalance)}</div>
          </div>

          <div>${statusBadge}</div>

          <div class="flex items-center gap-1">
            <button onclick="viewOrderSlip('${order.id}')" title="พิมพ์ใบจอง/ใบส่งของ" class="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            <button onclick="openEditOrderModal('${order.id}')" title="แก้ไขการจอง (เปลี่ยนวัน/ข้อมูลสินค้า)" class="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700">
              <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
            <button onclick="openDeliveryUpdateModal('${order.id}')" title="อัปเดตสถานะ" class="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700">
              <i data-lucide="truck" class="w-4 h-4"></i>
            </button>
            ${order.status !== 'cancelled' && order.status !== 'delivered' ? `
            <button onclick="openCancelOrderModal('${order.id}')" title="ยกเลิกการจอง" class="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700">
              <i data-lucide="x-circle" class="w-4 h-4"></i>
            </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  });

  listContainer.innerHTML = html;
  lucide.createIcons();
}

function openNewOrderWithDate(date) {
  openNewOrderModal();
  const input = document.getElementById('order-delivery-date');
  if (input) input.value = date || state.selectedDate;
}

// ====================================================================
// 2. DAILY DISPATCH QUEUE & DRIVER VIEW (คิวจัดส่งประจำวัน & คนขับรถ)
// ====================================================================
function setDailyDateToToday() {
  const picker = document.getElementById('daily-date-picker');
  if (picker) {
    picker.value = getTodayString();
    renderDailyQueue();
  }
}

function renderDailyQueue() {
  const picker = document.getElementById('daily-date-picker');
  const targetDate = picker ? picker.value : getTodayString();
  const container = document.getElementById('daily-orders-container');
  const prepGrid = document.getElementById('daily-prep-summary-grid');
  if (!container || !prepGrid) return;

  const dayOrders = state.orders.filter(o => o.deliveryDate === targetDate && o.status !== 'cancelled');

  // 1. Calculate Prep Summary (สรุปยอดรวมปลาที่ต้องเตรียมตัก/ขึ้นรถในวันนั้น)
  const itemMap = {};
  dayOrders.forEach(order => {
    order.items.forEach(it => {
      const key = `${it.name} (${it.size || ''})`;
      if (!itemMap[key]) {
        itemMap[key] = {
          name: it.name,
          size: it.size || '',
          qty: 0,
          unit: it.unit,
          category: it.category
        };
      }
      itemMap[key].qty += Number(it.qty || 0);
    });
  });

  const prepItems = Object.values(itemMap);
  if (prepItems.length === 0) {
    prepGrid.innerHTML = `
      <div class="col-span-full text-sm text-slate-500 italic py-2">
        ไม่มีรายการสินค้าที่ต้องจัดเตรียมสำหรับวันที่ ${formatThaiDate(targetDate)}
      </div>
    `;
  } else {
    let prepHtml = '';
    prepItems.forEach(item => {
      prepHtml += `
        <div class="bg-white p-3 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <div class="font-bold text-slate-800 text-sm">${item.name}</div>
            <div class="text-xs text-amber-800 font-semibold">${item.size ? 'ไซส์: ' + item.size : item.category}</div>
          </div>
          <div class="text-right">
            <span class="text-lg font-bold text-sky-700">${formatNumber(item.qty)}</span>
            <span class="text-xs text-slate-600"> ${item.unit}</span>
          </div>
        </div>
      `;
    });
    prepGrid.innerHTML = prepHtml;
  }

  // 2. Render Orders List for Driver & Farm Staff
  if (dayOrders.length === 0) {
    container.innerHTML = `
      <div class="farm-card p-12 text-center text-slate-500">
        <div class="text-4xl mb-2">🚚</div>
        <h4 class="text-lg font-bold text-slate-700">ไม่มีคิวจัดส่งในวันที่ ${formatThaiDate(targetDate)}</h4>
        <p class="text-sm text-slate-400 mt-1">คุณสามารถเลือกดูวันอื่น หรือกดปุ่ม "จองพันธุ์ปลาใหม่" ด้านบนเพื่อเพิ่มคิวส่ง</p>
      </div>
    `;
    return;
  }

  let html = '';
  dayOrders.forEach((order, index) => {
    const isPickup = order.deliveryType === 'pickup';
    const statusBadge = getStatusBadgeHtml(order.status);
    const mapsLink = order.mapsUrl ? `<a href="${order.mapsUrl}" target="_blank" class="btn-large bg-sky-500 hover:bg-sky-600 text-white py-2 px-3 text-xs rounded-lg font-semibold inline-flex items-center gap-1 shadow-sm"><i data-lucide="map-pin" class="w-4 h-4"></i> <span>เปิด Google Maps</span></a>` : '';

    html += `
      <div class="farm-card p-5 border-l-4 ${order.status === 'cancelled' ? 'border-l-rose-400 opacity-60' : order.status === 'problem' ? 'border-l-red-500' : isPickup ? 'border-l-amber-500' : 'border-l-sky-500'} space-y-4">
        
        <!-- Header of Order -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-3">
            <span class="w-9 h-9 rounded-xl ${isPickup ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'} flex items-center justify-center font-bold text-sm">
              #${index + 1}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-lg font-bold text-slate-900">${order.customerName}</h4>
                <span class="text-xs px-2 py-0.5 rounded-full font-bold ${isPickup ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-900'}">
                  ${isPickup ? '🏠 มารับเองหน้าฟาร์ม' : '🚚 จัดส่งถึงที่'}
                </span>
              </div>
              <p class="text-xs text-slate-500">รหัสจอง: ${order.id} • บันทึกเมื่อ: ${formatThaiDate(order.createdAt, true)}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-auto">
            ${statusBadge}
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <!-- Left: Location & Contact -->
          <div class="space-y-2">
            <!-- Quick Contact & Maps Bar for Mobile Driver -->
            <div class="grid grid-cols-2 gap-2 pt-1 pb-1">
              <a href="tel:${order.customerPhone}" class="btn-large bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                <i data-lucide="phone-call" class="w-4 h-4"></i>
                <span>โทรหาลูกค้า</span>
              </a>
              ${order.mapsUrl ? `
              <a href="${order.mapsUrl}" target="_blank" class="btn-large bg-sky-600 hover:bg-sky-700 text-white py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                <i data-lucide="navigation" class="w-4 h-4"></i>
                <span>เปิดแผนที่นำทาง</span>
              </a>
              ` : `
              <div class="p-2 bg-slate-100 rounded-xl text-[11px] text-slate-400 text-center flex items-center justify-center">
                <span>ไม่มีพิกัด Maps</span>
              </div>
              `}
            </div>

            <div class="flex items-start gap-2 pt-1">
              <i data-lucide="map-pin" class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"></i>
              <div class="text-xs">
                <span class="text-slate-500">สถานที่ส่ง: </span>
                <span class="text-slate-800 font-medium">${order.deliveryAddress || '-'}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
              <i data-lucide="clock" class="w-4 h-4 text-amber-500"></i>
              <span>เวลานัด: <strong>${order.deliveryTimeSlot || '-'}</strong></span>
            </div>
          </div>

          <!-- Right: Items & Financials -->
          <div class="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div class="text-xs font-bold text-slate-700 uppercase tracking-wider">รายการสินค้า:</div>
            <div class="space-y-1">
              ${order.items.map(it => `
                <div class="flex justify-between text-xs text-slate-800 py-0.5 border-b border-slate-100 last:border-none">
                  <span>• ${it.name} ${it.size ? `(${it.size})` : ''} x <strong>${formatNumber(it.qty)}</strong> ${it.unit}</span>
                  <span class="font-semibold text-slate-700">${formatMoney(it.totalPrice)}</span>
                </div>
              `).join('')}
            </div>

            <div class="pt-2 border-t border-slate-200 text-xs space-y-1">
              <div class="flex justify-between text-slate-600">
                <span>ยอดรวมสุทธิ:</span>
                <span class="font-bold text-slate-900">${formatMoney(order.netTotal)}</span>
              </div>
              <div class="flex justify-between text-emerald-700">
                <span>มัดจำแล้ว:</span>
                <span class="font-bold">${formatMoney(order.deposit)}</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-amber-800 bg-amber-100 p-2 rounded-lg">
                <span>ยอดที่ต้องเก็บวันส่ง:</span>
                <span class="text-base">${formatMoney(order.remainingBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Action Bar (ปุ่มใหญ่พิเศษสำหรับคนขับรถบนมือถือ) -->
        <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div class="text-xs text-slate-500 flex items-center gap-1">
            <i data-lucide="user-check" class="w-4 h-4 text-sky-600"></i>
            <span>ผู้ขับ/ผู้รับผิดชอบ: ${order.driverName || 'ยังไม่ระบุ'}</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            ${canCurrentUser('print_slip') ? `
            <button onclick="viewOrderSlip('${order.id}')" class="btn-large bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 text-xs rounded-xl font-semibold">
              <i data-lucide="printer" class="w-4 h-4"></i> พิมพ์ใบส่งของ
            </button>
            ` : ''}

            ${canCurrentUser('edit_order') ? `
            <button onclick="openEditOrderModal('${order.id}')" class="btn-large bg-purple-50 hover:bg-purple-100 text-purple-700 py-2 px-3 text-xs font-bold rounded-xl border border-purple-200">
              <i data-lucide="edit" class="w-4 h-4 text-purple-600"></i>
              <span>แก้ไขการจอง</span>
            </button>
            ` : ''}

            ${order.editHistory && order.editHistory.length > 0 ? `
              <button onclick="viewOrderHistory('${order.id}')" class="btn-large bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 text-xs font-semibold rounded-xl">
                <i data-lucide="history" class="w-4 h-4 text-purple-700"></i>
                <span>ประวัติแก้ไข (${order.editHistory.length})</span>
              </button>
            ` : ''}

            ${canCurrentUser('update_delivery') ? `
            <button onclick="openDeliveryUpdateModal('${order.id}')" class="btn-large btn-primary-blue py-2 px-4 text-xs font-bold rounded-xl shadow-sm">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>อัปเดตสถานะ / รับเงิน</span>
            </button>
            ` : ''}

            ${canCurrentUser('create_claim') ? `
            <button onclick="openClaimFromOrder('${order.id}')" class="btn-large bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 text-xs font-bold rounded-xl border border-red-200">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-red-600"></i>
              <span>แจ้งเคลมปลา</span>
            </button>
            ` : ''}

            ${order.status !== 'cancelled' && order.status !== 'delivered' && canCurrentUser('cancel_order') ? `
            <button onclick="openCancelOrderModal('${order.id}')" class="btn-large bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 px-3 text-xs font-bold rounded-xl border border-rose-200">
              <i data-lucide="x-circle" class="w-4 h-4 text-rose-600"></i>
              <span>ยกเลิกการจอง</span>
            </button>
            ` : ''}
          </div>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
  lucide.createIcons();
}

// Status Badges
function getStatusBadgeHtml(status) {
  switch (status) {
    case 'delivered':
      return `<span class="badge-tag bg-emerald-100 text-emerald-800 border border-emerald-300"><i data-lucide="check" class="w-3.5 h-3.5"></i> ส่งสำเร็จ</span>`;
    case 'in_transit':
      return `<span class="badge-tag bg-sky-100 text-sky-800 border border-sky-300"><i data-lucide="truck" class="w-3.5 h-3.5"></i> อยู่ระหว่างจัดส่ง</span>`;
    case 'preparing':
      return `<span class="badge-tag bg-amber-100 text-amber-800 border border-amber-300"><i data-lucide="package" class="w-3.5 h-3.5"></i> กำลังเตรียมปลา</span>`;
    case 'problem':
      return `<span class="badge-tag bg-red-100 text-red-800 border border-red-300"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> มีปัญหา/เคลม</span>`;
    case 'cancelled':
      return `<span class="badge-tag bg-rose-100 text-rose-800 border border-rose-400 line-through opacity-80"><i data-lucide="x-circle" class="w-3.5 h-3.5 no-underline"></i> <span class="no-underline">ยกเลิกแล้ว</span></span>`;
    case 'pending':
    default:
      return `<span class="badge-tag bg-slate-100 text-slate-700 border border-slate-300"><i data-lucide="clock" class="w-3.5 h-3.5"></i> รอดำเนินการ</span>`;
  }
}

// ====================================================================
// 2b. CANCEL ORDER (ยกเลิกการจอง)
// ====================================================================
let cancelTargetOrderId = null;

function openCancelOrderModal(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  if (order.status === 'delivered') {
    showNotification('ไม่สามารถยกเลิกได้ เนื่องจากส่งมอบสินค้าเรียบร้อยแล้ว', 'warning');
    return;
  }
  if (order.status === 'cancelled') {
    showNotification('รายการนี้ถูกยกเลิกแล้ว', 'warning');
    return;
  }
  cancelTargetOrderId = orderId;

  const infoEl = document.getElementById('cancel-order-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <div class="font-bold text-slate-900 text-base">${order.customerName}</div>
      <div class="text-xs text-slate-500">รหัสจอง: ${order.id}</div>
      <div class="text-xs text-slate-600 mt-1">📅 วันนัด: ${formatThaiDate(order.deliveryDate)} • 💰 ยอดสุทธิ: ${formatMoney(order.netTotal)}</div>
      ${order.deposit > 0 ? `<div class="text-xs text-amber-700 font-semibold mt-1">⚠️ มีมัดจำ ${formatMoney(order.deposit)} — กรุณาระบุวิธีคืนเงินในเหตุผลด้วย</div>` : ''}
    `;
  }
  const reasonEl = document.getElementById('cancel-reason-input');
  if (reasonEl) reasonEl.value = '';

  openModal('modal-cancel-order');
}

function confirmCancelOrder() {
  const reasonEl = document.getElementById('cancel-reason-input');
  const reason = reasonEl ? reasonEl.value.trim() : '';
  if (!reason) {
    showNotification('กรุณาระบุเหตุผลในการยกเลิกก่อนดำเนินการ', 'error');
    reasonEl && reasonEl.focus();
    return;
  }

  const order = state.orders.find(o => o.id === cancelTargetOrderId);
  if (!order) return;

  const prevStatus = order.status;
  order.status = 'cancelled';

  // Record cancel in editHistory
  if (!order.editHistory) order.editHistory = [];
  order.editHistory.unshift({
    timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
    editorName: state.currentUser ? state.currentUser.name : 'ไม่ระบุ',
    editorRole: state.currentUser ? state.currentUser.role : '-',
    reason: `❌ ยกเลิกการจอง — ${reason}`,
    changeSummary: `เปลี่ยนสถานะจาก "${prevStatus}" → "cancelled"`
  });

  saveState();
  closeModal('modal-cancel-order');
  cancelTargetOrderId = null;
  showNotification(`ยกเลิกการจองของ ${order.customerName} เรียบร้อยแล้ว`, 'success');
  switchTab(state.activeTab);
  lucide.createIcons();
}

// ====================================================================
// 3. ORDER BOOKING & DYNAMIC ITEMS (ระบบจองพันธุ์ปลา & รายการไม่จำกัด)
// ====================================================================
let tempItemRows = [];

function openNewOrderModal() {
  tempItemRows = [];
  const formTbody = document.getElementById('order-items-tbody');
  if (formTbody) formTbody.innerHTML = '';

  // Reset Edit ID and Title to Create Mode
  const editIdInput = document.getElementById('order-edit-id');
  if (editIdInput) editIdInput.value = '';
  const titleEl = document.getElementById('modal-order-title');
  if (titleEl) titleEl.textContent = 'บันทึกการจองพันธุ์ปลาและสินค้าใหม่';
  const iconEl = document.getElementById('modal-order-icon');
  if (iconEl) iconEl.textContent = '📝';

  // Hide Audit Section in create mode
  const auditContainer = document.getElementById('order-edit-audit-container');
  if (auditContainer) auditContainer.classList.add('hidden');

  // Reset form fields
  document.getElementById('order-customer-name').value = '';
  document.getElementById('order-customer-phone').value = '';
  document.getElementById('order-customer-address').value = '';
  document.getElementById('order-customer-maps').value = '';
  document.getElementById('order-notes').value = '';
  document.getElementById('order-deposit').value = '0';
  document.getElementById('order-delivery-date').value = state.selectedDate || getTodayString();

  // Reset radio
  const deliveryRadios = document.getElementsByName('order-delivery-type');
  if (deliveryRadios.length > 0) deliveryRadios[0].checked = true;
  toggleDeliveryFields(true);

  // Populate customer dropdown & driver dropdown
  populateCustomerDropdown();
  populateDriverDropdown();

  // Add 1 default row
  addOrderItemRow();

  calculateOrderTotals();
  openModal('modal-new-order');
}

// เปิดหน้าต่างแก้ไขข้อมูลการจอง (เปลี่ยนวัน, เปลี่ยนรายการสินค้า, บันทึกผู้แก้และเหตุผล)
function openEditOrderModal(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) {
    alert('ไม่พบคำสั่งซื้อที่ต้องการแก้ไข');
    return;
  }

  // Set ID and Mode
  document.getElementById('order-edit-id').value = order.id;
  const titleEl = document.getElementById('modal-order-title');
  if (titleEl) titleEl.textContent = `แก้ไขข้อมูลการจองพันธุ์ปลา (รหัส: ${order.id})`;
  const iconEl = document.getElementById('modal-order-icon');
  if (iconEl) iconEl.textContent = '✏️';

  // Show Audit Section
  const auditContainer = document.getElementById('order-edit-audit-container');
  if (auditContainer) {
    auditContainer.classList.remove('hidden');
    document.getElementById('order-edit-user').value = `${state.currentUser.name} (${state.currentUser.roleLabel})`;
    document.getElementById('order-edit-reason').value = '';
  }

  // Populate customer dropdown
  populateCustomerDropdown();
  const custSelect = document.getElementById('order-existing-customer');
  if (custSelect) custSelect.value = order.customerId || '';

  // Populate driver dropdown
  populateDriverDropdown();
  const driverSelect = document.getElementById('order-driver-select');
  if (driverSelect) driverSelect.value = order.driverName || '';

  // Populate fields
  document.getElementById('order-customer-name').value = order.customerName;
  document.getElementById('order-customer-phone').value = order.customerPhone;
  document.getElementById('order-customer-address').value = order.deliveryAddress || '';
  document.getElementById('order-customer-maps').value = order.mapsUrl || '';
  document.getElementById('order-delivery-date').value = order.deliveryDate;
  document.getElementById('order-delivery-time').value = order.deliveryTimeSlot || 'ช่วงเช้า (08:00 - 10:30 น.)';
  document.getElementById('order-notes').value = order.notes || '';
  document.getElementById('order-deposit').value = order.deposit || 0;
  document.getElementById('order-deposit-method').value = order.paymentMethod || 'โอนเงิน';

  // Delivery type radio
  const isDelivery = order.deliveryType === 'delivery';
  const deliveryRadios = document.getElementsByName('order-delivery-type');
  if (deliveryRadios.length >= 2) {
    deliveryRadios[0].checked = isDelivery;
    deliveryRadios[1].checked = !isDelivery;
  }
  toggleDeliveryFields(isDelivery);

  // Clear & Populate Items
  const tbody = document.getElementById('order-items-tbody');
  if (tbody) tbody.innerHTML = '';

  if (order.items && order.items.length > 0) {
    order.items.forEach(item => addOrderItemRow(item));
  } else {
    addOrderItemRow();
  }

  calculateOrderTotals();
  openModal('modal-new-order');
}

function populateCustomerDropdown() {
  const select = document.getElementById('order-existing-customer');
  if (!select) return;
  select.innerHTML = '<option value="">-- เป็นลูกค้าใหม่ หรือ กรอกข้อมูลด้านล่าง --</option>';

  state.customers.forEach(cust => {
    const opt = document.createElement('option');
    opt.value = cust.id;
    opt.textContent = `${cust.name} (${cust.phone}) - เกรด ${cust.vipTier || 'ทั่วไป'}`;
    select.appendChild(opt);
  });
}

function autoFillCustomerData(customerId) {
  if (!customerId) return;
  const cust = state.customers.find(c => c.id === customerId);
  if (cust) {
    document.getElementById('order-customer-name').value = cust.name;
    document.getElementById('order-customer-phone').value = cust.phone;
    document.getElementById('order-customer-address').value = cust.address || '';
    document.getElementById('order-customer-maps').value = cust.mapsUrl || '';
  }
}

function toggleDeliveryFields(isDelivery) {
  const container = document.getElementById('delivery-address-container');
  if (container) {
    if (isDelivery) {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  }
}

// Add Dynamic Row for item with Unit Discount (บาท/หน่วย ไม่มี %)
function addOrderItemRow(defaultItem = null) {
  const tbody = document.getElementById('order-items-tbody');
  if (!tbody) return;

  const rowId = 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.className = 'hover:bg-slate-50/80 transition';

  // Category options
  const categories = ['พันธุ์ปลา', 'อาหารปลา', 'กระชังเลี้ยงปลา', 'ยารักษาโรคปลา'];
  const catVal = defaultItem ? defaultItem.category : 'พันธุ์ปลา';
  const catOptions = categories.map(c => `<option value="${c}" ${c === catVal ? 'selected' : ''}>${c}</option>`).join('');

  const nameVal = defaultItem ? (defaultItem.name || '') : '';
  const sizeVal = defaultItem ? (defaultItem.size || '') : '';
  const qtyVal = defaultItem ? (defaultItem.qty !== undefined ? defaultItem.qty : 1000) : 1000;
  const unitVal = defaultItem ? (defaultItem.unit || 'ตัว') : 'ตัว';
  const priceVal = defaultItem ? (defaultItem.unitPrice !== undefined ? defaultItem.unitPrice : 1.50) : 1.50;
  const discVal = defaultItem ? (defaultItem.unitDiscount !== undefined ? defaultItem.unitDiscount : 0) : 0;

  tr.innerHTML = `
    <td class="p-2.5">
      <select onchange="onCategoryChange('${rowId}', this.value)" class="input-large py-1 px-2 text-xs w-full bg-white row-category">
        ${catOptions}
      </select>
    </td>
    <td class="p-2.5">
      <input type="text" value="${nameVal}" placeholder="ระบุชื่อสินค้า หรือคลิกเลือก" class="input-large py-1 px-2 text-xs w-full font-semibold row-name" list="catalog-products-datalist" oninput="calculateOrderTotals()">
    </td>
    <td class="p-2.5">
      <input type="text" value="${sizeVal}" placeholder="เช่น 2-3 นิ้ว" class="input-large py-1 px-2 text-xs w-full row-size" oninput="calculateOrderTotals()">
    </td>
    <td class="p-2.5 min-w-[120px]">
      <input type="number" min="1" value="${qtyVal}" class="input-large py-1 px-2 text-sm w-full font-bold text-center row-qty" oninput="calculateOrderTotals()">
    </td>
    <td class="p-2.5">
      <input type="text" value="${unitVal}" class="input-large py-1 px-2 text-xs w-full text-center row-unit">
    </td>
    <td class="p-2.5">
      <input type="number" step="0.05" min="0" value="${priceVal}" class="input-large py-1 px-2 text-xs w-full text-right row-price" oninput="calculateOrderTotals()">
    </td>
    <td class="p-2.5 bg-amber-50/60">
      <input type="number" step="0.05" min="0" value="${discVal}" class="input-large py-1 px-2 text-xs w-full text-right font-bold text-amber-700 row-discount" oninput="calculateOrderTotals()" placeholder="0.00">
    </td>
    <td class="p-2.5 text-right font-bold text-sky-800 row-total">
      ฿0.00
    </td>
    <td class="p-2.5 text-center">
      <button type="button" onclick="removeOrderItemRow('${rowId}')" class="text-slate-400 hover:text-red-500 p-1">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </td>
  `;

  tbody.appendChild(tr);
  lucide.createIcons();
  calculateOrderTotals();
}

function removeOrderItemRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    calculateOrderTotals();
  }
}

function onCategoryChange(rowId, category) {
  const row = document.getElementById(rowId);
  if (!row) return;

  const unitInput = row.querySelector('.row-unit');
  const sizeInput = row.querySelector('.row-size');
  const qtyInput = row.querySelector('.row-qty');
  const priceInput = row.querySelector('.row-price');
  const nameInput = row.querySelector('.row-name');

  if (category === 'พันธุ์ปลา') {
    unitInput.value = 'ตัว';
    sizeInput.placeholder = 'เช่น 2-3 นิ้ว';
    qtyInput.value = '5000';
    priceInput.value = '1.50';
    nameInput.placeholder = 'เช่น ปลาดุกบิ๊กอุย, ปลานิล';
  } else if (category === 'อาหารปลา') {
    unitInput.value = 'กระสอบ';
    sizeInput.placeholder = 'เช่น 20 กก.';
    qtyInput.value = '2';
    priceInput.value = '480';
    nameInput.placeholder = 'เช่น อาหารปลาดุก เบอร์ 1';
  } else if (category === 'กระชังเลี้ยงปลา') {
    unitInput.value = 'หลัง';
    sizeInput.placeholder = 'เช่น 2x3x1.2 ม.';
    qtyInput.value = '1';
    priceInput.value = '850';
    nameInput.placeholder = 'เช่น กระชังบกเย็บสำเร็จ';
  } else if (category === 'ยารักษาโรคปลา') {
    unitInput.value = 'ขวด';
    sizeInput.placeholder = 'เช่น 500 กรัม';
    qtyInput.value = '1';
    priceInput.value = '120';
    nameInput.placeholder = 'เช่น ยาเหลือง, ด่างทับทิม';
  }
  calculateOrderTotals();
}

// Calculate Order Totals in Realtime
function calculateOrderTotals() {
  const rows = document.querySelectorAll('#order-items-tbody tr');
  let grossTotal = 0;
  let totalDiscount = 0;
  let netTotal = 0;

  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.row-qty')?.value || 0);
    const unitPrice = parseFloat(row.querySelector('.row-price')?.value || 0);
    const unitDiscount = parseFloat(row.querySelector('.row-discount')?.value || 0);

    const netUnitPrice = Math.max(0, unitPrice - unitDiscount);
    const rowGross = qty * unitPrice;
    const rowNet = qty * netUnitPrice;
    const rowDisc = rowGross - rowNet;

    grossTotal += rowGross;
    totalDiscount += rowDisc;
    netTotal += rowNet;

    const rowTotalEl = row.querySelector('.row-total');
    if (rowTotalEl) rowTotalEl.textContent = formatMoney(rowNet);
  });

  const depositInput = document.getElementById('order-deposit');
  const deposit = parseFloat(depositInput?.value || 0);
  const remaining = Math.max(0, netTotal - deposit);

  // Update summary fields
  const grossEl = document.getElementById('calc-gross-total');
  const discEl = document.getElementById('calc-total-discount');
  const netEl = document.getElementById('calc-net-total');
  const remainEl = document.getElementById('calc-remaining-balance');

  if (grossEl) grossEl.textContent = formatMoney(grossTotal);
  if (discEl) discEl.textContent = '- ' + formatMoney(totalDiscount);
  if (netEl) netEl.textContent = formatMoney(netTotal);
  if (remainEl) remainEl.textContent = formatMoney(remaining);
}

// Save New Order
function saveNewOrder() {
  const custName = document.getElementById('order-customer-name').value.trim();
  const custPhone = document.getElementById('order-customer-phone').value.trim();
  const deliveryDate = document.getElementById('order-delivery-date').value;
  const deliveryTime = document.getElementById('order-delivery-time').value;
  const notes = document.getElementById('order-notes').value.trim();
  const deposit = parseFloat(document.getElementById('order-deposit').value || 0);
  const depositMethod = document.getElementById('order-deposit-method').value;

  const isDelivery = document.querySelector('input[name="order-delivery-type"]:checked')?.value === 'delivery';
  const address = isDelivery ? document.getElementById('order-customer-address').value.trim() : 'มารับเองที่ ฟาร์มปลาผู้ใหญ่พร';
  const mapsUrl = isDelivery ? document.getElementById('order-customer-maps').value.trim() : '';

  if (!custName) {
    alert('กรุณาระบุชื่อลูกค้า');
    return;
  }
  if (!custPhone) {
    alert('กรุณาระบุเบอร์โทรศัพท์ลูกค้า');
    return;
  }
  if (!deliveryDate) {
    alert('กรุณาระบุวันนัดจัดส่ง/นัดรับ');
    return;
  }

  // Parse items
  const rows = document.querySelectorAll('#order-items-tbody tr');
  if (rows.length === 0) {
    alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
    return;
  }

  const items = [];
  let grossTotal = 0;
  let totalDiscount = 0;
  let netTotal = 0;

  for (const row of rows) {
    const category = row.querySelector('.row-category').value;
    const name = row.querySelector('.row-name').value.trim();
    const size = row.querySelector('.row-size').value.trim();
    const qty = parseFloat(row.querySelector('.row-qty').value || 0);
    const unit = row.querySelector('.row-unit').value.trim() || 'ตัว';
    const unitPrice = parseFloat(row.querySelector('.row-price').value || 0);
    const unitDiscount = parseFloat(row.querySelector('.row-discount').value || 0);

    if (!name) {
      alert('กรุณาระบุชื่อสินค้าในทุกรายการ');
      return;
    }

    const netUnitPrice = Math.max(0, unitPrice - unitDiscount);
    const lineTotal = qty * netUnitPrice;
    const lineGross = qty * unitPrice;

    grossTotal += lineGross;
    totalDiscount += (lineGross - lineTotal);
    netTotal += lineTotal;

    items.push({
      id: 'it_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      category,
      name,
      size,
      qty,
      unit,
      unitPrice,
      unitDiscount,
      netUnitPrice,
      totalPrice: lineTotal
    });
  }

  const remainingBalance = Math.max(0, netTotal - deposit);

  const driverSelect = document.getElementById('order-driver-select');
  const selectedDriver = driverSelect ? driverSelect.value : '';
  const finalDriverName = isDelivery ? (selectedDriver || 'ยังไม่ระบุ') : 'ลูกค้ารับเองหน้าฟาร์ม';

  // ==========================================
  // ตรวจสอบว่าเป็นโหมดแก้ไข (EDIT MODE) หรือสร้างใหม่
  // ==========================================
  const editId = document.getElementById('order-edit-id')?.value;
  if (editId) {
    const order = state.orders.find(o => o.id === editId);
    if (!order) {
      alert('ไม่พบข้อมูลคำสั่งซื้อเดิม');
      return;
    }

    const editReason = document.getElementById('order-edit-reason')?.value.trim();
    if (!editReason) {
      alert('กรุณาระบุเหตุผลในการแก้ไขข้อมูลการจอง เพื่อบันทึกเป็นประวัติการแก้ไข');
      document.getElementById('order-edit-reason')?.focus();
      return;
    }

    // ตรวจสอบการเปลี่ยนแปลงเพื่อทำสรุป
    const changes = [];
    if (order.deliveryDate !== deliveryDate) changes.push(`วันส่ง: ${order.deliveryDate} → ${deliveryDate}`);
    if (order.netTotal !== netTotal) changes.push(`ยอดเงิน: ฿${formatNumber(order.netTotal)} → ฿${formatNumber(netTotal)}`);
    if (order.driverName !== finalDriverName) changes.push(`คนขับ: ${order.driverName || '-'} → ${finalDriverName}`);
    if (order.items.length !== items.length) changes.push(`รายการสินค้า: ${order.items.length} รายการ → ${items.length} รายการ`);

    const logEntry = {
      id: 'hist_' + Date.now(),
      timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
      editorName: state.currentUser.name,
      editorRole: state.currentUser.roleLabel,
      reason: editReason,
      oldDate: order.deliveryDate,
      newDate: deliveryDate,
      oldTotal: order.netTotal,
      newTotal: netTotal,
      changeSummary: changes.length > 0 ? changes.join(' • ') : 'ปรับปรุงรายละเอียดการจอง'
    };

    order.editHistory = order.editHistory || [];
    order.editHistory.unshift(logEntry);

    // ปรับปรุงยอดซื้อสะสมของลูกค้าตามส่วนต่างยอดสุทธิ
    const diffNet = netTotal - order.netTotal;
    const cust = state.customers.find(c => c.id === order.customerId);
    if (cust) {
      cust.totalSpentYear = Math.max(0, (cust.totalSpentYear || 0) + diffNet);
      cust.totalSpentLifetime = Math.max(0, (cust.totalSpentLifetime || 0) + diffNet);
      if (cust.totalSpentYear >= 50000) cust.vipTier = 'VIP';
      else if (cust.orderCount >= 3) cust.vipTier = 'Regular';
    }

    // อัปเดตข้อมูลในออเดอร์
    order.customerName = custName;
    order.customerPhone = custPhone;
    order.deliveryType = isDelivery ? 'delivery' : 'pickup';
    order.deliveryAddress = address;
    order.mapsUrl = mapsUrl;
    order.deliveryDate = deliveryDate;
    order.deliveryTimeSlot = deliveryTime;
    order.driverName = finalDriverName;
    order.items = items;
    order.grossTotal = grossTotal;
    order.totalDiscount = totalDiscount;
    order.netTotal = netTotal;
    order.deposit = deposit;
    order.remainingBalance = remainingBalance;
    order.paymentMethod = depositMethod;
    order.notes = notes;
    order.lastModified = logEntry.timestamp;
    order.lastModifiedBy = state.currentUser.name;

    saveState();
    closeModal('modal-new-order');
    showNotification(`แก้ไขข้อมูลการจอง ${order.id} เรียบร้อยแล้ว (บันทึกประวัติโดย ${state.currentUser.name})`, 'success');

    // รีเฟรชหน้าจอ
    switchTab(state.activeTab);
    return;
  }

  // ==========================================
  // โหมดสร้างการจองใหม่ (CREATE MODE)
  // ==========================================
  const orderId = 'ORD-' + deliveryDate.replace(/-/g, '') + '-' + String(state.orders.length + 1).padStart(3, '0');

  // Customer sync (Find or create customer)
  let custObj = state.customers.find(c => c.phone === custPhone || c.name === custName);
  if (!custObj) {
    custObj = {
      id: 'cust_' + Date.now(),
      name: custName,
      phone: custPhone,
      address,
      mapsUrl,
      notes,
      totalSpentYear: netTotal,
      totalSpentLifetime: netTotal,
      orderCount: 1,
      vipTier: netTotal > 50000 ? 'VIP' : 'Normal',
      registeredAt: getTodayString()
    };
    state.customers.push(custObj);
  } else {
    custObj.totalSpentYear += netTotal;
    custObj.totalSpentLifetime += netTotal;
    custObj.orderCount += 1;
    if (custObj.totalSpentYear >= 50000) custObj.vipTier = 'VIP';
    else if (custObj.orderCount >= 3) custObj.vipTier = 'Regular';
  }

  const newOrder = {
    id: orderId,
    orderNumber: String(state.orders.length + 1).padStart(3, '0'),
    customerId: custObj.id,
    customerName: custName,
    customerPhone: custPhone,
    deliveryType: isDelivery ? 'delivery' : 'pickup',
    deliveryAddress: address,
    mapsUrl,
    deliveryDate,
    deliveryTimeSlot: deliveryTime,
    status: 'pending',
    paymentStatus: deposit >= netTotal ? 'paid_full' : (deposit > 0 ? 'deposit_paid' : 'unpaid'),
    paymentMethod: depositMethod,
    items,
    grossTotal,
    totalDiscount,
    netTotal,
    deposit,
    remainingBalance,
    actualCollected: 0,
    collectedMethod: 'ยังไม่ได้เก็บ',
    driverName: finalDriverName,
    notes,
    editHistory: [],
    createdAt: getTodayString() + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  };

  state.orders.unshift(newOrder);
  saveState();
  closeModal('modal-new-order');

  showNotification(`บันทึกการจองรหัส ${orderId} เรียบร้อยแล้ว`, 'success');

  // Switch to calendar or daily queue
  switchTab(state.activeTab);

  // Automatically offer to view/print receipt slip
  viewOrderSlip(orderId);
}

// ดูประวัติการแก้ไขข้อมูลการจอง (Order Audit Log Viewer)
function viewOrderHistory(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  const titleEl = document.getElementById('history-modal-title');
  const subEl = document.getElementById('history-modal-subtitle');
  if (titleEl) titleEl.textContent = `ประวัติการแก้ไข: ${order.id}`;
  if (subEl) subEl.textContent = `ลูกค้า: ${order.customerName} (${order.customerPhone})`;

  const content = document.getElementById('history-modal-content');
  if (!content) return;

  const history = order.editHistory || [];

  if (history.length === 0) {
    content.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <i data-lucide="info" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
        <p class="text-sm font-semibold text-slate-600">ยังไม่มีประวัติการแก้ไขข้อมูล</p>
        <p class="text-xs text-slate-400 mt-1">ออเดอร์นี้เป็นข้อมูลเดิมตั้งแต่สร้างเมื่อ ${formatThaiDate(order.createdAt, true)}</p>
      </div>
    `;
    lucide.createIcons();
    openModal('modal-order-history');
    return;
  }

  let html = `<div class="relative border-l-2 border-purple-200 ml-4 pl-4 space-y-4">`;
  history.forEach((h, idx) => {
    html += `
      <div class="relative">
        <div class="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow"></div>
        <div class="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 text-xs space-y-1.5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="font-bold text-purple-900 text-sm flex items-center gap-1">
              <span>👤 ${h.editorName}</span>
              <span class="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-normal">${h.editorRole}</span>
            </span>
            <span class="text-[11px] text-slate-500">${formatThaiDate(h.timestamp, true)}</span>
          </div>

          <div class="bg-white p-2.5 rounded-lg border border-purple-200 text-slate-800">
            <span class="font-bold text-amber-900 block mb-0.5">📌 เหตุผลในการแก้ไข:</span>
            <span class="text-slate-700">${h.reason}</span>
          </div>

          ${h.changeSummary ? `
            <div class="text-purple-900 text-[11px] pt-1">
              <strong>สิ่งที่เปลี่ยนแปลง:</strong> ${h.changeSummary}
            </div>
          ` : ''}

          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-purple-200/60">
            <span>วันนัดส่ง: <strong>${formatThaiDate(h.newDate)}</strong></span>
            <span>ยอดสุทธิใหม่: <strong>${formatMoney(h.newTotal)}</strong></span>
          </div>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  content.innerHTML = html;
  lucide.createIcons();
  openModal('modal-order-history');
}

// ====================================================================
// 4. PRINT SLIP & LINE SUMMARY (พิมพ์ใบจอง & ส่งเข้า LINE)
// ====================================================================
let currentSlipOrder = null;

function viewOrderSlip(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  currentSlipOrder = order;

  const container = document.getElementById('print-slip-content');
  if (!container) return;

  const isPickup = order.deliveryType === 'pickup';

  container.innerHTML = `
    <div class="border-2 border-slate-300 rounded-2xl p-6 sm:p-8 bg-white relative print-only-shadow-none">
      
      <!-- Farm Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-200 gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-3xl font-bold shadow-md">
            🐟
          </div>
          <div>
            <h2 class="text-2xl font-black text-sky-950">ฟาร์มปลาผู้ใหญ่พร</h2>
            <p class="text-xs text-slate-500">จำหน่ายพันธุ์ปลาน้ำจืดคุณภาพ อาหารปลา กระชัง และเวชภัณฑ์ครบวงจร</p>
            <p class="text-xs text-slate-600 font-medium">โทร: 081-999-8888, 089-777-6666 • LINE ID: @phuyaiporn_farm</p>
          </div>
        </div>

        <div class="text-left sm:text-right">
          <span class="inline-block bg-sky-100 text-sky-900 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-1">
            ${isPickup ? 'ใบรับสินค้าหน้าฟาร์ม' : 'ใบสั่งจอง / ใบส่งมอบพันธุ์ปลา'}
          </span>
          <div class="text-base font-bold text-slate-900">เลขที่: ${order.id}</div>
          <div class="text-xs text-slate-500">วันที่ทำรายการ: ${formatThaiDate(order.createdAt, true)}</div>
        </div>
      </div>

      <!-- Customer & Delivery Info Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
        <div>
          <span class="text-slate-400 font-semibold uppercase">ข้อมูลผู้สั่งจอง:</span>
          <div class="font-bold text-sm text-slate-900 mt-0.5">${order.customerName}</div>
          <div class="text-slate-600">เบอร์โทรศัพท์: <strong>${order.customerPhone}</strong></div>
        </div>

        <div>
          <span class="text-slate-400 font-semibold uppercase">สถานที่ส่งมอบ & กำหนดนัด:</span>
          <div class="font-semibold text-slate-800 mt-0.5">
            ${isPickup ? '🏠 ลูกค้ามารับเองที่ ฟาร์มปลาผู้ใหญ่พร' : `🚚 จัดส่ง: ${order.deliveryAddress}`}
          </div>
          <div class="text-sky-800 font-bold mt-1">
            🗓️ วันนัดส่งมอบ: ${formatThaiDate(order.deliveryDate)} (${order.deliveryTimeSlot || 'ตามนัดหมาย'})
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="py-4">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-sky-50 text-sky-950 font-bold border-y border-sky-200">
              <th class="py-2 px-2 text-center w-8">#</th>
              <th class="py-2 px-2">รายการสินค้า</th>
              <th class="py-2 px-2 text-center">ขนาด/ไซส์</th>
              <th class="py-2 px-2 text-center">จำนวน</th>
              <th class="py-2 px-2 text-right">ราคาปกติ</th>
              <th class="py-2 px-2 text-right bg-amber-50/70 text-amber-900">ลด/หน่วย</th>
              <th class="py-2 px-2 text-right">ราคาสุทธิ/หน่วย</th>
              <th class="py-2 px-2 text-right font-bold">รวมเงิน</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${order.items.map((it, idx) => `
              <tr>
                <td class="py-2 px-2 text-center text-slate-400">${idx + 1}</td>
                <td class="py-2 px-2 font-semibold text-slate-900">
                  ${it.name}
                  <span class="text-[10px] text-slate-400 block">${it.category}</span>
                </td>
                <td class="py-2 px-2 text-center text-slate-600">${it.size || '-'}</td>
                <td class="py-2 px-2 text-center font-bold text-slate-800">${formatNumber(it.qty)} ${it.unit}</td>
                <td class="py-2 px-2 text-right text-slate-500">${formatMoney(it.unitPrice)}</td>
                <td class="py-2 px-2 text-right text-amber-700 font-medium bg-amber-50/30">
                  ${it.unitDiscount > 0 ? `-${formatMoney(it.unitDiscount)}` : '-'}
                </td>
                <td class="py-2 px-2 text-right font-semibold text-slate-800">${formatMoney(it.netUnitPrice)}</td>
                <td class="py-2 px-2 text-right font-bold text-sky-900">${formatMoney(it.totalPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Financial Totals Box -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t-2 border-slate-200">
        <div class="text-xs text-slate-500 max-w-sm">
          <p class="font-bold text-slate-700">เงื่อนไขการรับประกันและข้อตกลง:</p>
          <ul class="list-disc pl-4 space-y-0.5 mt-1">
            <li>กรุณาตรวจนับจำนวนและความสมบูรณ์ของปลาทันทีเมื่อได้รับมอบ</li>
            <li>หากพบปลาตาย/น็อคน้ำหน้างาน ถ่ายภาพยืนยันส่งให้คนขับหรือแจ้งทางฟาร์มทันทีเพื่อเคลมสินค้า</li>
            <li>ปลาผ่านการพักน้ำและตรวจโรคจากฝ่าย QC เรียบร้อยแล้ว</li>
          </ul>
        </div>

        <div class="w-full sm:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
          <div class="flex justify-between text-slate-600">
            <span>ราคารวมปกติ:</span>
            <span>${formatMoney(order.grossTotal)}</span>
          </div>
          <div class="flex justify-between text-amber-600 font-bold">
            <span>รวมส่วนลดพิเศษ:</span>
            <span>-${formatMoney(order.totalDiscount)}</span>
          </div>
          <div class="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
            <span>ยอดรวมสุทธิทั้งบิล:</span>
            <span class="text-sky-700">${formatMoney(order.netTotal)}</span>
          </div>
          <div class="flex justify-between text-emerald-700 font-semibold pt-1">
            <span>มัดจำแล้ว (${order.paymentMethod || 'โอนเงิน'}):</span>
            <span>${formatMoney(order.deposit)}</span>
          </div>
          <div class="flex justify-between text-sm font-bold text-amber-900 bg-amber-100/70 p-2 rounded-lg mt-2">
            <span>ยอดคงเหลือที่ต้องชำระ:</span>
            <span class="text-base text-amber-800">${formatMoney(order.remainingBalance)}</span>
          </div>
        </div>
      </div>

      ${order.editHistory && order.editHistory.length > 0 ? `
        <div class="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950">
          <div class="font-bold flex items-center justify-between text-purple-900 mb-1">
            <span class="flex items-center gap-1.5"><i data-lucide="history" class="w-3.5 h-3.5"></i> ประวัติการแก้ไขล่าสุด (${order.editHistory[0].timestamp})</span>
            <span class="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">ผู้แก้ไข: ${order.editHistory[0].editorName}</span>
          </div>
          <div class="text-[11px] text-slate-700"><strong>เหตุผลในการแก้ไข:</strong> ${order.editHistory[0].reason}</div>
          ${order.editHistory[0].changeSummary ? `<div class="text-[10px] text-purple-800 mt-0.5">${order.editHistory[0].changeSummary}</div>` : ''}
        </div>
      ` : ''}

      <!-- Signatures Line -->
      <div class="grid grid-cols-2 gap-8 pt-8 mt-4 text-center text-xs text-slate-600">
        <div>
          <div class="border-b border-slate-300 w-40 mx-auto mb-1"></div>
          <p>ลงชื่อผู้รับสินค้า / ลูกค้า</p>
          <p class="text-[10px] text-slate-400">วันที่ ......./......./...........</p>
        </div>
        <div>
          <div class="border-b border-slate-300 w-40 mx-auto mb-1"></div>
          <p>ลงชื่อผู้ส่งมอบ (ฟาร์มปลาผู้ใหญ่พร)</p>
          <p class="text-[10px] text-slate-400">วันที่ ......./......./...........</p>
        </div>
      </div>

    </div>
  `;

  openModal('modal-print-slip');
}

function copyOrderSummaryForLine() {
  if (!currentSlipOrder) return;
  const o = currentSlipOrder;
  const isPickup = o.deliveryType === 'pickup';

  const itemsText = o.items.map(i => {
    let line = `• ${i.name} ${i.size ? `(${i.size})` : ''} x ${formatNumber(i.qty)} ${i.unit}`;
    if (i.unitDiscount > 0) {
      line += ` [ลด ${formatMoney(i.unitDiscount)}/หน่วย -> สุทธิ ${formatMoney(i.totalPrice)}]`;
    } else {
      line += ` [${formatMoney(i.totalPrice)}]`;
    }
    return line;
  }).join('\n');

  const text = `🐟 *สรุปรายการจองพันธุ์ปลา - ฟาร์มปลาผู้ใหญ่พร* 🐟
--------------------------------
📋 *รหัสการจอง:* ${o.id}
👤 *ชื่อลูกค้า:* ${o.customerName}
📞 *เบอร์โทร:* ${o.customerPhone}
🗓️ *วันนัดรับ/ส่ง:* ${formatThaiDate(o.deliveryDate)} (${o.deliveryTimeSlot || 'ตามนัดหมาย'})
📍 *สถานที่:* ${isPickup ? 'มารับเองที่หน้าฟาร์ม' : o.deliveryAddress}

📦 *รายการสินค้า:*
${itemsText}
--------------------------------
💰 ราคารวมปกติ: ${formatMoney(o.grossTotal)}
🏷️ ส่วนลดพิเศษ: -${formatMoney(o.totalDiscount)}
✨ *ยอดสุทธิทั้งบิล: ${formatMoney(o.netTotal)}*
💵 มัดจำแล้ว: ${formatMoney(o.deposit)}
🔥 *ยอดคงเหลือวันส่ง: ${formatMoney(o.remainingBalance)}*
--------------------------------
ฟาร์มปลาผู้ใหญ่พร ขอขอบพระคุณครับ 🙏
สอบถามเพิ่มเติม โทร 081-999-8888`;

  navigator.clipboard.writeText(text).then(() => {
    showNotification('คัดลอกข้อความสรุปแล้ว! สามารถนำไปวางส่งใน LINE ได้ทันที', 'success');
  }).catch(err => {
    prompt('คัดลอกข้อความด้านล่างเพื่อส่ง LINE:', text);
  });
}

// ====================================================================
// 5. UPDATE DELIVERY STATUS & PAYMENT (อัปเดตคิวส่ง & ชำระเงินหน้างาน)
// ====================================================================
let currentUpdateOrderId = null;

function openDeliveryUpdateModal(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  currentUpdateOrderId = orderId;

  document.getElementById('update-order-id').value = order.id;
  document.getElementById('update-customer-title').textContent = `ลูกค้า: ${order.customerName} (${order.customerPhone})`;
  document.getElementById('update-order-number').textContent = `รหัสการจอง: ${order.id} • วันที่ส่ง: ${formatThaiDate(order.deliveryDate)}`;
  document.getElementById('update-balance-due').textContent = `ยอดที่ต้องเก็บหน้างาน: ${formatMoney(order.remainingBalance)}`;

  document.getElementById('update-status-select').value = order.status;
  document.getElementById('update-collected-amount').value = order.remainingBalance;
  document.getElementById('update-collected-method').value = order.paymentMethod === 'เงินสด' ? 'เงินสด' : 'โอนเงิน';
  document.getElementById('update-notes-input').value = order.notes || '';

  // Slip preview
  const slipPreview = document.getElementById('update-slip-preview');
  const slipImg = document.getElementById('update-slip-img');
  if (order.paymentProof) {
    slipImg.src = order.paymentProof;
    slipPreview.classList.remove('hidden');
  } else {
    slipPreview.classList.add('hidden');
  }

  openModal('modal-delivery-update');
}

function handleSlipImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const slipPreview = document.getElementById('update-slip-preview');
    const slipImg = document.getElementById('update-slip-img');
    slipImg.src = dataUrl;
    slipPreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function saveDeliveryUpdate() {
  const order = state.orders.find(o => o.id === currentUpdateOrderId);
  if (!order) return;

  const newStatus = document.getElementById('update-status-select').value;
  const collectedAmt = parseFloat(document.getElementById('update-collected-amount').value || 0);
  const collectedMethod = document.getElementById('update-collected-method').value;
  const notes = document.getElementById('update-notes-input').value.trim();
  const slipImgSrc = document.getElementById('update-slip-img').src;

  order.status = newStatus;
  order.actualCollected = collectedAmt;
  order.collectedMethod = collectedMethod;
  order.notes = notes;
  if (slipImgSrc && slipImgSrc.startsWith('data:image')) {
    order.paymentProof = slipImgSrc;
  }

  if (newStatus === 'delivered') {
    order.paymentStatus = 'paid_full';
  }

  saveState();
  closeModal('modal-delivery-update');
  showNotification(`อัปเดตสถานะออเดอร์ ${order.id} เรียบร้อยแล้ว`, 'success');

  // Re-render
  if (state.activeTab === 'calendar') renderMonthlyCalendar();
  if (state.activeTab === 'daily') renderDailyQueue();
  if (state.activeTab === 'orders') renderOrdersList();
}

// ====================================================================
// 6. CLAIMS & DAMAGED FISH TRACKING (ระบบเคลม & ภาพถ่ายปลาเสียหาย)
// ====================================================================
// Array เก็บ data URLs ของไฟล์มีเดียที่อัปโหลด (รูป/วิดีโอ)
let claimMediaDataUrls = [];

function openClaimFromOrder(orderId) {
  openNewClaimModal(orderId);
}

function openNewClaimModal(preselectedOrderId = null) {
  const orderSelect = document.getElementById('claim-order-select');
  if (!orderSelect) return;

  orderSelect.innerHTML = '<option value="">-- เลือกคำสั่งซื้อที่ต้องการเคลม --</option>';
  state.orders.forEach(ord => {
    const opt = document.createElement('option');
    opt.value = ord.id;
    opt.textContent = `${ord.id} - ${ord.customerName} (${formatThaiDate(ord.deliveryDate)})`;
    if (preselectedOrderId && ord.id === preselectedOrderId) opt.selected = true;
    orderSelect.appendChild(opt);
  });

  if (preselectedOrderId) {
    orderSelect.value = preselectedOrderId;
  }

  // Reset inputs
  claimMediaDataUrls = [];
  const mediaInput = document.getElementById('claim-media-files');
  if (mediaInput) mediaInput.value = '';
  document.getElementById('claim-media-preview').innerHTML = `
    <div id="claim-media-empty" class="col-span-full flex flex-col items-center justify-center py-4 text-slate-400">
      <i data-lucide="image" class="w-8 h-8 mb-1 text-slate-300"></i>
      <p class="text-xs">ยังไม่ได้เลือกไฟล์</p>
    </div>`;
  document.getElementById('claim-media-count').classList.add('hidden');
  document.getElementById('claim-amount').value = '';
  document.getElementById('claim-cause-custom').value = '';

  // สร้าง row รายการสินค้าเสียหายแรกอัตโนมัติ
  const itemsList = document.getElementById('claim-items-list');
  if (itemsList) itemsList.innerHTML = '';
  addClaimItemRow();

  if (preselectedOrderId) {
    populateClaimItems(preselectedOrderId);
  }

  openModal('modal-new-claim');
  lucide.createIcons();
}

function addClaimItemRow() {
  const list = document.getElementById('claim-items-list');
  if (!list) return;

  const idx = list.children.length;
  const row = document.createElement('div');
  row.className = 'claim-item-row flex flex-wrap items-center gap-2 p-3 bg-red-50/70 border border-red-100 rounded-xl';
  row.dataset.idx = idx;

  // ดึง options ปัจจุบันจาก order ที่เลือก
  const orderId = document.getElementById('claim-order-select')?.value;
  const order = orderId ? state.orders.find(o => o.id === orderId) : null;
  const itemOptions = order
    ? order.items.map(it => `<option value="${it.name}${it.size ? ` (${it.size})` : ''}" data-unit="${it.unit}">${it.name} ${it.size ? `(${it.size})` : ''} [${formatNumber(it.qty)} ${it.unit}]</option>`).join('')
    : '<option value="">-- เลือกออเดอร์ก่อน --</option>';

  row.innerHTML = `
    <div class="flex-1 min-w-[140px]">
      <label class="block text-[10px] font-bold text-slate-600 mb-0.5">ชนิดสินค้า</label>
      <select class="claim-item-name input-large w-full bg-white text-xs py-2" onchange="updateClaimRowUnit(this)">
        <option value="">-- เลือกรายการ --</option>
        ${itemOptions}
      </select>
    </div>
    <div class="w-24">
      <label class="block text-[10px] font-bold text-slate-600 mb-0.5">จำนวนที่เสียหาย</label>
      <input type="number" class="claim-item-qty input-large w-full text-xs py-2 font-bold text-red-600" placeholder="เช่น 200" min="1">
    </div>
    <div class="w-16">
      <label class="block text-[10px] font-bold text-slate-600 mb-0.5">หน่วย</label>
      <input type="text" class="claim-item-unit input-large w-full text-xs py-2 bg-slate-100 text-center" value="ตัว">
    </div>
    ${idx > 0 ? `<button type="button" onclick="removeClaimItemRow(this)" class="mt-4 p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 flex-shrink-0"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : '<div class="w-8"></div>'}
  `;
  list.appendChild(row);
  lucide.createIcons();
}

function removeClaimItemRow(btn) {
  btn.closest('.claim-item-row')?.remove();
}

function updateClaimRowUnit(selectEl) {
  const row = selectEl.closest('.claim-item-row');
  const unitInput = row?.querySelector('.claim-item-unit');
  const selected = selectEl.selectedOptions[0];
  if (unitInput && selected?.dataset?.unit) {
    unitInput.value = selected.dataset.unit;
  }
}

function populateClaimItems(orderId) {
  // อัปเดต dropdown ในทุก row ที่มีอยู่
  const order = state.orders.find(o => o.id === orderId);
  document.querySelectorAll('.claim-item-name').forEach(sel => {
    const current = sel.value;
    sel.innerHTML = '<option value="">-- เลือกรายการ --</option>';
    if (order) {
      order.items.forEach(it => {
        const opt = document.createElement('option');
        opt.value = it.name + (it.size ? ` (${it.size})` : '');
        opt.dataset.unit = it.unit;
        opt.textContent = `${it.name} ${it.size ? `(${it.size})` : ''} [${formatNumber(it.qty)} ${it.unit}]`;
        if (opt.value === current) opt.selected = true;
        sel.appendChild(opt);
      });
    }
  });
}

function handleClaimMediaUpload(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  const MAX = 10;
  const available = MAX - claimMediaDataUrls.length;
  if (available <= 0) {
    alert('อัปโหลดครบ 10 ไฟล์แล้ว กรุณาลบบางไฟล์ออกก่อน');
    event.target.value = '';
    return;
  }
  const toLoad = files.slice(0, available);
  if (files.length > available) {
    showNotification(`เลือกได้อีกสูงสุด ${available} ไฟล์เท่านั้น (ข้ามไฟล์ที่เกินออก)`, 'info');
  }

  let loaded = 0;
  toLoad.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      claimMediaDataUrls.push({ url: e.target.result, type: file.type, name: file.name });
      loaded++;
      if (loaded === toLoad.length) renderClaimMediaPreviews();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = ''; // reset เพื่อให้เลือกซ้ำได้
}

function renderClaimMediaPreviews() {
  const grid = document.getElementById('claim-media-preview');
  const countEl = document.getElementById('claim-media-count');
  const countNum = document.getElementById('claim-media-count-num');
  if (!grid) return;

  if (claimMediaDataUrls.length === 0) {
    grid.innerHTML = `<div id="claim-media-empty" class="col-span-full flex flex-col items-center justify-center py-4 text-slate-400">
      <i data-lucide="image" class="w-8 h-8 mb-1 text-slate-300"></i>
      <p class="text-xs">ยังไม่ได้เลือกไฟล์</p></div>`;
    if (countEl) countEl.classList.add('hidden');
    lucide.createIcons();
    return;
  }

  grid.innerHTML = claimMediaDataUrls.map((m, i) => {
    const isVideo = m.type.startsWith('video/');
    return `<div class="relative group rounded-xl overflow-hidden border border-red-200 bg-slate-100" style="aspect-ratio:1">
      ${isVideo
        ? `<video src="${m.url}" class="w-full h-full object-cover" muted playsinline></video>
           <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span class="text-white text-2xl drop-shadow">▶</span>
           </div>`
        : `<img src="${m.url}" class="w-full h-full object-cover cursor-pointer" onclick="zoomImage('${m.url}')">`
      }
      <button onclick="removeClaimMedia(${i})" class="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow hover:bg-rose-700 opacity-80 hover:opacity-100">✕</button>
    </div>`;
  }).join('');

  if (countEl) { countEl.classList.remove('hidden'); }
  if (countNum) countNum.textContent = claimMediaDataUrls.length;
}

function removeClaimMedia(idx) {
  claimMediaDataUrls.splice(idx, 1);
  renderClaimMediaPreviews();
}

function saveNewClaim() {
  const orderId = document.getElementById('claim-order-select').value;
  if (!orderId) { alert('กรุณาเลือกคำสั่งซื้อ'); return; }

  // รวบรวมรายการสินค้าเสียหายทุก row
  const rows = document.querySelectorAll('.claim-item-row');
  const damagedItems = [];
  for (const row of rows) {
    const name = row.querySelector('.claim-item-name')?.value?.trim();
    const qty = parseFloat(row.querySelector('.claim-item-qty')?.value || 0);
    const unit = row.querySelector('.claim-item-unit')?.value || 'ตัว';
    if (!name) { alert('กรุณาเลือกชนิดสินค้าทุกรายการ'); return; }
    if (!qty || qty <= 0) { alert('กรุณาระบุจำนวนที่เสียหายทุกรายการ'); return; }
    damagedItems.push({ name, qty, unit });
  }
  if (damagedItems.length === 0) { alert('กรุณาเพิ่มรายการสินค้าเสียหายอย่างน้อย 1 รายการ'); return; }
  if (claimMediaDataUrls.length === 0) { alert('กรุณาแนบรูปภาพหรือวิดีโอยืนยันความเสียหายอย่างน้อย 1 ไฟล์'); return; }

  const causeSelect = document.getElementById('claim-cause-select').value;
  const causeCustom = document.getElementById('claim-cause-custom').value.trim();
  const cause = causeCustom ? `${causeSelect}: ${causeCustom}` : causeSelect;

  const resType = document.querySelector('input[name="claim-res-type"]:checked')?.value || 'deduct_balance';
  const claimAmount = parseFloat(document.getElementById('claim-amount').value || 0);
  const qcStatus = document.getElementById('claim-qc-status').value;

  const order = state.orders.find(o => o.id === orderId);
  const claimId = 'CLM-' + String(state.claims.length + 1).padStart(3, '0');

  let resText = '';
  const totalQty = damagedItems.reduce((s, i) => s + i.qty, 0);
  const firstUnit = damagedItems[0].unit;
  if (resType === 'deduct_balance') resText = `หักลดยอดจ่ายหน้างาน ${formatMoney(claimAmount)}`;
  else if (resType === 'replace_next') resText = `ส่งปลาชดเชยรอบหน้าจำนวน ${formatNumber(totalQty)} ${firstUnit}`;
  else if (resType === 'refund') resText = `โอนเงินคืนลูกค้า ${formatMoney(claimAmount)}`;

  const claimObj = {
    id: claimId,
    orderId,
    customerName: order ? order.customerName : 'ลูกค้า',
    customerPhone: order ? order.customerPhone : '',
    date: getTodayString(),
    damagedItems,                          // array หลายรายการ
    damagedItem: damagedItems.map(i => `${i.name} x ${i.qty} ${i.unit}`).join(', '),  // backward compat
    damagedQty: totalQty,
    damagedUnit: firstUnit,
    cause,
    mediaUrls: claimMediaDataUrls.map(m => m.url),  // รูป+วิดีโอ หลายไฟล์
    photoUrl: claimMediaDataUrls[0]?.url || '',       // backward compat
    resolutionType: resType,
    resolutionText: resText,
    claimAmount,
    approvedBy: qcStatus === 'approved' ? state.currentUser.name : 'รอการตรวจสอบ',
    qcStatus,
    createdAt: getTodayString() + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  };

  state.claims.unshift(claimObj);

  if (order) {
    order.status = 'problem';
    order.claimRecord = claimObj;
    if (resType === 'deduct_balance' && claimAmount > 0) {
      order.remainingBalance = Math.max(0, order.remainingBalance - claimAmount);
    }
  }

  saveState();
  closeModal('modal-new-claim');
  showNotification(`บันทึกการเคลมรหัส ${claimId} (${damagedItems.length} รายการ, ${claimMediaDataUrls.length} ไฟล์หลักฐาน) เรียบร้อยแล้ว`, 'success');
  renderClaimsList();
}


function renderClaimsList() {
  const container = document.getElementById('claims-list-container');
  if (!container) return;

  if (state.claims.length === 0) {
    container.innerHTML = `
      <div class="farm-card p-12 text-center text-slate-500">
        <div class="text-4xl mb-2">🎉</div>
        <h4 class="text-lg font-bold text-slate-700">ไม่มีรายการเคลมสินค้า</h4>
        <p class="text-sm text-slate-400 mt-1">ฟาร์มของคุณยังไม่มีรายงานปลาเสียหายหรือมีปัญหาการขนส่ง</p>
      </div>
    `;
    return;
  }

  let html = '';
  state.claims.forEach(clm => {
    let qcBadge = '';
    if (clm.qcStatus === 'approved') {
      qcBadge = `<span class="badge-tag bg-emerald-100 text-emerald-800 border border-emerald-300">✅ QC อนุมัติแล้ว</span>`;
    } else if (clm.qcStatus === 'pending') {
      qcBadge = `<span class="badge-tag bg-amber-100 text-amber-800 border border-amber-300">⏳ รอ QC ตรวจสอบ</span>`;
    } else {
      qcBadge = `<span class="badge-tag bg-red-100 text-red-800 border border-red-300">❌ ปฏิเสธการเคลม</span>`;
    }

    html += `
      <div class="farm-card p-5 border-l-4 border-l-red-500 flex flex-col md:flex-row gap-6">
        
        <!-- Photo Thumbnail with Zoom Click -->
        <div class="w-full md:w-56 flex-shrink-0">
          <div class="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-sm" onclick="zoomImage('${clm.photoUrl}')">
            <img src="${clm.photoUrl}" alt="หลักฐานภาพถ่าย" class="w-full h-40 object-cover group-hover:scale-105 transition duration-200">
            <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold gap-1">
              <i data-lucide="zoom-in" class="w-4 h-4"></i> แตะเพื่อขยายรูป
            </div>
            <span class="absolute bottom-2 left-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              📸 ภาพหลักฐาน
            </span>
          </div>
        </div>

        <!-- Claim Information -->
        <div class="flex-1 space-y-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span class="text-xs font-bold text-red-600 uppercase">รหัสเคลม: ${clm.id}</span>
              <h4 class="text-lg font-bold text-slate-900">${clm.customerName} (${clm.customerPhone || '-'})</h4>
              <p class="text-xs text-slate-500">อ้างอิงออเดอร์: <button onclick="viewOrderSlip('${clm.orderId}')" class="text-sky-600 font-bold hover:underline">${clm.orderId}</button> • วันที่เคลม: ${formatThaiDate(clm.createdAt, true)}</p>
            </div>
            <div>${qcBadge}</div>
          </div>

          <div class="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-950 space-y-1">
            <div class="font-bold text-sm text-red-800">
              ปลาเสียหาย: ${clm.damagedItem} จำนวน ${formatNumber(clm.damagedQty)} ${clm.damagedUnit}
            </div>
            <div><strong>สาเหตุ:</strong> ${clm.cause}</div>
            <div><strong>แนวทางชดเชย:</strong> ${clm.resolutionText}</div>
            <div><strong>ผู้ตรวจสอบ/อนุมัติ:</strong> ${clm.approvedBy || '-'}</div>
          </div>

          <!-- QC Action Buttons (ขึ้นอยู่กับสิทธิ์ approve_claim) -->
          <div class="pt-2 flex items-center justify-end space-x-2">
            ${clm.qcStatus === 'pending' && canCurrentUser('approve_claim') ? `
              <button onclick="approveClaim('${clm.id}')" class="btn-large bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-4 text-xs font-bold rounded-lg shadow-sm">
                <i data-lucide="check" class="w-4 h-4"></i> อนุมัติการเคลม
              </button>
              <button onclick="rejectClaim('${clm.id}')" class="btn-large bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 px-3 text-xs font-bold rounded-lg">
                ปฏิเสธ
              </button>
            ` : ''}
          </div>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
  lucide.createIcons();
}

function approveClaim(claimId) {
  const claim = state.claims.find(c => c.id === claimId);
  if (claim) {
    claim.qcStatus = 'approved';
    claim.approvedBy = state.currentUser.name;
    saveState();
    renderClaimsList();
    showNotification(`อนุมัติการเคลม ${claimId} เรียบร้อยแล้ว`, 'success');
  }
}

function rejectClaim(claimId) {
  const claim = state.claims.find(c => c.id === claimId);
  if (claim) {
    claim.qcStatus = 'rejected';
    claim.approvedBy = state.currentUser.name;
    saveState();
    renderClaimsList();
    showNotification(`ปฏิเสธการเคลม ${claimId}`, 'info');
  }
}

// Lightbox Zoom
function zoomImage(src) {
  if (!src) return;
  const target = document.getElementById('zoom-img-target');
  if (target) {
    target.src = src;
    openModal('modal-image-zoom');
  }
}

// ====================================================================
// 7. ALL ORDERS LIST (รายการคำสั่งจองทั้งหมด)
// ====================================================================
// Sort state: 'desc' = ใหม่สุดก่อน, 'asc' = เก่าสุดก่อน
let orderDateSortDir = 'desc';

function toggleOrderDateSort() {
  orderDateSortDir = orderDateSortDir === 'desc' ? 'asc' : 'desc';
  const icon = document.getElementById('order-sort-icon');
  if (icon) icon.textContent = orderDateSortDir === 'desc' ? '↓' : '↑';
  renderOrdersList();
}

function renderOrdersList() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  const search = (document.getElementById('filter-order-search')?.value || '').toLowerCase();
  const status = document.getElementById('filter-order-status')?.value || 'all';
  const type = document.getElementById('filter-order-type')?.value || 'all';

  let filtered = state.orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search) ||
                        o.customerPhone.includes(search) ||
                        o.id.toLowerCase().includes(search) ||
                        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(search));
    const matchStatus = status === 'all' || o.status === status;
    const matchType = type === 'all' || o.deliveryType === type;
    return matchSearch && matchStatus && matchType;
  });

  // เรียงลำดับตามวันที่ส่ง
  filtered.sort((a, b) => {
    const da = a.deliveryDate ? new Date(a.deliveryDate) : new Date(0);
    const db = b.deliveryDate ? new Date(b.deliveryDate) : new Date(0);
    return orderDateSortDir === 'desc' ? db - da : da - db;
  });

  // sync icon in case renderOrdersList is called externally
  const icon = document.getElementById('order-sort-icon');
  if (icon) icon.textContent = orderDateSortDir === 'desc' ? '↓' : '↑';


  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-slate-400">
          ไม่พบรายการคำสั่งจองที่ตรงกับเงื่อนไขการค้นหา
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  filtered.forEach(o => {
    const isPickup = o.deliveryType === 'pickup';
    const statusBadge = getStatusBadgeHtml(o.status);

    html += `
      <tr class="hover:bg-slate-50/90 transition">
        <td class="py-3 px-4">
          <div class="font-bold text-sky-900 flex items-center gap-1.5">
            <span>${o.id}</span>
            ${o.editHistory && o.editHistory.length > 0 ? `
              <button onclick="viewOrderHistory('${o.id}')" title="ดูประวัติการแก้ไข (${o.editHistory.length} ครั้ง)" class="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold hover:bg-purple-200 cursor-pointer">
                📝 แก้ไข (${o.editHistory.length})
              </button>
            ` : ''}
          </div>
          <div class="text-xs text-slate-500">${formatThaiDate(o.deliveryDate)}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900">${o.customerName}</div>
          <div class="text-xs text-slate-500">${o.customerPhone}</div>
          <div class="text-[11px] text-slate-400 truncate max-w-[200px]">${isPickup ? 'รับเองหน้าฟาร์ม' : (o.deliveryAddress || '-')}</div>
        </td>
        <td class="py-3 px-4">
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${isPickup ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}">
            ${isPickup ? '🏠 รับหน้าฟาร์ม' : '🚚 จัดส่ง'}
          </span>
        </td>
        <td class="py-3 px-4">
          <div class="text-xs text-slate-700 max-w-xs space-y-0.5">
            ${o.items.map(it => `<div>• ${it.name} (${it.size || ''}) x ${formatNumber(it.qty)} ${it.unit}</div>`).join('')}
          </div>
        </td>
        <td class="py-3 px-4 text-right font-bold text-slate-900">
          ${formatMoney(o.netTotal)}
        </td>
        <td class="py-3 px-4 text-right text-xs">
          <div class="text-emerald-700">มัดจำ: ${formatMoney(o.deposit)}</div>
          <div class="font-bold text-amber-800">คงเหลือ: ${formatMoney(o.remainingBalance)}</div>
        </td>
        <td class="py-3 px-4 text-center">
          ${statusBadge}
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center space-x-1">
            ${canCurrentUser('print_slip') ? `
            <button onclick="viewOrderSlip('${o.id}')" title="ดูใบส่งของ" class="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700">
              <i data-lucide="file-text" class="w-4 h-4"></i>
            </button>
            ` : ''}
            ${canCurrentUser('edit_order') ? `
            <button onclick="openEditOrderModal('${o.id}')" title="แก้ไขการจอง (เปลี่ยนวัน/ข้อมูลสินค้า)" class="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            ` : ''}
            ${o.editHistory && o.editHistory.length > 0 ? `
              <button onclick="viewOrderHistory('${o.id}')" title="ดูประวัติการแก้ไข (${o.editHistory.length} ครั้ง)" class="p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800">
                <i data-lucide="history" class="w-4 h-4"></i>
              </button>
            ` : ''}
            ${canCurrentUser('update_delivery') ? `
            <button onclick="openDeliveryUpdateModal('${o.id}')" title="อัปเดตสถานะ" class="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700">
              <i data-lucide="truck" class="w-4 h-4"></i>
            </button>
            ` : ''}
            ${o.status !== 'cancelled' && o.status !== 'delivered' && canCurrentUser('cancel_order') ? `
            <button onclick="openCancelOrderModal('${o.id}')" title="ยกเลิกการจอง" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700">
              <i data-lucide="x-circle" class="w-4 h-4"></i>
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  lucide.createIcons();
}

// ====================================================================
// 8. CUSTOMER HISTORY & CRM (ประวัติลูกค้าตลอดชีพ & VIP)
// ====================================================================
function renderCustomersList() {
  const grid = document.getElementById('customers-grid');
  if (!grid) return;

  const search = (document.getElementById('search-customer-input')?.value || '').toLowerCase();

  const filtered = state.customers.filter(c => {
    return c.name.toLowerCase().includes(search) ||
           c.phone.includes(search) ||
           (c.address && c.address.toLowerCase().includes(search)) ||
           (c.vipTier && c.vipTier.toLowerCase().includes(search));
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full farm-card p-12 text-center text-slate-400">
        ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(cust => {
    const isVip = cust.vipTier === 'VIP' || cust.totalSpentYear >= 50000;
    const isRegular = cust.vipTier === 'Regular' || cust.orderCount >= 3;

    let tierBadge = '';
    if (isVip) {
      tierBadge = `<span class="badge-tag bg-amber-100 text-amber-900 border border-amber-300">🌟 VIP ลูกค้าคนสำคัญ</span>`;
    } else if (isRegular) {
      tierBadge = `<span class="badge-tag bg-sky-100 text-sky-900 border border-sky-300">🥈 ลูกค้าประจำ</span>`;
    } else {
      tierBadge = `<span class="badge-tag bg-slate-100 text-slate-700 border border-slate-300">🥉 ลูกค้าทั่วไป</span>`;
    }

    // Customer orders
    const custOrders = state.orders.filter(o => o.customerId === cust.id || o.customerPhone === cust.phone);

    html += `
      <div class="farm-card p-5 space-y-4 hover:border-sky-300 transition flex flex-col justify-between">
        
        <div class="space-y-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-2xl ${isVip ? 'bg-amber-500' : 'bg-sky-600'} text-white flex items-center justify-center text-xl font-bold shadow-md">
                ${cust.name.substring(0, 2)}
              </div>
              <div>
                <h4 class="font-bold text-slate-900 text-base">${cust.name}</h4>
                <a href="tel:${cust.phone}" class="text-xs text-sky-700 font-semibold hover:underline block">${cust.phone}</a>
              </div>
            </div>
            <div>${tierBadge}</div>
          </div>

          <div class="text-xs text-slate-600">
            <p class="truncate"><i data-lucide="map-pin" class="w-3.5 h-3.5 inline text-slate-400"></i> ${cust.address || 'ไม่ระบุที่อยู่'}</p>
            ${cust.notes ? `<p class="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">${cust.notes}</p>` : ''}
          </div>

          <!-- Spend Stats -->
          <div class="grid grid-cols-2 gap-2 bg-gradient-to-r from-sky-50 to-amber-50 p-3 rounded-xl border border-sky-100 text-xs">
            <div>
              <div class="text-slate-500">ยอดซื้อสะสมปีนี้:</div>
              <div class="text-base font-bold text-sky-900">${formatMoney(cust.totalSpentYear)}</div>
            </div>
            <div>
              <div class="text-slate-500">ยอดซื้อตลอดชีพ:</div>
              <div class="text-base font-bold text-amber-800">${formatMoney(cust.totalSpentLifetime)}</div>
            </div>
          </div>

          <!-- Order History Accordion / List -->
          <div class="pt-2 border-t border-slate-100">
            <div class="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>ประวัติสั่งซื้อย้อนหลัง (${custOrders.length} ครั้ง):</span>
            </div>
            <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
              ${custOrders.length > 0 ? custOrders.map(o => `
                <div class="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between hover:bg-sky-50/50 cursor-pointer" onclick="viewOrderSlip('${o.id}')">
                  <div>
                    <span class="font-bold text-sky-900">${o.id}</span>
                    <span class="text-slate-400 text-[10px]">(${formatThaiDate(o.deliveryDate)})</span>
                  </div>
                  <span class="font-bold text-slate-800">${formatMoney(o.netTotal)}</span>
                </div>
              `).join('') : '<div class="text-slate-400 italic text-[11px]">ยังไม่มีประวัติคำสั่งซื้อ</div>'}
            </div>
          </div>
        </div>

        <!-- Customer Action Button -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-400">เป็นลูกค้าตั้งแต่: ${cust.registeredAt ? formatThaiDate(cust.registeredAt) : '-'}</span>
          <div class="flex items-center gap-1.5">
            ${canCurrentUser('create_order') ? `
            <button onclick="openNewOrderForCustomer('${cust.id}')" class="btn-large btn-farm-yellow text-xs py-1.5 px-3 font-bold rounded-lg shadow-sm">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> จองพันธุ์ปลาให้ลูกค้านี้
            </button>
            ` : ''}
            ${canCurrentUser('edit_customer') ? `
            <button onclick="openEditCustomerModal('${cust.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800" title="แก้ไขข้อมูลลูกค้า">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            ` : ''}
          </div>
        </div>

      </div>
    `;
  });

  grid.innerHTML = html;
  lucide.createIcons();
}

function openNewOrderForCustomer(customerId) {
  openNewOrderModal();
  autoFillCustomerData(customerId);
}

function openEditCustomerModal(customerId) {
  const cust = state.customers.find(c => c.id === customerId);
  if (!cust) return;
  // Populate modal fields
  document.getElementById('edit-customer-id').value = cust.id;
  document.getElementById('edit-customer-name').value = cust.name || '';
  document.getElementById('edit-customer-phone').value = cust.phone || '';
  document.getElementById('edit-customer-address').value = cust.address || '';
  document.getElementById('edit-customer-notes').value = cust.notes || '';
  openModal('modal-edit-customer');
}

function saveCustomerEdits() {
  const id = document.getElementById('edit-customer-id').value;
  const cust = state.customers.find(c => c.id === id);
  if (!cust) return;
  // Update customer data
  cust.name = document.getElementById('edit-customer-name').value;
  cust.phone = document.getElementById('edit-customer-phone').value;
  cust.address = document.getElementById('edit-customer-address').value;
  cust.notes = document.getElementById('edit-customer-notes').value;
  // Persist and refresh UI
  saveState();
  renderCustomersList();
  closeModal('modal-edit-customer');
}

// ====================================================================
// 9. ANALYTICS & CEO REPORTS (สถิติฟาร์ม & ส่งออก EXCEL)
// ====================================================================
// 9. ANALYTICS & CEO REPORTS (สถิติฟาร์ม & ส่งออก EXCEL)
// ====================================================================

// State สำหรับ filter ของ Analytics
let analyticsMode = 'all'; // 'all' | 'year' | 'month'

function initAnalyticsFilters() {
  // สร้างตัวเลือกปีจากข้อมูล orders ที่มี
  const yearSelect = document.getElementById('analytics-year-select');
  if (!yearSelect) return;

  const currentYear = new Date().getFullYear();
  // รวบรวมปีที่มีในออเดอร์ (ค.ศ.) แล้วแปลงเป็น พ.ศ.
  const yearsSet = new Set();
  state.orders.forEach(o => {
    if (o.deliveryDate) {
      const y = new Date(o.deliveryDate).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    }
  });
  // เพิ่มปีปัจจุบันเสมอ
  yearsSet.add(currentYear);

  const sortedYears = [...yearsSet].sort((a, b) => b - a);
  yearSelect.innerHTML = sortedYears.map(y =>
    `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y + 543}</option>`
  ).join('');

  // ตั้งเดือนปัจจุบัน
  const monthSelect = document.getElementById('analytics-month-select');
  if (monthSelect) {
    monthSelect.value = String(new Date().getMonth() + 1);
  }
}

function setAnalyticsMode(mode) {
  analyticsMode = mode;

  // อัปเดต active style ของปุ่ม
  ['all', 'year', 'month'].forEach(m => {
    const btn = document.getElementById(`analytics-mode-${m}`);
    if (!btn) return;
    if (m === mode) {
      btn.className = 'px-4 py-2 bg-sky-600 text-white hover:bg-sky-700 transition';
    } else {
      btn.className = 'px-4 py-2 bg-white text-slate-600 hover:bg-sky-50 transition border-l border-slate-200';
    }
  });

  // แสดง/ซ่อน month picker
  const monthPicker = document.getElementById('analytics-month-picker');
  if (monthPicker) {
    monthPicker.classList.toggle('hidden', mode !== 'month');
  }

  renderAnalyticsDashboard();
}

function renderAnalyticsDashboard() {
  // ── อ่านค่า filter ──
  const yearSel = document.getElementById('analytics-year-select');
  const monthSel = document.getElementById('analytics-month-select');
  const selectedYear = yearSel ? Number(yearSel.value) : new Date().getFullYear();
  const selectedMonth = monthSel ? Number(monthSel.value) : new Date().getMonth() + 1;

  // ── กรองออเดอร์ตาม mode ──
  let filteredOrders = state.orders;
  if (analyticsMode === 'year') {
    filteredOrders = state.orders.filter(o => {
      if (!o.deliveryDate) return false;
      return new Date(o.deliveryDate).getFullYear() === selectedYear;
    });
  } else if (analyticsMode === 'month') {
    filteredOrders = state.orders.filter(o => {
      if (!o.deliveryDate) return false;
      const d = new Date(o.deliveryDate);
      return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    });
  }

  // กรอง claims ตาม mode เช่นกัน
  let filteredClaims = state.claims;
  if (analyticsMode === 'year') {
    filteredClaims = state.claims.filter(c => {
      if (!c.createdAt) return false;
      return new Date(c.createdAt).getFullYear() === selectedYear;
    });
  } else if (analyticsMode === 'month') {
    filteredClaims = state.claims.filter(c => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    });
  }

  // ── คำนวณ KPI ──
  let totalSales = 0;
  let totalDeposit = 0;
  let totalClaimsAmt = 0;
  const productCountMap = {};

  filteredOrders.forEach(o => {
    totalSales += Number(o.netTotal || 0);
    totalDeposit += Number(o.deposit || 0);

    o.items.forEach(it => {
      const key = `${it.name} ${it.size ? `(${it.size})` : ''}`;
      if (!productCountMap[key]) {
        productCountMap[key] = {
          name: it.name,
          size: it.size || '',
          qty: 0,
          unit: it.unit,
          salesAmt: 0
        };
      }
      productCountMap[key].qty += Number(it.qty || 0);
      productCountMap[key].salesAmt += Number(it.totalPrice || 0);
    });
  });

  filteredClaims.forEach(c => {
    totalClaimsAmt += Number(c.claimAmount || 0);
  });

  // ── อัปเดต label KPI ตาม mode ──
  const thaiMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  let periodLabel = '';
  let labelSuffix = '';
  if (analyticsMode === 'year') {
    periodLabel = `📅 ปี พ.ศ. ${selectedYear + 543}`;
    labelSuffix = `ปี ${selectedYear + 543}`;
  } else if (analyticsMode === 'month') {
    periodLabel = `📅 ${thaiMonths[selectedMonth]} ${selectedYear + 543}`;
    labelSuffix = `${thaiMonths[selectedMonth]} ${selectedYear + 543}`;
  } else {
    periodLabel = '📋 ทุกช่วงเวลา (ทั้งหมด)';
    labelSuffix = 'ทั้งหมด';
  }

  const periodLabelEl = document.getElementById('analytics-period-label');
  if (periodLabelEl) periodLabelEl.textContent = periodLabel;

  const setSafe = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setSafe('kpi-label-sales', `ยอดขายรวม (${labelSuffix})`);
  setSafe('kpi-label-deposit', `ยอดมัดจำ (${labelSuffix})`);
  setSafe('kpi-label-orders', `จำนวนออเดอร์ (${labelSuffix})`);
  setSafe('kpi-label-claims', `มูลค่าเคลม (${labelSuffix})`);

  // ── แสดงค่า KPI ──
  setSafe('kpi-total-sales', formatMoney(totalSales));
  setSafe('kpi-total-deposit', formatMoney(totalDeposit));
  setSafe('kpi-total-orders', `${filteredOrders.length} รายการ`);
  setSafe('kpi-total-claims', formatMoney(totalClaimsAmt));

  // ── Top Products ──
  const topProducts = Object.values(productCountMap).sort((a, b) => b.salesAmt - a.salesAmt).slice(0, 5);
  const prodContainer = document.getElementById('top-products-list');
  if (prodContainer) {
    if (topProducts.length === 0) {
      prodContainer.innerHTML = '<div class="text-sm text-slate-400 italic">ยังไม่มีข้อมูลยอดขายสินค้าในช่วงนี้</div>';
    } else {
      let pHtml = '';
      topProducts.forEach((p, idx) => {
        pHtml += `
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div class="flex items-center space-x-3">
              <span class="w-7 h-7 rounded-lg ${idx === 0 ? 'bg-amber-400 text-amber-950 font-black' : 'bg-slate-200 text-slate-700 font-bold'} text-xs flex items-center justify-center">
                ${idx + 1}
              </span>
              <div>
                <div class="font-bold text-slate-900 text-sm">${p.name}</div>
                <div class="text-xs text-slate-500">${p.size ? 'ขนาด: ' + p.size : ''} • รวม ${formatNumber(p.qty)} ${p.unit}</div>
              </div>
            </div>
            <div class="text-right font-bold text-sky-800 text-sm">
              ${formatMoney(p.salesAmt)}
            </div>
          </div>
        `;
      });
      prodContainer.innerHTML = pHtml;
    }
  }

  // ── Top VIP Clients ──
  // คำนวณยอดซื้อลูกค้าในช่วงที่กรองจาก filteredOrders
  const customerSpendMap = {};
  filteredOrders.forEach(o => {
    const cKey = o.customerId || o.customerPhone;
    if (!cKey) return;
    if (!customerSpendMap[cKey]) {
      customerSpendMap[cKey] = { name: o.customerName, phone: o.customerPhone, spent: 0, count: 0 };
    }
    customerSpendMap[cKey].spent += Number(o.netTotal || 0);
    customerSpendMap[cKey].count++;
  });
  const topClients = Object.values(customerSpendMap).sort((a, b) => b.spent - a.spent).slice(0, 5);

  const custContainer = document.getElementById('top-customers-list');
  if (custContainer) {
    if (topClients.length === 0) {
      custContainer.innerHTML = '<div class="text-sm text-slate-400 italic">ยังไม่มีข้อมูลลูกค้าในช่วงนี้</div>';
    } else {
      let cHtml = '';
      topClients.forEach((c, idx) => {
        cHtml += `
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div class="flex items-center space-x-3">
              <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                ${idx === 0 ? '👑' : (idx + 1)}
              </span>
              <div>
                <div class="font-bold text-slate-900 text-sm">${c.name}</div>
                <div class="text-xs text-slate-500">โทร: ${c.phone} • สั่งซื้อ ${c.count} ครั้ง</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-amber-800 text-sm">${formatMoney(c.spent)}</div>
              <span class="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">ช่วงนี้</span>
            </div>
          </div>
        `;
      });
      custContainer.innerHTML = cHtml;
    }
  }
}


// Export Orders to Excel (.xlsx)
function exportOrdersToExcel() {
  try {
    const rows = state.orders.map(o => ({
      'รหัสการจอง': o.id,
      'วันที่ส่งมอบ': o.deliveryDate,
      'ช่วงเวลานัด': o.deliveryTimeSlot,
      'ชื่อลูกค้า': o.customerName,
      'เบอร์โทร': o.customerPhone,
      'รูปแบบ': o.deliveryType === 'pickup' ? 'รับเองหน้าฟาร์ม' : 'จัดส่งถึงที่',
      'ที่อยู่จัดส่ง': o.deliveryAddress,
      'รายการสินค้า': o.items.map(i => `${i.name} (${i.size || ''}) x ${i.qty} ${i.unit}`).join('; '),
      'ราคารวมปกติ': o.grossTotal,
      'รวมส่วนลด': o.totalDiscount,
      'ยอดสุทธิ': o.netTotal,
      'เงินมัดจำ': o.deposit,
      'ยอดคงเหลือ': o.remainingBalance,
      'สถานะการจัดส่ง': o.status,
      'จำนวนครั้งที่แก้ไข': (o.editHistory ? o.editHistory.length : 0),
      'ผู้แก้ไขล่าสุด': (o.editHistory && o.editHistory.length > 0 ? o.editHistory[0].editorName : '-'),
      'เหตุผลการแก้ไขล่าสุด': (o.editHistory && o.editHistory.length > 0 ? o.editHistory[0].reason : '-'),
      'ช่องทางชำระเงิน': o.paymentMethod,
      'คนขับรถ': o.driverName,
      'หมายเหตุ': o.notes
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายการสั่งจองพันธุ์ปลา');
    XLSX.writeFile(wb, `รายงานการจองพันธุ์ปลา_ฟาร์มปลาผู้ใหญ่พร_${getTodayString()}.xlsx`);

    showNotification('ดาวน์โหลดไฟล์ Excel สำเร็จแล้ว', 'success');
  } catch (err) {
    console.error('Export error:', err);
    alert('เกิดข้อผิดพลาดในการส่งออก Excel: ' + err.message);
  }
}

// Export Customers to Excel (.xlsx)
function exportCustomersToExcel() {
  try {
    const rows = state.customers.map(c => ({
      'รหัสลูกค้า': c.id,
      'ชื่อ-นามสกุล': c.name,
      'เบอร์โทรศัพท์': c.phone,
      'ที่อยู่/สถานที่': c.address,
      'ลิงก์ Google Maps': c.mapsUrl,
      'เกรดลูกค้า': c.vipTier,
      'จำนวนครั้งที่สั่ง': c.orderCount,
      'ยอดซื้อสะสมปีนี้ (บาท)': c.totalSpentYear,
      'ยอดซื้อสะสมตลอดชีพ (บาท)': c.totalSpentLifetime,
      'วันที่บันทึกครั้งแรก': c.registeredAt,
      'หมายเหตุลูกค้า': c.notes
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อลูกค้าและ VIP');
    XLSX.writeFile(wb, `ฐานข้อมูลลูกค้า_ฟาร์มปลาผู้ใหญ่พร_${getTodayString()}.xlsx`);

    showNotification('ส่งออกรายชื่อลูกค้าเป็น Excel สำเร็จแล้ว', 'success');
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการส่งออก Excel: ' + err.message);
  }
}

// Export Full Annual Farm Report to Excel
function exportFullReportExcel() {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Orders
    const orderRows = state.orders.map(o => ({
      'รหัสจอง': o.id,
      'วันที่ส่ง': o.deliveryDate,
      'ลูกค้า': o.customerName,
      'เบอร์โทร': o.customerPhone,
      'ประเภท': o.deliveryType === 'pickup' ? 'รับเองหน้าฟาร์ม' : 'จัดส่ง',
      'ยอดสุทธิ (บาท)': o.netTotal,
      'มัดจำแล้ว (บาท)': o.deposit,
      'ยอดคงเหลือ (บาท)': o.remainingBalance,
      'สถานะ': o.status
    }));
    const wsOrders = XLSX.utils.json_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'คำสั่งจองทั้งหมด');

    // Sheet 2: Customers
    const custRows = state.customers.map(c => ({
      'ชื่อลูกค้า': c.name,
      'เบอร์โทร': c.phone,
      'ระดับ VIP': c.vipTier,
      'ยอดซื้อปีนี้': c.totalSpentYear,
      'ยอดซื้อตลอดชีพ': c.totalSpentLifetime
    }));
    const wsCust = XLSX.utils.json_to_sheet(custRows);
    XLSX.utils.book_append_sheet(wb, wsCust, 'ประวัติและยอดซื้อลูกค้า');

    // Sheet 3: Claims
    const claimRows = state.claims.map(cl => ({
      'รหัสเคลม': cl.id,
      'อ้างอิงออเดอร์': cl.orderId,
      'ลูกค้า': cl.customerName,
      'สินค้าเสียหาย': cl.damagedItem,
      'จำนวน': cl.damagedQty,
      'หน่วย': cl.damagedUnit,
      'สาเหตุ': cl.cause,
      'มูลค่าชดเชย': cl.claimAmount,
      'แนวทางชดเชย': cl.resolutionText,
      'สถานะ QC': cl.qcStatus
    }));
    const wsClaims = XLSX.utils.json_to_sheet(claimRows);
    XLSX.utils.book_append_sheet(wb, wsClaims, 'รายงานเคลมสินค้า');

    XLSX.writeFile(wb, `รายงานสรุปภาพรวมฟาร์มปลาผู้ใหญ่พร_ประจำปี_${state.currentYear + 543}.xlsx`);
    showNotification('ดาวน์โหลดรายงานสรุปประจำปี (.xlsx) สำเร็จแล้ว', 'success');
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel: ' + err.message);
  }
}

// ====================================================================
// MODAL & NOTIFICATION HELPERS
// ====================================================================
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  lucide.createIcons();
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

// Toast Notification
function showNotification(msg, type = 'info') {
  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-sky-700');

  toast.className = `fixed bottom-5 right-5 z-50 text-white ${bgClass} px-5 py-3.5 rounded-xl shadow-2xl font-bold text-sm flex items-center space-x-2 transition-all duration-300 transform translate-y-4 opacity-0`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '📢'}</span> <span>${msg}</span>`;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 50);

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Setup Keyboard & Modal dismissals
function setupEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('[id^="modal-"]:not(.hidden)');
      openModals.forEach(m => closeModal(m.id));
    }
  });
}

// ====================================================================
// 10. ROLE PERMISSIONS MANAGEMENT (ระบบจัดการสิทธิ์ - CEO ONLY)
// ====================================================================

// รายการสิทธิ์ทั้งหมดที่มีในระบบ
const PERMISSION_DEFINITIONS = [
  {
    key: 'create_order',
    name: 'สร้างรายการจองพันธุ์ปลาใหม่',
    description: 'เปิดฟอร์มสร้างใบจองใหม่ และจองให้ลูกค้า'
  },
  {
    key: 'edit_order',
    name: 'แก้ไขข้อมูลการจองพันธุ์ปลา',
    description: 'แก้ไขวันส่ง, ชนิดปลา, ไซส์, จำนวน และยอดเงิน (Audit Trail)'
  },
  {
    key: 'cancel_order',
    name: 'ยกเลิกคำสั่งจอง (Cancel Order)',
    description: 'ยกเลิกออเดอร์พร้อมระบุเหตุผลในการยกเลิก'
  },
  {
    key: 'update_delivery',
    name: 'อัปเดตสถานะจัดส่ง & รับเงินหน้างาน',
    description: 'เปลี่ยนสถานะการส่ง (กำลังเตรียม/เดินทาง/ส่งมอบ) และแนบสลิป'
  },
  {
    key: 'create_claim',
    name: 'บันทึกแจ้งเคลมปลาเสียหาย',
    description: 'เปิดฟอร์มแจ้งเคลม แนบรูปถ่าย/วิดีโอปลาเสียหาย'
  },
  {
    key: 'approve_claim',
    name: 'ตรวจสอบและอนุมัติ/ปฏิเสธการเคลม',
    description: 'ปุ่มกดอนุมัติหรือปฏิเสธคำขอเคลมปลา'
  },
  {
    key: 'edit_customer',
    name: 'แก้ไขข้อมูลลูกค้า (CRM)',
    description: 'แก้ไขชื่อ, เบอร์โทร, ที่อยู่ และหมายเหตุลูกค้า'
  },
  {
    key: 'print_slip',
    name: 'พิมพ์ / ส่งใบจอง-ใบส่งของ (LINE/PDF)',
    description: 'ดูเอกสารสรุปใบจอง สั่งพิมพ์ หรือแชร์เข้า LINE'
  }
];

// ค่าสิทธิ์เริ่มต้นตามตาราง
function getDefaultPermissions() {
  return {
    CEO: {
      create_order: true,
      edit_order: true,
      cancel_order: true,
      update_delivery: true,
      create_claim: true,
      approve_claim: true,
      edit_customer: true,
      print_slip: true
    },
    Manager: {
      create_order: true,
      edit_order: true,
      cancel_order: true,
      update_delivery: true,
      create_claim: true,
      approve_claim: true,
      edit_customer: true,
      print_slip: true
    },
    QC: {
      create_order: true,
      edit_order: true,
      cancel_order: true,
      update_delivery: true,
      create_claim: true,
      approve_claim: true,
      edit_customer: true,
      print_slip: true
    },
    Driver: {
      create_order: false,
      edit_order: false,
      cancel_order: false,
      update_delivery: true,
      create_claim: true,
      approve_claim: false,
      edit_customer: false,
      print_slip: true
    }
  };
}

// ตรวจสอบสิทธิ์ผู้ใช้ปัจจุบัน (ถ้าเป็น CEO อนุญาตเสมอ)
function canCurrentUser(actionKey) {
  if (!state.currentUser) return false;
  const role = state.currentUser.role;
  if (role === 'CEO') return true;

  if (!state.permissions) {
    state.permissions = getDefaultPermissions();
  }
  const rolePerms = state.permissions[role];
  if (!rolePerms) return false;
  return rolePerms[actionKey] === true;
}

// วาดตารางจัดการสิทธิ์ (Matrix Table)
function renderPermissionsTable() {
  const tbody = document.getElementById('permissions-table-body');
  if (!tbody) return;

  if (!state.permissions) {
    state.permissions = getDefaultPermissions();
  }

  const roles = [
    { key: 'CEO', label: 'CEO', locked: true },
    { key: 'Manager', label: 'ผู้จัดการ', locked: false },
    { key: 'QC', label: 'หัวหน้า QC', locked: false },
    { key: 'Driver', label: 'คนขับรถ', locked: false }
  ];

  let html = '';
  PERMISSION_DEFINITIONS.forEach(perm => {
    html += `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800 text-sm">${perm.name}</div>
          <div class="text-xs text-slate-400 mt-0.5">${perm.description}</div>
        </td>
    `;

    roles.forEach(role => {
      const allowed = state.permissions[role.key] && state.permissions[role.key][perm.key] === true;
      if (role.locked) {
        // CEO ล็อคเสมอ เป็นผู้มีสิทธิ์สูงสุด
        html += `
          <td class="py-3 px-3 text-center bg-amber-50/40">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm shadow-sm cursor-not-allowed" title="CEO มีสิทธิ์เต็มเสมอ">
              ✓
            </span>
          </td>
        `;
      } else {
        html += `
          <td class="py-3 px-3 text-center">
            <label class="inline-flex items-center justify-center cursor-pointer select-none">
              <input type="checkbox" 
                ${allowed ? 'checked' : ''} 
                onchange="toggleRolePermission('${role.key}', '${perm.key}', this.checked)"
                class="w-5 h-5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer transition">
            </label>
          </td>
        `;
      }
    });

    html += `</tr>`;
  });

  tbody.innerHTML = html;
  lucide.createIcons();
}

// สลับสิทธิ์ (Toggle Permission)
function toggleRolePermission(roleKey, actionKey, isEnabled) {
  if (state.currentUser.role !== 'CEO') {
    showNotification('ไม่อนุญาต: สิทธิ์เฉพาะ CEO เท่านั้น', 'error');
    renderPermissionsTable();
    return;
  }

  if (!state.permissions) {
    state.permissions = getDefaultPermissions();
  }
  if (!state.permissions[roleKey]) {
    state.permissions[roleKey] = {};
  }
  state.permissions[roleKey][actionKey] = isEnabled;
  saveState();

  const roleLabel = DEFAULT_USERS.find(u => u.role === roleKey)?.roleLabel || roleKey;
  const permDef = PERMISSION_DEFINITIONS.find(p => p.key === actionKey);
  const statusText = isEnabled ? 'เปิดใช้งาน' : 'ปิดการใช้งาน';
  showNotification(`บันทึกแล้ว: ${statusText} "${permDef ? permDef.name : actionKey}" สำหรับ ${roleLabel}`, isEnabled ? 'success' : 'info');
}

// คืนค่าเริ่มต้นของสิทธิ์ทั้งหมด
function resetPermissionsToDefault() {
  if (state.currentUser.role !== 'CEO') {
    showNotification('สิทธิ์เฉพาะ CEO เท่านั้น', 'error');
    return;
  }

  if (confirm('คุณต้องการรีเซ็ตสิทธิ์ของทุกบทบาทให้กลับเป็นค่าเริ่มต้นหรือไม่?')) {
    state.permissions = getDefaultPermissions();
    saveState();
    renderPermissionsTable();
    showNotification('คืนค่าสิทธิ์เริ่มต้นเรียบร้อยแล้ว', 'success');
  }
}

// ====================================================================
// 11. DRIVER MANAGEMENT (ระบบจัดการรายชื่อคนขับรถส่งของ)
// ====================================================================

// รายชื่อคนขับรถเริ่มต้น
function getDefaultDrivers() {
  return [
    {
      id: 'drv_boonmee',
      userId: 'usr_driver',
      name: 'พี่บุญมี',
      phone: '089-996-5569',
      vehicle: 'รถกระบะ ป้ายทะเบียน บธ-4512 ปราจีนบุรี',
      email: 'driver@phuyaiporn.farm',
      password: 'driver1234',
      status: 'active'
    },
    {
      id: 'drv_somkuan',
      userId: null,
      name: 'น้าสมควร',
      phone: '081-928-6697',
      vehicle: 'รถกระบะตอนเดียว ทะเบียน ผข-7890 อยุธยา',
      email: 'driver2@phuyaiporn.farm',
      password: 'driver1234',
      status: 'active'
    }
  ];
}

// วาดการ์ดรายชื่อคนขับรถในหน้า สิทธิ์การใช้งาน (CEO)
function renderDriversList() {
  const container = document.getElementById('drivers-list-grid');
  if (!container) return;

  if (!state.drivers || state.drivers.length === 0) {
    state.drivers = getDefaultDrivers();
  }

  container.innerHTML = state.drivers.map(drv => {
    const isActive = drv.status === 'active';
    // นับงานวันนี้
    const today = getTodayString();
    const todayJobs = state.orders.filter(o => o.deliveryDate === today && o.driverName && o.driverName.includes(drv.name) && o.status !== 'cancelled');

    return `
      <div class="p-4 rounded-xl border ${isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'} shadow-sm space-y-3 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-lg">
                🚚
              </div>
              <div>
                <h4 class="font-bold text-slate-900 text-base leading-tight">${drv.name}</h4>
                <a href="tel:${drv.phone}" class="text-xs text-sky-700 font-semibold hover:underline">${drv.phone}</a>
              </div>
            </div>
            <span class="badge-tag text-[10px] py-0.5 px-2 ${isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'}">
              ${isActive ? '🟢 พร้อมวิ่งงาน' : '🔴 ระงับชั่วคราว'}
            </span>
          </div>

          <div class="mt-3 text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div><span class="text-slate-400">รถ/ทะเบียน:</span> <strong class="text-slate-700">${drv.vehicle || '-'}</strong></div>
            <div><span class="text-slate-400">อีเมลล็อกอิน:</span> <span class="text-slate-600">${drv.email || '-'}</span></div>
            <div class="text-[11px] text-amber-800 font-semibold pt-1 border-t border-slate-200">
              📅 วันนี้มีคิวส่ง: ${todayJobs.length} รายการ
            </div>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onclick="toggleDriverStatus('${drv.id}')" class="text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${isActive ? 'text-rose-600 hover:bg-rose-50 border-rose-200' : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'}">
            ${isActive ? 'ระงับการใช้งาน' : 'เปิดใช้งาน'}
          </button>
          <button onclick="openEditDriverModal('${drv.id}')" class="btn-large bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs py-1.5 px-3 rounded-lg font-bold border border-orange-200 flex items-center gap-1">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-orange-700"></i>
            <span>แก้ไข</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// อัปเดต dropdown พนักงานขับรถในฟอร์มจอง/แก้ไข
function populateDriverDropdown() {
  const select = document.getElementById('order-driver-select');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">-- ยังไม่ได้ระบุ / จัดคนขับภายหลัง --</option>';

  if (!state.drivers || state.drivers.length === 0) {
    state.drivers = getDefaultDrivers();
  }

  state.drivers.filter(d => d.status === 'active').forEach(drv => {
    const opt = document.createElement('option');
    opt.value = `${drv.name} (${drv.vehicle || drv.phone})`;
    opt.textContent = `🚚 ${drv.name} - ${drv.vehicle || drv.phone}`;
    if (opt.value === currentVal) opt.selected = true;
    select.appendChild(opt);
  });
}

// เปิด Modal เพิ่มคนขับใหม่
function openAddDriverModal() {
  document.getElementById('driver-edit-id').value = '';
  document.getElementById('modal-driver-title').textContent = 'เพิ่มพนักงานขับรถส่งของใหม่';
  document.getElementById('driver-name-input').value = '';
  document.getElementById('driver-phone-input').value = '';
  document.getElementById('driver-vehicle-input').value = '';
  document.getElementById('driver-email-input').value = '';
  document.getElementById('driver-password-input').value = 'driver1234';
  document.getElementById('driver-status-input').value = 'active';

  openModal('modal-driver');
}

// เปิด Modal แก้ไขข้อมูลคนขับ
function openEditDriverModal(driverId) {
  const drv = state.drivers.find(d => d.id === driverId);
  if (!drv) return;

  document.getElementById('driver-edit-id').value = drv.id;
  document.getElementById('modal-driver-title').textContent = `แก้ไขข้อมูล: ${drv.name}`;
  document.getElementById('driver-name-input').value = drv.name;
  document.getElementById('driver-phone-input').value = drv.phone;
  document.getElementById('driver-vehicle-input').value = drv.vehicle || '';
  document.getElementById('driver-email-input').value = drv.email || '';
  document.getElementById('driver-password-input').value = drv.password || 'driver1234';
  document.getElementById('driver-status-input').value = drv.status || 'active';

  openModal('modal-driver');
}

// บันทึกข้อมูลคนขับรถ (เพิ่ม/แก้ไข)
function saveDriverData() {
  const name = document.getElementById('driver-name-input').value.trim();
  const phone = document.getElementById('driver-phone-input').value.trim();
  const vehicle = document.getElementById('driver-vehicle-input').value.trim();
  const email = document.getElementById('driver-email-input').value.trim();
  const password = document.getElementById('driver-password-input').value.trim();
  const status = document.getElementById('driver-status-input').value;
  const editId = document.getElementById('driver-edit-id').value;

  if (!name) {
    alert('กรุณากรอกชื่อพนักงานขับรถ');
    document.getElementById('driver-name-input').focus();
    return;
  }
  if (!phone) {
    alert('กรุณากรอกเบอร์โทรศัพท์');
    document.getElementById('driver-phone-input').focus();
    return;
  }

  if (!state.drivers) {
    state.drivers = getDefaultDrivers();
  }

  if (editId) {
    // แก้ไขข้อมูลเดิม
    const drv = state.drivers.find(d => d.id === editId);
    if (drv) {
      const oldName = drv.name;
      drv.name = name;
      drv.phone = phone;
      drv.vehicle = vehicle;
      drv.email = email;
      drv.password = password;
      drv.status = status;

      // อัปเดตใน DEFAULT_USERS ถ้ามีบัญชีล็อกอินตรงกัน
      const user = DEFAULT_USERS.find(u => u.id === drv.userId || (u.email && u.email.toLowerCase() === email.toLowerCase()));
      if (user) {
        user.name = `${name} (คนขับรถส่งปลา)`;
        user.email = email || user.email;
        user.password = password || user.password;
      }

      showNotification(`อัปเดตข้อมูล ${name} เรียบร้อยแล้ว`, 'success');
    }
  } else {
    // เพิ่มคนขับใหม่
    const newId = 'drv_' + Date.now();
    const newDriver = {
      id: newId,
      userId: null,
      name,
      phone,
      vehicle,
      email,
      password: password || 'driver1234',
      status
    };
    state.drivers.push(newDriver);

    // ถ้ามีอีเมลให้เพิ่มใน DEFAULT_USERS เพื่อให้ล็อกอินได้
    if (email) {
      const newUser = {
        id: 'usr_' + Date.now(),
        name: `${name} (คนขับรถส่งปลา)`,
        email: email.toLowerCase(),
        password: password || 'driver1234',
        role: 'Driver',
        roleLabel: 'พนักงานขับรถส่งของ',
        badgeColor: 'bg-orange-500 text-white',
        avatar: '🚚'
      };
      DEFAULT_USERS.push(newUser);
      newDriver.userId = newUser.id;
      setupRoleButtons();
    }

    showNotification(`เพิ่มพนักงานขับรถ ${name} เรียบร้อยแล้ว`, 'success');
  }

  saveState();
  closeModal('modal-driver');
  renderDriversList();
  populateDriverDropdown();
}

// สลับสถานะเปิด/ระงับใช้งานคนขับ
function toggleDriverStatus(driverId) {
  const drv = state.drivers.find(d => d.id === driverId);
  if (!drv) return;

  drv.status = drv.status === 'active' ? 'inactive' : 'active';
  saveState();
  renderDriversList();
  populateDriverDropdown();
  showNotification(`${drv.status === 'active' ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'} ${drv.name} แล้ว`, 'info');
}
