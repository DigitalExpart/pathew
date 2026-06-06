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

export const generateDocxBlob = async (markdownText: string): Promise<Blob> => {
  const lines = markdownText.split('\n');
  const children: any[] = [];
  
  let isHeaderArea = true;
  let emptyLineCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine.trim();
    
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
    
    // Header 1 (Usually Name)
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace('# ', '').toUpperCase(),
              bold: true,
              size: 48,
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      );
      continue;
    }
    
    // Header 2 (Section Title) - Starts with ## OR is completely UPPERCASE and short
    const cleanHeader = line.replace(/^[#]+ /, '').replace(/\*/g, '').trim();
    // Allow uppercase detection if it's relatively short and doesn't contain a pipe
    const isUppercaseHeader = cleanHeader.length > 0 && cleanHeader.length < 60 && cleanHeader === cleanHeader.toUpperCase() && !cleanHeader.includes('|');
    
    if (line.startsWith('## ') || (!isHeaderArea && isUppercaseHeader)) {
      isHeaderArea = false;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanHeader,
              bold: true,
              size: 26,
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 120 },
          border: {
            bottom: {
              color: "D69E2E",
              space: 4,
              style: BorderStyle.SINGLE,
              size: 12, // 1.5 pt
            }
          }
        })
      );
      continue;
    }
    
    // Header 3
    if (line.startsWith('### ')) {
      isHeaderArea = false;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^###\s+/, ''),
              bold: true,
              size: 24,
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 120, after: 60 },
        })
      );
      continue;
    }
    
    const isList = line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ');
    const hasPipe = line.includes('|');
    const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}|Present|Current)/i;
    
    // Check if it's an entry row with dates
    if (!isList && !isHeaderArea && hasPipe && dateRegex.test(line)) {
      let cleanLine = line.replace(/^\*\*/, '').replace(/\*\*$/, '');
      const parts = cleanLine.split('|').map(p => p.trim());
      
      if (parts.length >= 2) {
        const leftPart = parts.slice(0, parts.length - 1).join(' | ');
        const rightPart = parts[parts.length - 1];
        
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
                  width: { size: 80, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: parseInlineFormatting(leftPart),
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({
                          text: rightPart,
                          bold: true,
                          color: "D69E2E",
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
        children.push(new Paragraph({ spacing: { after: 60 } })); // small spacing after the row
        continue;
      }
    }
    
    // Normal paragraph or list item
    if (isList) {
      children.push(
        new Paragraph({
          children: parseInlineFormatting(line.substring(2).trim()),
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
              text: "–", // En-dash
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 360, hanging: 360 },
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
