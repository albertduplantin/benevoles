'use client'

import { useState, useRef } from 'react'
import type { UserProfile } from '@/lib/types'

interface CreateMissionFormProps {
    onMissionCreated: (formData: FormData) => Promise<string | undefined>;
    users?: UserProfile[] | null;
}

export default function CreateMissionForm({ onMissionCreated, users }: CreateMissionFormProps) {
    const [message, setMessage] = useState<string | undefined>('')
    // Checkbox "Mission sans date" (au long cours)
    const [isLongTerm, setIsLongTerm] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        setMessage('Création en cours...');
        const result = await onMissionCreated(formData);
        setMessage(result);

        if (result?.startsWith('Succès') && formRef.current) {
            formRef.current.reset();
        }
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 mt-6 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Créer une nouvelle mission</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Mission long terme */}
                <div className="md:col-span-2">
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            name="long_term"
                            id="long_term"
                            className="h-4 w-4 text-blue-600"
                            checked={isLongTerm}
                            onChange={() => setIsLongTerm(!isLongTerm)}
                        />
                        <span className="ml-2 text-sm text-gray-700">Mission sans date (long terme)</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Si cochée, cette mission n'apparaîtra pas dans le planning et sera affichée sans date.</p>
                </div>
                {/* Urgent */}
                <div>
                    <label className="inline-flex items-center mt-1">
                        <input type="checkbox" name="is_urgent" className="h-4 w-4 text-red-600" />
                        <span className="ml-2 text-sm text-red-700 font-semibold">Marquer comme Urgent</span>
                    </label>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre</label>
                    <input type="text" name="title" id="title" required className="w-full mt-1 border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" id="description" rows={3} className="w-full mt-1 border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Lieu</label>
                    <input type="text" name="location" id="location" required className="w-full mt-1 border-gray-300 rounded-md shadow-sm"/>
                </div>
                 <div>
                    <label htmlFor="max_volunteers" className="block text-sm font-medium text-gray-700">Bénévoles max</label>
                    <input type="number" name="max_volunteers" id="max_volunteers" required min="1" className="w-full mt-1 border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="manager_id" className="block text-sm font-medium text-gray-700">Responsable (optionnel)</label>
                    <select name="manager_id" id="manager_id" className="w-full mt-1 border-gray-300 rounded-md shadow-sm">
                        <option value="">Aucun responsable assigné</option>
                        {users?.filter(user => user.role === 'responsable' || user.role === 'admin').map(user => (
                            <option key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} ({user.role})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">Date et heure de début</label>
                    <input
                        type="datetime-local"
                        name="start_time"
                        id="start_time"
                        required={!isLongTerm}
                        disabled={isLongTerm}
                        className="w-full mt-1 border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                    />
                </div>
                <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">Date et heure de fin</label>
                    <input
                        type="datetime-local"
                        name="end_time"
                        id="end_time"
                        required={!isLongTerm}
                        disabled={isLongTerm}
                        className="w-full mt-1 border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                    />
                </div>
            </div>
            <div className="mt-6 text-right">
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Créer la mission
                </button>
            </div>
            {message && <p className="mt-4 text-sm text-center">{message}</p>}
        </form>
    )
} 