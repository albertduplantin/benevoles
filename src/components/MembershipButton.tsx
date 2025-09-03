'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MembershipSetting, UserProfile } from '@/lib/types'
import { loadStripe } from '@stripe/stripe-js'

interface MembershipButtonProps {
  userProfile: UserProfile | null
}

export default function MembershipButton({ userProfile }: MembershipButtonProps) {
  const [settings, setSettings] = useState<MembershipSetting | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [hasPaid, setHasPaid] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
    checkPaymentStatus()
  }, [userProfile])

  const loadSettings = async () => {
    const currentYear = new Date().getFullYear()
    const { data } = await supabase
      .from('membership_settings')
      .select('*')
      .eq('year', currentYear)
      .single()

    setSettings(data)
  }

  const checkPaymentStatus = async () => {
    if (!userProfile) return

    const currentYear = new Date().getFullYear()
    const { data } = await supabase
      .from('membership_payments')
      .select('*')
      .eq('user_id', userProfile.id)
      .eq('year', currentYear)
      .eq('status', 'completed')
      .single()

    setHasPaid(!!data)
  }

  const handlePayment = async () => {
    if (!settings || !userProfile) return

    setIsLoading(true)
    setMessage('')

    try {
      // Créer une session de paiement Stripe
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: settings.amount,
          year: settings.year,
          userId: userProfile.id,
          userName: `${userProfile.first_name} ${userProfile.last_name}`
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        setMessage(`Erreur: ${error}`)
        return
      }

      // Rediriger vers Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          setMessage(`Erreur de redirection: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage('Erreur lors de la création de la session de paiement')
    } finally {
      setIsLoading(false)
    }
  }

  if (!settings) {
    return null // Pas de paramètres de cotisation configurés
  }

  if (hasPaid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="text-green-600 text-2xl">✅</div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Cotisation payée !</h3>
            <p className="text-sm text-green-700">
              Merci pour votre soutien au festival pour l'année {settings.year}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Soutenez le Festival</h3>
          <p className="text-sm text-gray-600">
            Adhérez au festival pour {settings.year} et soutenez nos activités
          </p>
        </div>
        <div className="text-2xl">🎬</div>
      </div>

      <div className="space-y-4">
        <div className="bg-white/70 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{settings.amount}€</div>
              <div className="text-sm text-gray-600">Cotisation {settings.year}</div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>✨ Avantages exclusifs</div>
              <div>🎪 Soutien au festival</div>
              <div>📧 Newsletter privilégiée</div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <div className="text-amber-600">ℹ️</div>
            <div>
              <p className="text-sm text-amber-800">
                <strong>Cotisation facultative</strong> - Vous pouvez participer aux missions sans adhérer. 
                Cette cotisation nous aide simplement à organiser de meilleurs événements !
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 font-medium"
        >
          {isLoading ? 'Redirection vers le paiement...' : `Payer ${settings.amount}€ en ligne`}
        </button>

        {message && (
          <div className="p-3 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200">
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          Paiement sécurisé par Stripe • Aucune donnée bancaire stockée
        </div>
      </div>
    </div>
  )
} 