FROM node:20-slim

WORKDIR /app

# Copy only backend package files first (for better caching)
COPY backend/package.json backend/package-lock.json* ./

# Install production dependencies
RUN npm install --production

# Copy all backend source files into /app
COPY backend/ .

# HuggingFace Spaces requires port 7860
ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

CMD ["node", "server.js"]
