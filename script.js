// ================ CONFIGURATION ================
const API_URL = "https://script.google.com/macros/s/AKfycbzSpZ8pZ170BY_9cBvt9XEvPWKLQYOxWUxZqhDIDhIlrnN9TSEjPkykQpPgMTxc23BFvQ/exec";


// ==== LOGIN ====
const users = [
  { username: "admin", password: "picyas" }
];

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("btnLogin");
  const loginContainer = document.getElementById("loginContainer");
  const mainContainer = document.getElementById("mainContainer");
  const loginError = document.getElementById("loginError");

  loginBtn.addEventListener("click", () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const userValid = users.find(u => u.username === username && u.password === password);

    if (userValid) {
      // Login OK → on affiche le contenu principal
      loginContainer.style.display = "none";
      mainContainer.style.display = "block";

      // Charger les collaborateurs dès l'ouverture
      loadCollaborateurs();
    } else {
      // Login échoué
      loginError.style.display = "block";
    }
  });
});

const slogans = [
  "Chaque expérience est unique.",
  "Grandissons ensemble.",
  "Votre potentiel, notre mission.",
  "L’excellence commence par l’humain.",
  "La compétence au cœur de la performance.",
  "Construisons l’avenir ensemble.",
  "Apprendre, évoluer, réussir.",
  "La qualité est notre engagement.",
  "Votre savoir-faire fait la différence.",
  "Ensemble vers l’excellence.",

  // Versions compétences / talents gardées (les plus distinctes)
  "Vos compétences, notre fierté.",
  "Compétences d’aujourd’hui, succès de demain.",
  "Développer les compétences, libérer les performances.",
  "Chaque compétence compte, chaque personne brille.",
  "Cultivons les compétences, récoltons l’excellence.",
  "Rendre visible chaque compétence.",
  "Vos compétences prennent vie ici.",

  // Versions talents (gardé 2-3 variées)
  "Révéler les talents, construire l’excellence.",
  "Valoriser chaque talent, accélérer chaque projet.",
  "Votre talent mérite d’être vu.",
  "Mettre en lumière vos talents."
];

let sloganIndex = 0;
const sloganElement = document.getElementById("sloganText");

// Sécurité : vérifier que l’élément existe
if (sloganElement) {
  setInterval(() => {
    sloganIndex = (sloganIndex + 1) % slogans.length;
    sloganElement.textContent = slogans[sloganIndex];
  }, 3000); // 3 secondes par slogan
}



// ================ VARIABLES GLOBALES ================
let pendingPayload = null;
let currentMatricule = null;

// ================ ÉVÉNEMENTS AU CHARGEMENT ================
document.addEventListener("DOMContentLoaded", () => {
  loadCollaborateurs();
});

// ================ CHARGER LES COLLABORATEURS ================
async function loadCollaborateurs() {
  resetUI();

  matricule.disabled = true;
  matricule.innerHTML = "<option>Chargement...</option>";

  try {
    const response = await fetch(`${API_URL}?action=getCollaborateurs&sheetName=${encodeURIComponent(sheetName.value)}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erreur serveur");
    }

    matricule.innerHTML = "<option disabled selected>Sélectionner...</option>";
    result.data.forEach(c => {
      const o = document.createElement("option");
      o.value = c.matricule;
      o.textContent = `${c.matricule} - ${c.nom}`;
      matricule.appendChild(o);
    });

    matricule.disabled = false;
  } catch (err) {
    console.error(err);
    matricule.innerHTML = "<option>Erreur de chargement</option>";
  }
}

// ================ QUAND ON CHANGE DE COLLABORATEUR ================
matricule.addEventListener("change", async () => {
  resetUI();

  const selectedMatricule = matricule.value;
  if (!selectedMatricule) return;

  currentMatricule = selectedMatricule;

  try {
    const response = await fetch(
      `${API_URL}?action=getCollaborateur&sheetName=${encodeURIComponent(sheetName.value)}&matricule=${encodeURIComponent(selectedMatricule)}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Collaborateur non trouvé");
    }

    showCollaborateur(result.data);
  } catch (err) {
    console.error(err);
    alert("Impossible de charger les informations du collaborateur");
  }
});

// ================ AFFICHER LES INFOS DU COLLABORATEUR ================
function showCollaborateur(c) {
  i_matricule.textContent = c.matricule;
  i_nom.textContent = c.nom;
  i_fonction.textContent = c.fonction;
  i_anciennete.textContent = c.anciennete || "-";
  i_ancienPoste.textContent = c.ancienPoste || "-";

  info.style.display = "block";

  // Charger les compétences associées à la fonction
  loadCompetences(c.fonction);
}

// ================ CHARGER LES COMPÉTENCES PAR FONCTION ================
async function loadCompetences(fonction) {
  try {
    const response = await fetch(
      `${API_URL}?action=getCompetencesParFonction&fonction=${encodeURIComponent(fonction)}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erreur chargement compétences");
    }

    renderCompetences(result.data);
  } catch (err) {
    console.error(err);
    competenceContainer.innerHTML = "<p style='color:red'>Erreur lors du chargement des compétences</p>";
  }
}

// ================ AFFICHAGE DES COMPÉTENCES ================
function renderCompetences(list) {
  competenceContainer.innerHTML = "";
  competenceTitle.style.display = "block";
  btnSave.style.display = "block";

  list.forEach(c => {
    const block = document.createElement("div");
    block.className = "competence-block";

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

      // Désélectionner les autres
      document.querySelectorAll(`input[name="${radio.name}"]`)
        .forEach(x => x.closest(".level-row").classList.remove("selected"));

      radio.checked = true;
      row.classList.add("selected");
    });
  });
}

// ================ SAUVEGARDE → RÉCAP ================
function save() {
  const competences = [];

  document.querySelectorAll(".competence-block").forEach(b => {
    const competenceText = b.querySelector(".competence-title").textContent;
    // On prend seulement le nom de la compétence (avant le tiret)
    const competence = competenceText.split(" - ")[0].trim();

    const selected = b.querySelector("input:checked");
    if (selected) {
      competences.push({
        competence: competence,
        niveau: Number(selected.value)
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

// ================ MODAL RÉCAP ================
function showRecap(list) {
  recapContent.innerHTML = "";
  document.getElementById("commentaire").value = "";

  list.forEach(c => {
    const div = document.createElement("div");
    div.className = `recap-item recap-level-${c.niveau}`;
    div.innerHTML = `
      <span>${c.competence}</span>
      <span>Niveau ${c.niveau}</span>
    `;
    recapContent.appendChild(div);
  });

  recapModal.style.display = "flex";
  launchFireworks();
}

function closeRecap() {
  recapModal.style.display = "none";
  pendingPayload = null;
}

// ================ CONFIRMATION FINALE ================
async function confirmSave() {
  const textarea = document.getElementById("commentaire");
  const error = document.getElementById("commentError");
  const commentaire = textarea.value.trim();

  if (!commentaire) {
    textarea.style.borderColor = "#ef4444";
    error.style.display = "block";
    textarea.focus();
    return;
  }

  // Reset style erreur
  textarea.style.borderColor = "#e2e8f0";
  error.style.display = "none";

  pendingPayload.commentaire = commentaire;

  recapModal.style.display = "none";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",           // très important pour Google Apps Script
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "updateSelection",
        sheetName: sheetName.value,
        matricule: pendingPayload.matricule,
        competences: pendingPayload.competences,
        commentaire: pendingPayload.commentaire
      }),
      redirect: "follow"
    });

    // Avec no-cors on ne peut pas lire la réponse → on assume que si pas d'erreur réseau c'est OK
    successMessage.style.display = "flex";
    setTimeout(() => {
      successMessage.style.display = "none";
      loadCollaborateurs();   // recharge la liste
      resetUI();
    }, 2000);

  } catch (err) {
    console.error("Erreur sauvegarde :", err);
    alert("Erreur lors de l'enregistrement");
  } finally {
    pendingPayload = null;
  }
}

// ================ FIREWORKS 🎆 ================
function launchFireworks() {
  const modal = document.querySelector(".modal-content");
  if (!modal) return;

  for (let i = 0; i < 15; i++) {
    const f = document.createElement("div");
    f.className = "firework";
    f.style.left = Math.random() * 100 + "%";
    f.style.top = Math.random() * 100 + "%";
    f.style.background = randomColor();
    modal.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }
}

function randomColor() {
  const colors = ["#22c55e","#3b82f6","#8b5cf6","#f59e0b","#ec4899"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ================ RESET UI ================
function resetUI() {
  info.style.display = "none";
  competenceContainer.innerHTML = "";
  competenceTitle.style.display = "none";
  btnSave.style.display = "none";
  if (recapModal) recapModal.style.display = "none";
  pendingPayload = null;
  currentMatricule = null;
}

// Optionnel : masquer erreur commentaire dès qu'on tape
document.addEventListener("input", e => {
  if (e.target.id === "commentaire") {
    document.getElementById("commentError").style.display = "none";
    e.target.style.borderColor = "#e2e8f0";
  }
});