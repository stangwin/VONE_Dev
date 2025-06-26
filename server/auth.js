const bcrypt = require('bcrypt');

class AuthService {
  constructor(pool) {
    this.pool = pool;
    this.saltRounds = 12;
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  async createUser({ name, email, password, auth_provider = 'local' }) {
    const password_hash = password ? await this.hashPassword(password) : null;
    
    const query = `
      INSERT INTO users (name, email, password_hash, auth_provider, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, email, auth_provider, created_at
    `;
    
    const result = await this.pool.query(query, [name, email, password_hash, auth_provider]);
    return result.rows[0];
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async getUserById(id) {
    const query = 'SELECT id, name, email, auth_provider, created_at FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async authenticateUser(email, password) {
    const user = await this.getUserByEmail(email);
    
    if (!user || !user.password_hash) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers() {
    const query = 'SELECT id, name, email, auth_provider, created_at FROM users ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }
}

module.exports = { AuthService };