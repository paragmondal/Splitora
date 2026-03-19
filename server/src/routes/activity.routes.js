const express = require('express')
const { protect } = require('../middleware/auth.middleware')
const { getRecentActivity } = require('../controllers/activity.controller')

const router = express.Router()

router.get('/', protect, getRecentActivity)

module.exports = router
