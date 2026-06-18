const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
// limite maior pra imagens em b64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// front-end static
app.use(express.static(path.join(__dirname, '.')));

// rotas
const routes = ['clientes', 'veiculos', 'agendamentos', 'ordens_servico', 'estoque', 'galeria'];

app.post('/api/login', async (req, res) => {
    const { user, pass } = req.body;
    try {
        const db = await getDb();
        const found = await db.get('SELECT * FROM usuarios WHERE user = ? AND pass = ?', [user, pass]);
        if (found) {
            res.json({ success: true, token: 'fake-jwt-token-123' });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha inválidos' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// gerador de crud dinamico
routes.forEach(route => {
    // list
    app.get(`/api/${route}`, async (req, res) => {
        try {
            const db = await getDb();
            const rows = await db.all(`SELECT * FROM ${route}`);
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // create
    app.post(`/api/${route}`, async (req, res) => {
        try {
            const db = await getDb();
            const keys = Object.keys(req.body);
            const values = Object.values(req.body);
            const placeholders = keys.map(() => '?').join(',');
            
            const sql = `INSERT INTO ${route} (${keys.join(',')}) VALUES (${placeholders})`;
            const result = await db.run(sql, values);
            
            res.json({ id: result.lastID, ...req.body });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // update
    app.put(`/api/${route}/:id`, async (req, res) => {
        try {
            const db = await getDb();
            const keys = Object.keys(req.body);
            const values = Object.values(req.body);
            const setString = keys.map(k => `${k} = ?`).join(',');
            
            const sql = `UPDATE ${route} SET ${setString} WHERE id = ?`;
            await db.run(sql, [...values, req.params.id]);
            
            res.json({ id: req.params.id, ...req.body });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // delete
    app.delete(`/api/${route}/:id`, async (req, res) => {
        try {
            const db = await getDb();
            await db.run(`DELETE FROM ${route} WHERE id = ?`, [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
