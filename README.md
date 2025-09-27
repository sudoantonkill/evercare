# CareConnect Platform

A comprehensive elderly assistance platform connecting helpers with elderly people who need assistance with daily tasks.

## 🌟 Features

- **User Authentication**: Secure login with Google OAuth and phone verification
- **Profile Management**: Complete profiles with Aadhaar verification for helpers
- **Job Management**: Create, browse, and manage assistance requests
- **Real-time Location**: GPS tracking for helpers during jobs
- **Emergency System**: SOS alerts with automatic notifications
- **Rating System**: Feedback and ratings for completed jobs
- **Job History**: Complete tracking of all completed assistance requests

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Maps**: Google Maps API
- **Email**: Resend API for notifications
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Maps API key
- Resend API key (for email notifications)

## 🛠️ Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd login
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Fill in your actual API keys in `.env`

4. **Database Setup**
   - Run `complete_database_setup.sql` in your Supabase SQL editor
   - This sets up all tables, policies, and functions

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🌐 Deployment to Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual Deployment Steps

1. **Prepare for deployment**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com) and sign up/login
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: **Vite**
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **Add Environment Variables in Vercel Dashboard**
   ```bash
   VITE_SUPABASE_URL=https://gzprwsyevvczlysawxun.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_RESEND_API_KEY=your_resend_api_key
   ```

4. **Deploy!** - Click the deploy button

5. **Configure Supabase for Production**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Update Site URL: `https://your-app.vercel.app`
   - Add Redirect URL: `https://your-app.vercel.app/`

## 🔧 Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_RESEND_API_KEY=your_resend_api_key
```

## 📱 User Roles

### Elderly Users
- Create assistance requests
- Browse available helpers
- Track job progress
- Emergency SOS functionality

### Helpers
- Complete profile with Aadhaar verification
- Browse and accept jobs
- Real-time location sharing
- Receive ratings and feedback

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- Aadhaar document verification
- Secure file storage with access policies
- Phone number verification
- OAuth authentication

## 🏗️ Database Schema

The platform uses Supabase with the following main tables:
- `profiles` - User profiles and verification status
- `jobs` - Assistance requests and job details
- `job_history` - Completed job records
- `ratings` - User ratings and feedback
- `sos_alerts` - Emergency alert system
- `contacts` - Emergency contacts

## 🚀 Deployment Checklist

- [ ] Create `vercel.json` configuration file
- [ ] Set up environment variables in Vercel
- [ ] Update Supabase URL configuration
- [ ] Test Google OAuth on production
- [ ] Verify all features work on live site

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.
