const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const locales = ['en.json', 'de.json', 'es.json', 'fr.json', 'nl.json'];

locales.forEach(file => {
  const filePath = path.join(localesDir, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.builders && data.builders.loading && data.builders.loading.generatingDraft) {
      data.builders.loading.generatingDraft = "Pathew AI is generating documentation";
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Updated ' + file);
    }
  }
});
