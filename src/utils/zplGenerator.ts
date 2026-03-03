// ZPL is measured in dots. The ZQ620 prints at 203 DPI by default.
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
  // For landscape, swap width and height so the label feeds correctly
  const labelWidthDots = inchesToDots(orientation === 'landscape' ? heightIn : widthIn);
  const labelHeightDots = inchesToDots(orientation === 'landscape' ? widthIn : heightIn);

  const paddingDots = 20;
  const usableWidth = labelWidthDots - paddingDots * 2;
  const usableHeight = labelHeightDots - paddingDots * 2;

  const lineHeights = lines.map(l => fontHeightMap[l.fontSize]);
  const lineGap = 10;
  const totalTextHeight =
    lineHeights.reduce((a, b) => a + b, 0) +
    lineGap * Math.max(lines.length - 1, 0);

  let startY: number;
  if (verticalAlign === 'top') {
    startY = paddingDots;
  } else if (verticalAlign === 'bottom') {
    startY = labelHeightDots - paddingDots - totalTextHeight;
  } else {
    startY = Math.round((labelHeightDots - totalTextHeight) / 2);
  }

  const alignMap = {left: 'L', center: 'C', right: 'R'};

  let zpl = '';
  zpl += '^XA\n';
  zpl += '^PON\n';          // Normal print orientation
  zpl += '^LH0,0\n';        // Home position
  zpl += `^PW${labelWidthDots}\n`;
  zpl += `^LL${labelHeightDots}\n`;

  let currentY = startY;

  lines.forEach(line => {
    const fontHeight = fontHeightMap[line.fontSize];
    const fontWidth = Math.round(fontHeight * 0.6);

    zpl += `^FO${paddingDots},${currentY}\n`;
    zpl += `^A0N,${fontHeight},${fontWidth}\n`;
    zpl += `^FB${usableWidth},1,0,${alignMap[line.align]},0\n`;
    zpl += `^FD${line.content}^FS\n`;

    currentY += fontHeight + lineGap;
  });

  zpl += '^XZ\n';

  return zpl;
}