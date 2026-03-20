const express = require('express')
const { protect } = require('../middleware/auth.middleware')
const { createOrder, verifyPayment, getPaymentStatus } = require('../controllers/payment.controller')
const router = express.Router()
router.use(protect)
router.post('/create-order', createOrder)
router.post('/verify', verifyPayment)
router.get('/status/:settlementId', getPaymentStatus)
module.exports = router
