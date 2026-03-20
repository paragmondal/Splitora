const express = require('express')
const { protect } = require('../middleware/auth.middleware')
const { getSpendingInsights, getSplitSuggestion } = require('../controllers/ai.controller')
const router = express.Router()
router.use(protect)
router.get('/insights', getSpendingInsights)
router.post('/split-suggestion', getSplitSuggestion)
module.exports = router
