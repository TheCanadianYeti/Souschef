# --- BACKEND DOCKERFILE ---
FROM node:20-alpine

WORKDIR /app

# Install dependencies for node-gyp and common build tools
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy application files
COPY . .

# Create uploads directory for recipe images
RUN mkdir -p uploads

# Expose port 3001
EXPOSE 3001

# Start the application using npm start (which uses cross-env)
CMD ["npm", "start"]