// Traduction des messages d'erreur techniques en messages utilisateur conviviaux

export interface ErrorMessage {
  message: string;
  type: 'error' | 'warning' | 'info';
  icon?: string;
}

export function translateAuthError(error: any): ErrorMessage {
  if (!error || !error.message) {
    return {
      message: "Une erreur inattendue s'est produite. Veuillez réessayer.",
      type: 'error',
      icon: '⚠️'
    };
  }

  const errorMessage = error.message.toLowerCase();

  // Erreurs de connexion
  if (errorMessage.includes('invalid login credentials') || 
      errorMessage.includes('invalid credentials')) {
    return {
      message: "Email ou mot de passe incorrect. Vérifiez vos identifiants.",
      type: 'error',
      icon: '🔐'
    };
  }

  if (errorMessage.includes('email not confirmed')) {
    return {
      message: "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.",
      type: 'warning',
      icon: '📧'
    };
  }

  if (errorMessage.includes('too many requests')) {
    return {
      message: "Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.",
      type: 'warning',
      icon: '⏰'
    };
  }

  // Erreurs d'inscription
  if (errorMessage.includes('user already registered')) {
    return {
      message: "Un compte existe déjà avec cette adresse email. Essayez de vous connecter ou utilisez un autre email.",
      type: 'warning',
      icon: '👤'
    };
  }

  if (errorMessage.includes('password should be at least')) {
    return {
      message: "Le mot de passe doit contenir au moins 6 caractères.",
      type: 'error',
      icon: '🔒'
    };
  }

  if (errorMessage.includes('invalid email')) {
    return {
      message: "Veuillez saisir une adresse email valide.",
      type: 'error',
      icon: '📧'
    };
  }

  // Erreurs OAuth
  if (errorMessage.includes('oauth')) {
    return {
      message: "Erreur lors de la connexion avec Google. Veuillez réessayer ou utiliser l'inscription classique.",
      type: 'error',
      icon: '🔗'
    };
  }

  // Erreurs de réseau
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      message: "Problème de connexion internet. Vérifiez votre connexion et réessayez.",
      type: 'error',
      icon: '🌐'
    };
  }

  // Erreurs de profil
  if (errorMessage.includes('phone')) {
    return {
      message: "Veuillez saisir un numéro de téléphone valide.",
      type: 'error',
      icon: '📱'
    };
  }

  // Erreurs de mission
  if (errorMessage.includes('mission')) {
    return {
      message: "Erreur lors de la gestion de la mission. Veuillez réessayer.",
      type: 'error',
      icon: '🎯'
    };
  }

  // Erreurs de permissions
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return {
      message: "Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
      type: 'error',
      icon: '🚫'
    };
  }

  // Erreurs de base de données
  if (errorMessage.includes('database') || errorMessage.includes('constraint')) {
    return {
      message: "Erreur de données. Veuillez réessayer dans quelques instants.",
      type: 'error',
      icon: '💾'
    };
  }

  // Message par défaut pour les erreurs non reconnues
  return {
    message: "Une erreur s'est produite. Veuillez réessayer ou contacter le support si le problème persiste.",
    type: 'error',
    icon: '❌'
  };
}

export function translateFormError(field: string, error: any): ErrorMessage {
  if (!error || !error.message) {
    return {
      message: `Erreur dans le champ ${field}.`,
      type: 'error',
      icon: '⚠️'
    };
  }

  const errorMessage = error.message.toLowerCase();

  // Erreurs de validation
  if (errorMessage.includes('required')) {
    return {
      message: `Le champ ${field} est obligatoire.`,
      type: 'error',
      icon: '📝'
    };
  }

  if (errorMessage.includes('invalid')) {
    return {
      message: `Le format du champ ${field} n'est pas valide.`,
      type: 'error',
      icon: '📝'
    };
  }

  if (errorMessage.includes('too short')) {
    return {
      message: `Le champ ${field} est trop court.`,
      type: 'error',
      icon: '📝'
    };
  }

  if (errorMessage.includes('too long')) {
    return {
      message: `Le champ ${field} est trop long.`,
      type: 'error',
      icon: '📝'
    };
  }

  return translateAuthError(error);
}

// Messages de succès
export const successMessages = {
  login: {
    message: "Connexion réussie ! Redirection en cours...",
    type: 'info' as const,
    icon: '✅'
  },
  signup: {
    message: "Inscription réussie ! Vérifiez vos emails pour confirmer votre compte.",
    type: 'info' as const,
    icon: '🎉'
  },
  profileUpdate: {
    message: "Profil mis à jour avec succès !",
    type: 'info' as const,
    icon: '✅'
  },
  missionCreated: {
    message: "Mission créée avec succès !",
    type: 'info' as const,
    icon: '🎯'
  },
  missionUpdated: {
    message: "Mission mise à jour avec succès !",
    type: 'info' as const,
    icon: '✅'
  },
  missionDeleted: {
    message: "Mission supprimée avec succès !",
    type: 'info' as const,
    icon: '🗑️'
  },
  userCreated: {
    message: "Utilisateur créé avec succès !",
    type: 'info' as const,
    icon: '👤'
  },
  subscriptionPaid: {
    message: "Cotisation payée avec succès ! Merci pour votre soutien.",
    type: 'info' as const,
    icon: '💳'
  }
};
