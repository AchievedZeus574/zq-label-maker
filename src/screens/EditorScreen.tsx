/* eslint-disable react-native/no-inline-styles */
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

type LabelCard = {
  id: string;
  copies: number;
  collapsed: boolean;
  lines: TextLine[];
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

const newLabel = (): LabelCard => ({
  id: Date.now().toString(),
  copies: 1,
  collapsed: false,
  lines: [],
});

export default function EditorScreen() {
  const theme = useTheme();
  const {connectAndPrint, printerMac} = usePrinter();

  const [selectedSize, setSelectedSize] = useState<LabelSize>(LABEL_SIZES[0]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'center' | 'bottom'>('center');
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const [labels, setLabels] = useState<LabelCard[]>([newLabel()]);

  const updateLabel = (id: string, changes: Partial<LabelCard>) => {
    setLabels(prev => prev.map(l => l.id === id ? {...l, ...changes} : l));
  };

  const deleteLabel = (id: string) => {
    if (labels.length === 1) {
      Toast.show({type: 'error', text1: 'Cannot delete last label'});
      return;
    }
    setLabels(prev => prev.filter(l => l.id !== id));
  };

  const addLine = (labelId: string) => {
    setLabels(prev => prev.map(l => l.id === labelId ? {
      ...l,
      lines: [...l.lines, {
        id: Date.now().toString(),
        content: '',
        fontSize: 'large',
        align: 'left',
        bold: false,
      }],
    } : l));
  };

  const updateLine = (labelId: string, lineId: string, changes: Partial<TextLine>) => {
    setLabels(prev => prev.map(l => l.id === labelId ? {
      ...l,
      lines: l.lines.map(line => line.id === lineId ? {...line, ...changes} : line),
    } : l));
  };

  const deleteLine = (labelId: string, lineId: string) => {
    setLabels(prev => prev.map(l => l.id === labelId ? {
      ...l,
      lines: l.lines.filter(line => line.id !== lineId),
    } : l));
  };

  const moveLine = (labelId: string, index: number, direction: 'up' | 'down') => {
    setLabels(prev => prev.map(l => {
      if (l.id !== labelId) return l;
      const newLines = [...l.lines];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= newLines.length) return l;
      [newLines[index], newLines[swapIndex]] = [newLines[swapIndex], newLines[index]];
      return {...l, lines: newLines};
    }));
  };

  const printAll = async () => {
    if (!printerMac) {
      Toast.show({type: 'error', text1: 'No Printer', text2: 'Please configure a printer first.'});
      return;
    }
    const hasEmpty = labels.some(l => l.lines.length === 0);
    if (hasEmpty) {
      Toast.show({type: 'error', text1: 'Empty Label', text2: 'All labels must have at least one line.'});
      return;
    }
    try {
      const zpl = labels.map(label =>
        generateZPL(
          label.lines,
          selectedSize.widthIn,
          selectedSize.heightIn,
          orientation,
          verticalAlign,
          label.copies,
        )
      ).join('\n');
      await connectAndPrint(zpl);
      Toast.show({type: 'success', text1: 'Job Sent', text2: `${labels.length} label(s) sent to printer.`});
    } catch {
      Toast.show({type: 'error', text1: 'Print Failed', text2: 'Could not connect to printer. Make sure it is powered on.'});
    }
  };

  const s = makeStyles(theme);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
      keyboardVerticalOffset={85}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* Job Settings */}
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

        {/* Label Cards */}
        {labels.map((label, labelIndex) => (
          <View key={label.id} style={s.card}>

            {/* Label Header */}
            <TouchableOpacity
              style={s.labelHeader}
              onPress={() => updateLabel(label.id, {collapsed: !label.collapsed})}>
              <Text style={s.labelHeaderText}>
                Label {labelIndex + 1} {label.lines.length > 0 ? `— ${label.lines.length} line(s)` : '— empty'}
              </Text>
              <View style={s.labelHeaderRight}>
                {labels.length > 1 && (
                  <TouchableOpacity
                    style={s.deleteLabelBtn}
                    onPress={() => deleteLabel(label.id)}>
                    <Text style={s.deleteLabelText}>✕</Text>
                  </TouchableOpacity>
                )}
                <Text style={s.collapseArrow}>{label.collapsed ? '▼' : '▲'}</Text>
              </View>
            </TouchableOpacity>

            {!label.collapsed && (
              <>
                {/* Copy Count */}
                <View style={s.copyRow}>
                  <Text style={s.label}>Copies</Text>
                  <View style={s.copyControls}>
                    <TouchableOpacity
                      style={s.copyBtn}
                      onPress={() => updateLabel(label.id, {copies: Math.max(1, label.copies - 1)})}>
                      <Text style={s.copyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.copyCount}>{label.copies}</Text>
                    <TouchableOpacity
                      style={s.copyBtn}
                      onPress={() => updateLabel(label.id, {copies: label.copies + 1})}>
                      <Text style={s.copyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Lines */}
                {label.lines.length === 0 && (
                  <Text style={s.emptyText}>No lines yet. Tap + Add Line to begin.</Text>
                )}

                {label.lines.map((line, index) => (
                  <View key={line.id} style={s.lineCard}>
                    <TextInput
                      style={s.textInput}
                      value={line.content}
                      onChangeText={text => updateLine(label.id, line.id, {content: text})}
                      placeholder="Enter text..."
                      placeholderTextColor={theme.placeholder}
                    />
                    <View style={s.row}>
                      <Text style={s.label}>Size:</Text>
                      {FONT_SIZES.map(size => (
                        <TouchableOpacity
                          key={size}
                          style={[s.chip, line.fontSize === size && s.chipActive]}
                          onPress={() => updateLine(label.id, line.id, {fontSize: size})}>
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
                          onPress={() => updateLine(label.id, line.id, {align})}>
                          <Text style={[s.chipText, line.align === align && s.chipTextActive]}>
                            {align}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={s.row}>
                      <TouchableOpacity
                        style={[s.chip, line.bold && s.chipActive]}
                        onPress={() => updateLine(label.id, line.id, {bold: !line.bold})}>
                        <Text style={[s.chipText, line.bold && s.chipTextActive]}>Bold</Text>
                      </TouchableOpacity>
                      <View style={s.spacer} />
                      <TouchableOpacity
                        style={s.iconBtn}
                        onPress={() => moveLine(label.id, index, 'up')}
                        disabled={index === 0}>
                        <Text style={[s.iconText, index === 0 && s.dimmed]}>▲</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.iconBtn}
                        onPress={() => moveLine(label.id, index, 'down')}
                        disabled={index === label.lines.length - 1}>
                        <Text style={[s.iconText, index === label.lines.length - 1 && s.dimmed]}>▼</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={() => deleteLine(label.id, line.id)}>
                        <Text style={s.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Preview */}
                {label.lines.length > 0 && (
                  <View style={s.previewContainer}>
                    <Text style={s.label}>Preview</Text>
                    <View
                      style={[
                        s.previewBox,
                        {
                          aspectRatio: orientation === 'landscape'
                            ? selectedSize.widthIn / selectedSize.heightIn
                            : selectedSize.heightIn / selectedSize.widthIn,
                          justifyContent: verticalAlign === 'top' ? 'flex-start'
                            : verticalAlign === 'bottom' ? 'flex-end' : 'space-evenly',
                        },
                      ]}>
                      {label.lines.map(line => (
                        <Text
                          key={line.id}
                          numberOfLines={1}
                          adjustsFontSizeToFit
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

                {/* Add Line */}
                <TouchableOpacity style={s.addLineBtn} onPress={() => addLine(label.id)}>
                  <Text style={s.addLineBtnText}>+ Add Line</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

      </ScrollView>

      {/* Bottom Buttons */}
      <View style={s.buttonRow}>
        <TouchableOpacity
          style={s.addLabelButton}
          onPress={() => setLabels(prev => [...prev, newLabel()])}>
          <Text style={s.buttonText}>+ Add Label</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.printButton, !printerMac && s.printButtonDisabled]}
          onPress={printAll}>
          <Text style={s.buttonText}>Print</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ReturnType<typeof import('../context/ThemeContext').useTheme>) => ({
  container: {flex: 1, backgroundColor: theme.background},
  scroll: {flex: 1},
  scrollContent: {padding: 16, gap: 12},
  card: {backgroundColor: theme.card, borderRadius: 8, padding: 12, gap: 10, elevation: 2},
  lineCard: {backgroundColor: theme.background, borderRadius: 6, padding: 10, gap: 8, borderWidth: 1, borderColor: theme.border},
  sectionTitle: {fontSize: 13, color: theme.subtext, fontWeight: '600' as const},
  emptyText: {textAlign: 'center' as const, color: theme.subtext, fontSize: 14, paddingVertical: 8},
  label: {fontSize: 13, color: theme.subtext, marginRight: 4},
  row: {flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, flexWrap: 'wrap' as const},
  chip: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.chipBorder, backgroundColor: theme.chipBg},
  chipActive: {backgroundColor: theme.primary, borderColor: theme.primary},
  chipText: {fontSize: 13, color: theme.chipText},
  chipTextActive: {color: '#fff'},
  spacer: {flex: 1},
  iconBtn: {padding: 6},
  iconText: {fontSize: 18, color: theme.text},
  dimmed: {color: theme.disabled},
  deleteBtn: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: theme.dangerBg},
  deleteBtnText: {color: theme.danger, fontWeight: 'bold' as const},
  textInput: {borderWidth: 1, borderColor: theme.border, borderRadius: 6, padding: 8, fontSize: 16, color: theme.text, backgroundColor: theme.card},
  dropdownBtn: {flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, backgroundColor: theme.card},
  dropdownBtnText: {color: theme.text, fontSize: 14},
  dropdownArrow: {color: theme.subtext, fontSize: 12},
  dropdownList: {borderWidth: 1, borderColor: theme.border, borderRadius: 8, overflow: 'hidden' as const, backgroundColor: theme.card},
  dropdownItem: {padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border},
  dropdownItemActive: {backgroundColor: theme.primary},
  dropdownItemText: {color: theme.text, fontSize: 14},
  dropdownItemTextActive: {color: '#fff'},
  labelHeader: {flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const},
  labelHeaderText: {fontSize: 14, fontWeight: '600' as const, color: theme.text},
  labelHeaderRight: {flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12},
  deleteLabelBtn: {padding: 4},
  deleteLabelText: {color: theme.danger, fontSize: 16},
  collapseArrow: {color: theme.subtext, fontSize: 14},
  copyRow: {flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const},
  copyControls: {flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12},
  copyBtn: {width: 32, height: 32, borderRadius: 16, backgroundColor: theme.chipBg, borderWidth: 1, borderColor: theme.chipBorder, alignItems: 'center' as const, justifyContent: 'center' as const},
  copyBtnText: {fontSize: 18, color: theme.text, lineHeight: 22},
  copyCount: {fontSize: 16, color: theme.text, minWidth: 24, textAlign: 'center' as const},
  previewContainer: {gap: 6},
  previewBox: {width: '100%' as const, backgroundColor: theme.previewBg, borderWidth: 1, borderColor: theme.previewBorder, padding: 8},
  addLineBtn: {backgroundColor: theme.chipBg, borderWidth: 1, borderColor: theme.chipBorder, borderRadius: 8, padding: 10, alignItems: 'center' as const},
  addLineBtnText: {color: theme.primary, fontSize: 14, fontWeight: '600' as const},
  buttonRow: {flexDirection: 'row' as const, gap: 8, margin: 16},
  addLabelButton: {flex: 1, backgroundColor: theme.primary, borderRadius: 8, padding: 16, alignItems: 'center' as const},
  printButton: {flex: 1, backgroundColor: theme.danger, borderRadius: 8, padding: 16, alignItems: 'center' as const},
  printButtonDisabled: {backgroundColor: theme.disabled},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: 'bold' as const},
});