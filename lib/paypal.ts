import { 
  Client, 
  Environment, 
  LogLevel, 
  OrdersController 
} from "@paypal/paypal-server-sdk";

const clientId = process.env.PAYPAL_CLIENT_ID || 'build_placeholder_id';
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'build_placeholder_secret';

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: clientId,
    oAuthClientSecret: clientSecret,
  },
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true },
  },
});

export const ordersController = new OrdersController(client);
