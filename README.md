# NEXØRA Campus One AI

Beginner-friendly Android app starter with Expo React Native, Express API, and MongoDB.

## Requirements
- macOS with Node.js 20+ and npm
- VS Code
- MongoDB Atlas database (or local MongoDB)
- Expo Go for quick device testing; Android APK builds use EAS Build

## 1. Backend setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Edit `.env` and set `MONGODB_URI` and a long random `JWT_SECRET`. API runs on `http://localhost:5000`.
For a physical phone, set `API_URL` in the mobile app to your Mac's LAN IP, e.g. `http://192.168.1.10:5000/api`. Both devices must be on the same Wi-Fi. `localhost` on a phone means the phone itself.

Create the first admin using the one-time seed command:
```bash
npm run seed:admin
```
It uses `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `.env`. Keep these private.

## 2. Mobile setup
In a second terminal:
```bash
cd mobile
npm install
```
Edit `mobile/src/api/client.js` and set `API_URL` to your Mac LAN IP for physical-device testing. Then:
```bash
npx expo start
```
Scan the QR code with Expo Go. On iOS simulator use `http://localhost:5000/api`; on Android emulator use `http://10.0.2.2:5000/api`.

## 3. APK build
Install EAS CLI and sign in:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```
When the build completes, use the EAS build page to download the APK. This requires an Expo account and internet access.

## Visual design updates in this build
- Welcome screen uses the supplied Mewar University logo, NEXØRA logo, and campus building photo.
- Login/register screen uses the original logos and dark navy/electric-blue styling.
- Mess screen includes the full weekly menu supplied by the user (breakfast, lunch, snacks, dinner) and food suggestion form.
- Campus Map tab displays the supplied campus satellite screenshot. It is a reference image, not live GPS navigation.

The supplied images are stored in `mobile/assets/`.

## Included features
- Register/login with JWT and Student/Faculty/Admin roles
- Complaint creation, listing, status tracking and admin status updates
- Mess menu and food suggestions
- Campus locations list/search starter
- One AI FAQ assistant (rule-based starter, not a hosted LLM)
- Admin dashboard summary

## Before real campus deployment
- Replace demo campus locations with verified campus coordinates and map provider.
- Add rate limiting, email verification/password reset, audit logs, backups, HTTPS, monitoring and privacy/retention policy.
- Configure a real AI provider only on the backend; never ship API keys in the APK.
- Add a verified university identity/SSO process if required. Do not use sample credentials for real users.
