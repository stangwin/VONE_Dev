const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

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
    // Validate password strength
    if (password) this.validatePasswordStrength(password);
    
    const password_hash = password ? await this.hashPassword(password) : null;
    
    const query = `
      INSERT INTO users (name, email, password_hash, auth_provider, role, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, email, auth_provider, role, created_at
    `;
    
    const result = await this.pool.query(query, [name, email, password_hash, auth_provider, role]);
    return result.rows[0];
  }

  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!hasUpperCase) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      throw new Error('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      throw new Error('Password must contain at least one special character');
    }
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async getUserById(id) {
    const query = 'SELECT id, name, email, auth_provider, role, two_factor_secret, two_factor_enabled, created_at FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async setup2FA(userId) {
    const secret = speakeasy.generateSecret({
      name: `Vantix CRM (${userId})`,
      issuer: 'Vantix CRM'
    });

    // Store the secret in database
    await this.pool.query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    // Generate QR code for setup
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  async enable2FA(userId, token) {
    const user = await this.getUserById(userId);
    if (!user.two_factor_secret) {
      throw new Error('2FA setup not initiated');
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      throw new Error('Invalid verification code');
    }

    await this.pool.query(
      'UPDATE users SET two_factor_enabled = NOW() WHERE id = $1',
      [userId]
    );

    return true;
  }

  async verify2FA(userId, token) {
    const user = await this.getUserById(userId);
    if (!user.two_factor_enabled || !user.two_factor_secret) {
      return true; // 2FA not enabled for this user
    }

    return speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }

  async disable2FA(userId, token) {
    const user = await this.getUserById(userId);
    if (!user.two_factor_enabled) {
      throw new Error('2FA is not enabled');
    }

    const verified = await this.verify2FA(userId, token);
    if (!verified) {
      throw new Error('Invalid verification code');
    }

    await this.pool.query(
      'UPDATE users SET two_factor_enabled = NULL, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );

    return true;
  }

  async forceDisable2FA(userId) {
    const user = await this.getUserById(userId);
    if (!user.two_factor_enabled) {
      throw new Error('2FA is not enabled for this user');
    }

    await this.pool.query(
      'UPDATE users SET two_factor_enabled = NULL, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );

    return true;
  }

  async changePassword(userId, newPassword) {
    this.validatePasswordStrength(newPassword);
    const hashedPassword = await this.hashPassword(newPassword);
    
    await this.pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    return true;
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