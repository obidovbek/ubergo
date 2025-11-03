# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including tsx for running TypeScript)
RUN npm install --omit=dev && npm install tsx

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=production

# Start the application using tsx (runs TypeScript directly)
CMD ["npx", "tsx", "src/index.ts"]

