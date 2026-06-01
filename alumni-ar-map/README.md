# Alumni AR Map

A full-stack web application to visualize alumni locations on an interactive map with AR (Augmented Reality) view. Alumni data is stored in a PostgreSQL database, auto-geocoded by city/country, and rendered on a world map with an AR overlay feature.

## Tech Stack

**Backend**
- Python / Django 6
- Django REST Framework
- PostgreSQL
- geopy (auto-geocoding)
- Pillow (photo uploads)
- qrcode (QR generation)
- python-dotenv

**Frontend**
- React 19 + Vite
- React Router DOM
- Axios

## Project Structure

```
alumni-ar-map/
├── backend/
│   ├── alumni/          # Alumni app (models, views, serializers, URLs)
│   ├── core/            # Django project settings
│   ├── media/           # Uploaded alumni photos
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    └── src/
        ├── pages/
        │   ├── AdminPanel.jsx   # Add/manage alumni
        │   └── ARView.jsx       # AR map view
        └── App.jsx
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   source venv/bin/activate  # macOS/Linux
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure the `.env` file in the `backend/` directory:
   ```
   DB_NAME=alumni_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   SECRET_KEY=your-secret-key
   ```

4. Run migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`.

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alumni/` | List all alumni |
| POST | `/api/alumni/` | Add a new alumnus |
| GET | `/api/alumni/{id}/` | Retrieve an alumnus |
| PUT | `/api/alumni/{id}/` | Update an alumnus |
| DELETE | `/api/alumni/{id}/` | Delete an alumnus |

## Features

- Add alumni with name, batch year, company, city, country, and photo
- Automatic geocoding of city/country to latitude/longitude on save
- Interactive world map displaying alumni locations
- AR view for immersive location visualization
- Admin panel to manage alumni records
- QR code generation support
