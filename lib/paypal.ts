import { 
  Client, 
  Environment, 
  LogLevel, 
  OrdersController 
} from "@paypal/paypal-server-sdk";

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret || clientId === 'build_placeholder_id') {
  console.warn('[PayPal SDK] WARNING: PayPal credentials are missing or using placeholders. API calls will likely fail with 401.');
}

// Default to 'sandbox' unless PAYPAL_MODE is explicitly set to 'production'
// This is safer for development/testing on live hosting.
const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: clientId || 'missing',
    oAuthClientSecret: clientSecret || 'missing',
  },
  environment: mode === 'production' ? Environment.Production : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true },
  },
});

export const ordersController = new OrdersController(client);
