// Questions du quiz (document du groupe « Quizz et questions »). Partagé par le quiz et la page de résultats.
// Les libellés français sont enregistrés tels quels dans le Google Sheet, quelle que soit la langue choisie :
// les changer en cours de collecte sépare les réponses. La version anglaise (« en ») sert seulement à l'affichage,
// et ses options doivent rester dans le même ordre que les options françaises.
window.QUIZ_QUESTIONS = [
  {
    key: 'taille',
    type: 'single',
    title: 'Quelle est la taille de ton armoire ?',
    short: 'Taille de l’armoire',
    options: ['Moins de 30 pièces', '30 à 60 pièces', '61 à 100 pièces', 'Plus de 100 pièces'],
    en: {
      title: 'How big is your wardrobe?',
      options: ['Fewer than 30 pieces', '30 to 60 pieces', '61 to 100 pieces', 'More than 100 pieces'],
    },
  },
  {
    key: 'part_portee',
    type: 'single',
    title: 'Selon toi, quelle part de tes pièces portes-tu vraiment ?',
    short: 'Part des pièces vraiment portées',
    options: ['Plus de 80 %', '60 à 80 %', '40 à 60 %', 'Moins de 40 %'],
    en: {
      title: 'In your opinion, what share of your pieces do you really wear?',
      options: ['More than 80%', '60 to 80%', '40 to 60%', 'Less than 40%'],
    },
  },
  {
    key: 'raisons',
    type: 'multi',
    title: 'Pourquoi certaines pièces ne sont-elles pas ou peu utilisées ?',
    short: 'Pourquoi des pièces dorment',
    hint: 'Plusieurs choix possibles',
    options: [
      'Pas visibles / oubliées',
      'À réparer',
      'Achetées pour une occasion spécifique',
      'Plus à mon goût ou à ma taille',
      'Je veux les donner / les échanger',
      'Valeur sentimentale (je veux les garder)',
    ],
    en: {
      title: 'Why are some of your pieces rarely or never worn?',
      hint: 'Several answers possible',
      options: [
        'Not visible / forgotten',
        'They need repairing',
        'Bought for a specific occasion',
        'No longer my style or size',
        'I want to give them away / swap them',
        'Sentimental value (I want to keep them)',
      ],
    },
  },
  {
    key: 'valeur',
    type: 'single',
    title: 'À combien estimes-tu la valeur de tes pièces peu ou pas utilisées ?',
    short: 'Valeur estimée des pièces qui dorment',
    hint: 'Une estimation simple et rapide suffit !',
    options: ['Moins de 100 €', '100 à 300 €', '300 à 600 €', 'Plus de 600 €'],
    en: {
      title: 'How much do you think your rarely or never worn pieces are worth?',
      hint: 'A quick, rough estimate is enough!',
      options: ['Less than €100', '€100 to €300', '€300 to €600', 'More than €600'],
    },
  },
  {
    key: 'habitudes',
    type: 'counters',
    title: 'Tes habitudes d’aujourd’hui',
    short: 'Habitudes (6 derniers mois, moyenne)',
    hint: 'Sur les 6 derniers mois',
    items: [
      ['achats_neufs', 'Achats neufs'],
      ['echanges_prets', 'Échanges / prêts'],
      ['reparations', 'Réparations'],
      ['dons', 'Dons / transmissions'],
    ],
    en: {
      title: 'Your current habits',
      hint: 'Over the last 6 months',
      items: ['New purchases', 'Swaps / loans', 'Repairs', 'Donations / hand-me-downs'],
    },
  },
  {
    key: 'communaute',
    type: 'multi',
    title: 'Et demain, au sein d’une communauté, comment aimerais-tu redonner de la valeur à tes vêtements ?',
    short: 'Revaloriser ses vêtements en communauté',
    hint: 'Plusieurs choix possibles',
    options: [
      'Les échanger contre d’autres pièces',
      'Les prêter ou en emprunter pour une occasion',
      'Les donner à quelqu’un près de chez moi',
      'Les faire réparer ou retoucher par un artisan local',
      'Les vendre à d’autres membres',
      'Rien de tout ça, je préfère les garder',
    ],
    // Cette réponse décoche les autres (et inversement).
    exclusive: 'Rien de tout ça, je préfère les garder',
    en: {
      title: 'And tomorrow, within a community, how would you like to give your clothes new value?',
      hint: 'Several answers possible',
      options: [
        'Swap them for other pieces',
        'Lend them, or borrow pieces for an occasion',
        'Give them to someone near me',
        'Have them repaired or altered by a local craftsperson',
        'Sell them to other members',
        'None of these, I’d rather keep them',
      ],
    },
  },
]

window.QUIZ_INTEREST = {
  key: 'interet',
  title: 'Une appli qui t’aide à faire tout ça, tu l’utiliserais ?',
  short: 'Intérêt pour DeepIN Armour',
  options: ['Oui, carrément', 'Peut-être', 'Non merci'],
  en: {
    title: 'Would you use an app that helps you do all this?',
    options: ['Yes, definitely', 'Maybe', 'No thanks'],
  },
}
