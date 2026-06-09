const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');

const newFaqs = [
  {
    "question": "Do I need to have a CV to use PATHEW?",
    "answer": "No! PATHEW is designed for everyone, whether you’re starting from scratch or updating an existing CV. You can build a professional CV from the ground up using our guided onboarding form and step-by-step prompts."
  },
  {
    "question": "Is PATHEW free to use?",
    "answer": "PATHEW offers a free plan that gives you access to free credits to build functional CVs. Once you top up your credit, you’ll be able to create more CVs, cover letters, and grant proposals."
  },
  {
    "question": "Can I download my CV in different formats?",
    "answer": "Yes. Once your CV is complete, you can download it in PDF, Word (.docx), or plain text format, making it easy to submit to any employer or job platform."
  },
  {
    "question": "How long does it take to create a CV with PATHEW?",
    "answer": "Most users complete a polished, professional CV in under 15 minutes. If you already have your work history and key details ready, it can take even less time."
  },
  {
    "question": "Can I create multiple CVs for different job applications?",
    "answer": "Absolutely. PATHEW allows you to save and manage multiple CV versions, so you can tailor each one to a specific role or industry without starting over each time."
  },
  {
    "question": "Are the CV templates suitable for my industry?",
    "answer": "PATHEW offers a wide range of CVs designed for various industries and career levels, from creative fields to corporate, tech, healthcare, and more. You can prompt PATHEW to develop a CV for an industry that suits you best."
  },
  {
    "question": "Is my personal data safe on PATHEW?",
    "answer": "Yes. PATHEW takes data privacy seriously. Your information is encrypted, never shared with third parties, and you remain in full control of your data at all times."
  }
];

// Update EN
if (fs.existsSync(enPath)) {
  const data = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  if (data.landing && data.landing.faqList) {
    data.landing.faqList = newFaqs;
    fs.writeFileSync(enPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Updated en.json');
  }
}

// Copy to other locales to prevent mismatch (they will show english temporarily until translated)
const otherLocales = ['de.json', 'es.json', 'fr.json', 'nl.json'];
otherLocales.forEach(file => {
  const filePath = path.join(localesDir, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.landing && data.landing.faqList) {
      data.landing.faqList = newFaqs;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Updated ' + file);
    }
  }
});
