import express from 'express';
import authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login',
    authController.loginValidation,
    validate,
    authController.login
);

router.post('/forgot-password',
    authController.forgotPasswordValidation,
    validate,
    authController.forgotPassword
);

router.post('/reset-password',
    authController.resetPasswordValidation,
    validate,
    authController.resetPassword
);

router.post('/refresh',
    authController.refreshToken
);

// Protected routes
router.get('/me', authenticate, authController.getMe);

export default router;
