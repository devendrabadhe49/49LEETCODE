require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const redisclient = require('./config/redis');
const connectDB = require('./config/db');

const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/ProblemCreater');
const submitRouter = require('./routes/submit');
const chatRouter = require('./routes/chat');

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submit', submitRouter);
app.use('/chat', chatRouter);

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`DAY1 listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('DB connect error:', err);
        process.exit(1);
    });

// POST http://localhost:3000/user/admin/register
// x-admin-setup-key: dev_admin_setup_key_change_me
// Content-Type: application/json

// {
//   "firstName": "Admin",
//   "emailId": "admin@example.com",
//   "password": "StrongPass123!"
// }