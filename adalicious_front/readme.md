📄 front.js commenté


// Attente que toute la page soit chargée avant d’exécuter le JS
document.addEventListener("DOMContentLoaded", () => {
  // Si on trouve un bouton #validate, alors on est sur index.html
  if (document.querySelector("#validate")) {
    handleIndexPage();
  } 
  // Si on trouve la div #order, alors on est sur pageOrder.html
  else if (document.querySelector("#order")) {
    handleOrderPage();
  }
});


👉 Ici, j’adapte le script à la page courante (index ou order), en détectant la présence d’éléments spécifiques.

function handleIndexPage() {
  const btn = document.querySelector("#validate");

  // Quand on clique sur le bouton "valider"
  btn.addEventListener("click", (e) => {
    e.preventDefault(); // empêche le rechargement de la page

    // On récupère la valeur du champ prénom
    let prenom = document.querySelector("#inputName").value.trim();

    if (prenom.length === 0) {
      // Si le champ est vide → alerte
      alert("Merci d'entrer un prénom !");
    } else {
      // Sinon, on stocke le prénom dans le localStorage
      localStorage.setItem("prenom", prenom);

      // Puis on redirige vers la page de commande
      window.location.href = "pageOrder.html";
    }
  });
}


👉 localStorage permet de sauvegarder le prénom pour le réutiliser dans pageOrder.html.
👉 La redirection permet de passer de la page d’accueil vers la page commande.

async function handleOrderPage() {
  // On récupère le prénom sauvegardé (ou "invité" par défaut)
  const prenom = localStorage.getItem("prenom") || "invité";

  // On met à jour le texte de l’en-tête
  document.querySelector("h3").textContent = `Bonjour ${prenom}`;

  try {
    // On récupère la liste des plats depuis le backend
    const res = await fetch("http://localhost:3000/menu");
    const menus = await res.json();

    // On affiche les plats à l’écran
    displayMenus(menus);
  } catch (err) {
    // Si erreur (backend éteint, mauvais port, etc.)
    console.error("Erreur lors du chargement du menu :", err);
    const orderDiv = document.querySelector("#order");
    orderDiv.innerHTML += `<p style="color:red;">Impossible de charger le menu 😢</p>`;
  }
}


👉 Ici, on fait un fetch vers ton backend Express.
👉 Si ça marche → on affiche les plats avec displayMenus.
👉 Si ça échoue → on affiche un message d’erreur en rouge.

function displayMenus(menus) {
  const orderDiv = document.querySelector("#order");

  // On supprime d’éventuels anciens plats déjà affichés
  const oldMenus = orderDiv.querySelectorAll(".menuCard");
  oldMenus.forEach(m => m.remove());

  // Pour chaque plat reçu du backend
  menus.forEach((plat) => {
    const card = document.createElement("div");
    card.classList.add("menuCard"); // pour ton CSS

    // On construit l’affichage du plat
    card.innerHTML = `
      <div>${plat.image || "🍽️"}</div>
      <span>
        <h4>${plat.plate}</h4>
        <p>${plat.description}</p>
        <button class="command" data-id="${plat.id}">commander</button>
      </span>
    `;

    // Quand on clique sur "commander"
    card.querySelector(".command").addEventListener("click", async () => {
      try {
        // On fait un fetch spécifique au plat (GET /menu/:id)
        const res = await fetch(`http://localhost:3000/menu/${plat.id}`);
        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();

        // Confirmation à l’utilisateur
        alert(`✅ Tu as commandé : ${data.plate}`);
      } catch (err) {
        alert("❌ Erreur lors de la commande");
        console.error(err);
      }
    });

    // On ajoute la carte au DOM
    orderDiv.appendChild(card);
  });
}


👉 menus.forEach parcourt ton JSON.
👉 Chaque plat devient une "carte" (menuCard).
👉 Le bouton "commander" va chercher le plat par son id et affiche une alerte.

🔑 Résumé

index.html → entre le prénom → sauvegarde dans localStorage → redirection vers pageOrder.html.

pageOrder.html → récupère prénom + menus → affiche dynamiquement les plats.

Bouton commander → appelle /menu/:id et affiche une confirmation.