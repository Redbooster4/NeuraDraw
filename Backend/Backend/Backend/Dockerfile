# 1. Use a lightweight Node runtime base image
FROM node:18

# 2. Define the working directory inside the container isolation wall
WORKDIR /app

# 3. Copy package manifests first to leverage Docker's build layer caching
COPY package*.json ./

# 4. Install production dependencies inside the container container
RUN npm install --production

# 5. Copy your remaining application backend code files
COPY . .

# 6. Document and set the local environment communication port
EXPOSE 3000
ENV PORT=3000

# 7. Start up your Node.js application server script
CMD ["node", "server.js"]