# Tha Pyay Nu API

REST API for the Tha Pyay Nu book store. It handles authentication with JWT and role-based access control, with separate permissions for customers and admins.
Built a REST API with [27] endpoints using Express, Prisma, PostgreSQL, JWT authentication with HTTP cookies .

## Tech Stack
Node.js, Express, Prisma, PostgreSQL, JWT

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL running locally

### Installation
```bash
git clone https://github.com/Paung1999/tha-pyay-nu-api.git
cd tha-pyay-nu-api
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Environment Variables
| Variable | Description |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret used to sign tokens |
| PORT | Port the server runs on |

## API Endpoints

Roles: **Public** (no login), **Customer** (logged in), **Admin**.
Admins manage **inventory books** (stock records) and **sell-books** (listings shown in the store).

### Auth
| Method | Route | Description | Role |
|---|---|---|---|
| POST | /api/v1/user/register | Create an account | Public |
| POST | /api/v1/user/login | Log in, returns a JWT | Public |

### Books
| Method | Route | Description | Role |
|---|---|---|---|
| GET | /api/v1/books | List all books | Public |
| GET | /api/v1/books/:id | Get a book by id | Public |
| GET | /api/v1/books/genres/:genreId | List books in a genre | Public |

### Orders
| Method | Route | Description | Role |
|---|---|---|---|
| POST | /api/v1/orders/checkout | Check out the cart | Customer |
| GET | /api/v1/orders/my-orders | Get your own orders | Customer |

### Admin
| Method | Route | Description | Role |
|---|---|---|---|
| POST | /api/v1/admin/login | Login as admin | Public |

### Inventory Books
| Method | Route | Description | Role |
|---|---|---|---|
| GET | /api/v1/admin/books/search | Get book by search | Admin |
| GET | /api/v1/admin/books | Get inventory books| Admin |
| GET | /api/v1/admin/books/:id | Get inventory book by id | Admin |
| POST | /api/v1/admin/books | Save new book to inventory | Admin |
| PUT | /api/v1/admin/books/:id | Update book by id | Admin |
| DELETE | /api/v1/admin/books/:id | Delete book by id | Admin |

### Admin Genres
| Method | Route | Description | Role |
|---|---|---|---|
| GET | /api/v1/admin/genres | Get all genres | Admin |
| GET | /api/v1/admin/genres/:id | Get genre by id | Admin |
| POST | /api/v1/admin/genres | Save new genre | Admin |
| PUT | /api/v1/admin/genres/:id | Update genre by id | Admin |
| DELETE | /api/v1/admin/genres/:id | Delete genre by id | Admin |

### Admin:Store Listing
| Method | Route | Description | Role |
|---|---|---|---|
| GET | /api/v1/admin/sell-books/search | Get book by search | Admin |
| GET | /api/v1/admin/sell-books | Get all listed books | Admin |
| GET | /api/v1/admin/sell-books/:id | Get listed book by id  | Admin |
| POST | /api/v1/admin/sell-books | Save new book to store  | Admin |
| PUT | /api/v1/admin/sell-books/:id | Update listed book by id | Admin |
| DELETE | /api/v1/admin/sell-books/:id | Delete listed book by id | Admin |

### Admin orders
| Method | Route | Description | Role |
|---|---|---|---|
| GET | /api/v1/admin/orders| Get all orders | Admin |
| PUT | /api/v1/admin/orders/:orderId/status | Update order status by Admin | Admin |


## Related Repository
The frontend for this API is [tha-pyay-nu-client](https://github.com/Paung1999/tha-pyay-nu-client).