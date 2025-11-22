# Purple Link

Purple Link is a robust, self-hosted URL shortener and link management solution designed for privacy and ease of use. Built with Python (Flask) and SQLite, it offers a lightweight yet powerful platform for creating, tracking, and securing your links.

<p align="center">
  <img src="./static/img/dark-mode.png#gh-dark-mode-only" alt="Dark Mode Dashboard" width="75%">
  <img src="./static/img/dark-mode-phone.png#gh-dark-mode-only" alt="Dark Mode Mobile" width="20%">
  <img src="./static/img/light-mode.png#gh-light-mode-only" alt="Light Mode Dashboard" width="75%">
  <img src="./static/img/light-mode-phone.png#gh-light-mode-only" alt="Light Mode Mobile" width="20%">
</p>

---

## ✨ Key Features

*   **🔗 Smart Link Management**: Create shortened URLs with randomly generated or custom aliases (e.g., `/my-campaign`).
*   **🔒 Advanced Security**: Password-protect sensitive links to control access.
*   **📅 Expiration Control**: Set automatic expiration dates and times for temporary links.
*   **📊 Analytics Dashboard**: Track link performance with insights on views, top referring IPs, User Agents, and device types.
*   **📱 Responsive Design**: A seamless experience across desktop, tablet, and mobile devices.
*   **🌓 Theme Support**: Switch between Dark and Light mode with a built-in toggle.
*   **👥 User Management**: comprehensive admin panel for managing users and granular permissions (create, custom aliases, expiry, passwords, etc.).
*   **🖼️ QR Code Generation**: Instantly generate high-quality QR codes for any shortened link.
*   **⚡ High Performance**: powered by Waitress WSGI server for production-ready performance.

## 🚀 Getting Started

### Prerequisites

*   **Python 3.12+**

### 🛠️ Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/loserpurp/purple-link.git
    cd purple-link
    ```

2.  **Install dependencies:**
    It is recommended to use a virtual environment.
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```


3.  **Run the application:**
    ```bash
    python app.py
    ```
    Access the app at `http://localhost:7237`.

## ⚙️ Configuration & Usage

### Default Credentials
Upon first launch, a default administrator account is automatically created:

*   **Username**: `admin`
*   **Password**: `admin`

**⚠️ SECURITY WARNING**: Log in immediately and change the default password in the **Settings** tab.

### User Permissions
The Admin Panel allows you to manage user accounts and assign specific permissions:
*   **Create Links**: Allow user to shorten URLs.
*   **Custom Aliases**: Allow user to define custom URL paths.
*   **Expiry Dates**: Allow user to set link expiration.
*   **Password Protection**: Allow user to secure links with passwords.
*   **Max Uses**: Allow user to limit the number of times a link can be visited.
*   **Redirect Pages**: Allow user to enable a countdown redirect page.

## 🏗️ Tech Stack

*   **Backend**: [Flask](https://flask.palletsprojects.com/) (Python)
*   **WSGI Server**: [Waitress](https://docs.pylonsproject.org/projects/waitress/)
*   **Database**: SQLite (Lightweight, serverless)
*   **Frontend**: HTML5, CSS3, JavaScript

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or bug fixes, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeatureName`).
3.  Commit your changes (`git commit -m 'feat: Add some feature'`).
4.  Push to the branch (`git push origin feature/YourFeatureName`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
