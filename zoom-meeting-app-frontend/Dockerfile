FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Menjalankan build aplikasi Next.js
RUN npm run build

# Expose the port (e.g. 3000 for Next.js)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]