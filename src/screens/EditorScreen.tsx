import React, {useState} from 'react';
import {generateZPL} from '../utils/zplGenerator';
import {usePrinter} from '../context/PrinterContext';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';

type TextLine = {
  id: string;
  content: string;
  fontSize: 'small' | 'medium' | 'large';
  align: 'left' | 'center' | 'right';
  bold: boolean;
};

const FONT_SIZES = ['small', 'medium', 'large'] as const;
const ALIGNMENTS = ['left', 'center', 'right'] as const;

const fontSizeMap = {small: 14, medium: 20, large: 28};

type LabelSize = {
  id: string;
  label: string;
  widthIn: number;
  heightIn: number;
};

const LABEL_SIZES: LabelSize[] = [
  {id: '2x1.25', label: 'Shelf Label', widthIn: 2, heightIn: 1.25},
  {id: '3x2', label: 'VizPick Label', widthIn: 3, heightIn: 2},
];

export default function EditorScreen() {
  const [lines, setLines] = useState<TextLine[]>([]);
  const [selectedSize, setSelectedSize] = useState<LabelSize>(LABEL_SIZES[0]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'center' | 'bottom'>('center');
  const [zplOutput, setZplOutput] = useState<string>('');
  const {printer, isConnected} = usePrinter();


  const printLabel = async () => {
  if (!printer || !isConnected) {
    Alert.alert('No Printer', 'Please connect to a printer first via the Printer Setup screen.');
    return;
  }
  if (lines.length === 0) {
    Alert.alert('Empty Label', 'Please add at least one line before printing.');
    return;
  }
  try {
    const zpl = generateZPL(
      lines,
      selectedSize.widthIn,
      selectedSize.heightIn,
      orientation,
      verticalAlign,
    );
    await printer.write(zpl);
    Alert.alert('Success', 'Label sent to printer.');
  } catch {
    Alert.alert('Print Failed', 'Could not send to printer. Check that it is still connected.');
  }
};

  const addLine = () => {
    setLines(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        content: '',
        fontSize: 'large',
        align: 'left',
        bold: false,
      },
    ]);
  };

  const updateLine = (id: string, changes: Partial<TextLine>) => {
    setLines(prev =>
      prev.map(line => (line.id === id ? {...line, ...changes} : line)),
    );
  };

  const deleteLine = (id: string) => {
    setLines(prev => prev.filter(line => line.id !== id));
  };

  const moveLine = (index: number, direction: 'up' | 'down') => {
    const newLines = [...lines];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLines.length) return;
    [newLines[index], newLines[swapIndex]] = [newLines[swapIndex], newLines[index]];
    setLines(newLines);
  };

  const previewZPL = () => {
  const zpl = generateZPL(
    lines,
    selectedSize.widthIn,
    selectedSize.heightIn,
    orientation,
    verticalAlign,
  );
    setZplOutput(zpl);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Label Size Selector */}
{/* Label Settings */}
<View style={styles.sizeSelector}>
  <Text style={styles.sectionTitle}>Label Settings</Text>
  
  <Text style={styles.label}>Size</Text>
  <View style={styles.row}>
    {LABEL_SIZES.map(size => (
      <TouchableOpacity
        key={size.id}
        style={[styles.chip, selectedSize.id === size.id && styles.chipActive]}
        onPress={() => setSelectedSize(size)}>
        <Text style={[styles.chipText, selectedSize.id === size.id && styles.chipTextActive]}>
          {size.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  <Text style={styles.label}>Orientation</Text>
  <View style={styles.row}>
    {(['landscape', 'portrait'] as const).map(o => (
      <TouchableOpacity
        key={o}
        style={[styles.chip, orientation === o && styles.chipActive]}
        onPress={() => setOrientation(o)}>
        <Text style={[styles.chipText, orientation === o && styles.chipTextActive]}>
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  <Text style={styles.label}>Vertical Alignment</Text>
  <View style={styles.row}>
    {(['top', 'center', 'bottom'] as const).map(v => (
      <TouchableOpacity
        key={v}
        style={[styles.chip, verticalAlign === v && styles.chipActive]}
        onPress={() => setVerticalAlign(v)}>
        <Text style={[styles.chipText, verticalAlign === v && styles.chipTextActive]}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
        {lines.length === 0 && (
          <Text style={styles.emptyText}>No lines yet. Tap + Add Line to begin.</Text>
        )}

        {lines.map((line, index) => (
          <View key={line.id} style={styles.lineCard}>

            {/* Text Input */}
            <TextInput
              style={styles.textInput}
              value={line.content}
              onChangeText={text => updateLine(line.id, {content: text})}
              placeholder="Enter text..."
              placeholderTextColor="#999"
            />

            {/* Font Size */}
            <View style={styles.row}>
              <Text style={styles.label}>Size:</Text>
              {FONT_SIZES.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[styles.chip, line.fontSize === size && styles.chipActive]}
                  onPress={() => updateLine(line.id, {fontSize: size})}>
                  <Text style={[styles.chipText, line.fontSize === size && styles.chipTextActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Alignment */}
            <View style={styles.row}>
              <Text style={styles.label}>Align:</Text>
              {ALIGNMENTS.map(align => (
                <TouchableOpacity
                  key={align}
                  style={[styles.chip, line.align === align && styles.chipActive]}
                  onPress={() => updateLine(line.id, {align})}>
                  <Text style={[styles.chipText, line.align === align && styles.chipTextActive]}>
                    {align}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bold + Move + Delete */}
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.chip, line.bold && styles.chipActive]}
                onPress={() => updateLine(line.id, {bold: !line.bold})}>
                <Text style={[styles.chipText, line.bold && styles.chipTextActive]}>Bold</Text>
              </TouchableOpacity>
              <View style={styles.spacer} />
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => moveLine(index, 'up')}
                disabled={index === 0}>
                <Text style={[styles.iconText, index === 0 && styles.disabled]}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => moveLine(index, 'down')}
                disabled={index === lines.length - 1}>
                <Text style={[styles.iconText, index === lines.length - 1 && styles.disabled]}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteLine(line.id)}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

          </View>
        ))}
        {/* Preview */}
{lines.length > 0 && (
  <View style={styles.sizeSelector}>
    <Text style={styles.sectionTitle}>Preview</Text>
    <View
  style={[
    styles.previewBox,
    // eslint-disable-next-line react-native/no-inline-styles
    {
      aspectRatio:
        orientation === 'landscape'
          ? selectedSize.widthIn / selectedSize.heightIn
          : selectedSize.heightIn / selectedSize.widthIn,
      justifyContent:
        verticalAlign === 'top'
          ? 'flex-start'
          : verticalAlign === 'bottom'
          ? 'flex-end'
          : 'space-evenly',
    },
  ]}>
      {lines.map(line => (
        <Text
          key={line.id}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.previewText,
            // eslint-disable-next-line react-native/no-inline-styles
            {
              fontSize: fontSizeMap[line.fontSize],
              textAlign: line.align,
              fontWeight: line.bold ? 'bold' : 'normal',
            },
          ]}>
          {line.content || ' '}
        </Text>
      ))}
    </View>
  </View>
)}
{/* ZPL Output */}
{zplOutput !== '' && (
  <View style={styles.sizeSelector}>
    <Text style={styles.sectionTitle}>ZPL Output</Text>
    <Text selectable style={styles.zplText}>{zplOutput}</Text>
  </View>
)}
      </ScrollView>

<View style={styles.buttonRow}>
  <TouchableOpacity style={styles.addButton} onPress={addLine}>
    <Text style={styles.addButtonText}>+ Add Line</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.zplButton} onPress={previewZPL}>
    <Text style={styles.addButtonText}>Generate ZPL</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.printButton, !isConnected && styles.printButtonDisabled]}
    onPress={printLabel}>
    <Text style={styles.addButtonText}>Print</Text>
  </TouchableOpacity>
</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 12},
  emptyText: {textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16},
  lineCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    elevation: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    color: '#333',
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'},
  label: {fontSize: 13, color: '#666', marginRight: 4},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  chipActive: {backgroundColor: '#1a73e8', borderColor: '#1a73e8'},
  chipText: {fontSize: 13, color: '#444'},
  chipTextActive: {color: '#fff'},
  spacer: {flex: 1},
  iconBtn: {padding: 6},
  iconText: {fontSize: 18, color: '#555'},
  disabled: {color: '#ccc'},
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteBtnText: {color: '#dc2626', fontWeight: 'bold'},
  addButton: {
    felx: 1,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  sizeSelector: {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 12,
  gap: 8,
  elevation: 2,
  marginBottom: 4,
},
sectionTitle: {fontSize: 13, color: '#666', fontWeight: '600'},
previewBox: {
  width: '100%',
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#333',
  padding: 8,
},
previewText: {
  width: '100%',
  color: '#000',
},
buttonRow: {
  flexDirection: 'row',
  gap: 8,
  margin: 16,
},
zplButton: {
  flex: 1,
  backgroundColor: '#16a34a',
  borderRadius: 8,
  padding: 16,
  alignItems: 'center',
},
zplText: {
  fontFamily: 'monospace',
  fontSize: 11,
  color: '#333',
},
printButton: {
  flex: 1,
  backgroundColor: '#dc2626',
  borderRadius: 8,
  padding: 16,
  alignItems: 'center',
},
printButtonDisabled: {
  backgroundColor: '#ccc',
},
});