(function () {
  const SUPABASE_URL = "https://kqeamcljzlsgknxklxyw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__ogwCjIp_G_RLn0zbc5C-g_Ix81VZps";

  const { createClient } = supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const MAX_LEADS = 14;

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

  function byId(id){ return document.getElementById(id); }
  function normalizeName(x) {
    return (x || "").trim().replace(/\s+/g, " ").toLowerCase();
  }
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function fetchAll() {
    const { data, error } = await db
      .from("lead_assignments")
      .select("*")
      .order("lead", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  function renderRows(rows, $tbody, $full) {
    $tbody.innerHTML = "";

    if (rows.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td colspan='6'><i>No leads assigned yet.</i></td>";
      $tbody.appendChild(tr);
      $full.textContent = "";
      return;
    }

    rows.forEach((row, i) => {
      const rot = rotation[row.lead] || {s1:"", s2:"", total:""};
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (i + 1) + "</td>" +
        "<td>" + escapeHtml(row.name_raw) + "</td>" +
        "<td>#" + row.lead + "</td>" +
        "<td>" + escapeHtml(rot.s1) + "</td>" +
        "<td>" + escapeHtml(rot.s2) + "</td>" +
        "<td>" + escapeHtml(rot.total) + "</td>";
      $tbody.appendChild(tr);
    });

    $full.textContent = rows.length >= MAX_LEADS
      ? "All leads assigned (1–14)."
      : "";
  }

  function pickAvailableLead(rows) {
    const used = new Set(rows.map(r => r.lead));
    const available = [];
    for (let i = 1; i <= MAX_LEADS; i++) if (!used.has(i)) available.push(i);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  window.addEventListener("DOMContentLoaded", async function () {
    const $name  = byId("leadName");
    const $btn   = byId("leadBtn");
    const $reset = byId("leadResetBtn");
    const $msg   = byId("leadMsg");
    const $full  = byId("leadFullMsg");
    const $tbody = byId("leadTableBody");

    if (!$name || !$btn || !$reset || !$msg || !$full || !$tbody) return;

    async function refresh() {
      const rows = await fetchAll();
      renderRows(rows, $tbody, $full);
      $btn.disabled = rows.length >= MAX_LEADS;
      return rows;
    }

    await refresh();

    $btn.addEventListener("click", async function () {
      try {
        const raw = ($name.value || "").trim();
        const key = normalizeName(raw);
        if (!key) { $msg.textContent = "Please enter your name."; return; }

        // Check if name already exists
        const { data: existing, error: err1 } = await db
          .from("lead_assignments")
          .select("*")
          .eq("name_key", key)
          .maybeSingle();

        if (err1) throw err1;

        if (existing) {
          $msg.textContent = raw + ": already generated — your number is #" + existing.lead + ".";
          await refresh();
          return;
        }

        // Get current assignments, pick an available number, then insert
        const rows = await refresh();
        const lead = pickAvailableLead(rows);
        if (lead === null) { $msg.textContent = "All leads are assigned."; return; }

        const { error: err2 } = await db
          .from("lead_assignments")
          .insert({ name_key: key, name_raw: raw, lead: lead });

        if (err2) {
          // If someone else took that lead at the same time, just refresh and try again
          $msg.textContent = "Someone else just took a slot—please click Generate again.";
          await refresh();
          return;
        }

        $msg.textContent = raw + ": your lead number is #" + lead + ".";
        await refresh();
      } catch (e) {
        $msg.textContent = "Error: " + (e.message || e);
      }
    });

    // Secure Edge Function ot reset the list
    $reset.addEventListener("click", async function () {
    const pw = prompt("Admin password?");
    if (!pw) return;

    const { data, error } = await db.functions.invoke("reset-leads", {
    body: { password: pw },
    });

    if (error || !data?.ok) {
    $msg.textContent = "Reset failed (wrong password or server error).";
    return;
    }

    $msg.textContent = "Reset done for everyone.";
    await refresh();
    });
  });
})();
