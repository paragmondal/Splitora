require('dotenv').config()
const { createServer } = require('http')
const { Server } = require('socket.io')
const app = require('./app')
const prisma = require('./config/db')

const PORT = parseInt(process.env.PORT, 10) || 10000

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
})

global.io = io

io.on('connection', (socket) => {
  socket.on('join-group', (groupId) => socket.join(`group-${groupId}`))
  socket.on('leave-group', (groupId) => socket.leave(`group-${groupId}`))
})

async function startServer() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected')
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('❌ Server failed to start:', error.message)
    process.exit(1)
  }
}

startServer()

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message)
  process.exit(1)
})
