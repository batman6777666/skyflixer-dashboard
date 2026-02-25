FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy all backend source files
COPY . .

# HuggingFace Spaces uses port 7860
ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

CMD ["node", "server.js"]
