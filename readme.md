
<p align="center">
  <img
    src="frontend/public/travel-budget-logo.svg"
    alt="Travel Budget Pro"
    width="320"
  />
</p>

<p align="center">
  <strong>Plan trips without financial surprises.</strong>
</p>

<p align="center">
  A web application to plan trips, manage expenses, and compare your planned budget with actual costs.
</p>

<p align="center">
  <a href="https://travel-budget-pro.netlify.app/">Open Travel Budget Pro</a>
</p>

---


## ✨ Features

- **User Authentication:** Register and log in securely.
- **Trip Management:** Create, view, update, and delete trips.
- **Budget Planning:** Set a total budget for each trip.
- **Expense Tracking:** Add, edit, and delete travel, hotel, food, shopping, and activity expenses.
- **Budget Summary:** View total expenses and remaining budget.
- **Planned vs Actual:** Compare the planned budget with actual trip costs.
- **Expense Analysis:** View spending by category using charts.
- **Trip Search:** Search previous trips and filter them by status.
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
| Netlify | Frontend deployment |
| Render | Backend deployment |
| Aiven | Cloud MySQL hosting |


---

## 🚀 Getting Started

Follow these steps to run Travel Budget Pro on your local machine.

### Prerequisites

- Python installed
- Node.js and npm installed
- MySQL database configured

### 1. Clone the Repository

```bash
git clone <your-github-repository-url>
cd Travel_Budget_pro
```

Replace `<your-github-repository-url>` with your actual GitHub repository URL.

### 2. Set Up the Backend

Open a terminal in the project root and run:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Configure the backend environment variables in your local `.env` file.

Start the Flask server:

```bash
python app.py
```

### 3. Set Up the Frontend

Open a second terminal in the project root and run:

```bash
cd frontend
npm install
```

Create a frontend `.env` file containing:

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

Configure the following variables in your local environment files.

### Backend (`backend/.env`)

```env
SECRET_KEY=your_secret_key
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://127.0.0.1:5000
```

**Security:** Replace the example values with your own configuration. Never commit actual credentials, secret keys, or database certificates to GitHub.

## ☁️ Deployment

| Service | Purpose |
|---|---|
| Netlify | Frontend hosting |
| Render | Flask backend hosting |
| Aiven | Cloud MySQL database |

**Application:** [Travel Budget Pro](https://travel-budget-pro.netlify.app/)


---

## 🔮 Future Enhancements

- Add downloadable PDF expense reports.
- Improve budget insights and spending analysis.
- Enhance the user experience with additional dashboard features.

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a new branch for your changes.
3. Commit your changes.
4. Push your branch and open a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
