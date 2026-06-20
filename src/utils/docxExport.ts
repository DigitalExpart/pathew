import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

function parseInlineFormatting(text: string): TextRun[] {
  const tokens: TextRun[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const italicMatch1 = remaining.match(/\*(.*?)\*/);
    const italicMatch2 = remaining.match(/_(.*?)_/);
    
    let bestMatch: any = null;
    let type = '';
    
    if (boldMatch && (!bestMatch || boldMatch.index! < bestMatch.index!)) {
      bestMatch = boldMatch;
      type = 'bold';
    }
    if (italicMatch1 && (!bestMatch || italicMatch1.index! < bestMatch.index!)) {
      bestMatch = italicMatch1;
      type = 'italic';
    }
    if (italicMatch2 && (!bestMatch || italicMatch2.index! < bestMatch.index!)) {
      bestMatch = italicMatch2;
      type = 'italic';
    }
    
    if (bestMatch && bestMatch.index !== undefined) {
      if (bestMatch.index > 0) {
        tokens.push(new TextRun({ text: remaining.substring(0, bestMatch.index) }));
      }
      if (type === 'bold') {
        tokens.push(new TextRun({ text: bestMatch[1], bold: true }));
      } else {
        tokens.push(new TextRun({ text: bestMatch[1], italics: true }));
      }
      remaining = remaining.substring(bestMatch.index + bestMatch[0].length);
    } else {
      tokens.push(new TextRun({ text: remaining }));
      remaining = '';
    }
  }
  
  return tokens.length > 0 ? tokens : [new TextRun({ text })];
}

export const generateDocxBlob = async (markdownText: string, accentColorHex: string = "D69E2E", documentType: string = 'cv'): Promise<Blob> => {
  if (documentType === 'cover_letter') {
    return generateCoverLetterDocx(markdownText, accentColorHex);
  }

  const lines = markdownText.split('\n');
  const children: any[] = [];
  
  let isHeaderArea = true;
  let emptyLineCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine.replace(/\u00A0/g, ' ').trim();
    
    // Ignore simple decorative lines completely
    if (line.match(/^[-=_*]{3,}$/)) {
      isHeaderArea = false; // A decorative line definitively ends the header area
      continue;
    }
    
    if (!line) {
      emptyLineCount++;
      if (emptyLineCount >= 2 && isHeaderArea) {
        isHeaderArea = false; // Two blank lines end the header area
      }
      continue;
    }
    emptyLineCount = 0;
    
    const cleanHeader = line.replace(/^[#]+ /, '').replace(/\*/g, '').trim();

    // H1 (Name or Professional Title)
    if (line.startsWith('# ')) {
      // If it contains a pipe or is very long, it's a Professional Title
      if (cleanHeader.includes('|') || cleanHeader.length > 50) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanHeader, bold: true, size: 24, color: accentColorHex })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          })
        );
      } else {
        // Main Name
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanHeader.toUpperCase(), bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          })
        );
      }
      continue;
    }
    
    // H2 (Professional Title or Section Header)
    if (line.startsWith('## ')) {
      // If it's all caps and short and doesn't contain a pipe, it's a Section Title
      if (cleanHeader === cleanHeader.toUpperCase() && cleanHeader.length < 50 && !cleanHeader.includes('|')) {
        isHeaderArea = false;
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanHeader, bold: true, size: 26 })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 240, after: 120 },
            border: { bottom: { color: accentColorHex, space: 4, style: BorderStyle.SINGLE, size: 12 } }
          })
        );
      } else {
        // Professional Title (Subtitle)
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanHeader, bold: true, size: 24, color: accentColorHex })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          })
        );
      }
      continue;
    }
    
    // H3 (Contact Info)
    if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanHeader, bold: false, size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      );
      continue;
    }

    // H4 (Section Header)
    if (line.startsWith('#### ')) {
      isHeaderArea = false;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanHeader, bold: true, size: 26 })],
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 120 },
          border: { bottom: { color: accentColorHex, space: 4, style: BorderStyle.SINGLE, size: 12 } }
        })
      );
      continue;
    }

    // Fallback detection for Section Headers that are plain text
    // Allow uppercase detection if it's short, doesn't contain a pipe, and not a date
    const isUppercaseHeader = cleanHeader.length > 0 && cleanHeader.length < 60 && cleanHeader === cleanHeader.toUpperCase() && !cleanHeader.includes('|') && !cleanHeader.match(/\d{4}/);
    
    // Only apply uppercase fallback if we are OUTSIDE the header area, or if it explicitly looks like a section header like "PROFESSIONAL SUMMARY"
    if (isUppercaseHeader && (!isHeaderArea || cleanHeader === 'PROFESSIONAL SUMMARY' || cleanHeader === 'EDUCATION' || cleanHeader === 'WORK EXPERIENCE')) {
      isHeaderArea = false;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanHeader, bold: true, size: 26 })],
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 120 },
          border: { bottom: { color: accentColorHex, space: 4, style: BorderStyle.SINGLE, size: 12 } }
        })
      );
      continue;
    }
    
    const isListMatch = line.match(/^[\p{Pd}*+•]\s+/u);
    const isList = !!isListMatch;
    const hasPipe = line.includes('|');
    const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}|Present|Current)/i;
    
    // Check if it's an entry row with dates
    if (!isHeaderArea && hasPipe && dateRegex.test(line)) {
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
        
        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: parseInlineFormatting(leftPart),
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: rightPart,
                          bold: true,
                          color: accentColorHex,
                          size: 20,
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        });
        children.push(table);
        
        if (descriptionPart) {
          children.push(
            new Paragraph({
              children: parseInlineFormatting(descriptionPart),
              alignment: AlignmentType.LEFT,
              spacing: { before: 60, after: 120 }
            })
          );
        } else {
          children.push(new Paragraph({ spacing: { after: 60 } }));
        }
        continue;
      }
    }
    
    // Normal paragraph or list item
    if (isList) {
      children.push(
        new Paragraph({
          children: parseInlineFormatting(line.substring(isListMatch![0].length).trim()),
          numbering: {
            reference: "dash-bullet",
            level: 0
          },
          alignment: AlignmentType.LEFT,
          spacing: { after: 60 }
        })
      );
    } else if (isHeaderArea) {
      children.push(
        new Paragraph({
          children: parseInlineFormatting(line),
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 }
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: parseInlineFormatting(line),
          alignment: AlignmentType.LEFT,
          spacing: { after: 120 }
        })
      );
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "dash-bullet",
          levels: [
            {
              level: 0,
              format: "bullet",
              text: "•", // Standard bullet dot
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt
            color: "2D3748"
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          }
        }
      },
      children: children
    }]
  });

  return await Packer.toBlob(doc);
};

async function generateCoverLetterDocx(markdownText: string, accentColorHex: string): Promise<Blob> {
  const lines = markdownText.split('\n');
  const children: any[] = [];
  
  let state = 'HEADER';
  
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine.replace(/\u00A0/g, ' ').trim();
    
    if (line.match(/^[-=_*]{3,}$/)) continue;
    
    if (!line) {
      children.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }
    
    const cleanHeader = line.replace(/^[#]+ /, '').replace(/\*/g, '').trim();

    if (state === 'HEADER') {
      // If we see something that doesn't look like a header/contact, move to ADDRESS
      if (!line.startsWith('#') && !line.includes('@') && !line.includes('•') && !line.includes('|')) {
        state = 'ADDRESS';
      }
    }
    
    if (state === 'BODY') {
      const lower = line.toLowerCase();
      if (lower.startsWith('sincerely') || lower.startsWith('best regards') || lower.startsWith('yours') || lower.startsWith('kind regards') || lower.startsWith('thank you,')) {
        state = 'CONCLUSION';
      }
    }

    let align: any = AlignmentType.LEFT;
    if (state === 'HEADER') align = AlignmentType.CENTER;
    else if (state === 'ADDRESS') align = AlignmentType.LEFT;
    else if (state === 'BODY') align = AlignmentType.CENTER;
    else if (state === 'CONCLUSION') align = AlignmentType.LEFT;

    if (line.startsWith('# ')) {
      if (cleanHeader.includes('|') || cleanHeader.length > 50) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanHeader, bold: true, size: 24, color: accentColorHex })],
            alignment: align,
            spacing: { after: 120 },
          })
        );
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanHeader.toUpperCase(), bold: true, size: 32 })],
            alignment: align,
            spacing: { after: 120 },
          })
        );
      }
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanHeader, bold: true, size: 24, color: accentColorHex })],
          alignment: align,
          spacing: { after: 120 },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: parseInlineFormatting(cleanHeader),
          alignment: align,
          spacing: { after: 120 }
        })
      );
    }

    // Transition out of ADDRESS if we just printed the salutation
    if (state === 'ADDRESS' && line.toLowerCase().startsWith('dear ')) {
      state = 'BODY';
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22, color: "2D3748" }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: children
    }]
  });

  return await Packer.toBlob(doc);
}
