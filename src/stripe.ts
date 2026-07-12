import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY غير مضبوط');
  stripeClient = new Stripe(key);
  return stripeClient;
}

function appUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}

export async function createCheckoutSession(user: { id: string; email: string; stripeCustomerId: string | null }) {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_PRICE_ID غير مضبوط');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: user.stripeCustomerId || undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    client_reference_id: user.id,
    success_url: `${appUrl()}/store?success=1`,
    cancel_url: `${appUrl()}/store?canceled=1`,
    metadata: { userId: user.id },
  });

  return session.url;
}

export async function createBillingPortalSession(stripeCustomerId: string) {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl()}/store`,
  });
  return session.url;
}
