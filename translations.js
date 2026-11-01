/* English remains in the HTML so the page works without JavaScript. */
(() => {
  const translations = {
    '.skip-link': 'Aller au contenu',
    '.site-nav a': ['Expérience', 'Compétences', 'À propos', 'Contact'],
    '.header-cta': 'Courriel',
    '.hero-kicker': 'Développeur logiciel II chez Genetec · Canada',
    '#hero-title': 'Développeur .NET full-stack créant des <em>logiciels d’entreprise</em> <em>en production.</em>',
    '.hero-copy': 'Chez Genetec, je développe des logiciels de contrôle d’accès : services C# / .NET, interfaces React / TypeScript, Azure, CI/CD et tests automatisés, avec des résultats mesurables en sécurité et en fiabilité.',
    '.hero-actions a:first-child, .contact-actions a:first-child': 'Écrire à Nick',
    '.proof-strip li > span': ['de tests de livraison en moins', 'place au hackathon de l’entreprise', 'd’empreinte mémoire en moins', 'de builds Azure CI/CD plus rapides'],
    '.proof-strip li:nth-child(2) .unit': 're',
    '.scroll-cue-label': 'Défiler',
    '.section-index .label': ['Expérience', 'Compétences', 'À propos', 'Contact'],
    '#experience-title': 'Logiciels en production, CI/CD, automatisation des tests et mentorat.',
    '#experience .section-heading > p:last-child': 'Chez Genetec, je travaille sur les services .NET, les interfaces React / TypeScript, les pipelines Azure, les revues de sécurité et les tests automatisés de logiciels de contrôle d’accès en production.',
    '.experience-meta h3': ['Développeur logiciel II', 'Développeur logiciel'],
    '.experience-meta .period': ['janv. 2026 - aujourd’hui', 'juin 2024 - janv. 2026'],
    '.experience-row:first-child .lede-list li > span:last-child': [
      'Développement et maintenance de logiciels de contrôle d’accès en C#/.NET et React utilisés par des entreprises du Fortune 500.',
      'Réduction de <strong>50 %</strong> du temps de build Azure CI/CD grâce à des corrections de pipelines et à des améliorations de fiabilité.',
      'Direction de l’optimisation des tests de régression assistée par IA, réduisant de <strong>60 %</strong> le volume de tests de livraison.',
      'Refonte de scénarios de tests automatisés fragiles, rendant certaines exécutions <strong>jusqu’à 50 %</strong> plus rapides et plus stables.',
      'Présentation régulière de techniques pratiques d’IA, notamment l’utilisation efficace des jetons, à <strong>plus de 30</strong> membres des équipes de R&amp;D.',
      'Mentorat de <strong>6</strong> développeurs juniors et stagiaires lors de leur intégration, des revues de code et de l’accompagnement technique quotidien.',
      'Obtention de la <strong>1re place</strong> à une compétition de cybersécurité de type capture du drapeau.'
    ],
    '.experience-row:nth-child(2) .lede-list li > span:last-child': [
      'Obtention de la <strong>1re place</strong> à un hackathon d’entreprise avec un projet qui a influencé la feuille de route du produit.',
      'Réduction de <strong>40 %</strong> de l’empreinte mémoire d’une application embarquée, résolvant un problème critique de mémoire en production.',
      'Découverte de <strong>5</strong> vulnérabilités grâce aux revues de code et aux évaluations de sécurité.',
      'Diagnostic et résolution de <strong>plus de 10</strong> bogues de production signalés par les clients, en collaboration avec les équipes en contact avec eux.'
    ],
    '#skills-title': 'Les technologies que j’utilise.',
    '#skills .section-heading > p:last-child': 'Développement backend et frontend, infonuagique, données, qualité et pratiques d’équipe pour créer des logiciels sécurisés de bout en bout.',
    '.skills-group summary': ['Backend', 'Frontend', 'Données', 'Infonuagique et DevOps', 'Qualité', 'Méthodes de travail'],
    '.skills-group:nth-child(2) .chip:last-child': 'Interfaces accessibles',
    '.skills-group:nth-child(3) .chip:nth-last-child(2)': 'Conception de requêtes',
    '.skills-group:nth-child(3) .chip:last-child': 'Mise en cache',
    '.skills-group:nth-child(4) .chip:last-child': 'Pipelines CI/CD',
    '.skills-group:nth-child(5) .chip': ['Tests unitaires', 'Tests d’intégration', 'Tests de bout en bout', 'Revues de code', 'Évaluation de sécurité', 'Optimisation des performances'],
    '.skills-group:nth-child(6) .chip': ['Mentorat', 'Priorisation', 'Communication interéquipes', 'Scrum', 'Kanban'],
    '#about-title': 'Développeur .NET capable de livrer des fonctionnalités de bout en bout.',
    '.about-intro > p:last-child': 'Je crée des services C#/.NET, améliore le CI/CD Azure et rends les tests automatisés plus rapides et plus fiables. Je travaille aussi avec React et TypeScript pour les interfaces, au sein d’équipes anglophones et francophones.',
    '.about-panel div > span': ['Formation', 'Résultats scolaires', 'Langues'],
    '.about-panel div > strong': ['Baccalauréat en informatique', 'Moyenne de 3,99 / 4,00', 'Anglais et français'],
    '.about-panel div > p': ['Université Ferdowsi, spécialisation en génie logiciel. Juillet 2023.', 'Premier de ma promotion selon la moyenne.', 'Maîtrise de l’anglais et du français.'],
    '#contact-title': 'Restons en contact.',
    '.contact-copy > p:not(.copy-status)': 'Développeur .NET full-stack au Canada, je me concentre sur les logiciels d’entreprise, les systèmes backend, React, le CI/CD et l’automatisation des tests.',
    '[data-copy-email]': 'Copier le courriel',
    '.site-footer p:last-child': 'Développeur logiciel II · Canada'
  };

  const entries = Object.entries(translations).flatMap(([selector, french]) =>
    [...document.querySelectorAll(selector)].map((element, index) => ({
      element,
      en: element.innerHTML,
      fr: Array.isArray(french) ? french[index] : french
    }))
  );
  const button = document.querySelector('[data-language-toggle]');
  let language = 'en';
  try { language = localStorage.getItem('language') === 'fr' ? 'fr' : 'en'; } catch (_) { /* Storage is optional. */ }

  function setLanguage(next) {
    language = next;
    document.documentElement.lang = language;
    entries.forEach(({ element, en, fr }) => { element.innerHTML = language === 'fr' ? fr : en; });
    button.textContent = language === 'en' ? 'FR' : 'EN';
    button.lang = language === 'en' ? 'fr' : 'en';
    button.setAttribute('aria-label', language === 'en' ? 'Passer en français' : 'Switch to English');
    document.querySelector('.site-nav').setAttribute('aria-label', language === 'fr' ? 'Navigation principale' : 'Primary navigation');
    document.querySelector('.nav-toggle').setAttribute('aria-label', language === 'fr' ? 'Afficher ou masquer la navigation' : 'Toggle navigation');
    document.querySelector('.brand').setAttribute('aria-label', language === 'fr' ? 'Nick Moein, accueil' : 'Nick Moein home');
    document.querySelector('.proof-strip').setAttribute('aria-label', language === 'fr' ? 'Résultats mesurables' : 'Measured results');
    document.querySelector('.contact-links').setAttribute('aria-label', language === 'fr' ? 'Liens vers les profils' : 'Profile links');
    const status = document.querySelector('[data-copy-status]');
    status.textContent = '';
    status.classList.remove('is-shown');
    try { localStorage.setItem('language', language); } catch (_) { /* Storage is optional. */ }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  button.addEventListener('click', () => setLanguage(language === 'en' ? 'fr' : 'en'));
  if (language === 'fr') setLanguage(language);
})();
