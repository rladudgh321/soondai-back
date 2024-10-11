# Base image: Using Node.js 20 with Alpine for a smaller image size
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock or package-lock.json first to leverage Docker's cache
COPY package.json yarn.lock ./

# Install the dependencies (assuming you're using Yarn)
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the NestJS application (transpile TypeScript to JavaScript)
RUN yarn build

# Set environment variables for Prisma (or customize as per your environment)
ENV DATABASE_URL="postgresql://postgres:0gh0gh@host.docker.internal:5432/vlog?schema=public"

# Generate Prisma client
RUN npx prisma generate

# Expose the port your application runs on (default Nest.js port is 3000)
EXPOSE 3065

# Specify the command to run the application (use the compiled dist folder)
CMD ["node", "dist/main"]

