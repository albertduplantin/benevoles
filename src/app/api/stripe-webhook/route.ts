import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

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
      const paymentId = session.metadata?.payment_id
      const userId = session.metadata?.user_id
      const year = parseInt(session.metadata?.year || '0')

      if (!paymentId || !userId || !year) {
        console.error('Métadonnées manquantes dans le webhook')
        return NextResponse.json({ error: 'Métadonnées manquantes' }, { status: 400 })
      }

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