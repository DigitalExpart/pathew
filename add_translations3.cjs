const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const languages = ['en', 'fr', 'de', 'es'];

const newTranslations = {
  en: {
    contact: {
      title1: "Get in ",
      title2: "Touch",
      subtitle: "Have questions about PATHEW Assistant? Our team is here to help you accelerate your global career.",
      form: {
        nameLabel: "Full Name",
        namePlaceholder: "John Doe",
        emailLabel: "Email Address",
        emailPlaceholder: "john@example.com",
        subjectLabel: "Subject",
        subjects: {
          general: "General Inquiry",
          tech: "Technical Support",
          billing: "Billing Question",
          partner: "Partnership"
        },
        messageLabel: "Message",
        messagePlaceholder: "How can we help you?",
        sendBtn: "Send Message",
        sendingBtn: "Sending...",
        successTitle: "Message Sent!",
        successDesc: "Thank you for reaching out. A PATHEW expert will get back to you within 24 hours.",
        sendAnother: "Send Another Message"
      },
      info: {
        emailTitle: "Email Us",
        emailSub: "Expect a response in 24h",
        callTitle: "Call Us",
        callSub: "Mon-Fri, 9am - 6pm EST",
        visitTitle: "Visit Us",
        visitSub: "San Francisco, CA 94105",
        followTitle: "Follow Our Journey"
      }
    },
    howItWorks: {
      hero: {
        badge: "The Roadmap to Success",
        title1: "How ",
        title2: "PATHEW",
        title3: " Works",
        subtitle: "Discover how our advanced Assistant technology bridges the gap between your talent and global opportunities."
      },
      process: {
        title: "A 3-Step Journey",
        subtitle: "We've simplified the complex world of international applications into three powerful stages.",
        step1: {
          title: "Global Discovery",
          desc: "Our engine scans thousands of curated sources to find opportunities specifically matched to your unique profile."
        },
        step2: {
          title: "Assistant Analysis",
          desc: "The PATHEW Assistant evaluates your gaps, suggests improvements, and generates tailored application documents."
        },
        step3: {
          title: "Direct Application",
          desc: "Apply with confidence using optimized materials that stand out to selection committees and employers."
        }
      },
      story: {
        badge: "Our Story",
        title1: "Born from ",
        title2: "Frustration",
        title3: ", Built for ",
        title4: "Future.",
        p1: "PATHEW started as a small internal tool used by international researchers to find funding. We quickly realized that the biggest barrier to global success wasn't talent—it was access to information and the ability to package that talent effectively.",
        p2: "Today, we empower thousands of professionals across 120+ countries to navigate the complex landscape of fellowships, grants, and high-impact roles with ease and precision.",
        stat1: "Lives Impacted",
        stat2: "Countries"
      },
      team: {
        title: "The 3-Man Core",
        subtitle: "Meet the visionaries behind the PATHEW Assistant engine.",
        role1: "Founder",
        desc1: "The visionary behind PATHEW, dedicated to breaking down geographical barriers for talent worldwide.",
        role2: "Head of Product",
        desc2: "Product strategist focused on building intuitive AI tools that empower professional growth.",
        role3: "Growth Manager",
        desc3: "Strategic lead for global expansion, ensuring the PATHEW Assistant reaches every corner of the globe."
      },
      cta: {
        title: "Ready to bridge the gap?",
        subtitle: "Join thousands of professionals already using PATHEW to accelerate their careers.",
        startBtn: "Get Started Now",
        talkBtn: "Talk to us"
      }
    }
  },
  fr: {
    contact: {
      title1: "Entrez en ",
      title2: "Contact",
      subtitle: "Des questions sur PATHEW Assistant ? Notre équipe est là pour vous aider.",
      form: {
        nameLabel: "Nom Complet",
        namePlaceholder: "Jean Dupont",
        emailLabel: "Adresse Email",
        emailPlaceholder: "jean@example.com",
        subjectLabel: "Sujet",
        subjects: {
          general: "Demande Générale",
          tech: "Support Technique",
          billing: "Question de Facturation",
          partner: "Partenariat"
        },
        messageLabel: "Message",
        messagePlaceholder: "Comment pouvons-nous vous aider ?",
        sendBtn: "Envoyer le message",
        sendingBtn: "Envoi en cours...",
        successTitle: "Message Envoyé !",
        successDesc: "Merci. Un expert PATHEW vous répondra sous 24 heures.",
        sendAnother: "Envoyer un autre message"
      },
      info: {
        emailTitle: "Écrivez-nous",
        emailSub: "Réponse sous 24h",
        callTitle: "Appelez-nous",
        callSub: "Lun-Ven, 9h-18h",
        visitTitle: "Rendez-nous visite",
        visitSub: "San Francisco, CA 94105",
        followTitle: "Suivez-nous"
      }
    },
    howItWorks: {
      hero: {
        badge: "La Feuille de Route du Succès",
        title1: "Comment fonctionne ",
        title2: "PATHEW",
        title3: "",
        subtitle: "Découvrez comment notre Assistant avancé comble l'écart entre votre talent et les opportunités mondiales."
      },
      process: {
        title: "Un Parcours en 3 Étapes",
        subtitle: "Nous avons simplifié le monde complexe des candidatures internationales en trois étapes.",
        step1: {
          title: "Découverte Globale",
          desc: "Notre moteur scanne des milliers de sources pour trouver des opportunités adaptées à votre profil."
        },
        step2: {
          title: "Analyse par l'Assistant",
          desc: "L'Assistant évalue vos lacunes, suggère des améliorations et génère vos documents."
        },
        step3: {
          title: "Candidature Directe",
          desc: "Postulez en toute confiance avec des documents optimisés pour se démarquer."
        }
      },
      story: {
        badge: "Notre Histoire",
        title1: "Né de la ",
        title2: "Frustration",
        title3: ", Bâti pour ",
        title4: "l'Avenir.",
        p1: "PATHEW a commencé comme un outil interne pour les chercheurs internationaux. Le plus grand obstacle n'était pas le talent, c'était l'accès à l'information.",
        p2: "Aujourd'hui, nous aidons des milliers de professionnels dans plus de 120 pays.",
        stat1: "Vies Impactées",
        stat2: "Pays"
      },
      team: {
        title: "Le Noyau Dur",
        subtitle: "Rencontrez les visionnaires derrière le moteur PATHEW.",
        role1: "Fondatrice",
        desc1: "Dédiée à briser les barrières géographiques pour les talents du monde entier.",
        role2: "Chef de Produit",
        desc2: "Stratège concentrée sur la création d'outils IA intuitifs.",
        role3: "Responsable Croissance",
        desc3: "Lead stratégique pour l'expansion globale."
      },
      cta: {
        title: "Prêt à franchir le pas ?",
        subtitle: "Rejoignez des milliers de professionnels qui accélèrent leur carrière.",
        startBtn: "Commencer Maintenant",
        talkBtn: "Nous Contacter"
      }
    }
  },
  de: {
    contact: {
      title1: "Nehmen Sie ",
      title2: "Kontakt auf",
      subtitle: "Haben Sie Fragen? Unser Team hilft Ihnen gerne weiter.",
      form: {
        nameLabel: "Vollständiger Name",
        namePlaceholder: "Max Mustermann",
        emailLabel: "E-Mail Adresse",
        emailPlaceholder: "max@example.com",
        subjectLabel: "Betreff",
        subjects: {
          general: "Allgemeine Anfrage",
          tech: "Technischer Support",
          billing: "Abrechnung",
          partner: "Partnerschaft"
        },
        messageLabel: "Nachricht",
        messagePlaceholder: "Wie können wir Ihnen helfen?",
        sendBtn: "Nachricht senden",
        sendingBtn: "Wird gesendet...",
        successTitle: "Nachricht gesendet!",
        successDesc: "Danke. Ein PATHEW-Experte meldet sich innerhalb von 24 Stunden.",
        sendAnother: "Weitere Nachricht senden"
      },
      info: {
        emailTitle: "E-Mail uns",
        emailSub: "Antwort in 24h",
        callTitle: "Rufen Sie an",
        callSub: "Mo-Fr, 9-18 Uhr",
        visitTitle: "Besuchen Sie uns",
        visitSub: "San Francisco, CA 94105",
        followTitle: "Folgen Sie uns"
      }
    },
    howItWorks: {
      hero: {
        badge: "Der Weg zum Erfolg",
        title1: "Wie ",
        title2: "PATHEW",
        title3: " funktioniert",
        subtitle: "Entdecken Sie, wie unser Assistent die Lücke zwischen Ihrem Talent und globalen Chancen schließt."
      },
      process: {
        title: "Ein 3-Stufen-Prozess",
        subtitle: "Wir haben die komplexe Welt internationaler Bewerbungen vereinfacht.",
        step1: {
          title: "Globale Entdeckung",
          desc: "Unsere Engine durchsucht tausende Quellen nach passenden Chancen."
        },
        step2: {
          title: "Assistenten-Analyse",
          desc: "Der Assistent bewertet Lücken und generiert Dokumente."
        },
        step3: {
          title: "Direkte Bewerbung",
          desc: "Bewerben Sie sich selbstbewusst mit optimierten Materialien."
        }
      },
      story: {
        badge: "Unsere Geschichte",
        title1: "Aus ",
        title2: "Frustration",
        title3: " geboren, für die ",
        title4: "Zukunft gebaut.",
        p1: "PATHEW begann als kleines internes Tool. Die größte Hürde war nicht das Talent, sondern der Zugang zu Informationen.",
        p2: "Heute helfen wir tausenden Profis in über 120 Ländern.",
        stat1: "Beeinflusste Leben",
        stat2: "Länder"
      },
      team: {
        title: "Das Kernteam",
        subtitle: "Lernen Sie die Visionäre kennen.",
        role1: "Gründerin",
        desc1: "Gewidmet dem Abbau geografischer Barrieren.",
        role2: "Produktleitung",
        desc2: "Fokussiert auf intuitive KI-Tools.",
        role3: "Wachstumsmanager",
        desc3: "Strategischer Lead für globale Expansion."
      },
      cta: {
        title: "Bereit für den nächsten Schritt?",
        subtitle: "Schließen Sie sich tausenden erfolgreichen Profis an.",
        startBtn: "Jetzt starten",
        talkBtn: "Sprechen Sie mit uns"
      }
    }
  },
  es: {
    contact: {
      title1: "Ponte en ",
      title2: "Contacto",
      subtitle: "¿Tienes preguntas? Nuestro equipo está aquí para ayudarte.",
      form: {
        nameLabel: "Nombre completo",
        namePlaceholder: "Juan Pérez",
        emailLabel: "Correo electrónico",
        emailPlaceholder: "juan@example.com",
        subjectLabel: "Asunto",
        subjects: {
          general: "Consulta General",
          tech: "Soporte Técnico",
          billing: "Facturación",
          partner: "Asociación"
        },
        messageLabel: "Mensaje",
        messagePlaceholder: "¿Cómo podemos ayudarte?",
        sendBtn: "Enviar Mensaje",
        sendingBtn: "Enviando...",
        successTitle: "¡Mensaje Enviado!",
        successDesc: "Gracias. Un experto de PATHEW te responderá en 24 horas.",
        sendAnother: "Enviar otro mensaje"
      },
      info: {
        emailTitle: "Escríbenos",
        emailSub: "Respuesta en 24h",
        callTitle: "Llámanos",
        callSub: "Lun-Vie, 9am-6pm",
        visitTitle: "Visítanos",
        visitSub: "San Francisco, CA 94105",
        followTitle: "Síguenos"
      }
    },
    howItWorks: {
      hero: {
        badge: "El Mapa hacia el Éxito",
        title1: "Cómo funciona ",
        title2: "PATHEW",
        title3: "",
        subtitle: "Descubre cómo nuestra tecnología de Asistente cierra la brecha entre tu talento y las oportunidades globales."
      },
      process: {
        title: "Un Viaje de 3 Pasos",
        subtitle: "Hemos simplificado el complejo mundo de las solicitudes internacionales.",
        step1: {
          title: "Descubrimiento Global",
          desc: "Nuestro motor escanea miles de fuentes para encontrar oportunidades."
        },
        step2: {
          title: "Análisis del Asistente",
          desc: "El Asistente evalúa tus debilidades y genera documentos personalizados."
        },
        step3: {
          title: "Solicitud Directa",
          desc: "Solicita con confianza usando materiales optimizados."
        }
      },
      story: {
        badge: "Nuestra Historia",
        title1: "Nacido de la ",
        title2: "Frustración",
        title3: ", Construido para el ",
        title4: "Futuro.",
        p1: "PATHEW comenzó como una pequeña herramienta interna. La mayor barrera no era el talento, sino el acceso a la información.",
        p2: "Hoy, empoderamos a miles de profesionales en más de 120 países.",
        stat1: "Vidas Impactadas",
        stat2: "Países"
      },
      team: {
        title: "El Núcleo",
        subtitle: "Conoce a los visionarios detrás del motor PATHEW.",
        role1: "Fundadora",
        desc1: "Dedicada a romper barreras geográficas.",
        role2: "Jefa de Producto",
        desc2: "Estratega enfocada en herramientas de IA intuitivas.",
        role3: "Gerente de Crecimiento",
        desc3: "Líder estratégico para la expansión global."
      },
      cta: {
        title: "¿Listo para dar el salto?",
        subtitle: "Únete a miles de profesionales que ya usan PATHEW.",
        startBtn: "Empezar Ahora",
        talkBtn: "Contáctanos"
      }
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
