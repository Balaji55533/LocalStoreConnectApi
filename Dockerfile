# 1. Use an official Node.js runtime as a parent image
FROM node:14

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package.json and package-lock.json into the container
COPY package*.json ./

# 4. Install the dependencies
RUN npm install

# 5. Copy the rest of the application files into the container
COPY . .

# 6. Expose the port on which the app will run
EXPOSE 3000

# 7. Define the command to start the app
CMD ["npm", "start"]
