import express from 'express'
import verifyToken from '../middleware/verifyToken.js';
import getUsers from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', verifyToken, getUsers);

export default router;