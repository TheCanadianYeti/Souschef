const { query } = require('../database');
const { v4: uuidv4 } = require('uuid');

class GroceryList {
    static async create(userId, name = 'My Grocery List') {
        const id = uuidv4();
        const result = await query(
            `INSERT INTO grocery_lists (id, user_id, name)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [id, userId, name]
        );
        return result.rows[0];
    }

    static async findByUser(userId) {
        const result = await query(
            'SELECT * FROM grocery_lists WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    static async findById(id) {
        const result = await query(
            'SELECT * FROM grocery_lists WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async getWithItems(listId) {
        const list = await this.findById(listId);
        if (!list) return null;

        const itemsResult = await query(
            `SELECT gli.*, i.name as ingredient_name, i.quantity as ingredient_quantity, 
                    i.unit as ingredient_unit, r.title as recipe_title
             FROM grocery_list_items gli
             LEFT JOIN ingredients i ON gli.ingredient_id = i.id
             LEFT JOIN recipes r ON gli.recipe_id = r.id
             WHERE gli.grocery_list_id = $1
             ORDER BY gli.order_index, gli.created_at`,
            [listId]
        );

        return {
            ...list,
            items: itemsResult.rows.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                is_checked: item.is_checked,
                recipe_id: item.recipe_id,
                recipe_title: item.recipe_title,
                ingredient_id: item.ingredient_id
            }))
        };
    }

    static async update(listId, { name }) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(name);
        }

        if (fields.length === 0) return this.findById(listId);

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(listId);

        const result = await query(
            `UPDATE grocery_lists SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    static async delete(listId) {
        const result = await query(
            'UPDATE grocery_lists SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [listId]
        );
        return result.rows.length > 0;
    }

    static async addItem(listId, { name, quantity, unit, recipeId, ingredientId }) {
        const id = uuidv4();

        // Check if item already exists
        const existingResult = await query(
            `SELECT id FROM grocery_list_items 
             WHERE grocery_list_id = $1 AND name = $2 AND is_checked = false`,
            [listId, name]
        );

        if (existingResult.rows.length > 0) {
            return null; // Already exists
        }

        const result = await query(
            `INSERT INTO grocery_list_items (id, grocery_list_id, name, quantity, unit, recipe_id, ingredient_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [id, listId, name, quantity, unit, recipeId, ingredientId]
        );

        return result.rows[0];
    }

    static async addItemsFromRecipe(listId, recipeId) {
        // Get recipe ingredients
        const ingredientsResult = await query(
            `SELECT i.id, i.name, i.quantity, i.unit 
             FROM ingredients i 
             WHERE i.recipe_id = $1 
             ORDER BY i.order_index`,
            [recipeId]
        );

        const addedItems = [];
        for (const ingredient of ingredientsResult.rows) {
            const item = await this.addItem(listId, {
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                recipeId,
                ingredientId: ingredient.id
            });
            if (item) {
                addedItems.push(item);
            }
        }

        return addedItems;
    }

    static async updateItem(itemId, { is_checked, quantity, name }) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (is_checked !== undefined) {
            fields.push(`is_checked = $${paramIndex++}`);
            values.push(is_checked);
        }
        if (quantity !== undefined) {
            fields.push(`quantity = $${paramIndex++}`);
            values.push(quantity);
        }
        if (name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(name);
        }

        if (fields.length === 0) return;

        values.push(itemId);

        await query(
            `UPDATE grocery_list_items SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
            values
        );
    }

    static async removeItem(itemId) {
        await query('DELETE FROM grocery_list_items WHERE id = $1', [itemId]);
    }

    static async clearCheckedItems(listId) {
        await query(
            'DELETE FROM grocery_list_items WHERE grocery_list_id = $1 AND is_checked = true',
            [listId]
        );
    }

    static async getOrCreateForUser(userId) {
        const lists = await this.findByUser(userId);
        if (lists.length > 0) {
            return lists[0];
        }
        return this.create(userId);
    }
}

module.exports = GroceryList;