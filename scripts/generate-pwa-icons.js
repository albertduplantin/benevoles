// Script pour générer les icônes PWA
// Ce script utilise le logo SVG existant pour créer les icônes PNG

const fs = require('fs')
const path = require('path')

// Configuration des tailles d'icônes PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Template SVG pour les icônes PWA
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fond avec coins arrondis -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" ry="${size * 0.2}" fill="url(#gradient)"/>
  
  <!-- Icône film -->
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.6}" height="${size * 0.6}" rx="${size * 0.05}" fill="white" opacity="0.9"/>
    
    <!-- Détails du film -->
    <rect x="${size * 0.2}" y="${size * 0.25}" width="${size * 0.1}" height="${size * 0.5}" fill="url(#gradient)"/>
    <rect x="${size * 0.35}" y="${size * 0.25}" width="${size * 0.1}" height="${size * 0.5}" fill="url(#gradient)"/>
    <rect x="${size * 0.5}" y="${size * 0.25}" width="${size * 0.1}" height="${size * 0.5}" fill="url(#gradient)"/>
    
    <!-- Titre -->
    <text x="${size * 0.5}" y="${size * 0.8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold" fill="white">FESTIVAL</text>
  </g>
</svg>
`

// Créer les fichiers SVG
iconSizes.forEach(size => {
  const svgContent = createIconSVG(size)
  const filename = `icon-${size}x${size}.svg`
  const filepath = path.join(__dirname, '..', 'public', 'icons', filename)
  
  fs.writeFileSync(filepath, svgContent)
  console.log(`✅ Icône SVG créée: ${filename}`)
})

// Créer un fichier de fallback PNG simple (base64)
const createFallbackPNG = (size) => {
  // Pour l'instant, on crée juste un fichier SVG
  // En production, il faudrait utiliser une librairie comme sharp ou canvas
  return createIconSVG(size)
}

// Créer les icônes de raccourcis
const shortcutIcons = [
  { name: 'shortcut-missions', label: 'Missions' },
  { name: 'shortcut-planning', label: 'Planning' },
  { name: 'shortcut-profile', label: 'Profil' }
]

shortcutIcons.forEach(({ name, label }) => {
  const svgContent = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="96" height="96" rx="20" ry="20" fill="url(#gradient)"/>
  
  <text x="48" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">${label}</text>
</svg>
`
  
  const filepath = path.join(__dirname, '..', 'public', 'icons', `${name}.svg`)
  fs.writeFileSync(filepath, svgContent)
  console.log(`✅ Icône de raccourci créée: ${name}.svg`)
})

console.log('🎬 Toutes les icônes PWA ont été générées!')
console.log('📝 Note: Pour une production complète, convertissez les SVG en PNG avec des outils comme sharp ou canvas')
