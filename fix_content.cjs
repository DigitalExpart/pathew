const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const languages = ['en', 'fr', 'de', 'es'];

const patches = {
  en: {
    landing: {
      badge: "Powered by Pathew Assistant",
      heroTitle: "Apply for Your Next ",
      heroTitleHighlight: "Opportunity",
      heroTitleEnd: " with Precision.",
      heroSubtitle: "Build a professional CV, generate tailored cover letters and create winning proposals in minutes",
      footer: {
        tagline: "Assistant-powered career guidance for ambitious professionals."
      }
    },
    dashboard: {
      aiAssistant: "Pathew Assistant"
    },
    pricing: {
      features: [
        "View live job & grant opportunities",
        "Percentage readiness score per application",
        "Assistant-generated preparation plan – credit applies"
      ]
    },
    howItWorks: {
      team: {
        desc2: "Product strategist focused on building intuitive Assistant tools that empower professional growth."
      }
    }
  },
  fr: {
    landing: {
      badge: "Propulsé par l'Assistant Pathew",
      heroTitle: "Postulez à votre prochaine ",
      heroTitleHighlight: "opportunité",
      heroTitleEnd: " avec précision.",
      heroSubtitle: "La plateforme ultime pour les professionnels pour trouver, faire correspondre et postuler à des opportunités mondiales à fort impact. Arrêtez de chercher, commencez à faire correspondre avec l'Assistant Pathew.",
      footer: {
        tagline: "Une orientation professionnelle propulsée par l'Assistant pour les professionnels ambitieux."
      }
    },
    dashboard: {
      aiAssistant: "Assistant Pathew"
    },
    pricing: {
      features: [
        "Voir les offres d'emploi et les subventions en direct",
        "Score d'état de préparation en pourcentage par candidature",
        "Plan de préparation généré par l'Assistant - des crédits s'appliquent"
      ]
    },
    howItWorks: {
      team: {
        desc2: "Stratège produit concentré sur la création d'outils d'Assistant intuitifs qui favorisent la croissance professionnelle."
      }
    }
  },
  de: {
    landing: {
      badge: "Unterstützt von Pathew Assistant",
      heroTitle: "Bewerben Sie sich auf Ihre nächste ",
      heroTitleHighlight: "Gelegenheit",
      heroTitleEnd: " mit Präzision.",
      heroSubtitle: "Die ultimative Plattform für Fachleute, um weltweit hochwirksame Möglichkeiten zu finden, abzugleichen und sich zu bewerben. Hören Sie auf zu suchen, beginnen Sie mit dem Matching durch den Pathew Assistant.",
      footer: {
        tagline: "Vom Assistenten unterstützte Karriereberatung für ehrgeizige Fachleute."
      }
    },
    dashboard: {
      aiAssistant: "Pathew Assistant"
    },
    pricing: {
      features: [
        "Aktuelle Job- & Fördermöglichkeiten ansehen",
        "Prozentualer Bereitschaftsscore pro Bewerbung",
        "Vom Assistenten generierter Vorbereitungsplan – Gutschrift gilt"
      ]
    },
    howItWorks: {
      team: {
        desc2: "Produktstratege mit Fokus auf die Entwicklung intuitiver Assistant-Tools, die das berufliche Wachstum fördern."
      }
    }
  },
  es: {
    landing: {
      badge: "Desarrollado por el Asistente Pathew",
      heroTitle: "Solicita tu próxima ",
      heroTitleHighlight: "oportunidad",
      heroTitleEnd: " con precisión.",
      heroSubtitle: "La plataforma definitiva para profesionales para encontrar, emparejar y solicitar oportunidades de alto impacto en todo el mundo. Deja de buscar, comienza a emparejar con el Asistente Pathew.",
      footer: {
        tagline: "Orientación profesional impulsada por Asistente para profesionales ambiciosos."
      }
    },
    dashboard: {
      aiAssistant: "Asistente Pathew"
    },
    pricing: {
      features: [
        "Ver oportunidades de trabajo y subvenciones en vivo",
        "Puntuación de preparación porcentual por solicitud",
        "Plan de preparación generado por el Asistente - se aplican créditos"
      ]
    },
    howItWorks: {
      team: {
        desc2: "Estratega de productos enfocado en la creación de herramientas de Asistente intuitivas que empoderen el crecimiento profesional."
      }
    }
  }
};

async function patchLocales() {
  for (const lang of languages) {
    const filePath = path.join(localesDir, lang + '.json');
    if (fs.existsSync(filePath)) {
      const currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Deep merge function
      function mergeDeep(target, source) {
        for (const key in source) {
          if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], mergeDeep(target[key], source[key]));
          } else {
            target[key] = source[key];
          }
        }
        return target;
      }

      mergeDeep(currentData, patches[lang]);
      fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
      console.log('Patched ' + lang + '.json');
    }
  }
}

patchLocales();
