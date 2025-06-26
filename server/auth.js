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

  async createUser({ name, email, password, auth_provider = 'local', role = 'user' }) {
    const password_hash = password ? await this.hashPassword(password) : null;
    
    const query = `
      INSERT INTO users (name, email, password_hash, auth_provider, role, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, email, auth_provider, role, created_at
    `;
    
    const result = await this.pool.query(query, [name, email, password_hash, auth_provider, role]);
    return result.rows[0];
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async getUserById(id) {
    const query = 'SELECT id, name, email, auth_provider, role, created_at FROM users WHERE id = $1';
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
    const query = 'SELECT id, name, email, auth_provider, role, created_at FROM users ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async updateUser(id, updates) {
    const { name, email, role, password } = updates;
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (password !== undefined) {
      const password_hash = await this.hashPassword(password);
      fields.push(`password_hash = $${paramCount++}`);
      values.push(password_hash);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, auth_provider, role, created_at
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = { AuthService };