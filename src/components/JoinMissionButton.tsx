'use client'

import { useState } from 'react'

interface JoinMissionButtonProps {
    userId: string | undefined;
    isUserInscribed: boolean;
    isMissionFull: boolean;
    handleJoin: () => Promise<string | undefined>;
    handleLeave: () => Promise<string | undefined>;
}

export default function JoinMissionButton({
    userId,
    isUserInscribed,
    isMissionFull,
    handleJoin,
    handleLeave,
}: JoinMissionButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')

    const onJoin = async () => {
        setIsLoading(true)
        setMessage('')
        const result = await handleJoin();
        if (result) {
            setMessage(result)
        }
        setIsLoading(false)
    }

    const onLeave = async () => {
        setIsLoading(true)
        setMessage('')
        const result = await handleLeave();
        if (result) {
            setMessage(result)
        }
        setIsLoading(false)
    }

    if (!userId) return null

    if (isUserInscribed) {
        return (
            <div className="mt-6 text-center">
                <button
                    onClick={onLeave}
                    disabled={isLoading}
                    className="w-full px-6 py-3 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Chargement...' : 'Se désinscrire de la mission'}
                </button>
                {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
            </div>
        )
    }

    if (isMissionFull) {
        return (
            <div className="mt-6 text-center">
                <button
                    disabled
                    className="w-full px-6 py-3 font-semibold text-white bg-gray-500 rounded-md cursor-not-allowed"
                >
                    Mission complète
                </button>
            </div>
        )
    }

    return (
        <div className="mt-6 text-center">
            <button
                onClick={onJoin}
                disabled={isLoading}
                className="w-full px-6 py-3 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
                {isLoading ? 'Chargement...' : 'Participer à la mission'}
            </button>
            {message && <p className="mt-2 text-sm text-green-500">{message}</p>}
        </div>
    )
} 