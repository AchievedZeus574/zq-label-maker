const DPI = 203;
const inchesToDots = (inches: number): number => Math.round(inches * DPI);

type TextLine = {
  content: string;
  fontSize: 'small' | 'medium' | 'large';
  align: 'left' | 'center' | 'right';
  bold: boolean;
};

type Orientation = 'portrait' | 'landscape';
type VerticalAlign = 'top' | 'center' | 'bottom';

const fontHeightMap = {small: 20, medium: 35, large: 55};

export function generateZPL(
  lines: TextLine[],
  widthIn: number,
  heightIn: number,
  orientation: Orientation,
  verticalAlign: VerticalAlign,
): string {
  // Printer physically feeds in landscape, so always swap width/height
  const labelWidthDots = inchesToDots(widthIn);
  const labelHeightDots = inchesToDots(heightIn);
  const visibleHeight = orientation === 'landscape' ? labelHeightDots : labelWidthDots;
  const paddingDots = 13;
  const usableWidth = orientation === 'portrait'
  ? labelHeightDots - paddingDots * 2
  : labelWidthDots - paddingDots * 2;

  const lineHeights = lines.map(l => fontHeightMap[l.fontSize]);
  const lineGap = 10;
  const totalTextHeight =
    lineHeights.reduce((a, b) => a + b, 0) +
    lineGap * Math.max(lines.length - 1, 0);

  const alignMap = {left: 'L', center: 'C', right: 'R'};

  let startX: number;
  let startY: number;

  if (orientation === 'landscape') {
    // Landscape: text runs left to right across wide dimension
    // X is horizontal padding, Y is vertical position
    startY =
      verticalAlign === 'top'
        ? paddingDots
        : verticalAlign === 'bottom'
        ? visibleHeight - paddingDots - totalTextHeight
      : Math.round((visibleHeight - totalTextHeight) / 2);
    startX = paddingDots;
  } else {
    // Portrait: text rotated 90°, runs along narrow dimension
    // X becomes the vertical axis, Y becomes horizontal
    startX =
      verticalAlign === 'top'
        ? paddingDots
        : verticalAlign === 'bottom'
        ? labelWidthDots - paddingDots - totalTextHeight
        : Math.round((labelWidthDots - totalTextHeight) / 2);
    startY = paddingDots;
  }

  let zpl = '';
  zpl += '^XA\n';
  zpl += '^POI\n';   // Compensate for inverted printer loading
  zpl += '^MNA\n';   // Auto-detect media type
  zpl += '^PQ1\n';   // Print exactly 1 label
  zpl += '^LH0,0\n';
  zpl += `^PW${labelWidthDots}\n`;
  zpl += `^LL${labelHeightDots}\n`;

  let currentX = startX;
  let currentY = startY;
  lines.forEach(line => {
    const fontHeight = fontHeightMap[line.fontSize];
    const fontWidth = Math.round(fontHeight * 0.6);
    if (orientation === 'landscape') {
      zpl += `^FO${currentX},${currentY}\n`;
      zpl += `^A0N,${fontHeight},${fontWidth}\n`;
      zpl += `^FB${usableWidth},1,0,${alignMap[line.align]},0\n`;
      zpl += `^FD${line.content}^FS\n`;
      if (line.bold) {
        zpl += `^FO${currentX + 1},${currentY}\n`
        zpl += `^A0N,${fontHeight},${fontWidth}\n`;
        zpl += `^FB${usableWidth},1,0,${alignMap[line.align]},0\n`;
        zpl += `^FD${line.content}^FS\n`;
      }
      currentY += fontHeight + lineGap;
    } else {
      const portraitX =
        verticalAlign === 'top'
          ? (labelWidthDots - paddingDots) - fontHeight - (lines.indexOf(line) * (fontHeight + lineGap))
          : verticalAlign === 'bottom'
          ? paddingDots + ((lines.length - 1 - lines.indexOf(line)) * (fontHeight + lineGap))
          : Math.round((labelWidthDots - totalTextHeight) / 2) + totalTextHeight - fontHeight - (lines.indexOf(line) * (fontHeight + lineGap));
      zpl += `^FO${portraitX},${paddingDots}\n`;
      zpl += `^A0R,${fontHeight},${fontWidth}\n`;
      zpl += `^FB${usableWidth},1,0,${alignMap[line.align]},0\n`;
      zpl += `^FD${line.content}^FS\n`;
      if (line.bold) {
        zpl += `^FO${portraitX},${paddingDots + 1}\n`;
        zpl += `^A0R,${fontHeight},${fontWidth}\n`;
        zpl += `^FB${usableWidth},1,0,${alignMap[line.align]},0\n`;
        zpl += `^FD${line.content}^FS\n`;
      }
    }
  });

  zpl += '^XZ\n';
  return zpl;
}