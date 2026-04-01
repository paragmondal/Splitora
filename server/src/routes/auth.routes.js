const express = require('express')
const rateLimit = require('express-rate-limit')
const { body } = require('express-validator')
const { protect } = require('../middleware/auth.middleware')
const upload = require('../middleware/upload.middleware')
const validate = require('../middleware/validate.middleware')
const { register, login, googleSignIn, refreshToken, logout, getMe, updateProfile, changePassword, uploadAvatar } = require('../controllers/auth.controller')
const router = express.Router()

const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
})

router.post('/register',
  [body('name').notEmpty().withMessage('Name is required'),
   body('email').isEmail().withMessage('Valid email is required'),
   body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  authActionLimiter, validate, register)

router.post('/login',
  [body('email').isEmail().withMessage('Valid email is required'),
   body('password').notEmpty().withMessage('Password is required')],
  authActionLimiter, validate, login)

router.post('/google',
  [body('idToken').notEmpty().withMessage('Google ID token is required')],
  authActionLimiter, validate, googleSignIn)

router.post('/refresh', refreshToken)
router.post('/logout', logout)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.put('/password', protect, changePassword)
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar)

module.exports = router
