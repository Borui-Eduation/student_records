import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers/_app';
import { createContext } from './trpc';
import { createLogger, validateServerEnv } from '@student-record/shared';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger('api-server');

// Validate environment variables at startup
try {
  validateServerEnv();
  logger.info('Environment variables validated successfully');
} catch (error) {
  logger.error('Environment validation failed', error instanceof Error ? error : new Error(String(error)));
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8080;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Security middleware - Helmet
app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://storage.googleapis.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow tRPC
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
    });
  },
});

app.use('/trpc', limiter);

// Middleware - Support multiple CORS origins
// Support both comma and ^:^ as separators (gcloud uses ^:^ for list values)
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(/,|\^:\^/).map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('Blocked CORS request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Increase body size limit for image uploads (base64 images can be large)
app.use(express.json({ limit: '15mb' }));

// Legacy health check endpoint (for load balancers)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// tRPC endpoint
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { 
    path: req.path, 
    method: req.method,
    ip: req.ip,
  }, err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server (only in non-serverless environment)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    logger.info('API server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      trpcEndpoint: `http://localhost:${PORT}/trpc`,
    });
  });
}

// Export for Vercel Serverless
export default app;

