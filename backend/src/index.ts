import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('ProjectHub Backend API is running!');
});

// Routes
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// Protected Route Example
// 이 경로는 verifyToken 미들웨어를 통과해야만 접근 가능합니다.
// 헤더에 'Authorization: Bearer <Firebase_ID_Token>'이 없으면 401 에러가 납니다.
app.get('/api/me', verifyToken, (req, res) => {
    res.json({
        message: `Hello ${req.user?.email}`,
        uid: req.user?.uid,
        note: "This data comes from the Express Backend!"
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
