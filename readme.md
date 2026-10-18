
<p align="left">
  <img src="frontend/public/travel-budget-logo.svg" alt="Travel Budget Pro Logo" width="320">
</p>

<p align="left">
  <strong>Plan trips without financial surprises.</strong>
</p>

<p align="left">
  A web application to plan trips, manage expenses, and compare your planned budget with actual costs.
</p>

<p align="left">
  <a href="https://travel-budget-pro.netlify.app/">Open Travel Budget Pro</a>
</p>

---

## ✨ Features

- **User Authentication:** Register and log in.
- **Trip Management:** Create, view, update, and delete trips.
- **Budget Planning:** Set a total budget for each trip.
- **Expense Tracking:** Add, edit, and delete travel, hotel, food, shopping, and activity expenses.
- **Budget Summary:** View total expenses and remaining budget.
- **Planned vs Actual:** Compare planned budgets with actual trip costs.
- **Expense Analysis:** View spending by category using charts.
- **Trip Search:** Search previous trips and filter by status.
- **Expense Reports:** Generate trip expense reports.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend user interface |
| JavaScript | Frontend functionality |
| Python | Backend programming |
| Flask | Backend API |
| MySQL | Database |
| Pandas | Data processing and analysis |
| Matplotlib / Plotly | Expense visualization |
| Axios | Frontend API requests |
| Netlify | Frontend hosting |
| Render | Backend hosting |
| Aiven | Cloud MySQL hosting |

---

## 📁 Project Structure

```text
Travel_Budget_pro/
├── frontend/
│   ├── public/
│   │   ├── travel-budget-logo.svg
│   │   └── _redirects
│   ├── src/
│   └── package.json
├── backend/
│   ├── app.py
│   ├── config/
│   │   └── database.py
│   ├── requirements.txt
│   └── schema.sql
├── README.md
└── LICENSE
```

*This is a reference structure. Adjust it to match your actual files.*

---

## 🚀 Getting Started

### Prerequisites

- Python
- Node.js and npm
- MySQL database configuration

### 1. Clone the Repository

```bash
git clone <your-github-repository-url>
cd Travel_Budget_pro
```

Replace the placeholder with your actual GitHub repository URL.

### 2. Set Up the Backend

```bash
cd backend
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your local `backend/.env` file with the required database credentials and secret key.

Start the backend:

```bash
python app.py
```

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

---

## 🔐 Environment Variables

### Backend

Configure these variables in `backend/.env`:

```env
SECRET_KEY=your_secret_key
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

### Frontend

Configure `frontend/.env` for local development:

```env
VITE_API_URL=http://127.0.0.1:5000
```

**Security:** Never commit actual passwords, secret keys, or other sensitive credentials to GitHub.

---

## ☁️ Deployment

| Service | Purpose |
|---|---|
| Netlify | Frontend deployment |
| Render | Flask backend deployment |
| Aiven | Cloud MySQL database |

Application: [Travel Budget Pro](https://travel-budget-pro.netlify.app/)

---

## 🔮 Future Enhancements

- Add downloadable PDF expense reports.
- Improve budget insights and spending analysis.
- Enhance dashboard features.

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a branch for your changes.
3. Commit your changes.
4. Push your branch and open a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
