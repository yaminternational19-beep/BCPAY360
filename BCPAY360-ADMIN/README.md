# HRIS Admin Frontend

A modern Human Resource Information System (HRIS) admin panel built with React 19, Vite 7, and React Router. This application is designed for deployment on AWS EC2 with Nginx.

## 🚀 Features

- **Role-Based Access Control**: Super Admin, Company Admin, HR, and Employee roles
- **Employee Management**: Comprehensive employee profiles and management
- **Attendance Tracking**: Real-time attendance monitoring
- **Leave Management**: Leave requests and approval workflows
- **Payroll Management**: Payroll processing and reports
- **Asset Management**: Company asset tracking
- **Recruitment Module**: Job postings and candidate management
- **Organization Management**: Departments, branches, shifts, and employee types

## 📋 Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **AWS EC2 Instance**: Ubuntu 20.04 or higher (for production)
- **Nginx**: v1.18 or higher (for production)

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HRIS-ADMIN
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Production Build

### Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Test Production Build Locally

```bash
npm run preview
```

The production build will be served at `http://localhost:4173`

## 🌐 AWS EC2 Deployment

### Step 1: Prepare Your EC2 Instance

**1.1. Connect to your EC2 instance:**

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

**1.2. Update system packages:**

```bash
sudo apt update && sudo apt upgrade -y
```

**1.3. Install Node.js and npm:**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify installation
npm --version
```

**1.4. Install Nginx:**

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

### Step 2: Deploy the Application

**2.1. Create deployment directory:**

```bash
sudo mkdir -p /var/www/hris-admin
sudo chown -R $USER:$USER /var/www/hris-admin
```

**2.2. Transfer build files to EC2:**

From your local machine, build and transfer the files:

```bash
# Build the application
npm run build

# Transfer to EC2 (replace with your details)
scp -i your-key.pem -r dist/* ubuntu@your-ec2-ip:/var/www/hris-admin/
```

**Alternative: Build on EC2:**

```bash
# Clone repository on EC2
cd /var/www/hris-admin
git clone <repository-url> .

# Install dependencies
npm install

# Create production environment file
nano .env.production
# Add: VITE_API_BASE_URL=http://your-backend-url:5000

# Build
npm run build

# Move build files
mv dist/* .
```

### Step 3: Configure Nginx

**3.1. Copy the Nginx configuration:**

Transfer the `nginx.conf` file to your EC2 instance:

```bash
scp -i your-key.pem nginx.conf ubuntu@your-ec2-ip:~/
```

**3.2. Set up Nginx site configuration:**

```bash
# On EC2 instance
sudo cp ~/nginx.conf /etc/nginx/sites-available/hris-admin
sudo ln -s /etc/nginx/sites-available/hris-admin /etc/nginx/sites-enabled/
```

**3.3. Update the Nginx configuration:**

Edit the configuration to set your domain or IP:

```bash
sudo nano /etc/nginx/sites-available/hris-admin
```

Update the `server_name` directive:

```nginx
server_name your-domain.com;  # Or your EC2 IP
```

**3.4. Remove default Nginx site (optional):**

```bash
sudo rm /etc/nginx/sites-enabled/default
```

**3.5. Test and reload Nginx:**

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Configure Environment Variables

**4.1. Create production environment file:**

```bash
cd /var/www/hris-admin
nano .env.production
```

**4.2. Add your production API URL:**

```env
VITE_API_BASE_URL=http://your-ec2-backend-ip:5000
# Or if using a domain:
# VITE_API_BASE_URL=https://api.yourdomain.com
```

**4.3. Rebuild with production environment:**

```bash
npm run build
```

### Step 5: Configure Firewall

**5.1. Allow HTTP and HTTPS traffic:**

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

**5.2. Configure EC2 Security Group:**

In AWS Console, add inbound rules:
- **HTTP**: Port 80, Source: 0.0.0.0/0
- **HTTPS**: Port 443, Source: 0.0.0.0/0 (if using SSL)
- **SSH**: Port 22, Source: Your IP

### Step 6: Access Your Application

Open your browser and navigate to:

```
http://your-ec2-ip
```

Or if you've configured a domain:

```
http://your-domain.com
```

## 🔒 SSL/HTTPS Setup (Optional but Recommended)

### Using Let's Encrypt (Certbot)

**1. Install Certbot:**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

**2. Obtain SSL certificate:**

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**3. Auto-renewal:**

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000` |

## 🧪 Testing

### Test Routes

After deployment, verify these routes work correctly:

- `/login` - Login page
- `/admin/dashboard` - Admin dashboard
- `/admin/employees` - Employee list
- `/admin/attendance` - Attendance tracking
- `/super-admin/login` - Super admin login

**Direct URL Access Test:**

Navigate directly to any route (e.g., `http://your-ec2-ip/admin/employees`) and refresh the page. It should load correctly without 404 errors.

### Test API Integration

1. Open browser DevTools (F12)
2. Go to Network tab
3. Login to the application
4. Verify API requests are going to the correct `VITE_API_BASE_URL`

## 🔧 Troubleshooting

### Issue: 404 on Direct Route Access

**Solution:** Ensure Nginx configuration has the SPA fallback:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Issue: API Requests Failing

**Solution:** 

1. Check `.env.production` has correct `VITE_API_BASE_URL`
2. Rebuild the application: `npm run build`
3. Verify CORS is configured on backend
4. Check EC2 security groups allow traffic to backend port

### Issue: Nginx Configuration Errors

**Solution:**

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

### Issue: Build Fails

**Solution:**

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📦 Project Structure

```
HRIS-ADMIN/
├── src/
│   ├── api/              # API integration
│   ├── components/       # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── layout/          # Layout components (Navbar, Sidebar)
│   ├── modules/         # Feature modules
│   │   ├── employee/
│   │   ├── organization/
│   │   └── super-admin/
│   ├── pages/           # Page components
│   ├── styles/          # CSS files
│   └── utils/           # Utility functions
├── dist/                # Production build (generated)
├── nginx.conf           # Nginx configuration
├── .env.example         # Environment variables template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## 🔄 Updating the Application

**1. Pull latest changes:**

```bash
cd /var/www/hris-admin
git pull origin main
```

**2. Install new dependencies (if any):**

```bash
npm install
```

**3. Rebuild:**

```bash
npm run build
```

**4. Reload Nginx:**

```bash
sudo systemctl reload nginx
```

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build locally |
| `npm run serve` | Serve production build on port 4173 |
| `npm run lint` | Run ESLint |

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions, please contact your development team or create an issue in the repository.

---

**Note:** This application is designed to work with the HRIS backend API. Ensure your backend is properly configured and accessible from the frontend.
#   B C P A Y 3 6 0 - a d m i n  
 