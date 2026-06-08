const express = require('express');
const app = express();

const PORT = parseInt(process.argv[2]) || 3001;
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error('Puerto inválido. Uso: node server.js <puerto>');
  process.exit(1);
}

const SERVICE_ID = `service-${PORT}`;
const ERROR_RATE = parseFloat(process.env.ERROR_RATE) || 0; // 0.0 - 1.0

let requestCount = 0;
let errorCount = 0;
let activeRequests = 0;

app.use(express.json());

app.get('/api/process', (req, res) => {
  requestCount++;
  activeRequests++;
  const requestId = req.headers['x-request-id'];
  const startTime = Date.now();

  // Simular error según tasa configurada
  if (ERROR_RATE > 0 && Math.random() < ERROR_RATE) {
    errorCount++;
    activeRequests--;
    return res.status(500).json({
      serviceId: SERVICE_ID,
      requestId,
      error: 'Error simulado',
      errorRate: ERROR_RATE,
      timestamp: new Date().toISOString()
    });
  }

  const processingTime = 3000;

  setTimeout(() => {
    activeRequests--;
    const totalTime = Date.now() - startTime;
    res.json({
      serviceId: SERVICE_ID,
      port: PORT,
      requestId,
      message: `Procesado por ${SERVICE_ID}`,
      processingTime: `${processingTime}ms`,
      totalTime: `${totalTime}ms`,
      timestamp: new Date().toISOString()
    });
  }, processingTime);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    serviceId: SERVICE_ID,
    port: PORT,
    uptime: process.uptime(),
    activeRequests,
    timestamp: new Date().toISOString()
  });
});

app.get('/info', (req, res) => {
  res.json({
    serviceId: SERVICE_ID,
    port: PORT,
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    stats: {
      totalRequests: requestCount,
      totalErrors: errorCount,
      activeRequests,
      errorRate: ERROR_RATE
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 ${SERVICE_ID} corriendo en puerto ${PORT}`);
  if (ERROR_RATE > 0) console.log(`   ⚠️  Error rate: ${(ERROR_RATE * 100).toFixed(0)}%`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Process: http://localhost:${PORT}/api/process`);
});

function gracefulShutdown(signal) {
  console.log(`📴 ${SERVICE_ID} recibió ${signal}, cerrando (${activeRequests} requests activos)...`);
  server.close(() => {
    console.log(`✅ ${SERVICE_ID} cerrado limpiamente.`);
    process.exit(0);
  });

  // Forzar cierre si tarda más de 5s
  setTimeout(() => {
    console.warn(`⏰ ${SERVICE_ID} forzando cierre por timeout.`);
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));




