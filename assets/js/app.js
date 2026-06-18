/* ================================================
   AutoCenter Manager – app.js
   Lógica global: CRUD, localStorage, sidebar, auth
================================================ */

'use strict';

// ------------------------------------------------
// STORAGE – helpers genéricos
// ------------------------------------------------
const API_URL = 'http://localhost:3000/api';

const API = {
    async get(endpoint) {
        try {
            const res = await fetch(`${API_URL}/${endpoint}`);
            if (!res.ok) throw new Error('Erro na resposta do servidor');
            return res.json();
        } catch (err) {
            console.error('Erro de API (GET):', err);
            alert('Não foi possível conectar ao servidor. Certifique-se de que o backend (node server.js) está rodando.');
            throw err;
        }
    },
    async post(endpoint, data) {
        try {
            const res = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Erro na resposta do servidor');
            return res.json();
        } catch (err) {
            console.error('Erro de API (POST):', err);
            alert('Não foi possível salvar. Certifique-se de que o backend (node server.js) está rodando.');
            throw err;
        }
    },
    async put(endpoint, id, data) {
        try {
            const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Erro na resposta do servidor');
            return res.json();
        } catch (err) {
            console.error('Erro de API (PUT):', err);
            alert('Não foi possível atualizar. Certifique-se de que o backend (node server.js) está rodando.');
            throw err;
        }
    },
    async delete(endpoint, id) {
        try {
            const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Erro na resposta do servidor');
            return res.json();
        } catch (err) {
            console.error('Erro de API (DELETE):', err);
            alert('Não foi possível excluir. Certifique-se de que o backend (node server.js) está rodando.');
            throw err;
        }
    }
};

// ------------------------------------------------
// AUTENTICAÇÃO
// ------------------------------------------------
const Auth = {
    async login(user, pass) {
        try {
            const res = await fetch(API_URL + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass })
            });
            const data = await res.json();
            return data.success;
        } catch(e) { return false; }
    },

    check() {
        if (!sessionStorage.getItem('ac_logged') && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = '../index.html';
        }
    },

    logout() {
        sessionStorage.removeItem('ac_logged');
        window.location.href = '../index.html';
    }
};

// ------------------------------------------------
// SIDEBAR – marca link ativo
// ------------------------------------------------
function highlightSidebarLink() {
    const page = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && href === page) {
            a.classList.add('active');
        }
    });
}

function maskCPF(v) {
    return v.replace(/\D/g,'')
            .replace(/(\d{3})(\d)/,'$1.$2')
            .replace(/(\d{3})(\d)/,'$1.$2')
            .replace(/(\d{3})(\d{1,2})$/,'$1-$2');
}

function maskTel(v) {
    v = v.replace(/\D/g,'');
    if (v.length <= 10)
        return v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
    return v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3');
}

function maskMoney(v) {
    v = v.replace(/\D/g,'');
    v = (parseInt(v,10)/100).toFixed(2);
    return 'R$ ' + v.replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
}

function applyMask(input, fn) {
    input.addEventListener('input', () => {
        const cursor = input.selectionStart;
        input.value = fn(input.value);
        try { input.setSelectionRange(cursor, cursor); } catch(e) {}
    });
}

// ------------------------------------------------
// CLIENTES
// ------------------------------------------------
const Clientes = {
    ENDPOINT: 'clientes',
    list: [],

    async getAll() { this.list = await API.get(this.ENDPOINT); return this.list; },

    async add(obj) { await API.post(this.ENDPOINT, obj); },

    async remove(id) { await API.delete(this.ENDPOINT, id); },

    async update(id, obj) { await API.put(this.ENDPOINT, id, obj); },

    async render() {
        const tbody = document.getElementById('tbl-clientes');
        if (!tbody) return;
        const list = await this.getAll();
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fa-solid fa-users"></i><br>Nenhum cliente cadastrado ainda.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(c => `
            <tr>
                <td><strong>${c.nome}</strong></td>
                <td>${c.telefone}</td>
                <td>${c.email || '–'}</td>
                <td>${c.cpf || '–'}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="Clientes.startEdit(${c.id})"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="Clientes.confirmRemove(${c.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
    },

    startEdit(id) {
        const c = this.list.find(x => x.id === id);
        if (!c) return;
        document.getElementById('cli-id').value    = c.id;
        document.getElementById('cli-nome').value  = c.nome;
        document.getElementById('cli-tel').value   = c.telefone;
        document.getElementById('cli-email').value = c.email;
        document.getElementById('cli-cpf').value   = c.cpf;
        document.getElementById('btn-cli-submit').textContent = 'Salvar Alterações';
        document.getElementById('cli-nome').focus();
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    },

    async confirmRemove(id) {
        if (confirm('Excluir este cliente?')) {
            await this.remove(id);
            this.render();
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        const id    = parseInt(document.getElementById('cli-id').value);
        const obj   = {
            nome:     document.getElementById('cli-nome').value.trim(),
            telefone: document.getElementById('cli-tel').value.trim(),
            email:    document.getElementById('cli-email').value.trim(),
            cpf:      document.getElementById('cli-cpf').value.trim(),
        };
        if (!obj.nome) return alert('Nome é obrigatório.');
        if (id) { await Clientes.update(id, obj); } else { await Clientes.add(obj); }
        document.getElementById('form-clientes').reset();
        document.getElementById('cli-id').value = '';
        document.getElementById('btn-cli-submit').textContent = 'Cadastrar Cliente';
        Clientes.render();
    }
};

// ------------------------------------------------
// VEÍCULOS
// ------------------------------------------------
const Veiculos = {
    ENDPOINT: 'veiculos',
    list: [],

    async getAll() { this.list = await API.get(this.ENDPOINT); return this.list; },

    async add(obj) { await API.post(this.ENDPOINT, obj); },

    async remove(id) { await API.delete(this.ENDPOINT, id); },

    async update(id, obj) { await API.put(this.ENDPOINT, id, obj); },

    async render() {
        const tbody = document.getElementById('tbl-veiculos');
        if (!tbody) return;
        const list = await this.getAll();
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-car"></i><br>Nenhum veículo cadastrado ainda.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(v => `
            <tr>
                <td><strong>${v.placa}</strong></td>
                <td>${v.marca} ${v.modelo}</td>
                <td>${v.ano || '–'}</td>
                <td>${v.km ? Number(v.km).toLocaleString('pt-BR') + ' km' : '–'}</td>
                <td>${v.proprietario || '–'}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="Veiculos.startEdit(${v.id})"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="Veiculos.confirmRemove(${v.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
    },

    startEdit(id) {
        const v = this.list.find(x => x.id === id);
        if (!v) return;
        document.getElementById('vei-id').value          = v.id;
        document.getElementById('vei-placa').value       = v.placa;
        document.getElementById('vei-marca').value       = v.marca;
        document.getElementById('vei-modelo').value      = v.modelo;
        document.getElementById('vei-ano').value         = v.ano;
        document.getElementById('vei-km').value          = v.km;
        document.getElementById('vei-proprietario').value = v.proprietario;
        document.getElementById('btn-vei-submit').textContent = 'Salvar Alterações';
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    },

    async confirmRemove(id) {
        if (confirm('Excluir este veículo?')) {
            await this.remove(id);
            this.render();
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        const id  = parseInt(document.getElementById('vei-id').value);
        const obj = {
            placa:        document.getElementById('vei-placa').value.trim().toUpperCase(),
            marca:        document.getElementById('vei-marca').value.trim(),
            modelo:       document.getElementById('vei-modelo').value.trim(),
            ano:          document.getElementById('vei-ano').value,
            km:           document.getElementById('vei-km').value,
            proprietario: document.getElementById('vei-proprietario').value.trim(),
        };
        if (!obj.placa || !obj.modelo) return alert('Placa e Modelo são obrigatórios.');
        if (id) await Veiculos.update(id, obj); else await Veiculos.add(obj);
        document.getElementById('form-veiculos').reset();
        document.getElementById('vei-id').value = '';
        document.getElementById('btn-vei-submit').textContent = 'Cadastrar Veículo';
        Veiculos.render();
    }
};

// ------------------------------------------------
// AGENDAMENTOS
// ------------------------------------------------
const Agendamentos = {
    ENDPOINT: 'agendamentos',
    list: [],

    STATUS_CLASS: {
        'Agendado':     'badge-agendado',
        'Confirmado':   'badge-confirmado',
        'Em Execução':  'badge-em-execucao',
        'Concluído':    'badge-concluido',
    },

    async getAll() { this.list = await API.get(this.ENDPOINT); return this.list; },

    async add(obj) { await API.post(this.ENDPOINT, obj); },

    async remove(id) { await API.delete(this.ENDPOINT, id); },

    async update(id, obj) { await API.put(this.ENDPOINT, id, obj); },

    badgeHtml(status) {
        const cls = this.STATUS_CLASS[status] || 'badge-agendado';
        return `<span class="badge-status ${cls}">${status}</span>`;
    },

    async render() {
        const tbody = document.getElementById('tbl-agendamentos');
        if (!tbody) return;
        const list = await this.getAll();
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-calendar"></i><br>Nenhum agendamento cadastrado ainda.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(a => `
            <tr>
                <td><strong>${a.cliente}</strong></td>
                <td>${a.veiculo}</td>
                <td>${a.servico}</td>
                <td>${a.data ? new Date(a.data + 'T00:00').toLocaleDateString('pt-BR') : '–'}</td>
                <td>${a.hora || '–'}</td>
                <td>${this.badgeHtml(a.status)}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="Agendamentos.startEdit(${a.id})"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="Agendamentos.confirmRemove(${a.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
    },

    startEdit(id) {
        const a = this.list.find(x => x.id === id);
        if (!a) return;
        document.getElementById('age-id').value       = a.id;
        document.getElementById('age-cliente').value  = a.cliente;
        document.getElementById('age-veiculo').value  = a.veiculo;
        document.getElementById('age-data').value     = a.data;
        document.getElementById('age-hora').value     = a.hora;
        document.getElementById('age-servico').value  = a.servico;
        document.getElementById('age-status').value   = a.status;
        document.getElementById('btn-age-submit').textContent = 'Salvar Alterações';
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    },

    async confirmRemove(id) {
        if (confirm('Excluir este agendamento?')) {
            await this.remove(id);
            this.render();
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        const id  = parseInt(document.getElementById('age-id').value);
        const obj = {
            cliente: document.getElementById('age-cliente').value.trim(),
            veiculo: document.getElementById('age-veiculo').value.trim(),
            data:    document.getElementById('age-data').value,
            hora:    document.getElementById('age-hora').value,
            servico: document.getElementById('age-servico').value,
            status:  document.getElementById('age-status').value,
        };
        if (!obj.cliente) return alert('Cliente é obrigatório.');
        if (id) await Agendamentos.update(id, obj); else await Agendamentos.add(obj);
        document.getElementById('form-agendamentos').reset();
        document.getElementById('age-id').value = '';
        document.getElementById('btn-age-submit').textContent = 'Salvar Agendamento';
        Agendamentos.render();
    }
};

// ------------------------------------------------
// ORDENS DE SERVIÇO
// ------------------------------------------------
const Ordens = {
    ENDPOINT: 'ordens_servico',
    list: [],

    STATUS_CLASS: {
        'Aberta':       'badge-aberta',
        'Em Andamento': 'badge-andamento',
        'Finalizada':   'badge-finalizada',
        'Entregue':     'badge-entregue',
    },

    async getAll() { this.list = await API.get(this.ENDPOINT); return this.list; },

    async add(obj) { await API.post(this.ENDPOINT, obj); },

    async remove(id) { await API.delete(this.ENDPOINT, id); },

    async update(id, obj) { await API.put(this.ENDPOINT, id, obj); },

    badgeHtml(status) {
        const cls = this.STATUS_CLASS[status] || 'badge-aberta';
        return `<span class="badge-status ${cls}">${status}</span>`;
    },

    async render() {
        const tbody = document.getElementById('tbl-ordens');
        if (!tbody) return;
        const list = await this.getAll();
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-file-invoice"></i><br>Nenhuma ordem de serviço criada ainda.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(o => `
            <tr>
                <td><strong>#${String(o.id).padStart(3,'0')}</strong></td>
                <td>${o.cliente}</td>
                <td>${o.veiculo}</td>
                <td>${o.servico}</td>
                <td>${this.badgeHtml(o.status)}</td>
                <td>R$ ${parseFloat(o.total||0).toFixed(2).replace('.',',')}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="Ordens.startEdit(${o.id})"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="Ordens.confirmRemove(${o.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`).join('');
    },

    startEdit(id) {
        const o = this.list.find(x => x.id === id);
        if (!o) return;
        document.getElementById('os-id').value        = o.id;
        document.getElementById('os-cliente').value   = o.cliente;
        document.getElementById('os-veiculo').value   = o.veiculo;
        document.getElementById('os-servico').value   = o.servico;
        document.getElementById('os-status').value    = o.status;
        document.getElementById('os-descricao').value = o.descricao;
        document.getElementById('os-mao-obra').value  = o.maoObra;
        document.getElementById('os-pecas').value     = o.pecas;
        document.getElementById('os-total').value     = o.total;
        document.getElementById('btn-os-submit').textContent = 'Salvar Alterações';
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    },

    async confirmRemove(id) {
        if (confirm('Excluir esta ordem de serviço?')) {
            await this.remove(id);
            this.render();
        }
    },

    calcTotal() {
        const mao   = parseFloat(document.getElementById('os-mao-obra').value) || 0;
        const pecas = parseFloat(document.getElementById('os-pecas-valor').value) || 0;
        document.getElementById('os-total').value = (mao + pecas).toFixed(2);
    },

    async handleSubmit(e) {
        e.preventDefault();
        const id  = parseInt(document.getElementById('os-id').value);
        const obj = {
            cliente:   document.getElementById('os-cliente').value.trim(),
            veiculo:   document.getElementById('os-veiculo').value.trim(),
            servico:   document.getElementById('os-servico').value,
            status:    document.getElementById('os-status').value,
            descricao: document.getElementById('os-descricao').value.trim(),
            maoObra:   document.getElementById('os-mao-obra').value,
            pecas:     document.getElementById('os-pecas').value.trim(),
            total:     document.getElementById('os-total').value,
        };
        if (!obj.cliente) return alert('Cliente é obrigatório.');
        if (id) await Ordens.update(id, obj); else await Ordens.add(obj);
        document.getElementById('form-ordens').reset();
        document.getElementById('os-id').value = '';
        document.getElementById('btn-os-submit').textContent = 'Abrir Ordem de Serviço';
        Ordens.render();
    }
};

// ------------------------------------------------
// ESTOQUE
// ------------------------------------------------
const Estoque = {
    ENDPOINT: 'estoque',
    list: [],

    async getAll() { this.list = await API.get(this.ENDPOINT); return this.list; },

    async add(obj) { await API.post(this.ENDPOINT, obj); },

    async remove(id) { await API.delete(this.ENDPOINT, id); },

    async update(id, obj) { await API.put(this.ENDPOINT, id, obj); },

    async render() {
        const tbody = document.getElementById('tbl-estoque');
        if (!tbody) return;
        const list = await this.getAll();
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fa-solid fa-boxes-stacked"></i><br>Nenhum produto cadastrado ainda.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(e => {
            const baixo = parseInt(e.quantidade) < 5;
            return `
            <tr>
                <td><strong>${e.produto}</strong></td>
                <td>
                    <span class="${baixo ? 'alerta-estoque' : ''}">${e.quantidade} ${e.unidade || 'un'}</span>
                    ${baixo ? '<i class="fa-solid fa-triangle-exclamation text-danger ms-1" title="Estoque baixo!"></i>' : ''}
                </td>
                <td>R$ ${parseFloat(e.preco||0).toFixed(2).replace('.',',')}</td>
                <td>${e.categoria || '–'}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="Estoque.startEdit(${e.id})"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="Estoque.confirmRemove(${e.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    },

    startEdit(id) {
        const e = this.list.find(x => x.id === id);
        if (!e) return;
        document.getElementById('est-id').value        = e.id;
        document.getElementById('est-produto').value   = e.produto;
        document.getElementById('est-qtd').value       = e.quantidade;
        document.getElementById('est-unidade').value   = e.unidade;
        document.getElementById('est-preco').value     = e.preco;
        document.getElementById('est-categoria').value = e.categoria;
        document.getElementById('btn-est-submit').textContent = 'Salvar Alterações';
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    },

    async confirmRemove(id) {
        if (confirm('Excluir este produto?')) {
            await this.remove(id);
            this.render();
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        const id  = parseInt(document.getElementById('est-id').value);
        const obj = {
            produto:    document.getElementById('est-produto').value.trim(),
            quantidade: document.getElementById('est-qtd').value,
            unidade:    document.getElementById('est-unidade').value,
            preco:      document.getElementById('est-preco').value,
            categoria:  document.getElementById('est-categoria').value.trim(),
        };
        if (!obj.produto) return alert('Produto é obrigatório.');
        if (id) await Estoque.update(id, obj); else await Estoque.add(obj);
        document.getElementById('form-estoque').reset();
        document.getElementById('est-id').value = '';
        document.getElementById('btn-est-submit').textContent = 'Adicionar Produto';
        Estoque.render();
    }
};

// ------------------------------------------------
// GALERIA
// ------------------------------------------------
const Galeria = {
    ENDPOINT: 'galeria',
    list: [],

    async getAll() { this.list = await API.get(this.ENDPOINT); return this.list; },

    async add(obj) { await API.post(this.ENDPOINT, obj); },

    async remove(id) { await API.delete(this.ENDPOINT, id); },

    async render() {
        const container = document.getElementById('galeria-grid');
        if (!container) return;
        const list = await this.getAll();
        if (!list.length) {
            container.innerHTML = `<div class="col-12 empty-state"><i class="fa-solid fa-images"></i><p>Nenhuma foto adicionada ainda.</p></div>`;
            return;
        }
        container.innerHTML = list.map(g => `
            <div class="col-md-6 col-lg-4">
                <div class="card galeria-card">
                    <div class="galeria-header">
                        <span class="badge-status badge-concluido"><i class="fa-solid fa-car"></i> ${g.veiculo || 'Veículo'}</span>
                        <button class="btn-close-card" onclick="Galeria.confirmRemove(${g.id})"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="galeria-imgs">
                        <div class="galeria-img-box">
                            <span class="galeria-label">ANTES</span>
                            <img src="${g.antes}" alt="Antes" loading="lazy">
                        </div>
                        <div class="galeria-divider"><i class="fa-solid fa-arrow-right"></i></div>
                        <div class="galeria-img-box">
                            <span class="galeria-label after">DEPOIS</span>
                            <img src="${g.depois}" alt="Depois" loading="lazy">
                        </div>
                    </div>
                    ${g.descricao ? `<div class="galeria-desc">${g.descricao}</div>` : ''}
                </div>
            </div>`).join('');
    }
};

// ------------------------------------------------
// RELATÓRIOS
// ------------------------------------------------
const Relatorios = {
    async getResumo() {
        const ordens = await Ordens.getAll();
        const clientes = await Clientes.getAll();
        const veiculos = await Veiculos.getAll();
        const agendamentos = await Agendamentos.getAll();
        const estoque = await Estoque.getAll();
        const finaliz = ordens.filter(o => o.status === 'Finalizada' || o.status === 'Entregue');
        const receita = finaliz.reduce((acc, o) => acc + parseFloat(o.total || 0), 0);
        return {
            clientes: clientes.length,
            veiculos: veiculos.length,
            ordens:      ordens.length,
            receita:     receita,
            agendamentos: agendamentos.length,
            estoque: estoque.length,
        };
    },

    async getServicosContagem() {
        const ag = await Agendamentos.getAll();
        const ord = await Ordens.getAll();
        const todos = [...ag, ...ord];
        const cont = {};
        todos.forEach(a => { cont[a.servico] = (cont[a.servico] || 0) + 1; });
        return cont;
    },

    async getStatusOrdens() {
        const cont = {};
        const ord = await Ordens.getAll();
        ord.forEach(o => { cont[o.status] = (cont[o.status] || 0) + 1; });
        return cont;
    }
};

// ------------------------------------------------
// INIT POR PÁGINA
// ------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    highlightSidebarLink();

    const page = window.location.pathname.split('/').pop();

    // ----- LOGIN -----
    if (page === 'index.html' || page === '') {
        const form = document.getElementById('form-login');
        if (form) {
            form.addEventListener('submit', async e => {
                e.preventDefault();
                const user = document.getElementById('login-user').value.trim();
                const pass = document.getElementById('login-pass').value;
                if (await Auth.login(user, pass)) {
                    sessionStorage.setItem('ac_logged', '1');
                    window.location.href = 'pages/dashboard.html';
                } else {
                    const card = document.querySelector('.login-container');
                    card.classList.add('shake');
                    setTimeout(() => card.classList.remove('shake'), 500);
                    document.getElementById('login-error').style.display = 'block';
                }
            });
        }
    }

    // ----- SIDEBAR LOGOUT -----
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

    // ----- CLIENTES -----
    const formCli = document.getElementById('form-clientes');
    if (formCli) {
        formCli.addEventListener('submit', async e => Clientes.handleSubmit(e));
        applyMask(document.getElementById('cli-tel'), maskTel);
        applyMask(document.getElementById('cli-cpf'), maskCPF);
        Clientes.render();
    }

    // ----- VEÍCULOS -----
    const formVei = document.getElementById('form-veiculos');
    if (formVei) {
        formVei.addEventListener('submit', async e => Veiculos.handleSubmit(e));
        Veiculos.render();
    }

    // ----- AGENDAMENTOS -----
    const formAge = document.getElementById('form-agendamentos');
    if (formAge) {
        formAge.addEventListener('submit', async e => Agendamentos.handleSubmit(e));
        Agendamentos.render();
    }

    // ----- ORDENS -----
    const formOS = document.getElementById('form-ordens');
    if (formOS) {
        formOS.addEventListener('submit', async e => Ordens.handleSubmit(e));
        ['os-mao-obra','os-pecas-valor'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', Ordens.calcTotal);
        });
        Ordens.render();
    }

    // ----- ESTOQUE -----
    const formEst = document.getElementById('form-estoque');
    if (formEst) {
        formEst.addEventListener('submit', async e => Estoque.handleSubmit(e));
        Estoque.render();
    }

    // ----- GALERIA -----
    const formGal = document.getElementById('form-galeria');
    if (formGal) {
        formGal.addEventListener('submit', async e => {
            e.preventDefault();
            const veiculo  = document.getElementById('gal-veiculo').value.trim();
            const descricao = document.getElementById('gal-descricao').value.trim();
            const antesFile  = document.getElementById('gal-antes').files[0];
            const depoisFile = document.getElementById('gal-depois').files[0];
            if (!antesFile || !depoisFile) return alert('Selecione as duas fotos.');

            const reader1 = new FileReader();
            reader1.onload = ev1 => {
                const reader2 = new FileReader();
                reader2.onload = async ev2 => {
                    await Galeria.add({ veiculo, descricao, antes: ev1.target.result, depois: ev2.target.result });
                    formGal.reset();
                    document.getElementById('preview-antes').style.display  = 'none';
                    document.getElementById('preview-depois').style.display = 'none';
                    Galeria.render();
                };
                reader2.readAsDataURL(depoisFile);
            };
            reader1.readAsDataURL(antesFile);
        });

        // Previews
        ['gal-antes','gal-depois'].forEach(id => {
            const input = document.getElementById(id);
            const prev  = document.getElementById('preview-' + id.split('-')[1]);
            if (input && prev) {
                input.addEventListener('change', () => {
                    const file = input.files[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = ev => { prev.src = ev.target.result; prev.style.display = 'block'; };
                    r.readAsDataURL(file);
                });
            }
        });

        Galeria.render();
    }

    // ----- RELATÓRIOS -----
    if (page === 'relatorios.html') {
        initRelatorios();
    }

    // ----- DASHBOARD -----
    if (page === 'dashboard.html') {
        initDashboard();
    }
});

// ------------------------------------------------
// DASHBOARD – gráficos e KPIs
// ------------------------------------------------
async function initDashboard() {
    const res = await Relatorios.getResumo();
    const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setKpi('kpi-clientes',     res.clientes);
    setKpi('kpi-veiculos',     res.veiculos);
    setKpi('kpi-agendamentos', res.agendamentos);
    setKpi('kpi-os',           res.ordens);

    const PALETA = ['#2563eb','#7c3aed','#059669','#d97706','#0891b2','#dc2626'];

    // Gráfico de barras – serviços
    const ctxBar = document.getElementById('graficoServicos');
    if (ctxBar) {
        const cont = await Relatorios.getServicosContagem();
        const labels = Object.keys(cont).length ? Object.keys(cont) : ['Troca de Óleo','Lavagem','Polimento','Vitrificação','Revisão'];
        const data   = Object.keys(cont).length ? Object.values(cont) : [30,45,20,15,18];
        new Chart(ctxBar, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Quantidade', data, backgroundColor: PALETA, borderRadius: 6, borderSkipped: false }] },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
        });
    }

    // Gráfico pizza – distribuição
    const ctxPie = document.getElementById('graficoPizza');
    if (ctxPie) {
        const status = await Relatorios.getStatusOrdens();
        const labels = Object.keys(status).length ? Object.keys(status) : ['Mecânica','Estética'];
        const data   = Object.keys(status).length ? Object.values(status) : [60,40];
        new Chart(ctxPie, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: PALETA, borderWidth: 0 }] },
            options: { plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
        });
    }

    // Tabela próximos agendamentos
    const tbody = document.getElementById('tbl-proximos');
    if (tbody) {
        const ag = await Agendamentos.getAll();
        const list = ag.slice(0,5);
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhum agendamento.</td></tr>`;
        } else {
            tbody.innerHTML = list.map(a => `
                <tr>
                    <td>${a.cliente}</td>
                    <td>${a.veiculo}</td>
                    <td>${a.servico}</td>
                    <td>${a.data ? new Date(a.data+'T00:00').toLocaleDateString('pt-BR') : '–'}</td>
                    <td>${Agendamentos.badgeHtml(a.status)}</td>
                </tr>`).join('');
        }
    }
}

// ------------------------------------------------
// RELATÓRIOS – gráficos
// ------------------------------------------------
async function initRelatorios() {
    const res = await Relatorios.getResumo();
    const PALETA = ['#2563eb','#7c3aed','#059669','#d97706','#0891b2','#dc2626'];

    document.getElementById('rel-receita')     && (document.getElementById('rel-receita').textContent     = 'R$ ' + res.receita.toFixed(2).replace('.',','));
    document.getElementById('rel-ordens')      && (document.getElementById('rel-ordens').textContent      = res.ordens);
    document.getElementById('rel-clientes')    && (document.getElementById('rel-clientes').textContent    = res.clientes);
    document.getElementById('rel-agendamentos')&& (document.getElementById('rel-agendamentos').textContent= res.agendamentos);

    const ctxBar = document.getElementById('grafico-rel-bar');
    if (ctxBar) {
        const cont = await Relatorios.getServicosContagem();
        const labels = Object.keys(cont).length ? Object.keys(cont) : ['Lavagem','Polimento','Revisão','Troca de Óleo'];
        const data   = Object.keys(cont).length ? Object.values(cont) : [25,15,12,30];
        new Chart(ctxBar, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Serviços Realizados', data, backgroundColor: PALETA, borderRadius: 8, borderSkipped: false }] },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } }
        });
    }

    const ctxDoughnut = document.getElementById('grafico-rel-pizza');
    if (ctxDoughnut) {
        const status = await Relatorios.getStatusOrdens();
        const labels = Object.keys(status).length ? Object.keys(status) : ['Mecânica','Estética','Revisão'];
        const data   = Object.keys(status).length ? Object.values(status) : [45,35,20];
        new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: PALETA, borderWidth: 0 }] },
            options: { plugins: { legend: { position: 'bottom' } }, cutout: '65%' }
        });
    }
}