const fs = require('fs');

const filePath = 'src/pages/Landing/LandingPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldImageStyle = "style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block', borderRadius: 'inherit' }}";
const newImageStyle = "style={{ width: '100%', height: '700px', objectFit: 'cover', objectPosition: 'left top', display: 'block', borderRadius: 'inherit' }}";

if (content.includes(oldImageStyle)) {
  content = content.replace(oldImageStyle, newImageStyle);
} else {
  console.error("Could not find oldImageStyle");
}

const oldContainerScale = "transform: 'scale(1.20)',";
const newContainerScale = "transform: 'scale(1.05)',";

if (content.includes(oldContainerScale)) {
  content = content.replace(oldContainerScale, newContainerScale);
} else {
  console.error("Could not find oldContainerScale");
}

fs.writeFileSync(filePath, content);
console.log('Fixed image dimensions successfully!');
