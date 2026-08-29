import { Text, View, type TextStyle } from 'react-native';

/** Basit markdown: **kalın**, ## başlık, - madde */
export function renderMarkdownPreview(body: string, style: TextStyle, mutedStyle: TextStyle) {
  const lines = body.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <View key={`sp-${index}`} style={{ height: 6 }} />;
    if (trimmed.startsWith('## ')) {
      return (
        <Text key={`h-${index}`} style={[style, { fontWeight: '900', fontSize: 16, marginTop: 4 }]}>
          {trimmed.slice(3)}
        </Text>
      );
    }
    if (trimmed.startsWith('- ')) {
      return (
        <Text key={`li-${index}`} style={mutedStyle}>
          • {formatInline(trimmed.slice(2), style, mutedStyle)}
        </Text>
      );
    }
    return (
      <Text key={`p-${index}`} style={mutedStyle}>
        {formatInline(trimmed, style, mutedStyle)}
      </Text>
    );
  });
}

function formatInline(text: string, style: TextStyle, mutedStyle: TextStyle) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={[style, { fontWeight: '800' }]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}
