FROM oven/bun:latest AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* bun.lock* ./
RUN bun install

# Copy source and build
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# Serve Stage
FROM oven/bun:latest
WORKDIR /app

# We use bun to serve the static files from the dist folder
RUN bun add -g serve
COPY --from=builder /app/dist ./dist

# Expose port (internal container port)
EXPOSE 3000

# Start the server
CMD ["bunx", "serve", "dist", "-l", "tcp://0.0.0.0:3000", "--single"]
