(function () {
  const STORAGE_KEY = "lead_assignments_v3";
  const MAX_LEADS = 14;

  function byId(id){ return document.getElementById(id); }

  function normalizeName(x) {
    return (x || "").trim().replace(/\s+/g, " ").toLowerCase();
  }
  function loadArr() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch(e) { return []; }
  }
  function saveArr(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function usedLeadNumbers(arr) { return new Set(arr.map(x => x.lead)); }
  function findByName(arr, nameKey) { return arr.find(x => x.nameKey === nameKey); }

  const rotation = {
    1:{s1:"Feb 4",s2:"May 6",total:"2 sessions"},
    2:{s1:"Feb 11",s2:"May 13",total:"2 sessions"},
    3:{s1:"Feb 18",s2:"May 20",total:"2 sessions"},
    4:{s1:"Feb 25",s2:"May 27",total:"2 sessions"},
    5:{s1:"Mar 4",s2:"Jun 3 (co)",total:"2 sessions"},
    6:{s1:"Mar 11",s2:"Jun 3 (co)",total:"2 sessions"},
    7:{s1:"Mar 18",s2:"Jun 10",total:"2 sessions"},
    8:{s1:"Mar 25",s2:"Jun 17",total:"2 sessions"},
    9:{s1:"Apr 1 (co)",s2:"Jun 24",total:"2 sessions"},
    10:{s1:"Apr 1 (co)",s2:"Jul 8",total:"2 sessions"},
    11:{s1:"Apr 8",s2:"Jul 1 (co)",total:"2 sessions"},
    12:{s1:"Apr 15",s2:"Jul 1 (co)",total:"2 sessions"},
    13:{s1:"Apr 22",s2:"Jul 15",total:"2 sessions"},
    14:{s1:"Apr 29",s2:"Jul 22",total:"2 sessions"}
  };

  function render($tbody, $full, $btn) {
    const arr = loadArr().slice().sort((a,b) => a.lead - b.lead);
    $tbody.innerHTML = "";

    if (arr.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td colspan='6'><i>No leads assigned yet (in this browser).</i></td>";
      $tbody.appendChild(tr);
    } else {
      arr.forEach((row, i) => {
        const rot = rotation[row.lead] || {s1:"", s2:"", total:""};
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + (i + 1) + "</td>" +
          "<td>" + escapeHtml(row.nameRaw) + "</td>" +
          "<td>#" + row.lead + "</td>" +
          "<td>" + escapeHtml(rot.s1) + "</td>" +
          "<td>" + escapeHtml(rot.s2) + "</td>" +
          "<td>" + escapeHtml(rot.total) + "</td>";
        $tbody.appendChild(tr);
      });
    }

    if (arr.length >= MAX_LEADS) {
      $full.textContent = "All leads assigned (1–14) for this browser.";
      $btn.disabled = true;
    } else {
      $full.textContent = "";
      $btn.disabled = false;
    }
  }

  // Wait until the page is loaded, then wire up buttons
  window.addEventListener("DOMContentLoaded", function () {
    const $name  = byId("leadName");
    const $btn   = byId("leadBtn");
    const $reset = byId("leadResetBtn");
    const $msg   = byId("leadMsg");
    const $full  = byId("leadFullMsg");
    const $tbody = byId("leadTableBody");

    // If the section isn't on this page, do nothing
    if (!$name || !$btn || !$reset || !$msg || !$full || !$tbody) return;

    render($tbody, $full, $btn);

    $btn.addEventListener("click", function () {
      const raw = ($name.value || "").trim();
      const key = normalizeName(raw);

      if (!key) { $msg.textContent = "Please enter your name."; return; }

      const arr = loadArr();
      const existing = findByName(arr, key);

      if (existing) {
        const rot = rotation[existing.lead] || {s1:"", s2:""};
        $msg.textContent = raw + ": already generated — your number is #" + existing.lead +
          (rot.s1 || rot.s2 ? " (Session 1: " + rot.s1 + ", Session 2: " + rot.s2 + ")." : ".");
        render($tbody, $full, $btn);
        return;
      }

      if (arr.length >= MAX_LEADS) {
        $msg.textContent = "All leads are already assigned (1–14) on this browser.";
        render($tbody, $full, $btn);
        return;
      }

      const used = usedLeadNumbers(arr);
      let lead = randInt(1, MAX_LEADS);
      let guard = 0;
      while (used.has(lead) && guard < 200) { lead = randInt(1, MAX_LEADS); guard++; }

      arr.push({ nameKey: key, nameRaw: raw, lead: lead, createdAt: new Date().toISOString() });
      saveArr(arr);

      const rot = rotation[lead] || {s1:"", s2:""};
      $msg.textContent = raw + ": your lead number is #" + lead +
        (rot.s1 || rot.s2 ? " (Session 1: " + rot.s1 + ", Session 2: " + rot.s2 + ")." : ".");
      render($tbody, $full, $btn);
    });

    $reset.addEventListener("click", function () {
      const pw = prompt("Admin password?");
      if (pw !== "Jolly_005") { $msg.textContent = "Reset cancelled."; return; }
      localStorage.removeItem(STORAGE_KEY);
      $msg.textContent = "Reset done (for this browser).";
      render($tbody, $full, $btn);
    });
  });
})();