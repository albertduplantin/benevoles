export default function AuthErrorPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur d'authentification</h1>
                <p className="text-gray-700">
                    Un problème est survenu lors de la tentative de connexion.
                </p>
                <p className="text-gray-700 mt-2">
                    Veuillez réessayer ou contacter le support si le problème persiste.
                </p>
            </div>
        </div>
    )
} 