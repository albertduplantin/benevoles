import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { amount, year, userId } = await request.json()

    if (!amount || !year || !userId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Récupérer le vrai email de l'utilisateur depuis Supabase Auth
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.admin.getUserById(userId)
    
    const userRealEmail = user?.email || 'no-email@example.com'

    // Vérifier s'il existe déjà un paiement pour cette année
    const supabase = await createClient()
    const { data: existingPayment } = await supabase
      .from('membership_payments')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .single()

    let paymentRecord
    
    if (existingPayment) {
      // Utiliser le paiement existant s'il est en attente
      if (existingPayment.status === 'pending') {
        paymentRecord = existingPayment
      } else if (existingPayment.status === 'completed') {
        return NextResponse.json({ error: 'Cotisation déjà payée pour cette année' }, { status: 400 })
      } else {
        // Mettre à jour le statut si nécessaire
        const { data: updatedPayment, error: updateError } = await supabase
          .from('membership_payments')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', existingPayment.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('Erreur mise à jour:', updateError)
          return NextResponse.json({ error: 'Erreur lors de la mise à jour du paiement' }, { status: 500 })
        }
        paymentRecord = updatedPayment
      }
    } else {
      // Créer un nouveau paiement
      const { data: newPayment, error: dbError } = await supabase
        .from('membership_payments')
        .insert({
          user_id: userId,
          year: year,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single()

      if (dbError) {
        console.error('Erreur base de données:', dbError)
        return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
      }
      paymentRecord = newPayment
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Cotisation Festival du Film Court ${year}`,
              description: `Adhésion et soutien au festival pour l'année ${year}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?payment=cancelled`,
      metadata: {
        payment_id: paymentRecord.id.toString(),
        user_id: userId,
        year: year.toString(),
      },
      customer_email: userRealEmail,
    })

    // Mettre à jour l'enregistrement avec l'ID de session Stripe
    await supabase
      .from('membership_payments')
      .update({ stripe_payment_id: session.id })
      .eq('id', paymentRecord.id)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Erreur Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
} 