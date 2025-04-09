# AquaAlert - Water Bowser Management System

AquaAlert is a database-driven business system for managing emergency water bowsers, built using agile/Scrum methodology.

## Features

- Planning emergency bowser locations
- Scheduling/monitoring deployment
- Tracking maintenance and mechanical issues
- Planning/monitoring refilling schedules
- Public notifications about bowser locations/status
- Financial management (invoices, Mutual Aid Scheme)
- Emergency priority system

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask (Python)
- **Database**: SQLite (development), PostgreSQL (production)

## Local Development Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/ItsYoish/Agile-Codes.git
   cd Agile-Codes
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Initialize the database:
   ```
   flask init-db
   ```

6. Run the development server:
   ```
   flask run
   ```

7. Access the application at http://localhost:5000

## Deployment to GitHub

This application can be deployed to platforms like Heroku, Render, or PythonAnywhere that support Flask applications.

### Deploying to Heroku

1. Create a Heroku account and install the Heroku CLI
2. Login to Heroku CLI: `heroku login`
3. Create a new Heroku app: `heroku create your-app-name`
4. Add a PostgreSQL database: `heroku addons:create heroku-postgresql:hobby-dev`
5. Push to Heroku: `git push heroku main`
6. Initialize the database: `heroku run flask init-db`

## Project Structure

- `app.py`: Main Flask application
- `static/`: Static files (CSS, JS, images)
- `templates/`: HTML templates
- `*.html`: Frontend pages
- `js/`: JavaScript files
- `css/`: CSS stylesheets
- `requirements.txt`: Python dependencies
- `Procfile`: Deployment configuration

## Team Members

- [Your Team Members Here]

## License

[Your License Here]