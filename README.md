# YouKOL Clone

A standalone web application that provides image enhancement capabilities through a proxy server, built with Express.js and vanilla JavaScript.

## Features

- Image enhancement and processing
- CORS-enabled API proxy server
- File upload handling
- Environment-based configuration
- Simple and lightweight deployment

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/YouKOL-Clone.git
cd YouKOL-Clone
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment configuration:
```bash
# Copy the example configuration file
cp .env.example .env

# Edit the .env file with your API keys and settings
nano .env  # or use your preferred text editor
```

The `.env` file requires at minimum:
```
DEEP_IMAGE_API_KEY=your_api_key_here
GROK_API_KEY=your_grok_api_key_here
```

See `.env.example` for a complete list of configuration options with documentation.

## Logging

The application uses Winston logger for comprehensive logging:

- All logs are stored in the `logs` directory
- Log files are automatically rotated (5MB max size, 5 files max)
- Different log levels: error, warn, info, debug
- Configure the log level in the `.env` file:
  ```
  LOG_LEVEL=info  # Options: error, warn, info, debug
  ```

Log files created:
- `combined.log`: Contains all log messages
- `error.log`: Contains only error messages
- `exceptions.log`: Records uncaught exceptions
- `rejections.log`: Records unhandled promise rejections

## Development

To run the application in development mode with hot-reloading:S

```bash
npm run dev
```

## Production Deployment

### Option 1: Direct Server Deployment

1. **Prepare your server**
   - Set up a Linux server (Ubuntu/Debian recommended)
   - Install Node.js and npm
   - Install PM2 (process manager) globally:
     ```bash
     npm install -g pm2
     ```

2. **Deploy the application**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/YouKOL-Clone.git
   cd YouKOL-Clone

   # Install dependencies
   npm install --production

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your production values

   # Start the application with PM2
   pm2 start server.js --name "youkol-clone"
   
   # Ensure PM2 starts on system reboot
   pm2 startup
   pm2 save
   ```

3. **Set up Nginx as a reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Docker Deployment

1. **Create a Dockerfile in the project root**:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

2. **Build and run the Docker container**:
```bash
# Build the image
docker build -t youkol-clone .

# Run the container
docker run -d \
  -p 3000:3000 \
  --name youkol-clone \
  --env-file .env \
  youkol-clone
```

### Option 3: Cloud VM Deployment (e.g., DigitalOcean, AWS EC2, Google Cloud)

1. Create a VM instance
2. SSH into your instance
3. Follow the steps from Option 1 (Direct Server Deployment)
4. Configure your cloud provider's firewall to allow traffic on port 80/443

## Security Considerations

1. Always use HTTPS in production
2. Set up proper CORS configuration in `.env`
3. Use secure API keys and environment variables
4. Implement rate limiting for production use
5. Regular security updates and monitoring

## Monitoring and Maintenance

1. **Monitor the application**:
```bash
pm2 monit
pm2 logs
```

2. **Update the application**:
```bash
git pull
npm install
pm2 restart youkol-clone
```

## Troubleshooting

- Check server logs: `pm2 logs`
- Verify environment variables are set correctly
- Ensure all required ports are open
- Check disk space for uploads directory
- Verify API keys are valid

## License

[Your License Here]

## Support

For issues and feature requests, please create an issue in the repository. 