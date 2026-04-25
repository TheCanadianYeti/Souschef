FROM node:18-alpine

WORKDIR /app

# Install dependencies for node-gyp
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "src/server.js"]