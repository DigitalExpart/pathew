const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const languages = ['en', 'fr', 'de', 'es'];

const newTranslations = {
  en: {
    pricing: {
      title: "Pricing Plans",
      subtitle: "Simple, credit-based pricing. Pay for what you create.",
      month: "/month",
      generatesUpTo: "GENERATES UP TO",
      included: "INCLUDED IN EVERY PLAN",
      choose: "Choose",
      creditCost: "Credit Cost Per Service",
      creditCostSubtitle: "Mix and match any service — credits work across your entire account.",
      service: "Service",
      credits: "Credits",
      notes: "Notes",
      needMore: "Need more? Users can top up their credits at any time.",
      plans: {
        starter: {
          title: "Starter",
          credits: "25 credits / month",
          subtitle: "Perfect for individuals tackling a single application round."
        },
        growth: {
          title: "Growth",
          credits: "60 credits / month",
          subtitle: "For freelancers and active job seekers applying across multiple roles.",
          badge: "★ MOST POPULAR ★"
        },
        power: {
          title: "Power User",
          credits: "120 credits / month",
          subtitle: "For agencies, consultants and power users generating at scale.",
          badge: "★ BEST VALUE ★"
        }
      },
      services: {
        coverLetter: "Cover Letter",
        cv: "CV / Resume",
        proposal: "Proposal",
        grant: "Grant Application",
        prep: "Preparation Plan",
        rewrite: "Any Rewrite"
      },
      features: [
        "View live job & grant opportunities",
        "Percentage readiness score per application",
        "AI-generated preparation plan – credit applies"
      ]
    },
    grantBuilder: {
      title: "Grant Builder",
      subtitle: "Create multi-page proposals and targeted CVs tailored for success.",
      editMode: "Edit Mode",
      preview: "Preview",
      saveDraft: "Save Draft",
      docSetup: "Document Setup",
      docType: "Document Type",
      targetPageCount: "Target Page Count",
      customQuestions: "Custom Questions",
      addQuestion: "+ Add Question",
      wordLimit: "Word limit:",
      assistant: "Assistant"
    }
  },
  fr: {
    pricing: {
      title: "Forfaits Tarifaires",
      subtitle: "Tarification simple basée sur les crédits. Payez pour ce que vous créez.",
      month: "/mois",
      generatesUpTo: "GÉNÈRE JUSQU'À",
      included: "INCLUS DANS CHAQUE FORFAIT",
      choose: "Choisir",
      creditCost: "Coût en crédits par service",
      creditCostSubtitle: "Mélangez n'importe quel service - les crédits fonctionnent sur tout votre compte.",
      service: "Service",
      credits: "Crédits",
      notes: "Notes",
      needMore: "Besoin de plus ? Rechargez vos crédits à tout moment.",
      plans: {
        starter: {
          title: "Débutant",
          credits: "25 crédits / mois",
          subtitle: "Idéal pour une seule session de candidatures."
        },
        growth: {
          title: "Croissance",
          credits: "60 crédits / mois",
          subtitle: "Pour les indépendants et les chercheurs d'emploi actifs.",
          badge: "★ LE PLUS POPULAIRE ★"
        },
        power: {
          title: "Utilisateur Pro",
          credits: "120 crédits / mois",
          subtitle: "Pour les agences et les utilisateurs intensifs.",
          badge: "★ MEILLEURE VALEUR ★"
        }
      },
      services: {
        coverLetter: "Lettre de motivation",
        cv: "CV",
        proposal: "Proposition",
        grant: "Demande de subvention",
        prep: "Plan de préparation",
        rewrite: "Toute réécriture"
      },
      features: [
        "Voir les offres d'emploi et de subventions",
        "Score de préparation pour chaque candidature",
        "Plan de préparation généré par l'IA"
      ]
    },
    grantBuilder: {
      title: "Constructeur de Subventions",
      subtitle: "Créez des propositions multi-pages et des CV ciblés.",
      editMode: "Mode Édition",
      preview: "Aperçu",
      saveDraft: "Enregistrer le brouillon",
      docSetup: "Configuration du document",
      docType: "Type de document",
      targetPageCount: "Nombre de pages cible",
      customQuestions: "Questions personnalisées",
      addQuestion: "+ Ajouter une question",
      wordLimit: "Limite de mots :",
      assistant: "Assistant"
    }
  },
  de: {
    pricing: {
      title: "Preise",
      subtitle: "Einfache Guthaben-basierte Preisgestaltung. Zahlen Sie für das, was Sie erstellen.",
      month: "/Monat",
      generatesUpTo: "GENERIERT BIS ZU",
      included: "IN JEDEM PLAN ENTHALTEN",
      choose: "Wählen Sie",
      creditCost: "Guthabenkosten pro Service",
      creditCostSubtitle: "Mischen und anpassen Sie jeden Service — Guthaben gelten für Ihr gesamtes Konto.",
      service: "Service",
      credits: "Guthaben",
      notes: "Notizen",
      needMore: "Brauchen Sie mehr? Laden Sie Ihre Guthaben jederzeit auf.",
      plans: {
        starter: {
          title: "Anfänger",
          credits: "25 Guthaben / Monat",
          subtitle: "Perfekt für Einzelpersonen bei einer einzigen Bewerbungsrunde."
        },
        growth: {
          title: "Wachstum",
          credits: "60 Guthaben / Monat",
          subtitle: "Für Freiberufler und aktive Arbeitssucher.",
          badge: "★ AM BELIEBTESTEN ★"
        },
        power: {
          title: "Power-Nutzer",
          credits: "120 Guthaben / Monat",
          subtitle: "Für Agenturen, Berater und Vielnutzer.",
          badge: "★ BESTER WERT ★"
        }
      },
      services: {
        coverLetter: "Anschreiben",
        cv: "Lebenslauf",
        proposal: "Vorschlag",
        grant: "Zuschussantrag",
        prep: "Vorbereitungsplan",
        rewrite: "Jegliche Umschreibung"
      },
      features: [
        "Live-Jobs & Zuschüsse anzeigen",
        "Bereitschaftsscore pro Bewerbung",
        "KI-generierter Vorbereitungsplan"
      ]
    },
    grantBuilder: {
      title: "Zuschuss-Generator",
      subtitle: "Erstellen Sie mehrseitige Vorschläge und gezielte Lebensläufe.",
      editMode: "Bearbeitungsmodus",
      preview: "Vorschau",
      saveDraft: "Entwurf speichern",
      docSetup: "Dokument-Setup",
      docType: "Dokumenttyp",
      targetPageCount: "Ziel-Seitenzahl",
      customQuestions: "Benutzerdefinierte Fragen",
      addQuestion: "+ Frage hinzufügen",
      wordLimit: "Wortlimit:",
      assistant: "Assistent"
    }
  },
  es: {
    pricing: {
      title: "Planes de Precios",
      subtitle: "Precios simples basados en créditos. Paga por lo que creas.",
      month: "/mes",
      generatesUpTo: "GENERA HASTA",
      included: "INCLUIDO EN TODOS LOS PLANES",
      choose: "Elegir",
      creditCost: "Costo de crédito por servicio",
      creditCostSubtitle: "Combina cualquier servicio — los créditos funcionan en toda tu cuenta.",
      service: "Servicio",
      credits: "Créditos",
      notes: "Notas",
      needMore: "¿Necesitas más? Recarga tus créditos en cualquier momento.",
      plans: {
        starter: {
          title: "Iniciador",
          credits: "25 créditos / mes",
          subtitle: "Perfecto para individuos que abordan una sola ronda de solicitudes."
        },
        growth: {
          title: "Crecimiento",
          credits: "60 créditos / mes",
          subtitle: "Para autónomos y buscadores de empleo activos.",
          badge: "★ MÁS POPULAR ★"
        },
        power: {
          title: "Usuario Pro",
          credits: "120 créditos / mes",
          subtitle: "Para agencias, consultores y usuarios a gran escala.",
          badge: "★ MEJOR VALOR ★"
        }
      },
      services: {
        coverLetter: "Carta de presentación",
        cv: "CV / Currículum",
        proposal: "Propuesta",
        grant: "Solicitud de subvención",
        prep: "Plan de preparación",
        rewrite: "Cualquier reescritura"
      },
      features: [
        "Ver trabajos y subvenciones en vivo",
        "Puntuación de preparación por solicitud",
        "Plan de preparación generado por IA"
      ]
    },
    grantBuilder: {
      title: "Constructor de Subvenciones",
      subtitle: "Crea propuestas de varias páginas y CVs específicos.",
      editMode: "Modo Edición",
      preview: "Vista previa",
      saveDraft: "Guardar borrador",
      docSetup: "Configuración del documento",
      docType: "Tipo de documento",
      targetPageCount: "Cantidad de páginas",
      customQuestions: "Preguntas personalizadas",
      addQuestion: "+ Añadir Pregunta",
      wordLimit: "Límite de palabras:",
      assistant: "Asistente"
    }
  }
};

async function updateLocales() {
  for (const lang of languages) {
    const filePath = path.join(localesDir, lang + '.json');
    if (fs.existsSync(filePath)) {
      const currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Deep merge function
      function mergeDeep(target, source) {
        for (const key in source) {
          if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], mergeDeep(target[key], source[key]));
          }
        }
        Object.assign(target || {}, source);
        return target;
      }

      const mergedData = mergeDeep(currentData, newTranslations[lang]);
      fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));
      console.log('Updated ' + lang + '.json');
    }
  }
}

updateLocales();
