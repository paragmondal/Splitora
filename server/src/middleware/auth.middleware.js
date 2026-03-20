const jwt = require('jsonwebtoken')
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: token missing' })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    return next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired token' })
  }
}
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      req.user = jwt.verify(token, process.env.JWT_SECRET)
    }
  } catch {}
  return next()
}
module.exports = { protect, optionalAuth }
