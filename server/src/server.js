require('dotenv').config()
const app = require('./app')
const prisma = require('./config/db')

const PORT = process.env.PORT || 10000

async function main() {
  try {
    await prisma.$connect()
    console.log('Database connected successfully')
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Splitora server is running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

main()

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})
