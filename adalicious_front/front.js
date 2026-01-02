// ========================================
// INITIALISATION
// ========================================

const validateBtn = document.querySelector("#validate");
const orderDiv = document.querySelector("#order");
const nameInput = document.querySelector("#inputName");

document.addEventListener("DOMContentLoaded", () => {
  if (validateBtn) {
    // On est sur index.html
    handleIndexPage();
  } else if (orderDiv) {
    // On est sur pageOrder.html
    handleOrderPage();
  } else if (document.getElementById("plateBlock")) {
    // On est sur pagePlates.html
    handlePlatesPage();
  } else if (document.getElementById("kitchenOrders")) {
    // On est sur kitchenView.html
    handleKitchenPage();
  }
});

// ========================================
// PAGE INDEX (Saisie du prénom)
// ========================================

function handleIndexPage() {
  validateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let prenom = nameInput.value.trim();

    if (prenom.length === 0) {
      alert("Merci d'entrer un prénom !");
    } else {
      // Sauvegarder le prénom pour la page suivante
      localStorage.setItem("prenom", prenom);
      // Redirection vers la page de commande
      window.location.href = "pageOrder.html";
    }
  });
}

// ========================================
// PAGE ORDER (Affichage du menu et commande)
// ========================================

async function handleOrderPage() {
  // Afficher le prénom dans le titre
  const prenom = localStorage.getItem("prenom") || "invité";
  document.querySelector("h3").textContent = `Bonjour ${prenom}`;

  console.log("[DEBUG] Début du chargement du menu...");

  try {
    console.log("[DEBUG] Appel fetch vers http://localhost:3000/menu");
    const res = await fetch("http://localhost:3000/menu");
    
    console.log("[DEBUG] Réponse reçue:", res.status, res.statusText);
    
    const data = await res.json();
    console.log("[DEBUG] Données reçues:", data);
    
    // ✅ Vérifier si c'est une erreur
    if (data.error) {
      throw new Error(data.error);
    }
    
    // ✅ Vérifier si c'est bien un tableau
    if (!Array.isArray(data)) {
      throw new Error("Le serveur n'a pas renvoyé un tableau");
    }
    
    // ✅ Vérifier si le tableau est vide
    if (data.length === 0) {
      orderDiv.innerHTML += `<p style="color:orange;">⚠️ Le menu est vide.</p>`;
      return;
    }
    
    displayMenus(data);
    console.log("[PAGE ORDER] Menu chargé:", data.length, "plats");
    
  } catch (err) {
    console.error("[PAGE ORDER] Erreur:", err);
    orderDiv.innerHTML += `<p style="color:red;">❌ Impossible de charger le menu : ${err.message}</p>`;
  }
}

function displayMenus(menus) {
  // Supprimer les anciens plats affichés
  const oldMenus = orderDiv.querySelectorAll(".menuCard");
  oldMenus.forEach((m) => m.remove());

  menus.forEach((plat) => {
    const card = document.createElement("div");
    card.classList.add("menuCard");

    card.innerHTML = `
      <div>${plat.image || "🍽️"}</div>
      <span>
        <h4>${plat.plate_name}</h4>
        <p>${plat.description}</p>
        <button class="command" data-id="${plat.id}">commander</button>
      </span>
    `;

    // Gestion du clic sur "commander"
    card.querySelector(".command").addEventListener("click", () => {
      commanderPlat(plat);
    });

    orderDiv.appendChild(card);
  });
}

async function commanderPlat(plat) {
  try {
    let username = localStorage.getItem("prenom");

    const resp = await fetch("http://localhost:3000/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_id: plat.id,      // ✅ On envoie l'ID du menu
        clientName: username    // ✅ Le prénom du client
      }),
    });

    const data = await resp.json();
    if (!data.ok) throw new Error(data.error);
    
    console.log("[COMMANDE] Succès:", data);
    alert(`✅ ${data.message}`);
    
    // Stocker les infos de la commande pour la page suivante
    localStorage.setItem("lastOrder", JSON.stringify({
      ...plat,
      order_id: data.order.order_id,
      status: data.order.status_name
    }));
    
    // Redirection vers la page de confirmation
    window.location.href = "pagePlates.html";
    
  } catch (e) {
    alert("❌ Impossible d'envoyer la commande.");
    console.error("[COMMANDE] Erreur:", e);
  }
}

// ========================================
// PAGE PLATES (Confirmation et suivi)
// ========================================

function handlePlatesPage() {
  const plateBlock = document.getElementById("plateBlock");
  const lastOrder = localStorage.getItem("lastOrder");
  
  if (!lastOrder) {
    plateBlock.innerHTML = "<p>Aucune commande en cours.</p>";
    return;
  }
  
  const plat = JSON.parse(lastOrder);
  plateBlock.innerHTML = `
    <h3>Suivi :</h3>
    <div id="inProgress">
      <h4>En préparation</h4>
      <div>${plat.image || "🍽️"}</div>
      <p>${plat.plate_name}</p>
    </div>
  `;
}

// ========================================
// PAGE KITCHEN (Vue cuisine - À créer)
// ========================================

async function handleKitchenPage() {
  console.log("[KITCHEN] Chargement de la vue cuisine");
  
  // Chargement initial des commandes
  await loadKitchenOrders();
  
  // Rafraîchissement automatique toutes les 5 secondes
  setInterval(loadKitchenOrders, 5000);
}

async function loadKitchenOrders() {
  try {
    const indicator = document.getElementById("refreshIndicator");
    if (indicator) indicator.textContent = "🔄 Mise à jour...";
    
    const res = await fetch("http://localhost:3000/orders");
    const orders = await res.json();
    
    console.log("[KITCHEN] Commandes chargées:", orders.length);
    displayKitchenOrders(orders);
    
    if (indicator) {
      indicator.textContent = `✅ Mis à jour à ${new Date().toLocaleTimeString()}`;
      setTimeout(() => indicator.textContent = "", 2000);
    }
    
  } catch (err) {
    console.error("[KITCHEN] Erreur:", err);
    const indicator = document.getElementById("refreshIndicator");
    if (indicator) indicator.textContent = "❌ Erreur";
  }
}

function displayKitchenOrders(orders) {
  const container = document.getElementById("kitchenOrders");
  container.innerHTML = ""; // Vider le conteneur
  
  // Filtrer par statut
  const enPreparation = orders.filter(o => o.order_status_id === 1);
  const pretes = orders.filter(o => o.order_status_id === 2);
  const livrees = orders.filter(o => o.order_status_id === 3);
  
  // Afficher chaque section
  container.innerHTML = `
    <div class="kitchen-section">
      <h3>🔥 En préparation (${enPreparation.length})</h3>
      <div class="orders-list" id="preparation-list"></div>
    </div>
    
    <div class="kitchen-section">
      <h3>✅ Prêtes (${pretes.length})</h3>
      <div class="orders-list" id="ready-list"></div>
    </div>
    
    <div class="kitchen-section">
      <h3>📦 Livrées (${livrees.length})</h3>
      <div class="orders-list" id="delivered-list"></div>
    </div>
  `;
  
  // Remplir chaque liste
  displayOrdersInList(enPreparation, "preparation-list", 1);
  displayOrdersInList(pretes, "ready-list", 2);
  displayOrdersInList(livrees, "delivered-list", 3);
}

function displayOrdersInList(orders, containerId, currentStatus) {
  const container = document.getElementById(containerId);
  
  if (orders.length === 0) {
    container.innerHTML = "<p style='color: gray;'>Aucune commande</p>";
    return;
  }
  
  orders.forEach(order => {
    const card = document.createElement("div");
    card.classList.add("kitchen-order-card");
    
    // Boutons pour changer le statut
    let buttons = "";
    if (currentStatus === 1) {
      // En préparation → peut passer à "prête"
      buttons = `<button class="btn-ready" data-id="${order.id}">Marquer comme prête ✅</button>`;
    } else if (currentStatus === 2) {
      // Prête → peut passer à "livrée"
      buttons = `<button class="btn-deliver" data-id="${order.id}">Marquer comme livrée 📦</button>`;
    }
    
    card.innerHTML = `
      <div class="order-header">
        <span class="order-id">#${order.id}</span>
        <span class="order-client">${order.firstname}</span>
      </div>
      <div class="order-body">
        <div class="order-image">${order.image || "🍽️"}</div>
        <div class="order-details">
          <h4>${order.plate_name}</h4>
          <small>${new Date(order.created_at).toLocaleTimeString()}</small>
        </div>
      </div>
      <div class="order-actions">
        ${buttons}
      </div>
    `;
    
    container.appendChild(card);
  });
  
  // Ajouter les événements sur les boutons
  container.querySelectorAll(".btn-ready").forEach(btn => {
    btn.addEventListener("click", () => updateOrderStatus(btn.dataset.id, 2));
  });
  
  container.querySelectorAll(".btn-deliver").forEach(btn => {
    btn.addEventListener("click", () => updateOrderStatus(btn.dataset.id, 3));
  });
}

async function updateOrderStatus(orderId, newStatusId) {
  try {
    const res = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_id: newStatusId })
    });
    
    const data = await res.json();
    
    if (data.ok) {
      console.log(`[KITCHEN] Commande #${orderId} mise à jour`);
      // Recharger les commandes
      await loadKitchenOrders();
    } else {
      alert("Erreur lors de la mise à jour");
    }
    
  } catch (err) {
    console.error("[KITCHEN] Erreur mise à jour:", err);
    alert("Erreur réseau");
  }
}




