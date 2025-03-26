RD-API
===
## env guide
PORT=8080
DATABASE_URL=***
JWT_SECRET=***
CLOUDINARY_NAME=***
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***
---

## API Endpoints

### Authentication
|path |method |authen |params |query |body |
|:-- |:-- |:-- |:-- |:-- |:-- |
|/auth/register|post|-|-|-| { username, firstname, lastname, email, password, confirmPassword }
|/auth/login|post|-|-|-| {identity, password}
|/auth/me|get|y|-|-|-|

---