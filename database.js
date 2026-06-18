const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function getDb() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT UNIQUE,
      pass TEXT
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      telefone TEXT,
      email TEXT,
      cpf TEXT
    );

    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT,
      marca TEXT,
      modelo TEXT,
      ano TEXT,
      km TEXT,
      proprietario TEXT
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT,
      veiculo TEXT,
      data TEXT,
      hora TEXT,
      servico TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS ordens_servico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT,
      veiculo TEXT,
      servico TEXT,
      status TEXT,
      descricao TEXT,
      maoObra TEXT,
      pecas TEXT,
      total TEXT
    );

    CREATE TABLE IF NOT EXISTS estoque (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto TEXT,
      quantidade TEXT,
      unidade TEXT,
      preco TEXT,
      categoria TEXT
    );

    CREATE TABLE IF NOT EXISTS galeria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      veiculo TEXT,
      descricao TEXT,
      antes TEXT,
      depois TEXT
    );
  `);

  // admin default
  const admin = await db.get('SELECT * FROM usuarios WHERE user = ?', ['admin']);
  if (!admin) {
    await db.run('INSERT INTO usuarios (user, pass) VALUES (?, ?)', ['admin', 'admin']);
  }

  return db;
}

module.exports = { getDb };
