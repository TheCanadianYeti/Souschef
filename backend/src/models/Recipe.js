const { query } = require('../database');
const { v4: uuidv4 } = require('uuid');

class Recipe {
    static async create({
        userId,
        title,
        description,
        sourceUrl,
        sourceType,
        servings,
        cookTime,
        prepTime,
        difficulty,
        tags,
        imageUrl,
        originalRecipeId,
        ingredients,
        steps
    }) {
        const id = uuidv4();

        // Create the recipe
        const recipeResult = await query(
            `INSERT INTO recipes (id, user_id, title, description, source_url, source_type, servings, cook_time, prep_time, difficulty, tags, image_url, original_recipe_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [id, userId, title, description, sourceUrl, sourceType, servings, cookTime, prepTime, difficulty, tags, imageUrl, originalRecipeId]
        );

        const recipe = recipeResult.rows[0];

        // Insert ingredients if provided
        if (ingredients && ingredients.length > 0) {
            await this.insertIngredients(id, ingredients);
        }

        // Insert steps if provided
        if (steps && steps.length > 0) {
            await this.insertSteps(id, steps);
        }

        return this.findById(id);
    }

    static async insertIngredients(recipeId, ingredients) {
        const values = [];
        const valueStrings = [];
        let paramIndex = 1;

        ingredients.forEach((ingredient, index) => {
            const ingredientId = uuidv4();
            valueStrings.push(
                `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
            );
            values.push(
                ingredientId,
                recipeId,
                ingredient.name,
                ingredient.quantity,
                ingredient.unit,
                ingredient.dietaryFlags || [],
                ingredient.notes || null,
                index
            );
        });

        await query(
            `INSERT INTO ingredients (id, recipe_id, name, quantity, unit, dietary_flags, notes, order_index)
             VALUES ${valueStrings.join(', ')}`,
            values
        );
    }

    static async insertSteps(recipeId, steps) {
        const values = [];
        const valueStrings = [];
        let paramIndex = 1;

        steps.forEach((step, index) => {
            const stepId = uuidv4();
            valueStrings.push(
                `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
            );
            values.push(
                stepId,
                recipeId,
                step.stepNumber,
                step.instruction,
                step.durationSeconds || 0,
                step.notes || null,
                step.imageUrls || [],
                step.equipmentNeeded || [],
                index
            );
        });

        await query(
            `INSERT INTO cooking_steps (id, recipe_id, step_number, instruction, duration_seconds, notes, image_urls, equipment_needed, order_index)
             VALUES ${valueStrings.join(', ')}`,
            values
        );
    }

    static async findById(id) {
        const recipeResult = await query(
            'SELECT * FROM recipes WHERE id = $1',
            [id]
        );

        if (recipeResult.rows.length === 0) {
            return null;
        }

        const recipe = recipeResult.rows[0];

        // Fetch ingredients
        const ingredientsResult = await query(
            'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY order_index',
            [id]
        );

        // Fetch steps
        const stepsResult = await query(
            'SELECT * FROM cooking_steps WHERE recipe_id = $1 ORDER BY step_number',
            [id]
        );

        return {
            ...recipe,
            ingredients: ingredientsResult.rows.map(ing => ({
                id: ing.id,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                dietary_flags: ing.dietary_flags,
                notes: ing.notes
            })),
            steps: stepsResult.rows.map(step => ({
                id: step.id,
                step_number: step.step_number,
                instruction: step.instruction,
                duration_seconds: step.duration_seconds,
                notes: step.notes,
                image_urls: step.image_urls,
                equipment_needed: step.equipment_needed
            }))
        };
    }

    static async findByUser(userId, { limit = 50, offset = 0, tags = [], search = '' } = {}) {
        let whereClause = 'user_id = $1';
        let values = [userId];
        let paramIndex = 2;

        if (tags && tags.length > 0) {
            whereClause += ` AND tags && $${paramIndex++}`;
            values.push(tags);
        }

        if (search) {
            whereClause += ` AND (title ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`;
            values.push(`%${search}%`, `%${search}%`);
        }

        const recipesResult = await query(
            `SELECT * FROM recipes WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            [...values, limit, offset]
        );

        const countResult = await query(
            `SELECT COUNT(*) FROM recipes WHERE ${whereClause}`,
            values
        );

        const recipes = await Promise.all(
            recipesResult.rows.map(recipe => this.findById(recipe.id))
        );

        return {
            recipes,
            total: parseInt(countResult.rows[0].count, 10),
            limit,
            offset
        };
    }

    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        const updatableFields = [
            'title', 'description', 'source_url', 'source_type', 'servings',
            'cook_time', 'prep_time', 'difficulty', 'tags', 'image_url', 'is_public'
        ];

        updatableFields.forEach(field => {
            const dbField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            if (updates[field] !== undefined) {
                fields.push(`${field} = $${paramIndex++}`);
                values.push(updates[field]);
            }
        });

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        await query(
            `UPDATE recipes SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
            values
        );

        return this.findById(id);
    }

    static async updateIngredients(recipeId, ingredients) {
        // Delete existing ingredients
        await query('DELETE FROM ingredients WHERE recipe_id = $1', [recipeId]);

        // Insert new ingredients
        if (ingredients && ingredients.length > 0) {
            await this.insertIngredients(recipeId, ingredients);
        }
    }

    static async updateSteps(recipeId, steps) {
        // Delete existing steps
        await query('DELETE FROM cooking_steps WHERE recipe_id = $1', [recipeId]);

        // Insert new steps
        if (steps && steps.length > 0) {
            await this.insertSteps(recipeId, steps);
        }
    }

    static async delete(id) {
        const result = await query('DELETE FROM recipes WHERE id = $1 RETURNING id', [id]);
        return result.rows.length > 0;
    }

    static async fork(originalRecipeId, userId) {
        const original = await this.findById(originalRecipeId);
        if (!original) {
            throw new Error('Recipe not found');
        }

        return this.create({
            userId,
            title: `${original.title} (Copy)`,
            description: original.description,
            sourceUrl: original.source_url,
            sourceType: original.source_type,
            servings: original.servings,
            cookTime: original.cook_time,
            prepTime: original.prep_time,
            difficulty: original.difficulty,
            tags: original.tags,
            imageUrl: original.image_url,
            originalRecipeId,
            ingredients: original.ingredients,
            steps: original.steps
        });
    }

    static async getPublicRecipes({ limit = 20, offset = 0, tags = [], search = '' } = {}) {
        let whereClause = 'is_public = true';
        let values = [];
        let paramIndex = 1;

        if (tags && tags.length > 0) {
            whereClause += ` AND tags && $${paramIndex++}`;
            values.push(tags);
        }

        if (search) {
            whereClause += ` AND (title ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`;
            values.push(`%${search}%`, `%${search}%`);
        }

        const recipesResult = await query(
            `SELECT * FROM recipes WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            [...values, limit, offset]
        );

        return recipesResult.rows;
    }
}

module.exports = Recipe;