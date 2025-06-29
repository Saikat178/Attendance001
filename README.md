# AttendanceFlow - Full-Stack Attendance Management System

A comprehensive attendance management system built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

- **Employee Management**: Complete CRUD operations for employee profiles
- **Attendance Tracking**: Real-time check-in/check-out with break management
- **Leave Management**: Submit, review, and track leave requests
- **Comp Off System**: Request compensatory time off for weekend/holiday work
- **Holiday Calendar**: Manage company and national holidays
- **Notifications**: Real-time notifications for all activities
- **Admin Dashboard**: Comprehensive admin controls and analytics
- **Security**: Row-level security, audit logging, and rate limiting

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Netlify

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the migration files in the `supabase/migrations` folder
   - Enable Row Level Security (RLS) on all tables

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Netlify Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. **Manual deployment**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Build and deploy
   npm run build
   netlify deploy --prod --dir=dist
   ```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## 📊 Database Schema

The application uses the following main tables:
- `employees` - Employee profiles and authentication
- `attendance_records` - Daily attendance tracking
- `leave_requests` - Leave request management
- `comp_off_requests` - Compensatory time off requests
- `holidays` - Company and national holidays
- `notifications` - Real-time notifications
- `audit_logs` - Security audit trail

## 🔒 Security Features

- **Row Level Security (RLS)**: All database tables protected
- **Authentication**: Supabase Auth with JWT tokens
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Frontend and backend validation
- **Audit Logging**: All sensitive operations logged
- **Session Management**: Secure session handling with timeouts

## 🧪 Testing

The application includes a comprehensive test suite:

```bash
# Run tests (when implemented)
npm run test
```

Access the test dashboard through the admin panel for:
- Database connectivity tests
- Authentication tests
- Security validation
- Performance monitoring

## 📱 Usage

### For Employees:
1. Register with employee ID and email
2. Complete profile information
3. Upload required documents
4. Start using attendance tracking
5. Submit leave/comp-off requests

### For Admins:
1. Register as admin
2. Manage employee verification
3. Review leave/comp-off requests
4. Manage holidays and calendar
5. Monitor system performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the test dashboard for system status
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added comprehensive testing suite
- **v1.2.0** - Enhanced security and performance optimizations

---

Built with ❤️ using React, TypeScript, and Supabase