# 💼 AI-Powered Job Portal

A full-stack job portal with AI resume screening built with
React, Django REST Framework, and MySQL.

## 🚀 Features
- JWT Authentication with role-based access
- Job Seeker, Recruiter, and Admin roles
- AI resume screening with TF-IDF matching
- Job posting, search, and filtering
- Resume upload and management
- Admin dashboard with user management

## 🛠️ Tech Stack
| Layer    | Technology                    |
|----------|-------------------------------|
| Frontend | React 18 + Vite               |
| Backend  | Django 4 + Django REST Framework |
| Database | MySQL 8                       |
| Auth     | JWT (SimpleJWT)               |
| AI       | scikit-learn TF-IDF           |

## ⚙️ Local Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

## Frontend Setup

### Prerequisites
- Node.js 16+ 
- npm

### Installation

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```
VITE_API_URL=http://localhost:8000/api
```

4. Run development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/users/register/` - Register new user
- `POST /api/users/token/` - Get authentication token
- `GET /api/users/me/` - Get current user

### User Profiles
- `GET /api/users/profiles/my_profile/` - Get current user's profile
- `PUT /api/users/profiles/{id}/` - Update profile

### Jobs
- `GET /api/jobs/listings/` - List all jobs
- `POST /api/jobs/listings/` - Create job listing
- `GET /api/jobs/listings/{id}/` - Get job details
- `GET /api/jobs/listings/{id}/applications/` - Get job applications

### Applications
- `GET /api/jobs/applications/my_applications/` - Get user's applications
- `POST /api/jobs/applications/` - Apply for job
- `POST /api/jobs/applications/{id}/update_status/` - Update application status

## Technology Stack

### Backend
- **Django 4.2**: Web framework
- **Django REST Framework**: API development
- **django-cors-headers**: CORS support
- **Pillow**: Image processing
- **psycopg2**: PostgreSQL adapter

### Frontend
- **React 18**: UI library
- **Vite**: Build tool & dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client

## Development

### Running Tests

Backend:
```bash
cd backend
python manage.py test
```

Frontend:
```bash
cd frontend
npm run test
```

### Building for Production

Backend:
```bash
python manage.py collectstatic
gunicorn jobportal.wsgi
```

Frontend:
```bash
npm run build
```

## Configuration

### Database
- Development: SQLite (db.sqlite3)
- Production: Configure in `settings.py` DATABASES

### CORS
Update `CORS_ALLOWED_ORIGINS` in backend settings for your domains

### Environment Variables
Create `.env` file in backend directory:
```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DATABASE_URL=your-database-url
```

## Troubleshooting

### Port Already in Use
- Backend: `python manage.py runserver 8001`
- Frontend: `npm run dev -- --port 5174`

### CORS Errors
Ensure frontend URL is in `CORS_ALLOWED_ORIGINS` in backend settings

### Database Errors
Run migrations: `python manage.py migrate`

## Contributing

1. Create feature branch
2. Make changes
3. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.
