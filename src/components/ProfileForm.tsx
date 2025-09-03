'use client'

import { useState, useRef, useEffect } from 'react'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'
import { Skeleton } from '@/components/ui/Skeleton'

interface ProfileFormProps {
  userProfile: UserProfile | null;
}

export default function ProfileForm({ userProfile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Initialiser l'avatar URL au chargement du composant
  useEffect(() => {
    if (userProfile?.avatar_url) {
      setAvatarUrl(userProfile.avatar_url)
    }
  }, [userProfile])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Vérifier le format de fichier (plus spécifique)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setMessage('Format non supporté. Veuillez utiliser JPG, PNG ou WebP.')
        return
      }

      // Limiter la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('La taille de l\'image ne doit pas dépasser 5 MB.')
        return
      }

      // Vérifier la résolution minimum
      const img = new Image()
      const imagePromise = new Promise<void>((resolve, reject) => {
        img.onload = () => {
          if (img.width < 200 || img.height < 200) {
            reject(new Error('La résolution de l\'image doit être d\'au moins 200x200 pixels.'))
          } else {
            resolve()
          }
        }
        img.onerror = () => reject(new Error('Impossible de lire l\'image.'))
      })
      
      img.src = URL.createObjectURL(file)
      await imagePromise
      URL.revokeObjectURL(img.src)

      // Upload vers Supabase Storage avec la structure attendue par la politique
      const fileExt = file.name.split('.').pop()
      const fileName = `${userProfile?.id}.${fileExt}`
      
      console.log('Uploading to:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // Si le bucket n'existe pas encore, on affiche un message informatif
        if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
          setMessage('Fonctionnalité de photo de profil en cours de configuration. Revenez bientôt !')
        } else if (uploadError.message.includes('row-level security')) {
          setMessage('Erreur de permissions. Vérifiez la configuration des politiques Storage.')
        } else {
          setMessage(`Erreur d'upload: ${uploadError.message}`)
        }
        return
      }

      console.log('Upload successful:', uploadData)

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)
      setAvatarUrl(publicUrl)
      setMessage('Photo uploadée avec succès ! N\'oubliez pas de cliquer sur Sauvegarder.')
    } catch (error) {
      console.error('Erreur upload:', error)
      setMessage(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setMessage('')

    try {
      const updates = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        phone: formData.get('phone') as string,
        accepts_contact_sharing: formData.get('accepts_contact_sharing') === 'on',
        avatar_url: avatarUrl, // Sauvegarder l'URL de l'avatar
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userProfile?.id)

      if (error) throw error

      setMessage('Profil mis à jour avec succès !')
      // Refresh la page après 2 secondes
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      console.error('Erreur:', error)
      setMessage('Erreur lors de la mise à jour')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
      <form action={handleSubmit} className="space-y-6">
        {/* Photo de profil */}
        <div className="flex items-center space-x-6">
          <div className="relative">
                         <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
               {avatarUrl ? (
                 <NextImage
                   src={avatarUrl}
                   alt="Photo de profil"
                   width={96}
                   height={96}
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <span className="text-white text-2xl font-bold">
                   {userProfile?.first_name?.[0] || userProfile?.last_name?.[0] || '?'}
                 </span>
               )}
             </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center"
            >
              {isUploading ? <ButtonSpinner size="sm" /> : '📷'}
            </button>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Photo de profil</h3>
            <p className="text-sm text-gray-600 mb-2">
              Ajoutez une photo pour personnaliser votre profil (recommandé)
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium">Format conseillé :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Format carré (1:1) ou portrait</li>
                <li>Résolution minimum : 200x200 pixels</li>
                <li>Formats acceptés : JPG, PNG, WebP</li>
                <li>Taille maximale : 5 MB</li>
                <li>Photo de bonne qualité avec votre visage bien visible</li>
              </ul>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
              Prénom *
            </label>
            <input
              type="text"
              name="first_name"
              id="first_name"
              defaultValue={userProfile?.first_name || ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom *
            </label>
            <input
              type="text"
              name="last_name"
              id="last_name"
              defaultValue={userProfile?.last_name || ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            defaultValue={userProfile?.phone || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="06 12 34 56 78"
          />
        </div>

        {/* Préférences */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Préférences</h4>
          <div className="flex items-center">
            <input
              id="accepts_contact_sharing"
              name="accepts_contact_sharing"
              type="checkbox"
              defaultChecked={userProfile?.accepts_contact_sharing}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="accepts_contact_sharing" className="ml-3 text-sm text-gray-700">
              J'accepte que mes coordonnées soient partagées avec les autres bénévoles de mes missions
            </label>
          </div>
        </div>

        {/* Informations du compte */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informations du compte</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Rôle :</span>
                <span className="ml-2 text-gray-600 capitalize">{userProfile?.role}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Dernière mise à jour :</span>
                <span className="ml-2 text-gray-600">
                  {userProfile?.updated_at 
                    ? new Date(userProfile.updated_at).toLocaleDateString('fr-FR')
                    : 'Jamais'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
          >
            {isLoading && <ButtonSpinner size="sm" />}
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
      </form>
    </div>
  )
} 