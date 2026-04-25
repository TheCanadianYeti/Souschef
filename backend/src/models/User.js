const { query } = require('../database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
    static async create({ email, password, displayName, dietaryRestrictions, preferences, auth0Id }) {
        const id = uuidv4();
        let passwordHash = null;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(password, salt);
        }

        const result = await query(
            `INSERT INTO users (id, email, password_hash, display_name, dietary_restrictions, preferences, auth0_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, email, display_name, avatar_url, dietary_restrictions, preferences, auth0_id, created_at`,
            [id, email, passwordHash, displayName, dietaryRestrictions, JSON.stringify(preferences || {}), auth0Id]
        );

        return result.rows[0];
    }

    static async findById(id) {
        const result = await query(
            'SELECT id, email, display_name, avatar_url, dietary_restrictions, preferences, auth0_id, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await query(
            'SELECT id, email, password_hash, display_name, avatar_url, dietary_restrictions, preferences, auth0_id, created_at FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    static async findByAuth0Id(auth0Id) {
        const result = await query(
            'SELECT id, email, display_name, avatar_url, dietary_restrictions, preferences, auth0_id, created_at FROM users WHERE auth0_id = $1',
            [auth0Id]
        );
        return result.rows[0];
    }

    static async update(id, { displayName, avatarUrl, dietaryRestrictions, preferences }) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (displayName !== undefined) {
            fields.push(`display_name = $${paramIndex++}`);
            values.push(displayName);
        }
        if (avatarUrl !== undefined) {
            fields.push(`avatar_url = $${paramIndex++}`);
            values.push(avatarUrl);
        }
        if (dietaryRestrictions !== undefined) {
            fields.push(`dietary_restrictions = $${paramIndex++}`);
            values.push(dietaryRestrictions);
        }
        if (preferences !== undefined) {
            fields.push(`preferences = $${paramIndex++}`);
            values.push(JSON.stringify(preferences));
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
             RETURNING id, email, display_name, avatar_url, dietary_restrictions, preferences, auth0_id, created_at`,
            values
        );

        return result.rows[0];
    }

    static async verifyPassword(email, password) {
        const user = await this.findByEmail(email);
        if (!user || !user.password_hash) {
            return false;
        }
        return await bcrypt.compare(password, user.password_hash);
    }

    static async delete(id) {
        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        return result.rows.length > 0;
    }
}

module.exports = User;