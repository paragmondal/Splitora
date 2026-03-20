const express = require('express')
const { protect } = require('../middleware/auth.middleware')
const { getDashboardStats } = require('../controllers/stats.controller')
const router = express.Router()
router.get('/dashboard', protect, getDashboardStats)
module.exports = router
