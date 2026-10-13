(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const api = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Permintaan gagal (${response.status})`);
    return payload;
  };

  const countries = [
    ["Indonesia", "+62", "ID"], ["Afghanistan", "+93", "AF"], ["Albania", "+355", "AL"],
    ["Algeria", "+213", "DZ"], ["Andorra", "+376", "AD"], ["Angola", "+244", "AO"],
    ["Argentina", "+54", "AR"], ["Armenia", "+374", "AM"], ["Australia", "+61", "AU"],
    ["Austria", "+43", "AT"], ["Azerbaijan", "+994", "AZ"], ["Bahrain", "+973", "BH"],
    ["Bangladesh", "+880", "BD"], ["Belgium", "+32", "BE"], ["Bhutan", "+975", "BT"],
    ["Bolivia", "+591", "BO"], ["Bosnia and Herzegovina", "+387", "BA"], ["Brazil", "+55", "BR"],
    ["Brunei", "+673", "BN"], ["Bulgaria", "+359", "BG"], ["Cambodia", "+855", "KH"],
    ["Cameroon", "+237", "CM"], ["Canada", "+1", "CA"], ["Chile", "+56", "CL"],
    ["China", "+86", "CN"], ["Colombia", "+57", "CO"], ["Costa Rica", "+506", "CR"],
    ["Croatia", "+385", "HR"], ["Cuba", "+53", "CU"], ["Cyprus", "+357", "CY"],
    ["Czechia", "+420", "CZ"], ["Denmark", "+45", "DK"], ["Dominican Republic", "+1", "DO"],
    ["Ecuador", "+593", "EC"], ["Egypt", "+20", "EG"], ["Estonia", "+372", "EE"],
    ["Ethiopia", "+251", "ET"], ["Finland", "+358", "FI"], ["France", "+33", "FR"],
    ["Georgia", "+995", "GE"], ["Germany", "+49", "DE"], ["Ghana", "+233", "GH"],
    ["Greece", "+30", "GR"], ["Guatemala", "+502", "GT"], ["Hong Kong", "+852", "HK"],
    ["Hungary", "+36", "HU"], ["Iceland", "+354", "IS"], ["India", "+91", "IN"],
    ["Iran", "+98", "IR"], ["Iraq", "+964", "IQ"], ["Ireland", "+353", "IE"],
    ["Israel", "+972", "IL"], ["Italy", "+39", "IT"], ["Jamaica", "+1", "JM"],
    ["Japan", "+81", "JP"], ["Jordan", "+962", "JO"], ["Kazakhstan", "+7", "KZ"],
    ["Kenya", "+254", "KE"], ["Kuwait", "+965", "KW"], ["Laos", "+856", "LA"],
    ["Latvia", "+371", "LV"], ["Lebanon", "+961", "LB"], ["Libya", "+218", "LY"],
    ["Lithuania", "+370", "LT"], ["Luxembourg", "+352", "LU"], ["Macau", "+853", "MO"],
    ["Madagascar", "+261", "MG"], ["Malaysia", "+60", "MY"], ["Maldives", "+960", "MV"],
    ["Malta", "+356", "MT"], ["Mauritius", "+230", "MU"], ["Mexico", "+52", "MX"],
    ["Monaco", "+377", "MC"], ["Mongolia", "+976", "MN"], ["Montenegro", "+382", "ME"],
    ["Morocco", "+212", "MA"], ["Myanmar", "+95", "MM"], ["Nepal", "+977", "NP"],
    ["Netherlands", "+31", "NL"], ["New Zealand", "+64", "NZ"], ["Nigeria", "+234", "NG"],
    ["North Korea", "+850", "KP"], ["Norway", "+47", "NO"], ["Oman", "+968", "OM"],
    ["Pakistan", "+92", "PK"], ["Palestine", "+970", "PS"], ["Panama", "+507", "PA"],
    ["Papua New Guinea", "+675", "PG"], ["Paraguay", "+595", "PY"], ["Peru", "+51", "PE"],
    ["Philippines", "+63", "PH"], ["Poland", "+48", "PL"], ["Portugal", "+351", "PT"],
    ["Puerto Rico", "+1", "PR"], ["Qatar", "+974", "QA"], ["Romania", "+40", "RO"],
    ["Russia", "+7", "RU"], ["Saudi Arabia", "+966", "SA"], ["Serbia", "+381", "RS"],
    ["Singapore", "+65", "SG"], ["Slovakia", "+421", "SK"], ["Slovenia", "+386", "SI"],
    ["Somalia", "+252", "SO"], ["South Africa", "+27", "ZA"], ["South Korea", "+82", "KR"],
    ["Spain", "+34", "ES"], ["Sri Lanka", "+94", "LK"], ["Sudan", "+249", "SD"],
    ["Sweden", "+46", "SE"], ["Switzerland", "+41", "CH"], ["Syria", "+963", "SY"],
    ["Taiwan", "+886", "TW"], ["Tajikistan", "+992", "TJ"], ["Tanzania", "+255", "TZ"],
    ["Thailand", "+66", "TH"], ["Tunisia", "+216", "TN"], ["Turkey", "+90", "TR"],
    ["Uganda", "+256", "UG"], ["Ukraine", "+380", "UA"], ["United Arab Emirates", "+971", "AE"],
    ["United Kingdom", "+44", "GB"], ["United States", "+1", "US"], ["Uruguay", "+598", "UY"],
    ["Uzbekistan", "+998", "UZ"], ["Venezuela", "+58", "VE"], ["Vietnam", "+84", "VN"],
    ["Yemen", "+967", "YE"], ["Zambia", "+260", "ZM"], ["Zimbabwe", "+263", "ZW"]
  ];

  const state = {
    user: null,
    contacts: [],
    activeChat: null,
    activePage: "chat-page",
    filter: "all",
    subview: null,
    returnView: null,
    touchStartX: null,
    backendAvailable: false
  };

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const initials = name => (String(name || "?").trim().split(/\s+/).slice(0, 2).map(s => s[0] || "").join("").toUpperCase() || "?");
  const avatar = (name, photo = "") => `<span class="avatar">${photo ? `<img alt="" src="${esc(photo)}">` : esc(initials(name))}</span>`;
  const showToast = message => {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  };
  const setConnection = connected => {
    state.backendAvailable = connected;
    $("#connection-state").textContent = connected ? "Tersinkron" : "Offline";
    $("#connection-state").title = connected ? "Terhubung ke penyimpanan bersama" : "Backend belum tersedia";
  };
  const currentPhone = () => state.user?.phone || "";
  const localKey = suffix => `hasnanchat:${currentPhone()}:${suffix}`;
  const loadLocalContacts = () => {
    try { return JSON.parse(localStorage.getItem(localKey("contacts")) || "[]"); }
    catch { return []; }
  };
  const saveLocalContacts = contacts => localStorage.setItem(localKey("contacts"), JSON.stringify(contacts));
  const loadLocalMessages = contactId => {
    try { return JSON.parse(localStorage.getItem(localKey(`messages:${contactId}`)) || "[]"); }
    catch { return []; }
  };
  const saveLocalMessages = (contactId, messages) => localStorage.setItem(localKey(`messages:${contactId}`), JSON.stringify(messages));

  function fillCountries() {
    const select = $("#country");
    select.innerHTML = countries.map(([name, dial, code]) => `<option value="${code}" data-dial="${dial}" ${code === "ID" ? "selected" : ""}>${esc(name)} (${dial})</option>`).join("");
    select.addEventListener("change", () => {
      $("#dial-code").textContent = select.selectedOptions[0]?.dataset.dial || "";
    });
    $("#dial-code").textContent = "+62";
  }

  async function loadContacts() {
    const local = loadLocalContacts();
    state.contacts = local;
    try {
      const result = await api(`/api/contacts?owner=${encodeURIComponent(currentPhone())}`);
      if (Array.isArray(result.contacts)) {
        state.contacts = result.contacts;
        saveLocalContacts(result.contacts);
      }
      setConnection(true);
    } catch {
      setConnection(false);
    }
    renderChatList();
  }

  async function saveContact(contact) {
    const duplicate = state.contacts.some(item => item.phone === contact.phone);
    if (duplicate) throw new Error("Kontak dengan nomor tersebut sudah ada.");
    state.contacts = [...state.contacts, contact];
    saveLocalContacts(state.contacts);
    try {
      await api("/api/contacts", { method: "POST", body: JSON.stringify({ owner: currentPhone(), contact }) });
      setConnection(true);
    } catch {
      setConnection(false);
      showToast("Kontak tersimpan di perangkat ini. Hubungkan backend untuk sinkronisasi.");
    }
    renderChatList();
  }

  function showMain() {
    $("#login-screen").classList.add("hidden");
    $("#subscreen").classList.add("hidden");
    $("#main-screen").classList.remove("hidden");
    setPage("chat-page");
  }
  function setPage(pageId) {
    state.activePage = pageId;
    $$(".page").forEach(page => page.classList.toggle("active-page", page.id === pageId));
    $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === pageId));
    $("#page-title").textContent = pageId === "chat-page" ? "HasnanChat" : pageId === "status-page" ? "Status" : "Panggilan";
    $("#add-button").classList.toggle("hidden", pageId === "calls-page");
    $("#ai-button").classList.toggle("hidden", pageId !== "chat-page");
  }
  function openSubview(title, subtitle, html, back = null) {
    state.returnView = back || state.subview;
    state.subview = title;
    $("#main-screen").classList.add("hidden");
    $("#subscreen").classList.remove("hidden");
    $("#sub-title").textContent = title;
    $("#sub-subtitle").textContent = subtitle || "";
    $("#sub-content").innerHTML = html;
    $("#sub-content").scrollTop = 0;
  }
  function backFromSubview() {
    if (state.subview === "Percakapan" && state.activeChat) {
      state.activeChat = null;
    }
    if (state.returnView && state.returnView !== "main") {
      const previous = state.returnView;
      state.returnView = null;
      if (previous === "Pengaturan") return renderSettings();
      if (previous === "Profil") return renderProfile();
      if (previous === "Pilih Kontak") return renderPickContact();
      if (previous === "Grup Baru") return renderGroupForm();
      if (previous === "Kontak Baru") return renderNewContact();
      if (previous === "Komunitas Baru") return renderCommunityForm();
      if (previous === "Info Kontak") return renderContactInfo(state.activeChat);
    }
    state.subview = null;
    $("#subscreen").classList.add("hidden");
    $("#main-screen").classList.remove("hidden");
  }

  function renderChatList() {
    const list = $("#chat-list");
    const query = $("#search-input").value.trim().toLowerCase();
    const contacts = state.contacts.filter(contact => {
      const matchesQuery = !query || `${contact.name} ${contact.phone}`.toLowerCase().includes(query);
      const matchesFilter = state.filter === "all" || (contact.unread > 0);
      return matchesQuery && matchesFilter;
    });
    if (!contacts.length) {
      list.className = "list-area empty-state";
      list.innerHTML = `<div class="empty-icon"><svg><use href="#i-chat"/></svg></div><strong>${query ? "Kontak tidak ditemukan" : state.filter === "unread" ? "Tidak ada chat belum dibaca" : "Belum ada percakapan"}</strong><p>${query ? "Coba kata kunci atau nomor lain." : "Tambahkan kontak untuk mulai mengobrol."}</p>`;
      return;
    }
    list.className = "list-area";
    list.innerHTML = contacts.map(contact => `<button class="contact-row" data-contact="${esc(contact.id)}">${avatar(contact.name, contact.photo)}<span class="contact-meta"><strong>${esc(contact.name)}</strong><small>${esc(contact.lastMessage || contact.phone)}</small></span><span class="contact-time">${esc(contact.lastTime || "")}</span></button>`).join("");
    $$("[data-contact]", list).forEach(button => button.addEventListener("click", () => openChat(button.dataset.contact)));
  }

  async function openChat(contactId) {
    const contact = state.contacts.find(item => item.id === contactId);
    if (!contact) return showToast("Kontak tidak ditemukan.");
    state.activeChat = contactId;
    contact.unread = 0;
    saveLocalContacts(state.contacts);
    let messages = loadLocalMessages(contactId);
    try {
      const result = await api(`/api/messages?owner=${encodeURIComponent(currentPhone())}&peer=${encodeURIComponent(contact.phone)}`);
      if (Array.isArray(result.messages)) messages = result.messages;
      setConnection(true);
    } catch { setConnection(false); }
    const content = `<div class="chat-header"><button class="icon-button" id="chat-back" aria-label="Kembali"><svg><use href="#i-back"/></svg></button>${avatar(contact.name, contact.photo)}<button id="chat-info" class="chat-header-copy" style="border:0;background:transparent;color:inherit;text-align:left"><strong>${esc(contact.name)}</strong><small>${esc(contact.phone)}</small></button><button class="icon-button" id="chat-more" aria-label="Menu"><svg><use href="#i-more"/></svg></button></div><div id="chat-messages" class="chat-messages"></div><form id="message-form" class="message-form"><input id="message-input" autocomplete="off" maxlength="4000" placeholder="Ketik pesan" aria-label="Pesan"><button type="submit" aria-label="Kirim pesan"><svg><use href="#i-send"/></svg></button></form>`;
    openSubview("Percakapan", contact.name, content, "main");
    const drawMessages = () => {
      const area = $("#chat-messages");
      if (!area) return;
      area.innerHTML = messages.length ? messages.map(message => `<div class="message-bubble ${message.sender === currentPhone() ? "mine" : ""}">${esc(message.text)}<div class="message-time">${esc(message.time || "")}</div></div>`).join("") : `<div class="empty-state" style="min-height:180px"><strong>Mulai percakapan</strong><p>Belum ada pesan tersimpan.</p></div>`;
      area.scrollTop = area.scrollHeight;
    };
    drawMessages();
    $("#chat-back").addEventListener("click", () => { state.activeChat = null; state.subview = null; $("#subscreen").classList.add("hidden"); $("#main-screen").classList.remove("hidden"); renderChatList(); });
    $("#chat-info").addEventListener("click", () => renderContactInfo(contactId));
    $("#chat-more").addEventListener("click", () => renderChatActions(contactId));
    $("#message-form").addEventListener("submit", async event => {
      event.preventDefault();
      const input = $("#message-input");
      const messageText = input.value.trim();
      if (!messageText) return;
      const message = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`, sender: currentPhone(), text: messageText, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), createdAt: new Date().toISOString() };
      messages.push(message);
      saveLocalMessages(contactId, messages);
      contact.lastMessage = messageText;
      contact.lastTime = message.time;
      saveLocalContacts(state.contacts);
      input.value = "";
      drawMessages();
      try {
        await api("/api/messages", { method: "POST", body: JSON.stringify({ owner: currentPhone(), peer: contact.phone, message }) });
        setConnection(true);
      } catch {
        setConnection(false);
        showToast("Pesan tersimpan di perangkat ini saja. Backend belum siap.");
      }
    });
  }

  function renderPickContact() {
    const html = `<div class="menu-list"><button class="menu-action" id="new-group"><svg><use href="#i-plus"/></svg><span>Group Baru</span></button><button class="menu-action" id="new-contact"><svg><use href="#i-plus"/></svg><span>Kontak Baru</span></button><button class="menu-action" id="new-community"><svg><use href="#i-plus"/></svg><span>Komunitas Baru</span></button></div><div class="subsection-title">Daftar Kontak di HasnanChat</div><div id="pick-list"></div>`;
    openSubview("Pilih Kontak", `${state.contacts.length} kontak`, html, "main");
    $("#new-group").addEventListener("click", renderGroupForm);
    $("#new-contact").addEventListener("click", renderNewContact);
    $("#new-community").addEventListener("click", renderCommunityForm);
    const render = query => {
      const filtered = state.contacts.filter(c => `${c.name} ${c.phone}`.toLowerCase().includes((query || "").toLowerCase()));
      $("#pick-list").innerHTML = filtered.length ? filtered.map(c => `<button class="contact-row" data-pick="${esc(c.id)}">${avatar(c.name, c.photo)}<span class="contact-meta"><strong>${esc(c.name)}</strong><small>${esc(c.phone)}</small></span></button>`).join("") : `<p class="small-note">Belum ada kontak. Pilih Kontak Baru untuk menambahkan.</p>`;
      $$("[data-pick]").forEach(button => button.addEventListener("click", () => openChat(button.dataset.pick)));
    };
    render("");
    $("#sub-search-open").onclick = () => {
      const query = prompt("Cari nama atau nomor kontak:");
      if (query !== null) render(query);
    };
  }

  function renderNewContact() {
    openSubview("Kontak Baru", "Tambahkan teman", `<form id="contact-form" class="inline-form"><label>Nama kontak<input name="name" required maxlength="70" placeholder="Nama teman"></label><label>Nomor telepon<input name="phone" required inputmode="tel" maxlength="20" placeholder="+628123456789"></label><p class="small-note" style="margin:0">Nomor perlu memakai kode negara, misalnya +62 untuk Indonesia. Kontak tersimpan lintas perangkat hanya jika backend bersama sudah dikonfigurasi.</p><button class="primary-button" type="submit">Simpan Kontak</button></form>`, "Pilih Kontak");
    $("#contact-form").addEventListener("submit", async event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const name = String(data.get("name") || "").trim();
      const phone = String(data.get("phone") || "").replace(/[^\d+]/g, "");
      if (!name || phone.replace(/\D/g, "").length < 7) return showToast("Masukkan nama dan nomor yang valid.");
      const contact = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`, name, phone, lastMessage: "", lastTime: "", unread: 0, photo: "" };
      try {
        await saveContact(contact);
        showToast("Kontak berhasil ditambahkan.");
        renderPickContact();
      } catch (error) { showToast(error.message); }
    });
  }

  function renderGroupForm() {
    const checkboxes = state.contacts.map(c => `<label style="display:flex;align-items:center;gap:9px;font-weight:500"><input type="checkbox" name="members" value="${esc(c.id)}">${esc(c.name)}</label>`).join("");
    openSubview("Grup Baru", "Buat grup percakapan", `<form id="group-form" class="inline-form"><label>Nama grup<input name="name" required maxlength="70" placeholder="Nama grup"></label><label>Deskripsi<textarea name="description" maxlength="300" placeholder="Deskripsi grup (opsional)"></textarea></label><div class="subsection-title" style="padding-left:0">Tambahkan anggota</div>${checkboxes || '<p class="small-note" style="margin:0">Tambahkan kontak terlebih dahulu.</p>'}<button class="primary-button" type="submit">Buat Grup</button></form>`, "Pilih Kontak");
    $("#group-form").addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const name = String(data.get("name") || "").trim();
      const memberIds = data.getAll("members");
      if (!name) return;
      const contact = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`, name, phone: `group:${Date.now()}`, group: true, description: String(data.get("description") || ""), members: memberIds, lastMessage: "", lastTime: "", unread: 0 };
      state.contacts.push(contact);
      saveLocalContacts(state.contacts);
      showToast("Grup dibuat di perangkat ini. Sinkronisasi grup memerlukan API grup khusus.");
      renderPickContact();
    });
  }

  function renderCommunityForm() {
    openSubview("Komunitas Baru", "Buat komunitas", `<form id="community-form" class="inline-form"><label>Nama komunitas<input name="name" required maxlength="70" placeholder="Nama komunitas"></label><label>Deskripsi<textarea name="description" maxlength="300" placeholder="Tujuan komunitas"></textarea></label><button class="primary-button" type="submit">Buat Komunitas</button><p class="small-note" style="margin:0">Pembuatan komunitas saat ini berupa pengaturan lokal, belum menjadi layanan komunitas lintas perangkat.</p></form>`, "Pilih Kontak");
    $("#community-form").addEventListener("submit", event => {
      event.preventDefault();
      showToast("UI komunitas disiapkan; API komunitas belum diaktifkan.");
      renderPickContact();
    });
  }

  function renderMenu() {
    openSubview("Menu", "", `<div class="menu-list"><button class="menu-action" id="menu-group"><svg><use href="#i-plus"/></svg><span>Group Baru</span></button><button class="menu-action" id="menu-community"><svg><use href="#i-plus"/></svg><span>Komunitas Baru</span></button><button class="menu-action" id="mark-read"><svg><use href="#i-chat"/></svg><span>Baca semua</span></button><button class="menu-action" id="menu-settings"><svg><use href="#i-settings"/></svg><span>Pengaturan</span></button><button class="menu-action" id="menu-profile"><svg><use href="#i-edit"/></svg><span>Profil</span></button></div>`, "main");
    $("#menu-group").onclick = renderGroupForm;
    $("#menu-community").onclick = renderCommunityForm;
    $("#mark-read").onclick = () => { state.contacts.forEach(c => c.unread = 0); saveLocalContacts(state.contacts); renderChatList(); showToast("Semua chat ditandai telah dibaca."); backFromSubview(); };
    $("#menu-settings").onclick = renderSettings;
    $("#menu-profile").onclick = renderProfile;
  }

  function renderSettings() {
    openSubview("Pengaturan", "Akun dan preferensi", `<div class="profile-summary">${avatar(state.user.name, state.user.photo).replace('class="avatar"', 'class="avatar profile-big"')}<h3>${esc(state.user.name)}</h3><p>${esc(state.user.phone)}</p></div><div class="menu-list"><button class="setting-row" id="setting-profile"><svg><use href="#i-edit"/></svg><span>Profil</span></button><button class="setting-row" id="setting-privacy"><svg><use href="#i-settings"/></svg><span>Privasi dan keamanan</span></button><button class="setting-row" id="setting-chat"><svg><use href="#i-chat"/></svg><span>Tampilan chat</span></button><button class="setting-row" id="setting-logout"><svg><use href="#i-back"/></svg><span>Keluar dari perangkat ini</span></button></div><p class="small-note">Login saat ini hanya disimpan lokal dan belum memverifikasi nomor dengan OTP. Jangan gunakan untuk akun sensitif sebelum autentikasi server diaktifkan.</p>`, "main");
    $("#setting-profile").onclick = renderProfile;
    $("#setting-privacy").onclick = () => showToast("Pengaturan keamanan server perlu diaktifkan sebelum rilis publik.");
    $("#setting-chat").onclick = () => showToast("Tampilan chat memakai tema hijau HasnanChat.");
    $("#setting-logout").onclick = () => {
      if (!confirm("Keluar dari perangkat ini?")) return;
      localStorage.removeItem("hasnanchat:session");
      state.user = null;
      state.contacts = [];
      state.subview = null;
      $("#subscreen").classList.add("hidden");
      $("#main-screen").classList.add("hidden");
      $("#login-screen").classList.remove("hidden");
    };
  }

  function renderProfile() {
    const user = state.user;
    openSubview("Profil", "Informasi akun", `<div class="profile-summary">${avatar(user.name, user.photo).replace('class="avatar"', 'class="avatar profile-big"')}<label class="upload-label" for="profile-photo">Ubah foto profil</label><input class="file-input" type="file" id="profile-photo" accept="image/*"><h3>${esc(user.name)}</h3></div><div class="profile-card"><small>Nama pengguna</small><div class="value"><span id="profile-name-value">${esc(user.name)}</span><button id="edit-name" aria-label="Ubah nama"><svg><use href="#i-edit"/></svg></button></div></div><div class="profile-card"><small>Nomor pengguna</small><div class="value"><span>${esc(user.phone)}</span></div></div><div class="profile-card"><small>Bio</small><div class="value"><span id="profile-bio-value">${esc(user.bio || "Belum ada bio")}</span><button id="edit-bio" aria-label="Ubah bio"><svg><use href="#i-edit"/></svg></button></div></div><div class="profile-card"><small>Tautan berbagi</small><div class="value"><span>${esc(location.origin + "/?user=" + encodeURIComponent(user.phone))}</span><button id="copy-link" aria-label="Salin tautan"><svg><use href="#i-copy"/></svg></button></div></div>`, "Pengaturan");
    $("#profile-photo").addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) return showToast("Pilih gambar maksimal 2 MB.");
      const reader = new FileReader();
      reader.onload = () => { user.photo = String(reader.result); saveUser(); renderProfile(); };
      reader.readAsDataURL(file);
    });
    $("#edit-name").onclick = () => {
      const name = prompt("Nama pengguna:", user.name);
      if (name && name.trim()) { user.name = name.trim().slice(0, 70); saveUser(); renderProfile(); }
    };
    $("#edit-bio").onclick = () => {
      const bio = prompt("Bio:", user.bio || "");
      if (bio !== null) { user.bio = bio.trim().slice(0, 160); saveUser(); renderProfile(); }
    };
    $("#copy-link").onclick = async () => {
      const link = `${location.origin}/?user=${encodeURIComponent(user.phone)}`;
      try { await navigator.clipboard.writeText(link); showToast("Tautan disalin."); }
      catch { showToast(link); }
    };
  }

  function saveUser() {
    localStorage.setItem("hasnanchat:session", JSON.stringify(state.user));
    try { api("/api/profile", { method: "POST", body: JSON.stringify({ user: state.user }) }).then(() => setConnection(true)).catch(() => setConnection(false)); } catch {}
  }

  function renderContactInfo(contactId) {
    const contact = state.contacts.find(item => item.id === contactId);
    if (!contact) return;
    if (contact.group) {
      const members = (contact.members || []).map(id => state.contacts.find(c => c.id === id)).filter(Boolean);
      openSubview("Info Grup", "", `<div class="profile-summary">${avatar(contact.name).replace('class="avatar"', 'class="avatar profile-big"')}<h3>${esc(contact.name)}</h3><p>${esc(contact.description || "Tidak ada deskripsi")}</p></div><div class="profile-card"><small>Anggota</small><div class="value">${members.length + 1} anggota</div></div><div class="subsection-title">Daftar anggota</div><div class="member-row">${avatar(state.user.name)}<div><strong>${esc(state.user.name)}</strong><small>Admin</small></div></div>${members.map(m => `<div class="member-row">${avatar(m.name, m.photo)}<div><strong>${esc(m.name)}</strong></div></div>`).join("")}<button class="menu-action danger-text" id="leave-group">Keluar dari grup</button>`, "Percakapan");
      $("#leave-group").onclick = () => { state.contacts = state.contacts.filter(c => c.id !== contactId); saveLocalContacts(state.contacts); state.activeChat = null; renderPickContact(); showToast("Grup dihapus dari daftar lokal."); };
      return;
    }
    const alreadyAdded = state.contacts.some(c => c.phone === contact.phone);
    openSubview("Info Kontak", "", `<div class="profile-summary">${avatar(contact.name, contact.photo).replace('class="avatar"', 'class="avatar profile-big"')}<h3>${esc(contact.name)}</h3><p>${esc(contact.phone)}</p></div><div class="profile-actions"><button id="info-message" class="secondary-button">Kirim Pesan</button><button id="info-add" class="secondary-button">${alreadyAdded ? "Sudah Ditambahkan" : "Tambah Teman"}</button></div><div class="profile-card"><small>Nomor</small><div class="value">${esc(contact.phone)}</div></div>`, "Percakapan");
    $("#info-message").onclick = () => openChat(contactId);
    $("#info-add").onclick = () => showToast(alreadyAdded ? "Kontak sudah ditambahkan." : "Kontak ini sudah ada di daftar Anda.");
  }

  function renderChatActions(contactId) {
    openSubview("Opsi Percakapan", "", `<div class="menu-list"><button class="menu-action" id="clear-chat"><svg><use href="#i-chat"/></svg><span>Bersihkan chat di perangkat ini</span></button><button class="menu-action danger-text" id="block-contact"><svg><use href="#i-close"/></svg><span>Blokir kontak (lokal)</span></button></div>`, "Percakapan");
    $("#clear-chat").onclick = () => {
      if (confirm("Hapus riwayat chat lokal?")) { saveLocalMessages(contactId, []); showToast("Riwayat lokal dihapus."); openChat(contactId); }
    };
    $("#block-contact").onclick = () => {
      if (confirm("Hapus kontak ini dari daftar perangkat?")) { state.contacts = state.contacts.filter(c => c.id !== contactId); saveLocalContacts(state.contacts); state.activeChat = null; renderPickContact(); showToast("Kontak dihapus dari daftar lokal."); }
    };
  }

  function createStatus() {
    openSubview("Buat Status", "Teks atau foto", `<form id="status-form" class="inline-form"><label>Teks status<textarea name="text" maxlength="500" placeholder="Apa yang ingin Anda bagikan?"></textarea></label><label>Foto atau video<input type="file" name="media" accept="image/*,video/*"></label><button class="primary-button" type="submit">Bagikan Status</button><p class="small-note" style="margin:0">Status saat ini disimpan pada perangkat ini dan belum disinkronkan ke pengguna lain.</p></form>`, "main");
    $("#status-form").addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const text = String(data.get("text") || "").trim();
      const file = data.get("media");
      if (!text && !(file instanceof File && file.size)) return showToast("Tambahkan teks atau pilih media.");
      const statuses = JSON.parse(localStorage.getItem(localKey("statuses")) || "[]");
      statuses.unshift({ text, createdAt: new Date().toISOString(), fileName: file instanceof File ? file.name : "" });
      localStorage.setItem(localKey("statuses"), JSON.stringify(statuses.slice(0, 20)));
      renderStatuses();
      showToast("Status disimpan di perangkat ini.");
      backFromSubview();
    });
  }
  function renderStatuses() {
    const statuses = JSON.parse(localStorage.getItem(localKey("statuses")) || "[]");
    $("#status-list").className = statuses.length ? "list-area" : "list-area empty-state compact-empty";
    $("#status-list").innerHTML = statuses.length ? statuses.map(s => `<div class="contact-row">${avatar(state.user.name, state.user.photo)}<span class="contact-meta"><strong>Anda</strong><small>${esc(s.text || s.fileName || "Status media")}</small></span><span class="contact-time">${new Date(s.createdAt).toLocaleTimeString("id-ID", {hour:"2-digit",minute:"2-digit"})}</span></div>`).join("") : "Belum ada status baru.";
  }

  $("#login-form").addEventListener("submit", async event => {
    event.preventDefault();
    const dial = $("#country").selectedOptions[0]?.dataset.dial || "+62";
    let number = $("#phone").value.replace(/[^\d]/g, "");
    if (number.startsWith("0")) number = number.slice(1);
    if (number.length < 6 || number.length > 15) {
      $("#login-message").textContent = "Masukkan nomor telepon yang valid (6–15 digit).";
      return;
    }
    const phone = `${dial}${number}`;
    const saved = localStorage.getItem("hasnanchat:session");
    let previous = null;
    try { previous = JSON.parse(saved || "null"); } catch {}
    state.user = previous?.phone === phone ? previous : { phone, name: `Pengguna ${phone.slice(-4)}`, bio: "", photo: "" };
    saveUser();
    await loadContacts();
    showMain();
    renderStatuses();
  });
  $("#search-open").addEventListener("click", () => {
    $("#search-panel").classList.toggle("hidden");
    if (!$("#search-panel").classList.contains("hidden")) $("#search-input").focus();
  });
  $("#search-close").addEventListener("click", () => { $("#search-panel").classList.add("hidden"); $("#search-input").value = ""; renderChatList(); });
  $("#search-input").addEventListener("input", renderChatList);
  $("#menu-open").addEventListener("click", renderMenu);
  $("#add-button").addEventListener("click", renderPickContact);
  $("#ai-button").addEventListener("click", () => showToast("Hasnan AI belum terhubung ke layanan AI. Tidak ada balasan simulasi."));
  $("#sub-back").addEventListener("click", backFromSubview);
  $("#sub-search-open").addEventListener("click", () => {
    const query = prompt("Cari kontak:");
    if (query !== null) {
      const match = state.contacts.find(c => `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase()));
      if (match) openChat(match.id); else showToast("Kontak tidak ditemukan.");
    }
  });
  $("#my-status").addEventListener("click", createStatus);
  $("#status-create").addEventListener("click", createStatus);
  $$(".nav-item").forEach(item => item.addEventListener("click", () => setPage(item.dataset.page)));
  $$(".filter-chip").forEach(item => item.addEventListener("click", () => {
    state.filter = item.dataset.filter;
    $$(".filter-chip").forEach(chip => chip.classList.toggle("selected", chip === item));
    renderChatList();
  }));
  $("#main-screen").addEventListener("touchstart", event => { state.touchStartX = event.changedTouches[0]?.screenX ?? null; }, { passive: true });
  $("#main-screen").addEventListener("touchend", event => {
    if (state.touchStartX === null) return;
    const delta = (event.changedTouches[0]?.screenX ?? state.touchStartX) - state.touchStartX;
    state.touchStartX = null;
    if (Math.abs(delta) < 80) return;
    const pages = ["chat-page", "status-page", "calls-page"];
    const index = pages.indexOf(state.activePage);
    const next = pages[Math.max(0, Math.min(pages.length - 1, index + (delta < 0 ? 1 : -1)))];
    setPage(next);
  }, { passive: true });

  async function boot() {
    fillCountries();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("hasnanchat:session") || "null"); } catch {}
    if (saved?.phone) {
      state.user = saved;
      await loadContacts();
      showMain();
      renderStatuses();
    }
    try {
      const health = await api("/api/health");
      setConnection(Boolean(health.ok));
    } catch { setConnection(false); }
  }
  boot();
})();
