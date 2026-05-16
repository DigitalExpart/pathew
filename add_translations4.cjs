const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const languages = ['en', 'fr', 'de', 'es'];

const newTranslations = {
  en: {
    legal: {
      backToSignup: "Back to Sign Up",
      privacy: {
        title: "Privacy Policy",
        subtitle: "Version 1.0.0 • Last updated: May 12, 2024",
        sections: [
          {
            title: "1. Information We Collect",
            p: "We collect your name and email address when you create an account. For your profile, we may collect professional history, skills, and goals to provide better matching services."
          },
          {
            title: "2. How We Use Data",
            p: "Your data is used to calculate match scores with global opportunities and to communicate relevant updates. We do not sell your personal information to third parties."
          },
          {
            title: "3. Data Protection",
            p: "We implement industry-standard security measures, including data encryption and secure server protocols, to protect your personal information from unauthorized access."
          },
          {
            title: "4. Your Rights",
            p: "You have the right to access, correct, or delete your personal data at any time. You can manage these settings directly through your profile dashboard."
          },
          {
            title: "5. Cookies",
            p: "We use essential cookies to maintain your login session and improve platform performance. Non-essential cookies are only used with your explicit consent."
          }
        ]
      },
      terms: {
        title: "Terms & Conditions",
        subtitle: "Last updated: May 12, 2024",
        sections: [
          {
            title: "1. Acceptance of Terms",
            p: "By accessing and using PATHEW Assistant, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services."
          },
          {
            title: "2. Account Registration",
            p: "To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
          },
          {
            title: "3. Use of Services",
            p: "Our services are intended for professional opportunity matching. You agree not to use the platform for any unlawful purposes or in any way that could damage or disable our infrastructure."
          },
          {
            title: "4. Data & Privacy",
            p: "Your use of PATHEW is also governed by our Privacy Policy. Please review it to understand how we collect and process your information."
          },
          {
            title: "5. Termination",
            p: "We reserve the right to suspend or terminate your account at our discretion if we believe you have violated these terms."
          }
        ]
      }
    }
  },
  fr: {
    legal: {
      backToSignup: "Retour à l'inscription",
      privacy: {
        title: "Politique de Confidentialité",
        subtitle: "Version 1.0.0 • Dernière mise à jour : 12 mai 2024",
        sections: [
          { title: "1. Informations collectées", p: "Nous collectons votre nom et e-mail lors de la création du compte." },
          { title: "2. Utilisation des données", p: "Vos données servent à calculer les scores de correspondance." },
          { title: "3. Protection des données", p: "Nous appliquons des mesures de sécurité standard de l'industrie." },
          { title: "4. Vos droits", p: "Vous avez le droit d'accéder, corriger ou supprimer vos données." },
          { title: "5. Cookies", p: "Nous utilisons des cookies essentiels pour maintenir votre session." }
        ]
      },
      terms: {
        title: "Conditions Générales",
        subtitle: "Dernière mise à jour : 12 mai 2024",
        sections: [
          { title: "1. Acceptation des conditions", p: "En utilisant PATHEW, vous acceptez ces conditions." },
          { title: "2. Inscription", p: "Vous devez créer un compte pour accéder à certaines fonctionnalités." },
          { title: "3. Utilisation des services", p: "Nos services sont destinés à la recherche d'opportunités." },
          { title: "4. Données et confidentialité", p: "L'utilisation est également régie par notre Politique de Confidentialité." },
          { title: "5. Résiliation", p: "Nous nous réservons le droit de suspendre ou de résilier votre compte." }
        ]
      }
    }
  },
  de: {
    legal: {
      backToSignup: "Zurück zur Registrierung",
      privacy: {
        title: "Datenschutzrichtlinie",
        subtitle: "Version 1.0.0 • Letzte Aktualisierung: 12. Mai 2024",
        sections: [
          { title: "1. Gesammelte Informationen", p: "Wir erfassen Name und E-Mail bei der Kontoerstellung." },
          { title: "2. Datenverwendung", p: "Ihre Daten werden für das Matching verwendet." },
          { title: "3. Datenschutz", p: "Wir implementieren branchenübliche Sicherheitsmaßnahmen." },
          { title: "4. Ihre Rechte", p: "Sie haben das Recht auf Zugriff, Korrektur oder Löschung." },
          { title: "5. Cookies", p: "Wir verwenden essenzielle Cookies für die Sitzungsverwaltung." }
        ]
      },
      terms: {
        title: "Allgemeine Geschäftsbedingungen",
        subtitle: "Letzte Aktualisierung: 12. Mai 2024",
        sections: [
          { title: "1. Annahme der Bedingungen", p: "Durch die Nutzung von PATHEW stimmen Sie diesen Bedingungen zu." },
          { title: "2. Kontoregistrierung", p: "Für bestimmte Funktionen ist ein Konto erforderlich." },
          { title: "3. Nutzung der Dienste", p: "Unsere Dienste dienen dem beruflichen Matching." },
          { title: "4. Daten & Datenschutz", p: "Die Nutzung unterliegt auch unserer Datenschutzrichtlinie." },
          { title: "5. Beendigung", p: "Wir behalten uns das Recht vor, Ihr Konto zu sperren." }
        ]
      }
    }
  },
  es: {
    legal: {
      backToSignup: "Volver a Registrarse",
      privacy: {
        title: "Política de Privacidad",
        subtitle: "Versión 1.0.0 • Última actualización: 12 de mayo de 2024",
        sections: [
          { title: "1. Información que recopilamos", p: "Recopilamos su nombre y correo al crear una cuenta." },
          { title: "2. Uso de datos", p: "Sus datos se usan para calcular las coincidencias de oportunidades." },
          { title: "3. Protección de datos", p: "Implementamos medidas de seguridad estándar de la industria." },
          { title: "4. Sus derechos", p: "Tiene derecho a acceder, corregir o eliminar sus datos." },
          { title: "5. Cookies", p: "Usamos cookies esenciales para mantener su sesión." }
        ]
      },
      terms: {
        title: "Términos y Condiciones",
        subtitle: "Última actualización: 12 de mayo de 2024",
        sections: [
          { title: "1. Aceptación de los términos", p: "Al usar PATHEW, usted acepta estos términos." },
          { title: "2. Registro de cuenta", p: "Debe crear una cuenta para acceder a ciertas funciones." },
          { title: "3. Uso de los servicios", p: "Nuestros servicios están destinados a la búsqueda de oportunidades profesionales." },
          { title: "4. Datos y privacidad", p: "Su uso también se rige por nuestra Política de Privacidad." },
          { title: "5. Terminación", p: "Nos reservamos el derecho de suspender o cancelar su cuenta." }
        ]
      }
    }
  }
};

async function updateLocales() {
  for (const lang of languages) {
    const filePath = path.join(localesDir, lang + '.json');
    if (fs.existsSync(filePath)) {
      const currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
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
