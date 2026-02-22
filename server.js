require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar o MySQL com variáveis de ambiente (escondendo do repositório)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = {
    run: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params || [], function (err, results) {
            if (callback) {
                if (results && results.insertId !== undefined) {
                    callback.call({ lastID: results.insertId }, err, results);
                } else {
                    callback(err, results);
                }
            }
        });
    },
    get: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params || [], function (err, results) {
            if (err) return callback(err);
            callback(null, results && results.length > 0 ? results[0] : undefined);
        });
    },
    all: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params || [], function (err, results) {
            callback(err, results);
        });
    }
};

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados MySQL', err.message);
    } else {
        console.log('Conectado ao banco de dados MySQL.');
        connection.release();

        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title TEXT NOT NULL,
            resume TEXT NOT NULL,
            content TEXT NOT NULL,
            image TEXT,
            author TEXT NOT NULL,
            date TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email VARCHAR(255)
        )`);

        // Criar ou atualizar usuário atendemei
        const hash = crypto.createHash('sha256').update('CoderMaster#2026').digest('hex');
        db.get('SELECT * FROM users WHERE username = ?', ['atendemei'], (err, row) => {
            if (!row) {
                db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', ['atendemei', hash, 'contato@atendemei.com']);
            } else {
                // Garante que a senha seja atualizada caso o usuário já exista
                db.run('UPDATE users SET password = ?, email = ? WHERE username = ?', [hash, 'contato@atendemei.com', 'atendemei']);
            }
        });
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname, { extensions: ['html'] }));

// Multer upload (simples, salvando na pasta uploads)
const multer = require('multer');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middlewares de autenticação simples baseada em cookie (NÃO RECOMENDADO PARA PROD)
const cookieParser = require('cookie-parser');
app.use(cookieParser());

function requireAuth(req, res, next) {
    if (req.cookies.auth === 'true') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Rotas da API

// Autenticação
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, hash], (err, row) => {
        if (row) {
            res.cookie('auth', 'true', { maxAge: 86400000, httpOnly: true }); // 1 dia
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, error: 'Credenciais inválidas' });
        }
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth');
    res.json({ success: true });
});

// Checar Status Login
app.get('/api/check-auth', (req, res) => {
    if (req.cookies.auth === 'true') {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});


// Listar todos os posts
app.get('/api/posts', (req, res) => {
    db.all('SELECT id, title, resume, image, author, date FROM posts ORDER BY date DESC, id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Pegar post específico
app.get('/api/posts/:id', (req, res) => {
    db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Post não encontrado' });
        }
    });
});

// Criar novo post
app.post('/api/posts', requireAuth, upload.single('image'), (req, res) => {
    const { title, resume, content, author, date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
        'INSERT INTO posts (title, resume, content, image, author, date) VALUES (?, ?, ?, ?, ?, ?)',
        [title, resume, content, image, author, date],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Post criado com sucesso' });
        }
    );
});

// Atualizar post
app.put('/api/posts/:id', requireAuth, upload.single('image'), (req, res) => {
    const { title, resume, content, author, date } = req.body;

    // Se enviou nova imagem, atualiza o path. Senão mantém a velha (precisaria de lógica extra pra pegar no banco se não enviou pra n apagar, vou simplificar e assumir que a imagem atual não muda se n mandar nova)

    db.get('SELECT image FROM posts WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        const image = req.file ? `/uploads/${req.file.filename}` : row.image;

        db.run(
            'UPDATE posts SET title = ?, resume = ?, content = ?, image = ?, author = ?, date = ? WHERE id = ?',
            [title, resume, content, image, author, date, req.params.id],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Post atualizado com sucesso' });
            }
        );
    });
});

// Sistema de Reset de Senha via E-Mail com Código (NodeMailer + Mock para teste)
const nodemailer = require('nodemailer');
const resetCodes = {}; // Cache temporário { email: { code: '123456', expires: 12345678 } }

// 1. Receber Email, Gerar Código e Enviar
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'E-mail não encontrado no sistema.' });

        // Gerar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        resetCodes[email] = { code, expires: Date.now() + 15 * 60000 }; // Expira em 15 minutos

        // => IMPRIMIR CÓDIGO NO TERMINAL PARA TESTE PRÁTICO (Caso SMTP não configurado) <=
        console.log(`\n\n=== ATENÇÃO USUÁRIO ===\nCÓDIGO DE RECUPERAÇÃO PARA O EMAIL ${email}: ${code}\n=======================\n\n`);

        try {
            // Em Produção: Configure suas credenciais SMTP reais aqui abaixo!
            const transporter = nodemailer.createTransport({
                host: "mail.atendemei.com", // EXEMPLO
                port: 465,
                secure: true,
                auth: {
                    user: "contato@atendemei.com", // Seu email real
                    pass: "SUA_SENHA_DE_EMAIL"     // Sua senha de email real
                }
            });

            await transporter.sendMail({
                from: '"Painel AtendeMEI" <contato@atendemei.com>',
                to: email,
                subject: "Código de Recuperação - AtendeMEI",
                html: `<h2>Redefinição de Senha</h2><p>Seu código de segurança é: <b style="font-size:18px">${code}</b></p><p>Este código expira em 15 minutos.</p>`
            });
        } catch (error) {
            console.log("Aviso: Falha ao enviar email real (SMTP ainda não configurado ou credenciais ausentes em server.js). Você pode checar o código de segurança impresso no terminal local.");
        }

        res.json({ success: true, message: 'Se o e-mail existir, um código foi enviado (veja o terminal local se em teste).' });
    });
});

// 2. Verificar Código Digitado
app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    const resetData = resetCodes[email];

    if (resetData && resetData.code === code) {
        if (resetData.expires > Date.now()) {
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Código expirado (passou de 15 minutos).' });
        }
    } else {
        res.status(400).json({ error: 'Código inválido.' });
    }
});

// 3. Cadastrar Nova Senha
app.post('/api/reset-password-with-code', (req, res) => {
    const { email, code, newPassword } = req.body;
    const resetData = resetCodes[email];

    if (resetData && resetData.code === code && resetData.expires > Date.now()) {
        const hash = crypto.createHash('sha256').update(newPassword).digest('hex');

        db.run('UPDATE users SET password = ? WHERE email = ?', [hash, email], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            delete resetCodes[email]; // invalidar código recém usado
            res.json({ success: true, message: 'Sua senha foi redefinida com sucesso!' });
        });
    } else {
        res.status(400).json({ error: 'Não foi possível redefinir. Código inválido ou expirado.' });
    }
});

// Deletar post
app.delete('/api/posts/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Post excluído com sucesso' });
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
