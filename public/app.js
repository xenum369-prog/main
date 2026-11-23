(() => {
  'use strict';
  const app = document.getElementById('app');
  const languageKey = 'fieldwork-language';
  let language = localStorage.getItem(languageKey) || 'en';
  let currentUser = null;
  let currentPage = 'dashboard';
  let banner = null;

  const translations = {
    en: {
      home: 'Overview', assets: 'Assets', requests: 'Requests', workOrders: 'Work orders',
      inventory: 'Inventory', audit: 'Audit log', notifications: 'Notifications',
      overview: 'Operations overview', hello: 'A clear view of today’s maintenance work.',
      assetsCount: 'Registered assets', openRequests: 'Requests to review', openOrders: 'Open work orders',
      assignments: 'My open assignments', lowStock: 'Items at reorder level', workload: 'Technician workload',
      workloadHint: 'Open assignments by technician', recentWork: 'Active work orders',
      recentRequests: 'Latest requests', emptyTitle: 'Nothing here yet', empty: 'Records will appear here as work is logged.',
      signIn: 'Sign in to your workspace', signInSub: 'Use your organization account to continue.',
      username: 'Username', password: 'Password', passwordConfirmation: 'Confirm password',
      displayName: 'Your name', createAdmin: 'Create initial administrator', createAccount: 'Create administrator',
      login: 'Sign in', logout: 'Sign out', language: 'العربية', location: 'North campus',
      role: 'Role', reference: 'Reference', asset: 'Asset', priority: 'Priority', status: 'Status',
      requester: 'Requester', submitted: 'Submitted', title: 'Issue summary', description: 'Describe the issue',
      category: 'Category', assetCode: 'Asset code', assetName: 'Asset name', criticality: 'Criticality',
      createAsset: 'Add asset', createRequest: 'Submit request', newAsset: 'Register an asset',
      newRequest: 'New maintenance request', searchAsset: 'No specific asset', urgent: 'Urgent',
      normal: 'Normal', high: 'High', low: 'Low', approved: 'Approved', rejected: 'Rejected',
      converted: 'Converted', assigned: 'Assigned', complete: 'Complete', verified: 'Verified',
      noAssets: 'No assets recorded', addFirstAsset: 'Register the first asset to start building your register.',
      review: 'Review', approve: 'Approve', reject: 'Reject', convert: 'Create work order',
      assign: 'Assign technician', technician: 'Technician', unassigned: 'Unassigned',
      start: 'Start work', hold: 'Put on hold', resume: 'Resume work', markComplete: 'Complete work',
      verify: 'Verify', close: 'Close work order', completionNotes: 'Completion notes',
      checklist: 'Inspection checklist', required: 'Required',       inventoryTitle: 'Parts & stock', partName: 'Part name',
      stock: 'On hand', reserved: 'Reserved', available: 'Available', reorder: 'Reorder at',
      movement: 'Record stock movement', receive: 'Receive', issue: 'Issue', reserve: 'Reserve',
      quantity: 'Quantity', reason: 'Reason / reference', forWorkOrder: 'Work order (for reservation)',
      noPart: 'No inventory items', addStock: 'Inventory becomes available when configured.',
      auditTitle: 'Recent auditable activity', event: 'Event', record: 'Record', actor: 'Actor',
      time: 'Time', noAudit: 'No audit events', notificationsTitle: 'Your notifications',
      markRead: 'Mark read', noNotifications: 'You are all caught up.', new: 'New',
      dataNote: 'Data is stored locally on this development server.', signInError: 'Could not sign in.',
      demoNote: 'Demo accounts are available only when the server is started with the demo-data option.',
      bootstrapNote: 'Choose a unique username and a strong password of at least 12 characters.',
      roleAdmin: 'Administrator', roleManager: 'Maintenance manager', roleSupervisor: 'Supervisor',
      roleTechnician: 'Technician', roleRequester: 'Requester', roleStorekeeper: 'Storekeeper',
      noAccess: 'You do not have access to this section.', chooseTechnician: 'Choose a technician',
      dueToday: 'Live counts from your authorized records', noKpi: 'No matching records yet',
      edit: 'Edit', newPart: 'Add inventory item', release: 'Release reservation',
      movementHistory: 'Recent stock movements',
      archive: 'Archive', confirmArchive: 'Archive this asset? It will be hidden from the active register.',
      reassign: 'Reassign', needsAttention: 'Needs attention', outOfService: 'Out of service',
      critical: 'High', operational: 'Operational', workProgress: 'Work in progress',
      noTechnicians: 'No technician assignments', items: 'items', loginTitle: 'Maintenance, in good order.',
      loginStory: 'A shared workspace for requests, assets, work orders and stock—built for clear handoffs.',
      rejectPrompt: 'Why is this request being rejected?', actionFailed: 'That action could not be completed.',
      languageLabel: 'Switch language', mobileMenu: 'Open navigation', noRecords: 'No records yet',
      signInTag: 'MAINTENANCE OPERATIONS', newWorkOrder: 'Create work order',
    },
    ar: {
      home: 'نظرة عامة', assets: 'الأصول', requests: 'الطلبات', workOrders: 'أوامر العمل',
      inventory: 'المخزون', audit: 'سجل التدقيق', notifications: 'الإشعارات',
      overview: 'نظرة عامة على العمليات', hello: 'عرض واضح لأعمال الصيانة اليوم.',
      assetsCount: 'الأصول المسجلة', openRequests: 'طلبات قيد المراجعة', openOrders: 'أوامر العمل المفتوحة',
      assignments: 'مهامي المفتوحة', lowStock: 'أصناف عند حد إعادة الطلب', workload: 'عبء عمل الفنيين',
      workloadHint: 'المهام المفتوحة لكل فني', recentWork: 'أوامر العمل النشطة',
      recentRequests: 'أحدث الطلبات', emptyTitle: 'لا توجد بيانات بعد', empty: 'ستظهر السجلات هنا عند تسجيل العمل.',
      signIn: 'سجّل الدخول إلى مساحة عملك', signInSub: 'استخدم حساب مؤسستك للمتابعة.',
      username: 'اسم المستخدم', password: 'كلمة المرور', passwordConfirmation: 'تأكيد كلمة المرور',
      displayName: 'اسمك', createAdmin: 'إنشاء المسؤول الأول', createAccount: 'إنشاء المسؤول',
      login: 'تسجيل الدخول', logout: 'تسجيل الخروج', language: 'English', location: 'الحرم الشمالي',
      role: 'الدور', reference: 'المرجع', asset: 'الأصل', priority: 'الأولوية', status: 'الحالة',
      requester: 'مقدم الطلب', submitted: 'مُرسل', title: 'ملخص المشكلة', description: 'صف المشكلة',
      category: 'الفئة', assetCode: 'رمز الأصل', assetName: 'اسم الأصل', criticality: 'الأهمية',
      createAsset: 'إضافة أصل', createRequest: 'إرسال الطلب', newAsset: 'تسجيل أصل',
      newRequest: 'طلب صيانة جديد', searchAsset: 'لا يوجد أصل محدد', urgent: 'عاجل',
      normal: 'عادي', high: 'مرتفع', low: 'منخفض', approved: 'تمت الموافقة', rejected: 'مرفوض',
      converted: 'تم التحويل', assigned: 'مُسند', complete: 'مكتمل', verified: 'تم التحقق',
      noAssets: 'لا توجد أصول مسجلة', addFirstAsset: 'سجّل الأصل الأول لبدء إنشاء سجل الأصول.',
      review: 'مراجعة', approve: 'موافقة', reject: 'رفض', convert: 'إنشاء أمر عمل',
      assign: 'إسناد فني', technician: 'الفني', unassigned: 'غير مسند', start: 'بدء العمل',
      hold: 'تعليق العمل', resume: 'استئناف العمل', markComplete: 'إنهاء العمل',
      verify: 'تحقق', close: 'إغلاق أمر العمل', completionNotes: 'ملاحظات الإنجاز',
      checklist: 'قائمة الفحص', required: 'مطلوب',       inventoryTitle: 'قطع الغيار والمخزون', partName: 'اسم الصنف',
      stock: 'المتوفر', reserved: 'محجوز', available: 'المتاح', reorder: 'حد إعادة الطلب',
      movement: 'تسجيل حركة مخزون', receive: 'استلام', issue: 'صرف', reserve: 'حجز',
      quantity: 'الكمية', reason: 'السبب / المرجع', forWorkOrder: 'أمر العمل (للحجز)',
      noPart: 'لا توجد أصناف مخزون', addStock: 'سيظهر المخزون عند الإعداد.',
      auditTitle: 'النشاط الأخير القابل للتدقيق', event: 'الحدث', record: 'السجل', actor: 'المنفذ',
      time: 'الوقت', noAudit: 'لا توجد أحداث تدقيق', notificationsTitle: 'إشعاراتك',
      markRead: 'تحديد كمقروء', noNotifications: 'لا توجد إشعارات جديدة.', new: 'جديد',
      dataNote: 'تُحفظ البيانات محلياً على خادم التطوير هذا.', signInError: 'تعذر تسجيل الدخول.',
      demoNote: 'حسابات العرض متاحة فقط عند تشغيل الخادم بخيار بيانات العرض.',
      bootstrapNote: 'اختر اسم مستخدم فريداً وكلمة مرور قوية لا تقل عن 12 حرفاً.',
      roleAdmin: 'مسؤول النظام', roleManager: 'مدير الصيانة', roleSupervisor: 'مشرف',
      roleTechnician: 'فني', roleRequester: 'مقدم طلب', roleStorekeeper: 'مسؤول المخزون',
      noAccess: 'ليس لديك صلاحية لهذا القسم.', chooseTechnician: 'اختر فنياً',
      dueToday: 'أعداد مباشرة من السجلات المصرح بها', noKpi: 'لا توجد سجلات مطابقة بعد',
      edit: 'تعديل', newPart: 'إضافة صنف للمخزون', release: 'إلغاء الحجز',
      movementHistory: 'حركات المخزون الأخيرة',
      archive: 'أرشفة', confirmArchive: 'هل تريد أرشفة هذا الأصل؟',
      reassign: 'إعادة الإسناد', needsAttention: 'يحتاج إلى عناية', outOfService: 'خارج الخدمة',
      critical: 'مرتفع', operational: 'يعمل', workProgress: 'العمل جارٍ',
      noTechnicians: 'لا توجد مهام للفنيين', items: 'أصناف', loginTitle: 'صيانة منظمة.',
      loginStory: 'مساحة مشتركة للطلبات والأصول وأوامر العمل والمخزون — لتنسيق واضح.',
      rejectPrompt: 'ما سبب رفض هذا الطلب؟', actionFailed: 'تعذر إكمال هذا الإجراء.',
      languageLabel: 'تغيير اللغة', mobileMenu: 'فتح التنقل', noRecords: 'لا توجد سجلات بعد',
      signInTag: 'عمليات الصيانة', newWorkOrder: 'إنشاء أمر عمل',
    },
  };
  const t = (key) => translations[language][key] || translations.en[key] || key;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const roleLabel = (role) => t(`role${role}`);
  const api = async (path, options = {}) => {
    const response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || t('actionFailed'));
    return result;
  };
  const post = (path, body, key) => api(path, {
    method: 'POST', body: JSON.stringify(body),
    headers: key ? { 'Idempotency-Key': key } : {},
  });
  const showBanner = (message, kind = 'error') => {
    banner = { message, kind };
    render();
  };
  const roleAllowed = (...roles) => roles.includes(currentUser?.role);
  const navItems = () => [
    { id: 'dashboard', label: t('home'), icon: '⌂', roles: ['Admin','Manager','Supervisor','Technician','Requester','Storekeeper'] },
    { id: 'requests', label: t('requests'), icon: '↗', roles: ['Admin','Manager','Supervisor','Technician','Requester'] },
    { id: 'work-orders', label: t('workOrders'), icon: '▤', roles: ['Admin','Manager','Supervisor','Technician','Requester','Storekeeper'] },
    { id: 'assets', label: t('assets'), icon: '◈', roles: ['Admin','Manager','Supervisor','Technician','Requester','Storekeeper'] },
    { id: 'inventory', label: t('inventory'), icon: '▦', roles: ['Admin','Manager','Supervisor','Technician','Storekeeper'] },
    { id: 'notifications', label: t('notifications'), icon: '◉', roles: ['Admin','Manager','Supervisor','Technician','Requester','Storekeeper'] },
    { id: 'audit', label: t('audit'), icon: '⌁', roles: ['Admin','Manager','Supervisor'] },
  ].filter((item) => item.roles.includes(currentUser?.role));

  function badge(status) {
    const normalized = String(status || '').toLowerCase();
    const color = ['closed','verified','operational','approved'].includes(normalized) ? 'green'
      : ['urgent','rejected','overdue'].includes(normalized) ? 'red'
        : ['inprogress','submitted','scheduled','onhold','converted'].includes(normalized.replace(/\s/g, '')) ? 'amber' : 'teal';
    const key = ({ Submitted: 'submitted', Approved: 'approved', Rejected: 'rejected', Converted: 'converted',
      InProgress: 'workProgress', Scheduled: 'assigned', Completed: 'complete', Verified: 'verified',
      Operational: 'operational', NeedsAttention: 'needsAttention', OutOfService: 'outOfService' })[status] || null;
    return `<span class="badge ${color}">${esc(key ? t(key) : status)}</span>`;
  }
  const dateText = (value) => value ? new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value)) : '—';
  const emptyState = (title, copy) => `<div class="empty"><strong>${esc(title)}</strong>${esc(copy)}</div>`;
  const bannerHtml = () => banner ? `<div class="notice ${banner.kind}" role="${banner.kind === 'error' ? 'alert' : 'status'}">${esc(banner.message)}</div>` : '';

  async function renderLogin() {
    let status;
    try { status = await api('/session'); } catch { status = { needsBootstrap: false }; }
    app.innerHTML = `
      <main class="login-wrap">
        <section class="login-story" aria-label="${esc(t('signInTag'))}">
          <div class="brand"><div class="brand-mark" aria-hidden="true">F</div><div class="brand-name">Fieldwork<span class="brand-caption">${esc(t('signInTag'))}</span></div></div>
          <div><h1>${esc(t('loginTitle'))}</h1><p>${esc(t('loginStory'))}</p></div>
          <div class="login-art"><span aria-hidden="true">●</span> ${esc(t('location'))} · ${esc(t('dataNote'))}</div>
        </section>
        <section class="login-panel">
          <div class="login-card">
            <div class="action-row" style="justify-content:space-between"><span class="eyebrow">FIELDWORK · CMMS</span><button class="button language-button" id="language" aria-label="${esc(t('languageLabel'))}">${esc(t('language'))}</button></div>
            <h2>${esc(status.needsBootstrap ? t('createAdmin') : t('signIn'))}</h2>
            <p>${esc(status.needsBootstrap ? t('bootstrapNote') : t('signInSub'))}</p>
            ${bannerHtml()}
            <form class="form-grid" id="auth-form">
              ${status.needsBootstrap ? `<label>${esc(t('displayName'))}<input name="displayName" autocomplete="name" required maxlength="80"></label>` : ''}
              <label>${esc(t('username'))}<input name="username" autocomplete="username" required minlength="3" maxlength="40"></label>
              <label>${esc(t('password'))}<input name="password" type="password" autocomplete="${status.needsBootstrap ? 'new-password' : 'current-password'}" required minlength="${status.needsBootstrap ? 12 : 1}"></label>
              ${status.needsBootstrap ? `<label>${esc(t('passwordConfirmation'))}<input name="passwordConfirmation" type="password" autocomplete="new-password" required minlength="12"></label>` : ''}
              <button class="button primary" type="submit">${esc(status.needsBootstrap ? t('createAccount') : t('login'))}</button>
            </form>
            ${!status.needsBootstrap ? `<p class="footer-note">${esc(t('demoNote'))}</p>` : ''}
          </div>
        </section>
      </main>`;
    document.getElementById('language').addEventListener('click', toggleLanguage);
    document.getElementById('auth-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      try {
        const result = await post(status.needsBootstrap ? '/bootstrap' : '/login', data);
        currentUser = result.user;
        banner = null;
        render();
      } catch (error) { showBanner(error.message || t('signInError')); }
    });
  }

  async function loadPageData() {
    const endpoints = {
      dashboard: ['/dashboard', '/work-orders', '/requests', '/technicians'],
      assets: ['/assets'],
      requests: ['/requests', '/assets'],
      'work-orders': ['/work-orders', '/assets', '/technicians'],
      inventory: ['/inventory', '/work-orders', ...(roleAllowed('Admin','Manager','Supervisor','Storekeeper') ? ['/inventory/movements'] : [])],
      audit: ['/audit'],
      notifications: ['/notifications'],
    }[currentPage] || [];
    const values = await Promise.all(endpoints.map((path) => api(path)));
    return Object.fromEntries(endpoints.map((path, index) => [path, values[index]]));
  }

  function renderShell(content) {
    const unread = 0;
    const navigation = navItems().map((item) => `<button type="button" class="nav-item" data-page="${item.id}" aria-current="${currentPage === item.id ? 'page' : 'false'}"><span class="nav-icon" aria-hidden="true">${item.icon}</span>${esc(item.label)}</button>`).join('');
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar" id="sidebar" aria-label="${esc(t('home'))}">
          <div class="brand"><div class="brand-mark" aria-hidden="true">F</div><div class="brand-name">Fieldwork<span class="brand-caption">MAINTENANCE OPERATIONS</span></div></div>
          <div><div class="nav-label">${esc(t('home'))}</div><nav class="nav-list">${navigation}</nav></div>
          <div class="side-foot"><strong>${esc(currentUser.displayName)}</strong>${esc(roleLabel(currentUser.role))}<button type="button" class="button ghost" id="logout">${esc(t('logout'))}</button></div>
        </aside>
        <main class="main">
          <header class="topbar">
            <div class="action-row"><button type="button" class="button mobile-menu" id="menu" aria-label="${esc(t('mobileMenu'))}">☰</button><div class="topbar-context"><strong>Fieldwork</strong> / ${esc(navItems().find((item) => item.id === currentPage)?.label || t('home'))}</div></div>
            <div class="top-actions"><button type="button" class="button language-button" id="language" aria-label="${esc(t('languageLabel'))}">${esc(t('language'))}</button><div class="user-chip"><div class="avatar" aria-hidden="true">${esc(currentUser.displayName.split(/\s+/).map((part) => part[0]).slice(0,2).join('').toUpperCase())}</div><div><div class="user-name">${esc(currentUser.displayName)}</div><div class="user-role">${esc(roleLabel(currentUser.role))}</div></div></div></div>
          </header>
          <section class="content">${bannerHtml()}${content}</section>
        </main>
      </div>`;
    document.querySelectorAll('[data-page]').forEach((element) => element.addEventListener('click', () => {
      currentPage = element.dataset.page;
      banner = null;
      render();
    }));
    document.getElementById('language').addEventListener('click', toggleLanguage);
    document.getElementById('logout').addEventListener('click', async () => {
      await post('/logout', {});
      currentUser = null; currentPage = 'dashboard'; banner = null; render();
    });
    document.getElementById('menu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
    document.querySelectorAll('[data-action]').forEach((element) => element.addEventListener('click', () => onAction(element)));
    document.querySelectorAll('form[data-form]').forEach((form) => form.addEventListener('submit', onForm));
  }

  function pageHeading(title, subtitle, right = '') {
    return `<div class="page-heading"><div><div class="eyebrow">FIELDWORK · ${esc(t('signInTag'))}</div><h1>${esc(title)}</h1><p class="subheading">${esc(subtitle)}</p></div>${right}</div>`;
  }
  function kpi(label, value, icon, note) {
    return `<article class="card kpi"><div class="kpi-top"><span>${esc(label)}</span><span class="kpi-icon" aria-hidden="true">${icon}</span></div><div class="kpi-value">${esc(value)}</div><div class="kpi-note">${esc(note)}</div></article>`;
  }
  function workCard(order) {
    const canManage = roleAllowed('Admin','Manager','Supervisor');
    const canWork = roleAllowed('Admin','Manager','Supervisor') || (currentUser.role === 'Technician' && order.assignedToId === currentUser.id);
    const actions = [];
    if (canManage && !['Completed','Verified','Closed','Cancelled'].includes(order.status)) actions.push(`<button class="button small" data-action="assign" data-id="${esc(order.id)}">${esc(order.assignedToId ? t('reassign') : t('assign'))}</button>`);
    if (canWork && ['Scheduled','OnHold'].includes(order.status)) actions.push(`<button class="button small" data-action="status" data-status="InProgress" data-id="${esc(order.id)}">${esc(order.status === 'OnHold' ? t('resume') : t('start'))}</button>`);
    if (canWork && order.status === 'InProgress') actions.push(`<button class="button small" data-action="status" data-status="OnHold" data-id="${esc(order.id)}">${esc(t('hold'))}</button><button class="button primary small" data-action="complete-form" data-id="${esc(order.id)}">${esc(t('markComplete'))}</button>`);
    if (canManage && order.status === 'Completed') actions.push(`<button class="button small" data-action="status" data-status="Verified" data-id="${esc(order.id)}">${esc(t('verify'))}</button>`);
    if (canManage && order.status === 'Verified') actions.push(`<button class="button small" data-action="status" data-status="Closed" data-id="${esc(order.id)}">${esc(t('close'))}</button>`);
    const checks = (order.checklist || []).map((item) => `<label class="check-item"><input type="checkbox" data-action="checklist" data-id="${esc(order.id)}" data-item="${esc(item.id)}" ${item.done ? 'checked' : ''} ${!canWork ? 'disabled' : ''}><span>${esc(item.label)}${item.required ? ` · ${esc(t('required'))}` : ''}</span></label>`).join('');
    return `<article class="record">
      <div class="record-head"><div><div class="record-title">${esc(order.reference)} · ${esc(order.title)}</div><div class="record-meta">${esc(order.assetCode || '—')} · ${esc(order.assignedToName || t('unassigned'))} · ${esc(dateText(order.createdAt))}</div></div>${badge(order.status)}</div>
      ${order.description ? `<p class="record-description">${esc(order.description)}</p>` : ''}
      ${checks ? `<div class="stack" aria-label="${esc(t('checklist'))}">${checks}</div>` : ''}
      ${order.completionNotes ? `<p class="record-description">${esc(order.completionNotes)}</p>` : ''}
      <div class="action-row">${actions.join('')}</div>
      <div class="assignment-slot" id="assignment-${esc(order.id)}"></div>
      <div class="completion-slot" id="completion-${esc(order.id)}"></div>
    </article>`;
  }

  function dashboardPage(data) {
    const counts = data['/dashboard'];
    const active = data['/work-orders'].filter((item) => !['Completed','Verified','Closed','Cancelled'].includes(item.status)).slice(0,4);
    const requests = data['/requests'].slice().sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4);
    const techs = data['/technicians'].map((tech) => `<div class="record-head"><div><div class="record-title">${esc(tech.displayName)}</div><div class="record-meta">${esc(t('workloadHint'))}</div></div><span class="badge teal">${esc(tech.openAssignments)} ${esc(t('items'))}</span></div>`);
    return `${pageHeading(t('overview'), t('hello'))}
      <div class="grid kpi-grid">
        ${kpi(t('assetsCount'), counts.assetCount, '◈', t('dueToday'))}
        ${kpi(t('openRequests'), counts.submittedRequests, '↗', t('dueToday'))}
        ${kpi(t('openOrders'), counts.openWorkOrders, '▤', t('dueToday'))}
        ${kpi(t('assignments'), counts.technicianAssignments, '◷', t('dueToday'))}
        ${kpi(t('lowStock'), counts.lowStockItems, '▦', t('dueToday'))}
      </div>
      <div class="grid two-col">
        <div class="stack">
          <section class="card"><div class="section-head"><div><h2>${esc(t('recentWork'))}</h2><p>${esc(t('dueToday'))}</p></div></div><div class="stack">${active.length ? active.map(workCard).join('') : emptyState(t('emptyTitle'), t('empty'))}</div></section>
          <section class="card"><div class="section-head"><div><h2>${esc(t('recentRequests'))}</h2><p>${esc(t('dueToday'))}</p></div></div><div class="stack">${requests.length ? requests.map(requestCard).join('') : emptyState(t('emptyTitle'), t('empty'))}</div></section>
        </div>
        <section class="card"><div class="section-head"><div><h2>${esc(t('workload'))}</h2><p>${esc(t('workloadHint'))}</p></div></div><div class="stack">${techs.length ? techs.join('') : emptyState(t('noTechnicians'), t('empty'))}</div></section>
      </div>`;
  }

  function assetPage(assets) {
    const canCreate = roleAllowed('Admin','Manager','Supervisor');
    const form = canCreate ? `<section class="card"><div class="section-head"><div><h2>${esc(t('newAsset'))}</h2></div></div>
      <form class="form-grid" data-form="asset">
        <div class="form-row"><label>${esc(t('assetCode'))}<input name="code" required minlength="2" maxlength="40"></label><label>${esc(t('assetName'))}<input name="name" required minlength="2" maxlength="120"></label></div>
        <div class="form-row"><label>${esc(t('category'))}<input name="category" maxlength="60" placeholder="HVAC, electrical…"></label><label>${esc(t('criticality'))}<select name="criticality"><option>Normal</option><option>High</option><option>Critical</option></select></label></div>
        <label>${esc(t('description'))}<textarea name="description" maxlength="500"></textarea></label>
        <button class="button primary" type="submit">${esc(t('createAsset'))}</button>
      </form></section>` : '';
    const rows = assets.map((asset) => `<tr><td><strong>${esc(asset.code)}</strong></td><td>${esc(asset.name)}<div class="record-meta">${esc(asset.category || '—')}</div></td><td>${esc(asset.locationName || asset.locationId)}</td><td>${badge(asset.status)}</td><td>${badge(asset.criticality)}</td><td>${canCreate ? `<div class="action-row"><button type="button" class="button small" data-action="edit-asset" data-id="${esc(asset.id)}">${esc(t('edit'))}</button><button type="button" class="button danger small" data-action="archive-asset" data-id="${esc(asset.id)}">${esc(t('archive'))}</button></div><div id="asset-edit-${esc(asset.id)}"></div>` : ''}</td></tr>`).join('');
    return `${pageHeading(t('assets'), t('dueToday'))}
      <div class="grid ${canCreate ? 'two-col' : ''}">
        <section class="card"><div class="section-head"><div><h2>${esc(t('assetsCount'))}</h2><p>${esc(assets.length)} ${esc(t('items'))}</p></div></div>
          ${assets.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('assetCode'))}</th><th>${esc(t('assetName'))}</th><th>${esc(t('location'))}</th><th>${esc(t('status'))}</th><th>${esc(t('criticality'))}</th><th>${canCreate ? esc(t('edit')) : ''}</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState(t('noAssets'), t('addFirstAsset'))}
        </section>${form}</div>`;
  }

  function requestCard(request, assets = []) {
    const canReview = roleAllowed('Admin','Manager','Supervisor') && request.status === 'Submitted';
    const canConvert = roleAllowed('Admin','Manager','Supervisor') && request.status === 'Approved' && !request.workOrderId;
    const actions = `${canReview ? `<button class="button small" data-action="review" data-decision="Approved" data-id="${esc(request.id)}">${esc(t('approve'))}</button><button class="button danger small" data-action="reject-form" data-id="${esc(request.id)}">${esc(t('reject'))}</button>` : ''}${canConvert ? `<button class="button primary small" data-action="convert" data-id="${esc(request.id)}">${esc(t('convert'))}</button>` : ''}`;
    return `<article class="record"><div class="record-head"><div><div class="record-title">${esc(request.reference)} · ${esc(request.title)}</div><div class="record-meta">${esc(request.requesterName)} · ${esc(request.assetCode || t('searchAsset'))} · ${esc(dateText(request.createdAt))}</div></div>${badge(request.status)}</div><p class="record-description">${esc(request.description)}</p><div class="meta-row">${badge(request.priority)}${request.workOrderId ? `<span class="record-meta">${esc(t('workOrders'))}: ${esc(request.workOrderId.slice(0,8))}</span>` : ''}</div>${request.rejectionReason ? `<p class="record-description">${esc(request.rejectionReason)}</p>` : ''}<div class="action-row">${actions}</div><div id="request-action-${esc(request.id)}"></div></article>`;
  }

  function requestsPage(data) {
    const requests = data['/requests'];
    const assets = data['/assets'];
    const form = roleAllowed('Admin','Manager','Supervisor','Technician','Requester') ? `<section class="card"><div class="section-head"><div><h2>${esc(t('newRequest'))}</h2></div></div>
      <form class="form-grid" data-form="request">
        <label>${esc(t('title'))}<input name="title" required minlength="4" maxlength="120"></label>
        <label>${esc(t('description'))}<textarea name="description" required minlength="10" maxlength="2000"></textarea></label>
        <div class="form-row"><label>${esc(t('asset'))}<select name="assetId"><option value="">${esc(t('searchAsset'))}</option>${assets.map((asset) => `<option value="${esc(asset.id)}">${esc(asset.code)} · ${esc(asset.name)}</option>`).join('')}</select></label><label>${esc(t('priority'))}<select name="priority"><option>Normal</option><option>Low</option><option>High</option><option>Urgent</option></select></label></div>
        <button class="button primary" type="submit">${esc(t('createRequest'))}</button>
      </form></section>` : '';
    return `${pageHeading(t('requests'), t('dueToday'))}<div class="grid ${form ? 'two-col' : ''}"><section class="card"><div class="section-head"><div><h2>${esc(t('requests'))}</h2><p>${esc(requests.length)} ${esc(t('items'))}</p></div></div><div class="stack">${requests.length ? requests.slice().sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map((item) => requestCard(item, assets)).join('') : emptyState(t('emptyTitle'), t('empty'))}</div></section>${form}</div>`;
  }

  function workOrdersPage(data) {
    const orders = data['/work-orders'];
    const assets = data['/assets'];
    const technicians = data['/technicians'];
    const createForm = roleAllowed('Admin','Manager','Supervisor') ? `<section class="card"><h2>${esc(t('newWorkOrder'))}</h2><div class="divider"></div><form class="form-grid" data-form="work-order">
      <label>${esc(t('title'))}<input name="title" minlength="4" maxlength="120" required></label>
      <label>${esc(t('asset'))}<select name="assetId" required><option value="">—</option>${assets.map((item) => `<option value="${esc(item.id)}">${esc(item.code)} · ${esc(item.name)}</option>`).join('')}</select></label>
      <label>${esc(t('description'))}<textarea name="description" maxlength="1000"></textarea></label>
      <button class="button primary" type="submit">${esc(t('newWorkOrder'))}</button>
    </form></section>` : '';
    return `${pageHeading(t('workOrders'), t('dueToday'))}<div class="grid ${createForm ? 'two-col' : ''}"><section class="card"><div class="section-head"><div><h2>${esc(t('openOrders'))}</h2><p>${esc(orders.length)} ${esc(t('items'))}</p></div></div><div class="stack">${orders.length ? orders.map(workCard).join('') : emptyState(t('emptyTitle'), t('empty'))}</div></section>${createForm}</div>`;
  }

  function inventoryPage(items, orders, movements = []) {
    const canMove = roleAllowed('Admin','Manager','Storekeeper');
    const canReserve = roleAllowed('Admin','Manager','Supervisor','Storekeeper');
    const cards = items.map((item) => {
      const controls = canMove ? `<form class="form-grid" data-form="movement" data-part="${esc(item.id)}">
        <div class="form-row"><label>${esc(t('movement'))}<select name="direction"><option value="receive">${esc(t('receive'))}</option><option value="issue">${esc(t('issue'))}</option>${canReserve ? `<option value="reserve">${esc(t('reserve'))}</option>` : ''}</select></label><label>${esc(t('quantity'))}<input name="quantity" type="number" step="0.001" min="0.001" required></label></div>
        <label>${esc(t('reason'))}<input name="reason" maxlength="120" required minlength="3"></label>
        <label class="workorder-select">${esc(t('forWorkOrder'))}<select name="workOrderId"><option value="">—</option>${orders.map((order) => `<option value="${esc(order.id)}">${esc(order.reference)} · ${esc(order.title)}</option>`).join('')}</select></label>
        <button class="button small" type="submit">${esc(t('movement'))}</button>
      </form>` : '';
      const activeReservations = (item.reservations || []).map((reservation) => `<div class="record-head"><span class="record-meta">${esc(t('reserved'))}: ${esc(reservation.quantity)} · ${esc(reservation.workOrderReference)}</span>${canReserve ? `<button type="button" class="button ghost small" data-action="release-reservation" data-id="${esc(reservation.id)}">${esc(t('release'))}</button>` : ''}</div>`).join('');
      return `<article class="record"><div class="record-head"><div><div class="record-title">${esc(item.sku)} · ${esc(item.name)}</div><div class="record-meta">${esc(item.locationId)} · ${esc(item.unit)}</div></div>${Number(item.available) <= Number(item.reorderLevel) ? `<span class="badge amber">${esc(t('reorder'))}: ${esc(item.reorderLevel)}</span>` : badge('Operational')}</div>
        <div class="meta-row"><span class="badge">${esc(t('stock'))}: ${esc(item.onHand)}</span><span class="badge">${esc(t('reserved'))}: ${esc(item.reserved)}</span><span class="badge teal">${esc(t('available'))}: ${esc(item.available)}</span></div>${activeReservations}${controls}</article>`;
    }).join('');
    const createForm = roleAllowed('Admin','Manager','Storekeeper') ? `<section class="card"><h2>${esc(t('newPart'))}</h2><div class="divider"></div><form class="form-grid" data-form="part">
      <div class="form-row"><label>SKU<input name="sku" required minlength="2" maxlength="40"></label><label>${esc(t('partName'))}<input name="name" required minlength="2" maxlength="120"></label></div>
      <div class="form-row"><label>${esc(t('stock'))}<input name="onHand" type="number" step="0.001" min="0" value="0" required></label><label>${esc(t('reorder'))}<input name="reorderLevel" type="number" step="0.001" min="0" value="0" required></label></div>
      <button class="button primary" type="submit">${esc(t('newPart'))}</button></form></section>` : '';
    const movementTable = movements.length ? `<section class="card"><div class="section-head"><div><h2>${esc(t('movementHistory'))}</h2></div></div><div class="table-wrap"><table><thead><tr><th>${esc(t('time'))}</th><th>SKU</th><th>${esc(t('movement'))}</th><th>${esc(t('quantity'))}</th><th>${esc(t('reason'))}</th><th>${esc(t('actor'))}</th></tr></thead><tbody>${movements.slice().sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,25).map((movement) => `<tr><td>${esc(dateText(movement.createdAt))}</td><td>${esc(movement.sku)}</td><td>${esc(movement.direction)}</td><td>${esc(movement.quantity)}</td><td>${esc(movement.reason || '—')}</td><td>${esc(movement.actorId)}</td></tr>`).join('')}</tbody></table></div></section>` : '';
    return `${pageHeading(t('inventoryTitle'), t('dueToday'))}<div class="grid ${createForm ? 'two-col' : ''}"><section class="card"><div class="section-head"><div><h2>${esc(t('inventoryTitle'))}</h2><p>${esc(items.length)} ${esc(t('items'))}</p></div></div><div class="stack">${cards || emptyState(t('noPart'), t('addStock'))}</div></section>${createForm}</div>${movementTable}`;
  }

  function auditPage(entries) {
    return `${pageHeading(t('audit'), t('dueToday'))}<section class="card"><div class="section-head"><div><h2>${esc(t('auditTitle'))}</h2><p>${esc(entries.length)} · recent events</p></div></div>
      ${entries.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('event'))}</th><th>${esc(t('record'))}</th><th>${esc(t('actor'))}</th><th>${esc(t('time'))}</th></tr></thead><tbody>${entries.map((item) => `<tr><td>${esc(item.action)}</td><td>${esc(item.entityType)} · ${esc(item.entityId.slice(0,8))}</td><td>${esc(item.actorId)}</td><td>${esc(dateText(item.createdAt))}</td></tr>`).join('')}</tbody></table></div>` : emptyState(t('noAudit'), t('empty'))}
    </section>`;
  }

  function notificationsPage(items) {
    return `${pageHeading(t('notifications'), t('dueToday'))}<section class="card"><div class="section-head"><div><h2>${esc(t('notificationsTitle'))}</h2></div></div>
      <div class="stack">${items.length ? items.map((item) => `<article class="record"><div class="record-head"><div><div class="record-title">${esc(item.title)}</div><div class="record-meta">${esc(item.message)} · ${esc(dateText(item.createdAt))}</div></div>${item.readAt ? '' : `<span class="badge teal">${esc(t('new'))}</span>`}</div>${item.readAt ? '' : `<button class="button small" data-action="read" data-id="${esc(item.id)}">${esc(t('markRead'))}</button>`}</article>`).join('') : emptyState(t('notifications'), t('noNotifications'))}</div>
    </section>`;
  }

  async function render() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (!currentUser) { await renderLogin(); return; }
    try {
      const data = await loadPageData();
      const pages = {
        dashboard: () => dashboardPage(data),
        assets: () => assetPage(data['/assets']),
        requests: () => requestsPage(data),
        'work-orders': () => workOrdersPage(data),
        inventory: () => inventoryPage(data['/inventory'], data['/work-orders'], data['/inventory/movements'] || []),
        audit: () => auditPage(data['/audit']),
        notifications: () => notificationsPage(data['/notifications']),
      };
      renderShell((pages[currentPage] || pages.dashboard)());
    } catch (error) {
      currentUser = null;
      banner = { message: error.message, kind: 'error' };
      await renderLogin();
    }
  }

  async function onForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      if (form.dataset.form === 'asset') await post('/assets', data);
      if (form.dataset.form === 'request') await post('/requests', data, crypto.randomUUID());
      if (form.dataset.form === 'work-order') await post('/work-orders', data);
      if (form.dataset.form === 'part') await post('/inventory/items', data);
      if (form.dataset.form === 'assignment') {
        await post(`/work-orders/${encodeURIComponent(form.dataset.id)}/assign`, { assigneeId: data.assigneeId });
      }
      if (form.dataset.form === 'reject') {
        await post(`/requests/${encodeURIComponent(form.dataset.id)}/review`, { decision: 'Rejected', reason: data.reason });
      }
      if (form.dataset.form === 'asset-edit') {
        await api(`/assets/${encodeURIComponent(form.dataset.id)}`, { method: 'PATCH', body: JSON.stringify(data) });
      }
      if (form.dataset.form === 'completion') {
        await post(`/work-orders/${encodeURIComponent(form.dataset.id)}/status`, {
          status: 'Completed', completionNotes: data.completionNotes,
        });
      }
      if (form.dataset.form === 'movement') {
        const key = crypto.randomUUID();
        if (data.direction === 'reserve') {
          if (!data.workOrderId) throw new Error(t('forWorkOrder'));
          await post('/inventory/reservations', { partId: form.dataset.part, quantity: data.quantity, workOrderId: data.workOrderId }, key);
        } else {
          await post('/inventory/movements', { partId: form.dataset.part, direction: data.direction, quantity: data.quantity, reason: data.reason, workOrderId: data.workOrderId }, key);
        }
      }
      banner = { message: t('complete'), kind: 'success' };
      await render();
    } catch (error) {
      button.disabled = false;
      showBanner(error.message || t('actionFailed'));
    }
  }

  async function onAction(element) {
    const { action, id, decision, status } = element.dataset;
    element.disabled = true;
    try {
      if (action === 'review') {
        await post(`/requests/${encodeURIComponent(id)}/review`, { decision });
      } else if (action === 'reject-form') {
        const slot = document.getElementById(`request-action-${id}`);
        slot.innerHTML = `<form class="form-grid" data-form="reject" data-id="${esc(id)}"><label>${esc(t('rejectPrompt'))}<textarea name="reason" required minlength="4" maxlength="500"></textarea></label><button class="button danger small" type="submit">${esc(t('reject'))}</button></form>`;
        slot.querySelector('form').addEventListener('submit', onForm);
        element.disabled = false;
        return;
      } else if (action === 'convert') {
        await post(`/requests/${encodeURIComponent(id)}/convert`, {});
      } else if (action === 'assign') {
        const technicians = await api('/technicians');
        const slot = document.getElementById(`assignment-${id}`);
        slot.innerHTML = `<form class="form-grid" data-form="assignment" data-id="${esc(id)}"><label>${esc(t('technician'))}<select name="assigneeId" required><option value="">${esc(t('chooseTechnician'))}</option>${technicians.map((item) => `<option value="${esc(item.id)}">${esc(item.displayName)} · ${esc(item.openAssignments)} ${esc(t('items'))}</option>`).join('')}</select></label><button class="button small primary" type="submit">${esc(t('assign'))}</button></form>`;
        slot.querySelector('form').addEventListener('submit', onForm);
        element.disabled = false;
        return;
      } else if (action === 'status') {
        let completionNotes;
        if (status === 'Completed') { completionNotes = window.prompt(t('completionNotes')); if (!completionNotes) { element.disabled = false; return; } }
        await post(`/work-orders/${encodeURIComponent(id)}/status`, { status, completionNotes });
      } else if (action === 'complete-form') {
        const slot = document.getElementById(`completion-${id}`);
        slot.innerHTML = `<form class="form-grid" data-form="completion" data-id="${esc(id)}"><label>${esc(t('completionNotes'))}<textarea name="completionNotes" required minlength="8" maxlength="2000"></textarea></label><button class="button primary small" type="submit">${esc(t('markComplete'))}</button></form>`;
        slot.querySelector('form').addEventListener('submit', onForm);
        element.disabled = false;
        return;
      } else if (action === 'checklist') {
        await api(`/work-orders/${encodeURIComponent(id)}/checklist/${encodeURIComponent(element.dataset.item)}`, {
          method: 'PATCH', body: JSON.stringify({ done: element.checked }),
        });
      } else if (action === 'read') {
        await post(`/notifications/${encodeURIComponent(id)}/read`, {});
      } else if (action === 'release-reservation') {
        await post(`/inventory/reservations/${encodeURIComponent(id)}`, {});
      } else if (action === 'edit-asset') {
        const asset = (await api('/assets')).find((item) => item.id === id);
        if (!asset) throw new Error(t('actionFailed'));
        const slot = document.getElementById(`asset-edit-${id}`);
        slot.innerHTML = `<form class="form-grid" data-form="asset-edit" data-id="${esc(id)}"><label>${esc(t('assetName'))}<input name="name" required value="${esc(asset.name)}"></label><div class="form-row"><label>${esc(t('criticality'))}<select name="criticality"><option ${asset.criticality === 'Normal' ? 'selected' : ''}>Normal</option><option ${asset.criticality === 'High' ? 'selected' : ''}>High</option><option ${asset.criticality === 'Critical' ? 'selected' : ''}>Critical</option></select></label><label>${esc(t('status'))}<select name="status"><option value="Operational" ${asset.status === 'Operational' ? 'selected' : ''}>Operational</option><option value="NeedsAttention" ${asset.status === 'NeedsAttention' ? 'selected' : ''}>Needs attention</option><option value="OutOfService" ${asset.status === 'OutOfService' ? 'selected' : ''}>Out of service</option></select></label></div><button class="button small primary" type="submit">${esc(t('edit'))}</button></form>`;
        slot.querySelector('form').addEventListener('submit', onForm);
        element.disabled = false;
        return;
      } else if (action === 'archive-asset') {
        if (!window.confirm(t('confirmArchive'))) { element.disabled = false; return; }
        await api(`/assets/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) });
      }
      banner = { message: t('complete'), kind: 'success' };
      await render();
    } catch (error) {
      element.disabled = false;
      showBanner(error.message || t('actionFailed'));
    }
  }

  function toggleLanguage() {
    language = language === 'en' ? 'ar' : 'en';
    localStorage.setItem(languageKey, language);
    render();
  }
  document.addEventListener('DOMContentLoaded', async () => {
    try { const result = await api('/session'); currentUser = result.user; }
    catch { currentUser = null; }
    render();
  });
})();
