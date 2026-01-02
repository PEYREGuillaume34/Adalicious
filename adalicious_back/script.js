import express from "express";
import cors from "cors";
import 'dotenv/config';
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
});

const app = express();

app.use(express.json());
app.use(cors());

// ========================================
// ROUTE RACINE
// ========================================
app.get("/", (req, res) => {
    res.send("Accueil - API Adalicious");
});

// ========================================
// ROUTES MENU
// ========================================

// GET /menu - Récupère tous les plats
app.get("/menu", async (req, res) => {
    try {
        const menu = await sql`SELECT * FROM menus`;
        console.log('[GET /menu] Plats récupérés:', menu.length);
        res.json(menu);
    }
    catch (err) {
        console.error('[GET /menu] Erreur:', err);
        res.status(500).json({ error: "Erreur lors de la récupération du menu" });
    }
});

// ========================================
// ROUTES ORDERS
// ========================================

// GET /orders - Liste toutes les commandes avec JOIN
app.get("/orders", async (req, res) => {
    try {
        const orders = await sql`
            SELECT 
                o.id,
                o.user_id,
                o.menu_id,
                o.order_status_id,
                o.created_at,
                u.firstname,
                m.plate_name,
                m.image,
                os.status_name,
                os.disponibilite
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN menus m ON o.menu_id = m.id
            JOIN orders_status os ON o.order_status_id = os.id
            ORDER BY o.id DESC
        `;
        console.log('[GET /orders] Commandes récupérées:', orders.length);
        res.json(orders);
    }
    catch (err) {
        console.error('[GET /orders] Erreur:', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST /orders - Créer une nouvelle commande
app.post("/orders", async (req, res) => {
    console.log("[POST /orders] Body reçu:", req.body);
    const { menu_id, clientName } = req.body;
    
    // Validation des données
    if (!menu_id || !clientName) {
        console.log('[POST /orders] Champs manquants');
        return res.status(400).json({ error: "menu_id et clientName sont requis" });
    }
    
    try {
        // 1️⃣ Chercher ou créer l'utilisateur
        let user = await sql`SELECT id FROM users WHERE firstname = ${clientName}`;
        
        let userId;
        if (user.length === 0) {
            // L'utilisateur n'existe pas → on le crée
            const newUser = await sql`
                INSERT INTO users (firstname, created_at) 
                VALUES (${clientName}, NOW()) 
                RETURNING id
            `;
            userId = newUser[0].id;
            console.log(`[POST /orders] Nouvel utilisateur créé - id=${userId}, nom="${clientName}"`);
        } else {
            // L'utilisateur existe déjà
            userId = user[0].id;
            console.log(`[POST /orders] Utilisateur existant trouvé - id=${userId}, nom="${clientName}"`);
        }
        
        // 2️⃣ Créer la commande avec statut "en_preparation" (id=1)
        const newOrder = await sql`
            INSERT INTO orders (user_id, menu_id, order_status_id, created_at)
            VALUES (${userId}, ${menu_id}, 1, NOW())
            RETURNING *
        `;
        
        console.log(`[POST /orders] Commande créée - order_id=${newOrder[0].id}, user_id=${userId}, menu_id=${menu_id}`);
        
        // 3️⃣ Récupérer les infos complètes de la commande avec JOIN
        const orderComplete = await sql`
            SELECT 
                o.id as order_id,
                u.firstname,
                m.plate_name,
                m.image,
                os.status_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN menus m ON o.menu_id = m.id
            JOIN orders_status os ON o.order_status_id = os.id
            WHERE o.id = ${newOrder[0].id}
        `;
        
        return res.status(201).json({ 
            ok: true, 
            message: `Commande reçue : ${orderComplete[0].plate_name} pour ${clientName}`,
            order: orderComplete[0]
        });
        
    } catch (err) {
        console.error('[POST /orders] Erreur:', err);
        return res.status(500).json({ error: "Erreur lors de la création de la commande" });
    }
});

// PATCH /orders/:id/status - Modifier le statut d'une commande
app.patch("/orders/:id/status", async (req, res) => {
    const orderId = parseInt(req.params.id);
    const { status_id } = req.body;
    
    console.log(`[PATCH /orders/${orderId}/status] Nouveau statut:`, status_id);
    
    // Validation
    if (!status_id || ![1, 2, 3].includes(status_id)) {
        return res.status(400).json({ error: "status_id invalide (doit être 1, 2 ou 3)" });
    }
    
    try {
        // Mettre à jour le statut
        const result = await sql`
            UPDATE orders 
            SET order_status_id = ${status_id}
            WHERE id = ${orderId}
            RETURNING *
        `;
        
        if (result.length === 0) {
            return res.status(404).json({ error: "Commande non trouvée" });
        }
        
        console.log(`[PATCH /orders/${orderId}/status] Statut mis à jour vers ${status_id}`);
        
        // Récupérer les infos complètes
        const orderComplete = await sql`
            SELECT 
                o.id,
                o.user_id,
                o.menu_id,
                o.order_status_id,
                u.firstname,
                m.plate_name,
                m.image,
                os.status_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN menus m ON o.menu_id = m.id
            JOIN orders_status os ON o.order_status_id = os.id
            WHERE o.id = ${orderId}
        `;
        
        return res.json({ 
            ok: true, 
            message: "Statut mis à jour avec succès",
            order: orderComplete[0]
        });
        
    } catch (err) {
        console.error(`[PATCH /orders/${orderId}/status] Erreur:`, err);
        return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
});

// ========================================
// ROUTES USERS
// ========================================

// GET /users - Liste tous les utilisateurs
app.get("/users", async (req, res) => {
    try {
        const users = await sql`SELECT * FROM users ORDER BY id DESC`;
        console.log('[GET /users] Utilisateurs récupérés:', users.length);
        res.json(users);
    }
    catch (err) {
        console.error('[GET /users] Erreur:', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// POST /users - Créer un nouvel utilisateur (optionnel, déjà géré dans POST /orders)
app.post("/users", async (req, res) => {
    try {
        const { firstname } = req.body;
        
        if (!firstname) {
            return res.status(400).json({ error: "firstname est requis" });
        }

        const newUser = await sql`
            INSERT INTO users (firstname, created_at) 
            VALUES (${firstname}, NOW())
            RETURNING *
        `;
        
        console.log('[POST /users] Utilisateur créé:', newUser[0]);
        res.status(201).json(newUser[0]);
        
    } catch (error) {
        console.error('[POST /users] Erreur:', error);
        res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
    }
});

// Test de connexion à la base de données
(async () => {
    try {
        console.log("🔍 Test de connexion à Neon...");
        const test = await sql`SELECT NOW()`;
        console.log("✅ Connexion réussie à Neon !", test[0]);
    } catch (err) {
        console.error("❌ ERREUR de connexion à Neon:", err.message);
        console.error("Vérifiez votre DATABASE_URL dans le .env");
    }
})();

// ========================================
// LANCEMENT DU SERVEUR
// ========================================

app.listen(3000, () => { 
    console.log("✅ Serveur lancé sur http://localhost:3000"); 
});
