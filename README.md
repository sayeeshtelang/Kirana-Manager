# Kirana Manager

> A multi-business grocery store management system built with the MERN stack.

Kirana Manager helps grocery stores manage daily operations from one place: products, inventory, suppliers, purchase orders, customers, credit (khatta), point-of-sale billing, employees, dashboards, and reports. The application is designed for Indian retailers and uses Indian Rupees throughout the billing workflow.

## Features

- Dashboard with sales and inventory summaries
- Product and category management
- Stock tracking and inventory movements
- Supplier and purchase order management
- Customer records and khatta credit tracking
- POS billing and bill history
- Employee invitations with role-based permissions
- Business switcher for users who manage multiple stores
- Optional Cloudinary image uploads

## Tech stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Recharts
- **Backend:** Node.js, Express, Mongoose, JWT authentication
- **Database:** MongoDB Atlas
- **Integrations:** Cloudinary and SMTP/Nodemailer (optional)

## Requirements

- Node.js 18 or later
- npm
- A MongoDB Atlas database
- Cloudinary account for image uploads (optional)
- SMTP account for sending emails (optional in development)

## Getting started

Clone the repository and install dependencies for both applications:

```bash
git clone <your-repository-url>
cd grocery-store-system

cd backend
npm install

cd ../frontend
npm install
```

### Configure the backend

Create `backend/.env` with the following values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

To enable optional image uploads, add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. To enable email delivery, add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM`.

### Configure the frontend

The Vite development server uses `http://localhost:5173` and the backend uses `http://localhost:5000` by default. If the API is hosted elsewhere, configure the frontend API base URL in the frontend environment configuration used by the services layer.

### Run the application

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser. The API health endpoint is available at `http://localhost:5000/api/health`.

## First-run workflow

1. Open `/register` to create an account and its first business.
2. Sign in and open the dashboard.
3. Invite team members from the team settings and assign their roles.
4. Team members accept their invitation and only receive the permissions assigned to their role.
5. Use the business switcher to move between businesses connected to the same account.

## Multi-business security

Business data is isolated at the API layer:

- Users and businesses are separate records connected by memberships.
- Each business request includes an `X-Business-Id` header.
- Backend middleware verifies that the authenticated user has an active membership for the selected business.
- Controllers scope business-owned database queries to `req.businessId`.
- Roles and permissions are centrally defined in `backend/config/roles.js` and enforced by the backend as well as reflected in the frontend navigation.

## Project structure

```text
backend/
  config/          Database, Cloudinary, and role configuration
  controllers/     Request handlers for each business module
  middleware/      Authentication, tenancy, uploads, validation, and errors
  models/          Mongoose models
  routes/          Express API routes
  utils/           Tokens, email, uploads, and shared helpers

frontend/
  src/context/     Authentication and current-business state
  src/services/    API service wrappers
  src/layouts/     Application shell and navigation
  src/components/  Shared UI components and route guards
  src/pages/       Application screens
```

## Useful commands

From `backend/`:

```bash
npm run dev       # Start with Nodemon
npm start         # Start in normal mode
npm run check     # Check server.js syntax
```

From `frontend/`:

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run lint      # Run Oxlint
npm run preview   # Preview the production build
```

## Production checklist

- Use strong, unique JWT secrets and keep all credentials out of Git.
- Set `NODE_ENV=production` and configure `CLIENT_URL` to the deployed frontend URL.
- Restrict MongoDB Atlas network access and database permissions appropriately.
- Configure Cloudinary and SMTP before enabling image uploads or production email flows.
- Build the frontend with `npm run build` and serve it from your deployment platform.

## License

No license has been specified yet.
