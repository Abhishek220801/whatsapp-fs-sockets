import express from 'express';
import signup  from '../controllers/auth.controller.js';

const router = express.Router();

//Signup 
router.post('/signup', signup);

export default router;