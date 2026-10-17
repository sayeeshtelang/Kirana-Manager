
# Kirana Manager

A multi-business grocery store management system built with the MERN stack.

Kirana Manager helps grocery stores manage daily operations from one place, including products, inventory, suppliers, purchase orders, customers, credit (khatta), point-of-sale billing, employees, dashboards, and reports. The application is designed for Indian retailers and uses Indian Rupees (₹) throughout the billing workflow.

## Features

- Dashboard with sales and inventory summaries
- Product and category management with category-based browsing
- Stock tracking and inventory movement management
- Supplier and purchase order management
- Customer records and khatta credit tracking
- POS billing and bill history
- Employee invitations with role-based permissions
- Business switcher for users managing multiple stores
- Optional Cloudinary image uploads
- JWT-based authentication
- Business-level data isolation and access control
- Product search, filtering, and pagination
- Optional email delivery using SMTP and Nodemailer

## Tech Stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Recharts
- **Backend:** Node.js, Express.js, Mongoose, JWT authentication
- **Database:** MongoDB Atlas
- **Image Storage:** Cloudinary (optional)
- **Email Integration:** SMTP and Nodemailer (optional)

## Requirements

- Node.js 18 or later
- npm
- Git
- MongoDB Atlas account and database
- Cloudinary account for image uploads (optional)
- SMTP account for email delivery (optional during development)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd grocery-store-system
```

### 2. Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Environment Configuration

### Backend Configuration

The project already includes a `backend/.env.example` file. Use the existing file as the reference for the required environment variables.

From the `backend/` directory, create your local environment file:

```bash
cp .env.example .env
```

Update `backend/.env` with your MongoDB Atlas connection string, JWT secrets, and other required configuration values.

Typical configuration includes:

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

The variables above are examples. Check the existing `.env.example` and backend configuration for the exact variable names required by the application. Do not overwrite existing configuration unnecessarily.

### Optional Cloudinary Configuration

Configure these variables if image uploads use Cloudinary:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Optional SMTP Configuration

Configure these variables if the application sends emails:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=your-sender-email
```

Use the exact variable names expected by the existing application.

### Frontend Configuration

The frontend runs on `http://localhost:5173` by default, while the backend runs on `http://localhost:5000`.

Check the existing frontend services layer and environment configuration to determine how the API base URL is configured.

If the application uses `VITE_API_URL`, the local frontend environment file may contain:

```env
VITE_API_URL=http://localhost:5000/api
```

Do not introduce this variable if the application uses another configuration mechanism.

Never place database credentials, JWT secrets, SMTP passwords, or private API keys in frontend environment variables. Vite variables prefixed with `VITE_` can be exposed to browser code.

## Running the Application

### Start the Backend

Open a terminal and run:

```bash
cd backend
npm run dev
```

### Start the Frontend

Open another terminal and run:

```bash
cd frontend
npm run dev
```

Open the application in your browser:

`http://localhost:5173`

The backend health endpoint is available at:

`http://localhost:5000/api/health`

These URLs assume the default local development configuration.

## First-Run Workflow

1. Open `/register` to create an account and its first business.
2. Sign in and access the dashboard.
3. Add products and categories.
4. Manage inventory and stock movements.
5. Add suppliers and create purchase orders.
6. Register customers and track khatta credit.
7. Generate bills through the POS screen and review bill history.
8. Invite employees and assign roles through the team settings.
9. Allow invited employees to accept their invitations.
10. Use the business switcher to access businesses associated with the account, subject to membership permissions.

## Browsing Products by Category

1. Open the Categories section.
2. Select a category to browse its products.
3. Use the category filter on the Products page.
4. Combine category filtering with product search.
5. Navigate through paginated results.

## Multi-Business Security

Business data is isolated at the API layer.

- Users and businesses are separate records connected through memberships.
- Business-specific requests include an `X-Business-Id` header.
- Backend middleware verifies that the authenticated user has an active membership for the selected business.
- Controllers scope business-owned database queries using `req.businessId`.
- Roles and permissions are centrally defined in `backend/config/roles.js`.
- Backend authorization enforces permissions independently of frontend navigation.
- The frontend reflects the permissions assigned to each user.

The backend remains the source of truth for authorization. Hiding a menu item in the frontend is not sufficient to protect business data.

## Project Structure

```text
grocery-store-system/
├── backend/
│   ├── config/          # Database, Cloudinary, and role configuration
│   ├── controllers/     # Request handlers for business modules
│   ├── middleware/      # Authentication, tenancy, uploads, validation, and errors
│   ├── models/          # Mongoose models
│   ├── routes/          # Express API routes
│   ├── utils/           # Tokens, email, uploads, and shared helpers
│   ├── .env.example     # Existing environment variable template
│   └── server.js        # Backend entry point
│
├── frontend/
│   └── src/
│       ├── context/     # Authentication and current-business state
│       ├── services/    # API service wrappers
│       ├── layouts/     # Application shell and navigation
│       ├── components/  # Shared UI components and route guards
│       └── pages/       # Application screens
│
└── README.md
```

This is a representative structure. Refer to the repository for the complete directory layout.

## Useful Commands

### Backend

Run these commands from `backend/`:

```bash
npm run dev
npm start
npm run check
```

- `npm run dev`: Starts the development server, if configured.
- `npm start`: Starts the application using the configured start script.
- `npm run check`: Checks `server.js` syntax, if configured.

### Frontend

Run these commands from `frontend/`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Creates a production build.
- `npm run lint`: Runs the configured linting checks.
- `npm run preview`: Previews the production build locally.

Run only commands defined in the corresponding `package.json` files.

## Troubleshooting

### MongoDB Connection Issues

- Verify the MongoDB Atlas connection string in `backend/.env`.
- Check the database username and password.
- Verify Atlas network access rules and database permissions.
- Restart the backend after changing environment variables.

### Frontend Cannot Reach the Backend

- Confirm that the backend is running.
- Verify the API base URL in the frontend services layer.
- Check the backend port and CORS configuration.
- Inspect browser console errors and backend logs.
- Ensure the deployed frontend uses the correct API URL.

### Email Delivery Issues

- Verify the SMTP host, port, username, and password.
- Check whether the provider requires an app password.
- Confirm that the sender address is permitted.
- Inspect backend logs for delivery errors.

### Image Upload Issues

- Verify the Cloudinary credentials.
- Check upload middleware and file validation rules.
- Review upload limits and backend logs.

## Production Checklist

- Set `NODE_ENV=production`.
- Use strong, unique JWT secrets.
- Configure the production MongoDB connection string.
- Set `CLIENT_URL` to the deployed frontend origin.
- Configure the production API URL or API routing.
- Restrict MongoDB Atlas network access and database permissions.
- Keep `.env` files and credentials out of Git.
- Configure Cloudinary and SMTP if required.
- Enable HTTPS for production traffic.
- Review authentication, token refresh, session expiration, and authorization.
- Verify business membership and role permissions on every protected API operation.
- Build the frontend using `npm run build`.
- Deploy the frontend and backend using the appropriate hosting configuration.
- Test registration, login, billing, inventory, business switching, and employee permissions after deployment.

## Environment File Security

- Keep `backend/.env.example` committed to the repository when appropriate.
- Never commit `backend/.env` or expose credentials in source control.
- Update the existing `.env.example` when new environment variables are introduced.
- Use placeholder values in the example file.
- Do not copy production credentials into `.env.example`.
- Preserve existing environment configuration and avoid unnecessary overwrites.
- Ensure `.gitignore` excludes actual environment files.

## License

No license has been specified yet.
