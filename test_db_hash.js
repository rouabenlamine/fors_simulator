const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');

try {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] || '';
    }
  });
} catch (e) {
  console.log('No .env.local found');
}

async function testLogin(matricule, password) {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
  });

  const [users] = await pool.query(
    "SELECT matricule, name, prenom, role, password FROM users WHERE matricule = ?",
    [matricule]
  );
  
  if (users.length === 0) {
    console.log("USER NOT FOUND");
    return;
  }
  
  const user = users[0];
  console.log("DB Hash:", user.password);
  
  let isValid = false;
  if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$'))) {
    try {
      isValid = bcrypt.compareSync(password, user.password);
      console.log("Bcrypt compare result:", isValid);
    } catch (e) {
      console.error("Bcrypt validation error:", e);
    }
  } else {
    isValid = user.password === password;
    console.log("Direct compare result:", isValid);
  }
  
  await pool.end();
}

testLogin("SUPER01", "super2025");
