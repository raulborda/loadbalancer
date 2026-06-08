# Load Balancer con Microservicios

Simulación de un sistema de load balancing con 6 microservicios en Node.js. El balancer distribuye las peticiones usando Round Robin y monitorea la salud de cada servicio cada 10 segundos.

## Arquitectura

```
Cliente → Load Balancer (:3000) → service-3001
                                → service-3002
                                → service-3003
                                → service-3004
                                → service-3005
                                → service-3006
```

## Archivos

| Archivo | Descripción |
|---|---|
| `start-services.js` | Levanta los 6 microservicios y el load balancer |
| `load-balancer.js` | Recibe peticiones en `:3000` y las distribuye por Round Robin |
| `server.js` | Código de cada microservicio individual |
| `cleanup.js` | Mata procesos en los puertos 3000–3010 |

## Instalación

```bash
npm install
```

## Uso

### Iniciar el sistema

```bash
node start-services.js
```

Si hay procesos previos usando esos puertos:

```bash
node cleanup.js && node start-services.js
```

### Detener

`Ctrl+C` en la terminal donde corre `start-services.js`. Cierra todos los procesos limpiamente.

## Endpoints

### Load Balancer (puerto 3000)

```bash
# Petición balanceada
curl http://localhost:3000/api/process

# Estadísticas de uso por servicio
curl http://localhost:3000/stats

# Salud del sistema
curl http://localhost:3000/health
```

### Microservicio individual (puertos 3001–3006)

```bash
# Salud
curl http://localhost:3001/health

# Info detallada (memoria, uptime, stats)
curl http://localhost:3001/info
```

## Respuesta de ejemplo

```json
{
  "serviceId": "service-3002",
  "port": 3002,
  "requestId": "req-4",
  "message": "Procesado por service-3002",
  "processingTime": "3000ms",
  "totalTime": "3001ms",
  "timestamp": "2026-06-08T12:00:00.000Z"
}
```

El load balancer agrega headers en cada respuesta:

```
x-load-balancer: custom-lb
x-service-used: http://localhost:3002
x-request-id: req-4
x-response-time: 3002ms
```

## Ver el balanceo en acción

Peticiones secuenciales (muestra la rotación Round Robin):

```bash
for i in {1..6}; do curl -s http://localhost:3000/api/process | grep serviceId; done
```

Peticiones en paralelo (simula carga concurrente):

```bash
for i in {1..6}; do curl -s http://localhost:3000/api/process & done; wait
```

## Simular errores

Cada microservicio acepta una tasa de error via variable de entorno:

```bash
ERROR_RATE=0.3 node server.js 3001  # 30% de peticiones fallan con HTTP 500
```

## Personalización

- **Agregar/quitar servicios:** modificar el array `PORTS` en `start-services.js` y la lista `services` en `load-balancer.js`
- **Tiempo de respuesta:** modificar `processingTime` en `server.js` (actualmente fijo en 3000ms)
- **Timeout del balancer:** modificar `timeout` en `load-balancer.js` (actualmente 5000ms)
- **Intervalo de health check:** modificar el `setInterval` en `load-balancer.js` (actualmente cada 10s)

## Solución de problemas

| Error | Solución |
|---|---|
| Puerto ya en uso | `node cleanup.js` |
| No responde | `curl http://localhost:3000/health` para ver qué servicios están caídos |
| Dependencias faltantes | `npm install` |
