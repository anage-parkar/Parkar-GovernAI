# Vector Integration Guide

This guide outlines the steps to integrate the VerifyWise platform with Vector for comprehensive observability (logs, metrics, and traces).

## 1. Node.js Backend (`/Servers`)

The Node.js backend currently uses `console.log`. We will introduce `pino` for structured logging and `pino-http` for request logging.

### 1.1. Add Dependencies
x
```bash
cd Servers
npm install pino pino-http pino-pretty open-telemetry-instrumentation-pino
```

### 1.2. Create a Logger Module

Create a new file `Servers/src/config/logger.ts`:

```typescript
import pino from 'pino';
import { pinoHttp } from 'pino-http';

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
      },
    },
    // Add Vector transport here when you have the endpoint
    // {
    //   target: 'pino/file',
    //   options: {
    //     destination: '/path/to/vector.log' // Or use a pino-http-send transport
    //   }
    // }
  ],
});

const logger = pino(transport);

export const httpLogger = pinoHttp({ logger });

export default logger;
```

### 1.3. Integrate into Express

In `Servers/src/app.ts` (or your main Express file), add the `httpLogger`:

```typescript
// ... other imports
import { httpLogger } from './config/logger';

const app = express();

// Add this middleware near the top
app.use(httpLogger);

// ... rest of your app configuration
```

### 1.4. Replace `console.log`

Replace all instances of `console.log` with `logger.info`, `logger.warn`, `logger.error`, etc.

Example in `Servers/src/utils/db.ts`:
```typescript
import logger from '../config/logger';
// ...
try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
} catch (error) {
    logger.error('Unable to connect to the database:', error);
}
```

## 2. Python Services (`/AIGateway`, `/EvalServer`)

Both Python services use the standard `logging` module. We can configure it to send logs to Vector.

### 2.1. Update Logging Configuration

You will need to define a logging configuration dictionary. This can be done in a central configuration file for each service.

**Example for `AIGateway/src/main.py`:**

```python
import logging.config

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
        # Add a handler for Vector. This could be a FileHandler,
        # a SysLogHandler, or a custom HTTP handler.
        # "vector": {
        #     "formatter": "default",
        #     "class": "logging.handlers.SocketHandler",
        #     "host": "your-vector-host",
        #     "port": 12345 # your-vector-port
        # }
    },
    "loggers": {
        "uvicorn": {"handlers": ["default"], "level": "INFO"},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {"handlers": ["default"], "level": "INFO", "propagate": False},
    },
}

# In your app startup:
logging.config.dictConfig(LOGGING_CONFIG)
```

### 2.2. `EvalServer` Database Logging

For `EvalServer`, which logs to the database via `crud.create_log`, you can add a logging call alongside the database call.

In `EvalServer/src/utils/run_evaluation.py`:

```python
import logging
logger = logging.getLogger(__name__)

# ... inside run_evaluation function ...

# When you call crud.create_log:
log_data = {
    "evaluation_id": evaluation.id,
    # ... other log data
}
await crud.create_log(db, log_data)
logger.info("Evaluation log created", extra={"log_data": log_data})

```

## 3. Frontend (`/Clients`)

For the frontend, you can use a library that sends logs to an HTTP endpoint.

### 3.1. Add a Logging Library

You can choose a library like `@vector-log/browser` or create a simple fetch-based logger.

### 3.2. Create a Logger Service

Create `Clients/src/services/loggingService.ts`:

```typescript
const VECTOR_ENDPOINT = 'http://your-vector-host:8080/logs'; // Replace with your Vector HTTP source endpoint

export const logError = (error: Error, componentStack: string) => {
  const payload = {
    level: 'error',
    message: error.message,
    stack: error.stack,
    componentStack: componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  navigator.sendBeacon(VECTOR_ENDPOINT, JSON.stringify(payload));
};

export const logInfo = (message: string, extra: Record<string, any> = {}) => {
    const payload = {
        level: 'info',
        message,
        ...extra,
        timestamp: new Date().toISOString(),
        url: window.location.href,
    };
    navigator.sendBeacon(VECTOR_ENDPOINT, JSON.stringify(payload));
}
```

### 3.3. Use in Error Boundary

Use this service in a React Error Boundary.

Create `Clients/src/components/ErrorBoundary.tsx`:

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../services/loggingService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    logError(error, errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      return <h1>Sorry.. there was an error</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Then wrap your application with it in `Clients/src/main.tsx`.

## 4. OpenTelemetry (Tracing & Metrics)

For a deeper integration, you can add OpenTelemetry to your backend services. This will provide distributed tracing and performance metrics.

### 4.1. Node.js Backend

```bash
cd Servers
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http
```

Create `Servers/src/tracing.ts` and import it at the very top of your main application file (`app.ts` or `server.ts`).

### 4.2. Python Services

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
```

You can then use `opentelemetry-instrument` to automatically instrument your FastAPI application.

---

This guide provides the starting points for integrating Vector. You will need to replace placeholder URLs and configurations with the actual values from your Vector setup.
