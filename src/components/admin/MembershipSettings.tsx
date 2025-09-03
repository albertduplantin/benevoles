'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MembershipSetting } from '@/lib/types'

export default function MembershipSettings() {
  const [settings, setSettings] = useState<MembershipSetting | null>(null)
  const [amount, setAmount] = useState(20)
  const [year, setYear] = useState(new Date().getFullYear())
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadCurrentSettings()
  }, [])

  const loadCurrentSettings = async () => {
    const currentYear = new Date().getFullYear()
    const { data } = await supabase
      .from('membership_settings')
      .select('*')
      .eq('year', currentYear)
      .single()

    if (data) {
      setSettings(data)
      setAmount(data.amount)
      setYear(data.year)
    } else {
      // Créer les paramètres par défaut pour l'année courante
      const { data: newSettings, error } = await supabase
        .from('membership_settings')
        .insert({
          year: currentYear,
          amount: 20
        })
        .select()
        .single()
      
      if (newSettings && !error) {
        setSettings(newSettings)
        setAmount(newSettings.amount)
        setYear(newSettings.year)
      }
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      if (settings) {
        // Mettre à jour les paramètres existants
        const { error } = await supabase
          .from('membership_settings')
          .update({
            amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)

        if (error) throw error
      } else {
        // Créer de nouveaux paramètres
        const { data, error } = await supabase
          .from('membership_settings')
          .insert({
            year,
            amount
          })
          .select()
          .single()

        if (error) throw error
        setSettings(data)
      }

      setMessage('Paramètres de cotisation mis à jour avec succès !')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Erreur:', error)
      setMessage('Erreur lors de la mise à jour')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Paramètres de cotisation</h3>
          <p className="text-sm text-gray-600">Gérez le montant de la cotisation annuelle</p>
        </div>
        <div className="text-2xl">💰</div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Année
            </label>
            <input
              type="number"
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min="2024"
              max="2030"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              style={{ colorScheme: 'light' }}
            />
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Montant (€)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-lg">ℹ️</div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">À propos de la cotisation</h4>
              <p className="text-sm text-blue-700">
                La cotisation est facultative et permet aux bénévoles de soutenir le festival. 
                Elle donne accès à des avantages exclusifs et aide au financement des activités.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('succès')
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
} 