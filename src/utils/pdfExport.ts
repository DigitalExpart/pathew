import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function sanitizeText(text: string): string {
  if (!text) return '';
  return text.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '');
}

function inlineMarkdownToHtml(text: string): string {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #0f172a;">$1</strong>');
  // Italic *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #475569;">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em style="font-style: italic; color: #475569;">$1</em>');

  return html;
}

export const generatePdfBlob = async (
  markdownText: string,
  accentColorHex: string = 'D69E2E',
  documentType: string = 'cv'
): Promise<Blob> => {
  const sanitizedText = sanitizeText(markdownText);
  const cleanHex = accentColorHex.startsWith('#') ? accentColorHex.slice(1) : accentColorHex;
  const accentColor = `#${cleanHex}`;
  const normalizedType = documentType.toLowerCase().replace(/[\s-]/g, '_');

  // Create temporary container positioned offscreen with opacity: 1
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-9999px';
  container.style.width = '794px'; // ~A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.padding = '48px 56px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.fontSize = '13.5px';
  container.style.lineHeight = '1.6';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  (container.style as any).webkitFontSmoothing = 'antialiased';

  const lines = sanitizedText.split('\n');
  let htmlContent = '';
  let inList = false;
  let isHeaderArea = normalizedType.includes('cv') || normalizedType.includes('resume');
  let emptyLineCount = 0;

  const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}|Present|Current)/i;

  let isSkillsSection = false;
  let accumulatedSkills: string[] = [];

  const renderTwoColumnHtml = (items: string[]) => {
    if (!items || items.length === 0) return '';
    const mid = Math.ceil(items.length / 2);
    const leftCol = items.slice(0, mid);
    const rightCol = items.slice(mid);

    return `
      <div style="display: flex; gap: 24px; margin-top: 6px; margin-bottom: 12px; width: 100%;">
        <ul style="flex: 1; margin: 0; padding-left: 20px; color: #334155; list-style-type: disc;">
          ${leftCol.map(item => `<li style="margin-bottom: 4px; line-height: 1.5; font-size: 13px;">${inlineMarkdownToHtml(item)}</li>`).join('')}
        </ul>
        <ul style="flex: 1; margin: 0; padding-left: 20px; color: #334155; list-style-type: disc;">
          ${rightCol.map(item => `<li style="margin-bottom: 4px; line-height: 1.5; font-size: 13px;">${inlineMarkdownToHtml(item)}</li>`).join('')}
        </ul>
      </div>
    `;
  };

  const flushSkills = () => {
    if (accumulatedSkills.length > 0) {
      htmlContent += renderTwoColumnHtml(accumulatedSkills);
      accumulatedSkills = [];
    }
  };

  const closeList = () => {
    flushSkills();
    if (inList) {
      htmlContent += '</ul>';
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine.replace(/\u00A0/g, ' ').trim();

    // Ignore decorative horizontal lines
    if (line.match(/^[-=_*]{3,}$/)) {
      closeList();
      isHeaderArea = false;
      isSkillsSection = false;
      continue;
    }

    if (!line) {
      closeList();
      emptyLineCount++;
      if (emptyLineCount >= 2 && isHeaderArea) {
        isHeaderArea = false;
      }
      continue;
    }
    emptyLineCount = 0;

    const cleanHeader = line.replace(/^[#]+ /, '').replace(/\*/g, '').trim();

    // H1 (Name or Big Title)
    if (line.startsWith('# ')) {
      closeList();
      isSkillsSection = false;
      if (cleanHeader.includes('|') || cleanHeader.length > 50) {
        htmlContent += `<h2 style="font-size: 16px; font-weight: 700; text-align: center; color: ${accentColor}; margin: 0 0 12px 0;">${inlineMarkdownToHtml(cleanHeader)}</h2>`;
      } else {
        htmlContent += `<h1 style="font-size: 26px; font-weight: 800; text-align: center; text-transform: uppercase; color: #0f172a; margin: 0 0 8px 0; letter-spacing: 0.5px;">${inlineMarkdownToHtml(cleanHeader)}</h1>`;
      }
      continue;
    }

    // H2 (Professional Subtitle OR Section Header)
    if (line.startsWith('## ')) {
      closeList();
      isSkillsSection = /skills|competencies|strengths/i.test(cleanHeader);
      const isGrant = normalizedType.includes('grant') || normalizedType.includes('proposal') || normalizedType.includes('roadmap') || normalizedType.includes('general');
      if (isGrant || (cleanHeader === cleanHeader.toUpperCase() && cleanHeader.length < 50 && !cleanHeader.includes('|'))) {
        isHeaderArea = false;
        htmlContent += `
          <div style="margin-top: 22px; margin-bottom: 10px;">
            <h2 style="font-size: 15px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 4px 0; letter-spacing: 0.5px;">${inlineMarkdownToHtml(cleanHeader)}</h2>
            <div style="height: 2px; background-color: ${accentColor}; width: 100%;"></div>
          </div>
        `;
      } else {
        htmlContent += `<h2 style="font-size: 15px; font-weight: 600; text-align: center; color: ${accentColor}; margin: 0 0 12px 0;">${inlineMarkdownToHtml(cleanHeader)}</h2>`;
      }
      continue;
    }

    // H3 (Contact info line or Sub-header)
    if (line.startsWith('### ')) {
      closeList();
      isSkillsSection = /skills|competencies|strengths/i.test(cleanHeader);
      const isGrant = normalizedType.includes('grant') || normalizedType.includes('proposal') || normalizedType.includes('roadmap') || normalizedType.includes('general');
      if (isGrant) {
        htmlContent += `<h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 16px 0 8px 0;">${inlineMarkdownToHtml(cleanHeader)}</h3>`;
      } else {
        htmlContent += `<h3 style="font-size: 12px; font-weight: 500; text-align: center; color: #475569; margin: 0 0 16px 0;">${inlineMarkdownToHtml(cleanHeader)}</h3>`;
      }
      continue;
    }

    // H4 (Section Header)
    if (line.startsWith('#### ')) {
      closeList();
      isHeaderArea = false;
      isSkillsSection = /skills|competencies|strengths/i.test(cleanHeader);
      htmlContent += `
        <div style="margin-top: 22px; margin-bottom: 10px;">
          <h4 style="font-size: 15px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 4px 0; letter-spacing: 0.5px;">${inlineMarkdownToHtml(cleanHeader)}</h4>
          <div style="height: 2px; background-color: ${accentColor}; width: 100%;"></div>
        </div>
      `;
      continue;
    }

    // Uppercase Section Header Fallback
    const isUppercaseHeader = cleanHeader.length > 0 && cleanHeader.length < 60 && cleanHeader === cleanHeader.toUpperCase() && !cleanHeader.includes('|') && !cleanHeader.match(/\d{4}/);
    if (isUppercaseHeader && (!isHeaderArea || cleanHeader === 'PROFESSIONAL SUMMARY' || cleanHeader === 'EDUCATION' || cleanHeader === 'WORK EXPERIENCE' || cleanHeader.includes('SKILLS'))) {
      closeList();
      isHeaderArea = false;
      isSkillsSection = /skills|competencies|strengths/i.test(cleanHeader);
      htmlContent += `
        <div style="margin-top: 22px; margin-bottom: 10px;">
          <h4 style="font-size: 15px; font-weight: 700; text-transform: uppercase; color: #0f172a; margin: 0 0 4px 0; letter-spacing: 0.5px;">${inlineMarkdownToHtml(cleanHeader)}</h4>
          <div style="height: 2px; background-color: ${accentColor}; width: 100%;"></div>
        </div>
      `;
      continue;
    }

    const isListMatch = line.match(/^[\p{Pd}*+•]\s+/u);
    const isList = !!isListMatch;

    // Detect inline bullet points separated by bullet symbol • anywhere
    if (line.includes('•') && !isList) {
      const items = line.split('•').map(s => s.trim()).filter(Boolean);
      if (items.length >= 2) {
        closeList();
        htmlContent += renderTwoColumnHtml(items);
        continue;
      }
    }

    // If in Skills section, collect items for two-column layout
    if (isSkillsSection) {
      if (isList) {
        const itemContent = line.substring(isListMatch![0].length).trim();
        if (itemContent) accumulatedSkills.push(itemContent);
        continue;
      } else if (line.includes(',')) {
        const items = line.split(',').map(s => s.trim()).filter(Boolean);
        if (items.length >= 3) {
          accumulatedSkills.push(...items);
          continue;
        }
      }
    }

    // Experience Row Detection (Title | Company | Date)
    const hasPipe = line.includes('|');

    if (!isHeaderArea && hasPipe && dateRegex.test(line)) {
      closeList();
      let cleanLine = line.replace(/^\*\*/, '').replace(/\*\*$/, '');
      if (isListMatch) {
        cleanLine = cleanLine.substring(isListMatch[0].length);
      }

      const parts = cleanLine.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        const leftPart = parts.slice(0, parts.length - 1).join(' | ');
        let rightPart = parts[parts.length - 1];
        let descriptionPart = '';

        const dateMatch = rightPart.match(dateRegex);
        if (dateMatch) {
          const dateEndIndex = dateMatch.index! + dateMatch[0].length;
          const afterDate = rightPart.substring(dateEndIndex).trim();
          if (afterDate) {
            descriptionPart = afterDate.replace(/^[:\-–—.,;]\s*/, '').trim();
            rightPart = rightPart.substring(0, dateEndIndex).trim();
          }
        }

        htmlContent += `
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; margin-bottom: 4px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${inlineMarkdownToHtml(leftPart)}</div>
            <div style="font-weight: 700; color: ${accentColor}; font-size: 12.5px; white-space: nowrap; margin-left: 16px;">${inlineMarkdownToHtml(rightPart)}</div>
          </div>
        `;

        if (descriptionPart) {
          htmlContent += `<p style="margin: 0 0 6px 0; color: #334155;">${inlineMarkdownToHtml(descriptionPart)}</p>`;
        }
        continue;
      }
    }

    // Bullet List Item
    if (isList) {
      const content = line.substring(isListMatch![0].length).trim();
      if (!inList) {
        htmlContent += '<ul style="margin: 4px 0 8px 0; padding-left: 20px; color: #334155;">';
        inList = true;
      }
      htmlContent += `<li style="margin-bottom: 4px; line-height: 1.5;">${inlineMarkdownToHtml(content)}</li>`;
      continue;
    }

    // Regular Paragraph
    closeList();
    if (isHeaderArea) {
      htmlContent += `<p style="text-align: center; margin: 0 0 6px 0; color: #475569; font-size: 13px;">${inlineMarkdownToHtml(line)}</p>`;
    } else {
      htmlContent += `<p style="margin: 0 0 8px 0; color: #334155;">${inlineMarkdownToHtml(line)}</p>`;
    }
  }

  closeList();
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById('pdf-export-container');
        if (clonedEl) {
          clonedEl.style.position = 'static';
          clonedEl.style.left = '0px';
          clonedEl.style.top = '0px';
          clonedEl.style.opacity = '1';
          clonedEl.style.visibility = 'visible';
        }
      }
    });

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('html2canvas generated empty image canvas');
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    return pdf.output('blob');
  } catch (err) {
    console.warn('html2canvas PDF generation warning, falling back to direct jsPDF builder:', err);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    return generateDirectPdfFallback(sanitizedText, accentColor);
  }
};

function generateDirectPdfFallback(sanitizedText: string, accentColorHex: string): Blob {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const cleanHex = accentColorHex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2) || 'D6', 16);
  const g = parseInt(cleanHex.substring(2, 4) || '9E', 16);
  const b = parseInt(cleanHex.substring(4, 6) || '2E', 16);

  const lines = sanitizedText.split('\n');
  let y = 20;
  const margin = 15;
  const pageWidth = 210;
  const maxLineWidth = pageWidth - margin * 2;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      y += 5;
      if (y > 275) { pdf.addPage(); y = 20; }
      continue;
    }

    if (trimmed.startsWith('# ')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      const titleText = trimmed.replace('# ', '').replace(/\*/g, '');
      pdf.text(titleText, pageWidth / 2, y, { align: 'center' });
      y += 10;
    } else if (trimmed.startsWith('## ')) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(r, g, b);
      const subtitleText = trimmed.replace('## ', '').replace(/\*/g, '');
      pdf.text(subtitleText, margin, y);
      y += 2;
      pdf.setDrawColor(r, g, b);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
    } else if (trimmed.includes('•') && trimmed.split('•').length >= 3) {
      const items = trimmed.split('•').map(s => s.trim()).filter(Boolean);
      const mid = Math.ceil(items.length / 2);
      const colWidth = maxLineWidth / 2 - 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      
      const maxRows = Math.max(mid, items.length - mid);
      for (let r = 0; r < maxRows; r++) {
        const leftItem = items[r];
        const rightItem = items[r + mid];
        if (leftItem) {
          pdf.text(`• ${leftItem}`, margin, y, { maxWidth: colWidth });
        }
        if (rightItem) {
          pdf.text(`• ${rightItem}`, margin + maxLineWidth / 2 + 5, y, { maxWidth: colWidth });
        }
        y += 5.5;
        if (y > 275) { pdf.addPage(); y = 20; }
      }
      y += 3;
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(51, 65, 85);
      const cleanLine = trimmed.replace(/^[#*+•-]\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1');
      const splitLines = pdf.splitTextToSize(cleanLine, maxLineWidth);
      for (let sLine of splitLines) {
        pdf.text(sLine, margin, y);
        y += 6;
        if (y > 275) { pdf.addPage(); y = 20; }
      }
    }

    if (y > 275) {
      pdf.addPage();
      y = 20;
    }
  }

  return pdf.output('blob');
}
