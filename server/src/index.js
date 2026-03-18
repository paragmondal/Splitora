const http = require('http');
const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({
    success: true,
    service: 'Splitora API',
    message: 'Server is running',
  }));
});

server.listen(PORT, () => {
  console.log(`Splitora server listening on port ${PORT}`);
});
