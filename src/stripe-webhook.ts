import { Request, Response } from 'express';
import { getStripe } from './stripe';
import { prisma } from './prisma';

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET غير مضبوط' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { plan: 'PRO', stripeCustomerId: session.customer as string },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const user = await prisma.user.findUnique({ where: { stripeCustomerId: subscription.customer as string } });
        if (user) {
          await prisma.user.update({ where: { id: user.id }, data: { plan: 'FREE' } });
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook handling error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
