const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const languages = ['en', 'fr', 'de', 'es'];

const newTranslations = {
  en: {
    wallet: {
      title: "Wallet & Credits",
      subtitle: "Manage your platform credits and view transaction history.",
      availableBalance: "Available Balance",
      creditsReady: "Credits ready for your next application",
      upgradePlan: "Upgrade Plan",
      recentTransactions: "Recent Transactions",
      noTransactions: "No transactions yet."
    },
    builders: {
      editingMode: "Editing Mode",
      livePreview: "Live Preview",
      cv: {
        title: "Tailored CV",
        desc: "Optimize your experience for this role."
      },
      coverLetter: {
        title: "Cover Letter",
        desc: "Write a compelling narrative."
      },
      proposal: {
        title: "Proposal",
        desc: "Structure your pitch perfectly."
      }
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your PATHEW account and platform preferences.",
      tabs: {
        notifications: "Notifications",
        security: "Security",
        billing: "Billing",
        privacy: "Privacy & Data",
        preferences: "Preferences",
        account: "Account Deletion"
      },
      notifications: {
        title: "Notification Preferences",
        email: "Email Notifications",
        emailDesc: "Receive updates about new matches and document reviews.",
        push: "Push Notifications",
        pushDesc: "Get instant alerts on your desktop and mobile device.",
        newsletter: "Newsletter",
        newsletterDesc: "Stay updated with our weekly tips and success stories."
      },
      security: {
        title: "Security & Privacy",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm Password",
        updateSecurity: "Update Security",
        twoFactor: "Two-Factor Authentication",
        twoFactorDesc: "Secure your account with an additional security layer.",
        enable: "Enable"
      },
      assistant: {
        tone: "Default Tone of Voice",
        language: "Preferred Language",
        autoSave: "Auto-Save Assistant History",
        autoSaveDesc: "Save all generated content to your account history automatically."
      },
      billing: {
        title: "Billing & Subscription",
        currentPlan: "Current Plan",
        nextRenewal: "Next renewal:",
        changePlan: "Change Plan",
        paymentMethod: "Payment Method",
        noPaymentMethod: "No payment method",
        addPaymentMethod: "Add a payment method to subscribe",
        billingHistory: "Billing History",
        date: "Date",
        invoice: "Invoice",
        amount: "Amount",
        status: "Status",
        action: "Action",
        download: "Download",
        noHistory: "No billing history found"
      },
      privacy: {
        title: "Privacy & Data",
        dataExport: "Data Export",
        dataExportDesc: "Download a copy of all your personal data, saved opportunities, and generated documents.",
        exportZip: "Export Data as ZIP",
        tracking: "Tracking & Analytics",
        trackingDesc: "Allow us to collect anonymous usage data to help improve the platform.",
        analytics: "Analytics Tracking",
        analyticsDesc: "Share anonymous usage metrics."
      },
      preferences: {
        title: "Consent & Preferences",
        desc: "Manage how we communicate with you and your marketing preferences.",
        opportunityAlerts: "Weekly Opportunity Alerts",
        opportunityAlertsDesc: "Get personalized matches delivered to your inbox.",
        productUpdates: "Product Updates",
        productUpdatesDesc: "Stay informed about new features and improvements.",
        refreshState: "Refresh State"
      },
      account: {
        title: "Account Deletion",
        warning: "Warning: This action is permanent.",
        warningDesc: "All your credits, documents, and profile data will be permanently erased. This cannot be undone.",
        contactSupport: "If you're having trouble or just want to take a break, you can always contact our support team instead.",
        requestDeletion: "Request Account Deletion",
        areYouSure: "Are you absolutely sure? This cannot be undone.",
        confirmDeletion: "Confirm Permanent Deletion",
        cancel: "Cancel"
      }
    }
  },
  fr: {
    wallet: {
      title: "Portefeuille et Crédits",
      subtitle: "Gérez vos crédits et consultez l'historique des transactions.",
      availableBalance: "Solde disponible",
      creditsReady: "Crédits prêts pour votre prochaine candidature",
      upgradePlan: "Changer de forfait",
      recentTransactions: "Transactions récentes",
      noTransactions: "Aucune transaction pour le moment."
    },
    builders: {
      editingMode: "Mode d'édition",
      livePreview: "Aperçu en direct",
      cv: {
        title: "CV sur mesure",
        desc: "Optimisez votre expérience pour ce rôle."
      },
      coverLetter: {
        title: "Lettre de motivation",
        desc: "Rédigez un récit convaincant."
      },
      proposal: {
        title: "Proposition",
        desc: "Structurez parfaitement votre argumentaire."
      }
    },
    settings: {
      title: "Paramètres",
      subtitle: "Gérez votre compte PATHEW et vos préférences.",
      tabs: {
        notifications: "Notifications",
        security: "Sécurité",
        billing: "Facturation",
        privacy: "Confidentialité et Données",
        preferences: "Préférences",
        account: "Suppression de compte"
      },
      notifications: {
        title: "Préférences de notification",
        email: "Notifications par e-mail",
        emailDesc: "Recevez des mises à jour sur les nouveaux matchs et examens de documents.",
        push: "Notifications Push",
        pushDesc: "Obtenez des alertes instantanées sur votre appareil mobile et de bureau.",
        newsletter: "Newsletter",
        newsletterDesc: "Restez informé avec nos conseils hebdomadaires."
      },
      security: {
        title: "Sécurité et Confidentialité",
        currentPassword: "Mot de passe actuel",
        newPassword: "Nouveau mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        updateSecurity: "Mettre à jour la sécurité",
        twoFactor: "Authentification à deux facteurs",
        twoFactorDesc: "Sécurisez votre compte avec une couche supplémentaire.",
        enable: "Activer"
      },
      assistant: {
        tone: "Ton de voix par défaut",
        language: "Langue préférée",
        autoSave: "Sauvegarde automatique de l'historique",
        autoSaveDesc: "Enregistrez automatiquement tout le contenu généré."
      },
      billing: {
        title: "Facturation et Abonnement",
        currentPlan: "Forfait actuel",
        nextRenewal: "Prochain renouvellement:",
        changePlan: "Changer de forfait",
        paymentMethod: "Mode de paiement",
        noPaymentMethod: "Aucun mode de paiement",
        addPaymentMethod: "Ajoutez un mode de paiement pour vous abonner",
        billingHistory: "Historique de facturation",
        date: "Date",
        invoice: "Facture",
        amount: "Montant",
        status: "Statut",
        action: "Action",
        download: "Télécharger",
        noHistory: "Aucun historique de facturation trouvé"
      },
      privacy: {
        title: "Confidentialité et Données",
        dataExport: "Exportation de données",
        dataExportDesc: "Téléchargez une copie de toutes vos données personnelles.",
        exportZip: "Exporter les données (ZIP)",
        tracking: "Suivi et Analyse",
        trackingDesc: "Autorisez-nous à collecter des données d'utilisation anonymes.",
        analytics: "Suivi analytique",
        analyticsDesc: "Partager des métriques d'utilisation anonymes."
      },
      preferences: {
        title: "Consentement et Préférences",
        desc: "Gérez comment nous communiquons avec vous.",
        opportunityAlerts: "Alertes d'opportunités hebdomadaires",
        opportunityAlertsDesc: "Recevez des matchs personnalisés dans votre boîte de réception.",
        productUpdates: "Mises à jour du produit",
        productUpdatesDesc: "Restez informé des nouvelles fonctionnalités.",
        refreshState: "Rafraîchir l'état"
      },
      account: {
        title: "Suppression de compte",
        warning: "Avertissement : Cette action est permanente.",
        warningDesc: "Toutes vos données seront définitivement effacées.",
        contactSupport: "Si vous rencontrez des problèmes, vous pouvez contacter le support.",
        requestDeletion: "Demander la suppression du compte",
        areYouSure: "Êtes-vous absolument sûr ? Cela ne peut pas être annulé.",
        confirmDeletion: "Confirmer la suppression permanente",
        cancel: "Annuler"
      }
    }
  },
  de: {
    wallet: {
      title: "Brieftasche & Guthaben",
      subtitle: "Verwalten Sie Ihre Guthaben und Transaktionen.",
      availableBalance: "Verfügbares Guthaben",
      creditsReady: "Guthaben bereit für Ihre nächste Bewerbung",
      upgradePlan: "Plan aktualisieren",
      recentTransactions: "Letzte Transaktionen",
      noTransactions: "Noch keine Transaktionen."
    },
    builders: {
      editingMode: "Bearbeitungsmodus",
      livePreview: "Live-Vorschau",
      cv: {
        title: "Maßgeschneiderter Lebenslauf",
        desc: "Optimieren Sie Ihre Erfahrung für diese Rolle."
      },
      coverLetter: {
        title: "Anschreiben",
        desc: "Schreiben Sie eine überzeugende Erzählung."
      },
      proposal: {
        title: "Vorschlag",
        desc: "Strukturieren Sie Ihren Pitch perfekt."
      }
    },
    settings: {
      title: "Einstellungen",
      subtitle: "Verwalten Sie Ihr PATHEW-Konto und Ihre Einstellungen.",
      tabs: {
        notifications: "Benachrichtigungen",
        security: "Sicherheit",
        billing: "Abrechnung",
        privacy: "Datenschutz & Daten",
        preferences: "Präferenzen",
        account: "Kontolöschung"
      },
      notifications: {
        title: "Benachrichtigungseinstellungen",
        email: "E-Mail-Benachrichtigungen",
        emailDesc: "Erhalten Sie Updates zu neuen Übereinstimmungen.",
        push: "Push-Benachrichtigungen",
        pushDesc: "Erhalten Sie sofortige Warnungen.",
        newsletter: "Newsletter",
        newsletterDesc: "Bleiben Sie auf dem Laufenden."
      },
      security: {
        title: "Sicherheit & Datenschutz",
        currentPassword: "Aktuelles Passwort",
        newPassword: "Neues Passwort",
        confirmPassword: "Passwort bestätigen",
        updateSecurity: "Sicherheit aktualisieren",
        twoFactor: "Zwei-Faktor-Authentifizierung",
        twoFactorDesc: "Sichern Sie Ihr Konto zusätzlich ab.",
        enable: "Aktivieren"
      },
      assistant: {
        tone: "Standard-Sprachton",
        language: "Bevorzugte Sprache",
        autoSave: "Verlauf automatisch speichern",
        autoSaveDesc: "Generierte Inhalte automatisch speichern."
      },
      billing: {
        title: "Abrechnung & Abonnement",
        currentPlan: "Aktueller Plan",
        nextRenewal: "Nächste Verlängerung:",
        changePlan: "Plan ändern",
        paymentMethod: "Zahlungsmethode",
        noPaymentMethod: "Keine Zahlungsmethode",
        addPaymentMethod: "Zahlungsmethode hinzufügen",
        billingHistory: "Abrechnungsverlauf",
        date: "Datum",
        invoice: "Rechnung",
        amount: "Betrag",
        status: "Status",
        action: "Aktion",
        download: "Herunterladen",
        noHistory: "Kein Abrechnungsverlauf gefunden"
      },
      privacy: {
        title: "Datenschutz & Daten",
        dataExport: "Datenexport",
        dataExportDesc: "Laden Sie eine Kopie Ihrer Daten herunter.",
        exportZip: "Daten als ZIP exportieren",
        tracking: "Tracking & Analysen",
        trackingDesc: "Anonyme Nutzungsdaten sammeln.",
        analytics: "Analyse-Tracking",
        analyticsDesc: "Anonyme Nutzungsmetriken teilen."
      },
      preferences: {
        title: "Zustimmung & Präferenzen",
        desc: "Verwalten Sie Ihre Kommunikation.",
        opportunityAlerts: "Wöchentliche Chancen-Benachrichtigungen",
        opportunityAlertsDesc: "Personalisierte Matches erhalten.",
        productUpdates: "Produktupdates",
        productUpdatesDesc: "Über neue Funktionen informiert bleiben.",
        refreshState: "Status aktualisieren"
      },
      account: {
        title: "Kontolöschung",
        warning: "Warnung: Diese Aktion ist endgültig.",
        warningDesc: "Alle Ihre Daten werden dauerhaft gelöscht.",
        contactSupport: "Kontaktieren Sie den Support für Hilfe.",
        requestDeletion: "Kontolöschung anfordern",
        areYouSure: "Sind Sie absolut sicher? Dies kann nicht rückgängig gemacht werden.",
        confirmDeletion: "Dauerhafte Löschung bestätigen",
        cancel: "Abbrechen"
      }
    }
  },
  es: {
    wallet: {
      title: "Billetera y Créditos",
      subtitle: "Gestiona tus créditos y el historial de transacciones.",
      availableBalance: "Saldo disponible",
      creditsReady: "Créditos listos para tu próxima solicitud",
      upgradePlan: "Mejorar plan",
      recentTransactions: "Transacciones recientes",
      noTransactions: "No hay transacciones todavía."
    },
    builders: {
      editingMode: "Modo de edición",
      livePreview: "Vista previa en vivo",
      cv: {
        title: "CV a medida",
        desc: "Optimiza tu experiencia para este rol."
      },
      coverLetter: {
        title: "Carta de presentación",
        desc: "Escribe una narrativa convincente."
      },
      proposal: {
        title: "Propuesta",
        desc: "Estructura tu propuesta perfectamente."
      }
    },
    settings: {
      title: "Configuraciones",
      subtitle: "Gestiona tu cuenta PATHEW y preferencias.",
      tabs: {
        notifications: "Notificaciones",
        security: "Seguridad",
        billing: "Facturación",
        privacy: "Privacidad y Datos",
        preferences: "Preferencias",
        account: "Eliminación de cuenta"
      },
      notifications: {
        title: "Preferencias de notificaciones",
        email: "Notificaciones por correo",
        emailDesc: "Recibe actualizaciones sobre nuevas coincidencias.",
        push: "Notificaciones Push",
        pushDesc: "Obtén alertas instantáneas.",
        newsletter: "Boletín",
        newsletterDesc: "Mantente actualizado con consejos semanales."
      },
      security: {
        title: "Seguridad y Privacidad",
        currentPassword: "Contraseña actual",
        newPassword: "Nueva contraseña",
        confirmPassword: "Confirmar contraseña",
        updateSecurity: "Actualizar seguridad",
        twoFactor: "Autenticación de dos factores",
        twoFactorDesc: "Asegura tu cuenta con una capa adicional.",
        enable: "Habilitar"
      },
      assistant: {
        tone: "Tono de voz predeterminado",
        language: "Idioma preferido",
        autoSave: "Guardado automático",
        autoSaveDesc: "Guarda todo el contenido generado automáticamente."
      },
      billing: {
        title: "Facturación y Suscripción",
        currentPlan: "Plan actual",
        nextRenewal: "Próxima renovación:",
        changePlan: "Cambiar plan",
        paymentMethod: "Método de pago",
        noPaymentMethod: "Sin método de pago",
        addPaymentMethod: "Añade un método de pago para suscribirte",
        billingHistory: "Historial de facturación",
        date: "Fecha",
        invoice: "Factura",
        amount: "Cantidad",
        status: "Estado",
        action: "Acción",
        download: "Descargar",
        noHistory: "No se encontró historial de facturación"
      },
      privacy: {
        title: "Privacidad y Datos",
        dataExport: "Exportación de datos",
        dataExportDesc: "Descarga una copia de todos tus datos.",
        exportZip: "Exportar datos como ZIP",
        tracking: "Rastreo y Análisis",
        trackingDesc: "Permítenos recopilar datos anónimos.",
        analytics: "Análisis",
        analyticsDesc: "Comparte métricas de uso anónimas."
      },
      preferences: {
        title: "Consentimiento y Preferencias",
        desc: "Gestiona cómo nos comunicamos contigo.",
        opportunityAlerts: "Alertas de oportunidades",
        opportunityAlertsDesc: "Recibe coincidencias personalizadas en tu bandeja de entrada.",
        productUpdates: "Actualizaciones del producto",
        productUpdatesDesc: "Mantente informado sobre nuevas características.",
        refreshState: "Actualizar estado"
      },
      account: {
        title: "Eliminación de cuenta",
        warning: "Advertencia: Esta acción es permanente.",
        warningDesc: "Todos tus datos serán borrados permanentemente.",
        contactSupport: "Si tienes problemas, contacta a soporte.",
        requestDeletion: "Solicitar eliminación de cuenta",
        areYouSure: "¿Estás absolutamente seguro? Esto no se puede deshacer.",
        confirmDeletion: "Confirmar eliminación permanente",
        cancel: "Cancelar"
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
