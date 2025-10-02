import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

const metaSchema = z.object({
  payment_id: z.string().regex(/^\d+$/),
  user_id: z.string().uuid(),
  year: z.string().regex(/^\d{4}$/)
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Erreur signature webhook:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const parsed = metaSchema.safeParse(session.metadata || {})
      if (!parsed.success) {
        console.error('Métadonnées invalides:', parsed.error)
        return NextResponse.json({ error: 'Métadonnées invalides' }, { status: 400 })
      }

      const { payment_id: paymentId, user_id: userId, year: yearStr } = parsed.data
      const year = parseInt(yearStr, 10)

      // Mettre à jour le statut du paiement
      const { error: updateError } = await supabase
        .from('membership_payments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(paymentId))

      if (updateError) {
        console.error('Erreur mise à jour paiement:', updateError)
        return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
      }

      // Mettre à jour le profil utilisateur
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          membership_status: 'active',
          membership_year: year,
          membership_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (userUpdateError) {
        console.error('Erreur mise à jour utilisateur:', userUpdateError)
        return NextResponse.json({ error: 'Erreur mise à jour utilisateur' }, { status: 500 })
      }

      console.log(`Paiement confirmé pour l'utilisateur ${userId}, année ${year}`)
    } catch (error) {
      console.error('Erreur traitement webhook:', error)
      return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
} 