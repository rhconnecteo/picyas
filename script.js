// ================= CONFIGURATION =================
const API_URL = "https://script.google.com/macros/s/AKfycbzSpZ8pZ170BY_9cBvt9XEvPWKLQYOxWUxZqhDIDhIlrnN9TSEjPkykQpPgMTxc23BFvQ/exec";

// ================= LOGIN =================
const users = [{ username: "admin", password: "picyas" }];

document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.getElementById("btnLogin");
  const loginContainer = document.getElementById("loginContainer");
  const mainContainer = document.getElementById("mainContainer");
  const loginError = document.getElementById("loginError");

  btnLogin.addEventListener("click", () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const ok = users.find(u => u.username === username && u.password === password);

    if (ok) {
      loginContainer.style.display = "none";
      mainContainer.style.display = "block";
      loadCollaborateurs();
    } else {
      loginError.style.display = "block";
    }
  });
});

// ================= VARIABLES GLOBALES =================
let pendingPayload = null;
let currentMatricule = null;

// ================= CHARGEMENT INITIAL =================
document.addEventListener("DOMContentLoaded", () => {
  loadCollaborateurs();
});

// ================= CHARGER COLLABORATEURS =================
async function loadCollaborateurs() {
  resetUI();

  matricule.disabled = true;
  matricule.innerHTML = "<option>Chargement...</option>";

  try {
    const res = await fetch(
      `${API_URL}?action=getCollaborateurs&sheetName=${encodeURIComponent(sheetName.value)}`
    );
    const json = await res.json();

    if (!json.success) throw new Error(json.error);

    matricule.innerHTML = "<option disabled selected>Sélectionner...</option>";
    json.data.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.matricule;
      opt.textContent = `${c.matricule} - ${c.nom}`;
      matricule.appendChild(opt);
    });

    matricule.disabled = false;
  } catch (e) {
    console.error(e);
    matricule.innerHTML = "<option>Erreur chargement</option>";
  }
}

// ================= CHANGEMENT COLLABORATEUR =================
matricule.addEventListener("change", async () => {
  resetUI();

  if (!matricule.value) return;
  currentMatricule = matricule.value;

  try {
    const res = await fetch(
      `${API_URL}?action=getCollaborateur&sheetName=${encodeURIComponent(sheetName.value)}&matricule=${encodeURIComponent(currentMatricule)}`
    );
    const json = await res.json();

    if (!json.success) throw new Error(json.error);

    showCollaborateur(json.data);
  } catch (e) {
    alert("Erreur chargement collaborateur");
  }
});

// ================= AFFICHER COLLABORATEUR =================
function showCollaborateur(c) {
  i_matricule.textContent = c.matricule;
  i_nom.textContent = c.nom;
  i_fonction.textContent = c.fonction;
  i_anciennete.textContent = c.anciennete || "-";
  i_ancienPoste.textContent = c.ancienPoste || "-";

  info.style.display = "block";
  loadCompetences(c.fonction);
}

// ================= CHARGER COMPÉTENCES =================
async function loadCompetences(fonction) {
  try {
    const res = await fetch(
      `${API_URL}?action=getCompetencesParFonction&fonction=${encodeURIComponent(fonction)}`
    );
    const json = await res.json();

    if (!json.success) throw new Error(json.error);

    renderCompetences(json.data);
  } catch (e) {
    competenceContainer.innerHTML = "<p style='color:red'>Erreur chargement compétences</p>";
  }
}

// ================= AFFICHAGE COMPÉTENCES =================
function renderCompetences(list) {
  competenceContainer.innerHTML = "";
  competenceTitle.style.display = "block";
  btnSave.style.display = "block";

  list.forEach(c => {
    const block = document.createElement("div");
    block.className = "competence-block";

    // 🔐 stockage données utiles
    block.dataset.definition = c.definition;
    block.dataset.niv1 = c.niv1 || "";
    block.dataset.niv2 = c.niv2 || "";
    block.dataset.niv3 = c.niv3 || "";
    block.dataset.niv4 = c.niv4 || "";

    block.innerHTML = `
      <div class="competence-title">${c.competence} - ${c.definition}</div>
      ${renderLevel(c.competence, 1, c.niv1)}
      ${renderLevel(c.competence, 2, c.niv2)}
      ${renderLevel(c.competence, 3, c.niv3)}
      ${renderLevel(c.competence, 4, c.niv4)}
    `;

    competenceContainer.appendChild(block);
  });

  bindSelection();
}

function renderLevel(name, lvl, label) {
  if (!label) return "";
  return `
    <label class="level-row">
      <input type="radio" name="${name}" value="${lvl}">
      <span class="level-label">${label}</span>
    </label>
  `;
}

function bindSelection() {
  document.querySelectorAll(".level-row").forEach(row => {
    row.addEventListener("click", () => {
      const radio = row.querySelector("input");
      if (!radio) return;

      document
        .querySelectorAll(`input[name="${radio.name}"]`)
        .forEach(r => r.closest(".level-row").classList.remove("selected"));

      radio.checked = true;
      row.classList.add("selected");
    });
  });
}

// ================= SAUVEGARDE =================
function save() {
  const competences = [];

  document.querySelectorAll(".competence-block").forEach(b => {
    const title = b.querySelector(".competence-title").textContent;
    const competence = title.split(" - ")[0].trim();

    const selected = b.querySelector("input:checked");
    if (selected) {
      const niveau = Number(selected.value);
      const labelNiveau = b.dataset[`niv${niveau}`];

      competences.push({
        competence: competence,
        definition: b.dataset.definition,
        niveau: niveau,
        prix: labelNiveau   // ✅ libellé réel du niveau
      });
    }
  });

  if (!competences.length) {
    errorMessage.style.display = "flex";
    setTimeout(() => errorMessage.style.display = "none", 2000);
    return;
  }

  pendingPayload = {
    matricule: i_matricule.textContent,
    competences: competences,
    commentaire: ""
  };

  showRecap(competences);
}

// ================= RÉCAP =================
function showRecap(list) {
  recapContent.innerHTML = "";
  commentaire.value = "";

  list.forEach(c => {
    const div = document.createElement("div");
    div.className = `recap-item recap-level-${c.niveau}`;

    div.innerHTML = `
  <div class="recap-competence">
    <strong>${c.competence}</strong> - ${c.definition}
  </div>
  <div class="recap-niveau">
    ${c.prix}
  </div>
`;


    recapContent.appendChild(div);
  });

  recapModal.style.display = "flex";
}

// ================= CONFIRMATION =================
async function confirmSave() {
  if (!commentaire.value.trim()) {
    commentError.style.display = "block";
    commentaire.focus();
    return;
  }

  pendingPayload.commentaire = commentaire.value.trim();
  recapModal.style.display = "none";

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateSelection",
        sheetName: sheetName.value,
        matricule: pendingPayload.matricule,
        competences: pendingPayload.competences,
        commentaire: pendingPayload.commentaire
      })
    });

    successMessage.style.display = "flex";
    setTimeout(() => {
      successMessage.style.display = "none";
      loadCollaborateurs();
      resetUI();
    }, 2000);

  } catch (e) {
    alert("Erreur sauvegarde");
  }

  pendingPayload = null;
}

function closeRecap() {
  recapModal.style.display = "none";
  pendingPayload = null;
}


// ================= RESET UI =================
function resetUI() {
  info.style.display = "none";
  competenceContainer.innerHTML = "";
  competenceTitle.style.display = "none";
  btnSave.style.display = "none";
  recapModal.style.display = "none";
  pendingPayload = null;
  currentMatricule = null;
}

// ================= INPUT COMMENTAIRE =================
document.addEventListener("input", e => {
  if (e.target.id === "commentaire") {
    commentError.style.display = "none";
  }
});
