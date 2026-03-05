import React, {useState} from 'react';
import {generateZPL} from '../utils/zplGenerator';
import {usePrinter} from '../context/PrinterContext';
import {useTheme} from '../context/ThemeContext';
import Toast from 'react-native-toast-message';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
  {id: '4x3', label: 'Fact Tag', widthIn: 4, heightIn: 3},
  {id: '1.25x1', label: '1x1 Label', widthIn: 1.25, heightIn: 1},
];

export default function EditorScreen() {
  const theme = useTheme();
  const [lines, setLines] = useState<TextLine[]>([]);
  const [selectedSize, setSelectedSize] = useState<LabelSize>(LABEL_SIZES[0]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'center' | 'bottom'>('top');
  const [zplOutput, setZplOutput] = useState<string>('');
  const {connectAndPrint, printerMac} = usePrinter();
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);

  const printLabel = async () => {
    if (!printerMac) {
      Toast.show({type: 'error', text1: 'No Printer', text2: 'Please configure a printer first via the Printer Setup screen.'});
      return;
    }
    if (lines.length === 0) {
      Toast.show({type: 'error', text1: 'Empty Label', text2: 'Please add at least one line before printing.'});
      return;
    }
    try {
      const zpl = generateZPL(lines, selectedSize.widthIn, selectedSize.heightIn, orientation, verticalAlign);
      await connectAndPrint(zpl);
      Toast.show({type: 'success', text1: 'Label Printed'});
    } catch {
      Toast.show({type: 'error', text1: 'Print Failed', text2: 'Could not connect to printer. Make sure it is powered on.'});
    }
  };

  const addLine = () => {
    setLines(prev => [...prev, {id: Date.now().toString(), content: '', fontSize: 'large', align: 'left', bold: false}]);
  };

  const updateLine = (id: string, changes: Partial<TextLine>) => {
    setLines(prev => prev.map(line => (line.id === id ? {...line, ...changes} : line)));
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
    const zpl = generateZPL(lines, selectedSize.widthIn, selectedSize.heightIn, orientation, verticalAlign);
    setZplOutput(zpl);
  };

  const s = makeStyles(theme);

  return (
    <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'android' ? 'padding' : 'padding'}
        keyboardVerticalOffset={80}>
      <View style={s.container}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

          {/* Label Settings */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Label Settings</Text>

            <Text style={s.label}>Size</Text>
            <TouchableOpacity
              style={s.dropdownBtn}
              onPress={() => setSizeDropdownOpen(prev => !prev)}>
              <Text style={s.dropdownBtnText}>{selectedSize.label}</Text>
              <Text style={s.dropdownArrow}>{sizeDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {sizeDropdownOpen && (
              <View style={s.dropdownList}>
                {LABEL_SIZES.map(size => (
                  <TouchableOpacity
                    key={size.id}
                    style={[s.dropdownItem, selectedSize.id === size.id && s.dropdownItemActive]}
                    onPress={() => {
                      setSelectedSize(size);
                      setSizeDropdownOpen(false);
                    }}>
                    <Text style={[s.dropdownItemText, selectedSize.id === size.id && s.dropdownItemTextActive]}>
                      {size.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={s.label}>Orientation</Text>
            <View style={s.row}>
              {(['landscape', 'portrait'] as const).map(o => (
                <TouchableOpacity
                  key={o}
                  style={[s.chip, orientation === o && s.chipActive]}
                  onPress={() => setOrientation(o)}>
                  <Text style={[s.chipText, orientation === o && s.chipTextActive]}>
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Vertical Alignment</Text>
            <View style={s.row}>
              {(['top', 'center', 'bottom'] as const).map(v => (
                <TouchableOpacity
                  key={v}
                  style={[s.chip, verticalAlign === v && s.chipActive]}
                  onPress={() => setVerticalAlign(v)}>
                  <Text style={[s.chipText, verticalAlign === v && s.chipTextActive]}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {lines.length === 0 && (
            <Text style={s.emptyText}>No lines yet. Tap + Add Line to begin.</Text>
          )}

          {lines.map((line, index) => (
            <View key={line.id} style={s.card}>
              <TextInput
                style={s.textInput}
                value={line.content}
                onChangeText={text => updateLine(line.id, {content: text})}
                placeholder="Enter text..."
                placeholderTextColor={theme.placeholder}
              />

              <View style={s.row}>
                <Text style={s.label}>Size:</Text>
                {FONT_SIZES.map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[s.chip, line.fontSize === size && s.chipActive]}
                    onPress={() => updateLine(line.id, {fontSize: size})}>
                    <Text style={[s.chipText, line.fontSize === size && s.chipTextActive]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.row}>
                <Text style={s.label}>Align:</Text>
                {ALIGNMENTS.map(align => (
                  <TouchableOpacity
                    key={align}
                    style={[s.chip, line.align === align && s.chipActive]}
                    onPress={() => updateLine(line.id, {align})}>
                    <Text style={[s.chipText, line.align === align && s.chipTextActive]}>
                      {align}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.row}>
                <TouchableOpacity
                  style={[s.chip, line.bold && s.chipActive]}
                  onPress={() => updateLine(line.id, {bold: !line.bold})}>
                  <Text style={[s.chipText, line.bold && s.chipTextActive]}>Bold</Text>
                </TouchableOpacity>
                <View style={s.spacer} />
                <TouchableOpacity style={s.iconBtn} onPress={() => moveLine(index, 'up')} disabled={index === 0}>
                  <Text style={[s.iconText, index === 0 && s.dimmed]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => moveLine(index, 'down')} disabled={index === lines.length - 1}>
                  <Text style={[s.iconText, index === lines.length - 1 && s.dimmed]}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => deleteLine(line.id)}>
                  <Text style={s.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Preview */}
          {lines.length > 0 && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>Preview</Text>
              <View
                style={[
                  s.previewBox,
                  // eslint-disable-next-line react-native/no-inline-styles
                  {
                    aspectRatio: orientation === 'landscape'
                      ? selectedSize.widthIn / selectedSize.heightIn
                      : selectedSize.heightIn / selectedSize.widthIn,
                    justifyContent: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'space-evenly',
                  },
                ]}>
                {lines.map(line => (
                  <Text
                    key={line.id}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      width: '100%',
                      color: theme.text,
                      fontSize: fontSizeMap[line.fontSize],
                      textAlign: line.align,
                      fontWeight: line.bold ? 'bold' : 'normal',
                    }}>
                    {line.content || ' '}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* ZPL Output */}
          {zplOutput !== '' && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>ZPL Output</Text>
              <Text selectable style={s.zplText}>{zplOutput}</Text>
            </View>
          )}

        </ScrollView>

        <View style={s.buttonRow}>
          <TouchableOpacity style={s.addButton} onPress={addLine}>
            <Text style={s.buttonText}>+ Add Line</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.zplButton} onPress={previewZPL}>
            <Text style={s.buttonText}>Generate ZPL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.printButton, !printerMac && s.printButtonDisabled]}
            onPress={printLabel}>
            <Text style={s.buttonText}>Print</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof import('../context/ThemeContext').useTheme>) => StyleSheet.create({
  container: {flex: 1, backgroundColor: theme.background},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 12},
  emptyText: {textAlign: 'center', color: theme.subtext, marginTop: 40, fontSize: 16},
  card: {backgroundColor: theme.card, borderRadius: 8, padding: 12, gap: 10, elevation: 2},
  textInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.card,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'},
  label: {fontSize: 13, color: theme.subtext, marginRight: 4},
  sectionTitle: {fontSize: 13, color: theme.subtext, fontWeight: '600'},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.chipBorder,
    backgroundColor: theme.chipBg,
  },
  chipActive: {backgroundColor: theme.primary, borderColor: theme.primary},
  chipText: {fontSize: 13, color: theme.chipText},
  chipTextActive: {color: '#fff'},
  spacer: {flex: 1},
  iconBtn: {padding: 6},
  iconText: {fontSize: 18, color: theme.text},
  dimmed: {color: theme.disabled},
  deleteBtn: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: theme.dangerBg},
  deleteBtnText: {color: theme.danger, fontWeight: 'bold'},
  previewBox: {
    width: '100%',
    backgroundColor: theme.previewBg,
    borderWidth: 1,
    borderColor: theme.previewBorder,
    padding: 8,
  },
  buttonRow: {flexDirection: 'row', gap: 8, margin: 16},
  addButton: {flex: 1, backgroundColor: theme.primary, borderRadius: 8, padding: 16, alignItems: 'center'},
  zplButton: {flex: 1, backgroundColor: theme.success, borderRadius: 8, padding: 16, alignItems: 'center'},
  printButton: {flex: 1, backgroundColor: theme.danger, borderRadius: 8, padding: 16, alignItems: 'center'},
  printButtonDisabled: {backgroundColor: theme.disabled},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  zplText: {fontFamily: 'monospace', fontSize: 11, color: theme.text},
dropdownBtn: {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  borderWidth: 1,
  borderColor: theme.border,
  borderRadius: 8,
  padding: 10,
  backgroundColor: theme.card,
},
dropdownBtnText: {color: theme.text, fontSize: 14},
dropdownArrow: {color: theme.subtext, fontSize: 12},
dropdownList: {
  borderWidth: 1,
  borderColor: theme.border,
  borderRadius: 8,
  overflow: 'hidden' as const,
  backgroundColor: theme.card,
},
dropdownItem: {
  padding: 12,
  borderBottomWidth: 1,
  borderBottomColor: theme.border,
},
dropdownItemActive: {backgroundColor: theme.primary},
dropdownItemText: {color: theme.text, fontSize: 14},
dropdownItemTextActive: {color: '#fff'},
});