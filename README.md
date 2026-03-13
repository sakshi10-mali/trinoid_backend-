# Trinoid Solutions Backend

This is the backend server for handling SMTP operations (OTP verification and Contact Form submissions).

## Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
3.  Configure environment variables:
    *   Open `.env` file.
    *   Set `EMAIL_USER` to your Gmail address (e.g., `trinoidsolutions@gmail.com`).
    *   Set `EMAIL_PASS` to your [Gmail App Password](https://support.google.com/accounts/answer/185833). **Do not use your regular password.**
    *   Set `ADMIN_EMAIL` to the address where you want to receive contact form inquiries.

## Running the Server

Start the backend server:
```bash
npm start
```
The server will run on `http://localhost:5001`.

## Integration

The frontend is already configured to point to `http://localhost:5001`. Ensure the backend is running for OTP and Contact Form functionality to work.
