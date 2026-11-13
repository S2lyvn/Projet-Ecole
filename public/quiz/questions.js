// Questions du quiz (document du groupe « Quizz et questions »). Partagé par le quiz et la page de résultats.
// Les libellés sont enregistrés tels quels dans le Google Sheet : les changer en cours de collecte sépare les réponses.
window.QUIZ_QUESTIONS = [
  {
    key: 'taille',
    type: 'single',
    title: 'Quelle est la taille de ton armoire ?',
    short: 'Taille de l’armoire',
    options: ['Moins de 30 pièces', '30 à 60 pièces', '61 à 100 pièces', 'Plus de 100 pièces'],
  },
  {
    key: 'part_portee',
    type: 'single',
    title: 'Selon toi, quelle part de tes pièces portes-tu vraiment ?',
    short: 'Part des pièces vraiment portées',
    options: ['Plus de 80 %', '60 à 80 %', '40 à 60 %', 'Moins de 40 %'],
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
  },
  {
    key: 'valeur',
    type: 'single',
    title: 'À combien estimes-tu la valeur de tes pièces peu ou pas utilisées ?',
    short: 'Valeur estimée des pièces qui dorment',
    hint: 'Une estimation simple et rapide suffit !',
    options: ['Moins de 100 €', '100 à 300 €', '300 à 600 €', 'Plus de 600 €'],
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
  },
]

window.QUIZ_INTEREST = {
  key: 'interet',
  title: 'Une appli qui t’aide à faire tout ça, tu l’utiliserais ?',
  short: 'Intérêt pour DeepIN Armour',
  options: ['Oui, carrément', 'Peut-être', 'Non merci'],
}
