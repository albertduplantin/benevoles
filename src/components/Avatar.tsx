import React from 'react';

interface AvatarProps {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  firstName, 
  lastName, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm', 
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  // Générer une couleur de fond basée sur le nom pour la cohérence
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const backgroundColor = getBackgroundColor(firstName + lastName);

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${backgroundColor} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-medium 
        ${className}
      `}
    >
      {initials}
    </div>
  );
};

export default Avatar; 