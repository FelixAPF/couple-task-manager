# Use a lightweight official Nginx image
FROM nginx:stable-alpine

# Remove default Nginx welcome page (optional)
RUN rm -rf /usr/share/nginx/html/*

# Copy the built Angular app files from your local build output directory
# !!! IMPORTANT: Adjust 'dist/couple-task-manager/browser/' if your output path is different !!!
COPY dist/client/browser/ /usr/share/nginx/html

# Copy your custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Tell Docker that the container listens on port 80
EXPOSE 80

# Command to run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]