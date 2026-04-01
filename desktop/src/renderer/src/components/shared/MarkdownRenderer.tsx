interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps): JSX.Element {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      elements.push(
        <pre key={elements.length} className="bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2">
          {lang && <div className="text-[9px] text-slate-500 mb-1">{lang}</div>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    // Heading
    if (line.startsWith('### ')) {
      elements.push(<h3 key={elements.length} className="text-sm font-bold text-slate-900 mt-4 mb-1">{line.slice(4)}</h3>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={elements.length} className="text-base font-bold text-slate-900 mt-5 mb-1">{line.slice(3)}</h2>)
      i++; continue
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={elements.length} className="text-lg font-bold text-slate-900 mt-6 mb-2">{line.slice(2)}</h1>)
      i++; continue
    }

    // List item
    if (line.match(/^\s*[-*]\s/)) {
      elements.push(
        <li key={elements.length} className="text-xs text-slate-700 ml-4 list-disc">
          <InlineText text={line.replace(/^\s*[-*]\s/, '')} />
        </li>
      )
      i++; continue
    }

    // Numbered list
    if (line.match(/^\s*\d+\.\s/)) {
      elements.push(
        <li key={elements.length} className="text-xs text-slate-700 ml-4 list-decimal">
          <InlineText text={line.replace(/^\s*\d+\.\s/, '')} />
        </li>
      )
      i++; continue
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={elements.length} className="border-slate-200 my-3" />)
      i++; continue
    }

    // Empty line
    if (!line.trim()) {
      i++; continue
    }

    // Paragraph
    elements.push(
      <p key={elements.length} className="text-xs text-slate-700 my-1 leading-relaxed">
        <InlineText text={line} />
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

function InlineText({ text }: { text: string }): JSX.Element {
  // Handle bold, italic, code inline
  const parts: JSX.Element[] = []
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>)
    }
    const m = match[0]
    if (m.startsWith('`')) {
      parts.push(<code key={match.index} className="bg-slate-100 text-indigo-600 px-1 rounded text-[11px] font-mono">{m.slice(1, -1)}</code>)
    } else if (m.startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-slate-900">{m.slice(2, -2)}</strong>)
    } else if (m.startsWith('*')) {
      parts.push(<em key={match.index} className="italic">{m.slice(1, -1)}</em>)
    }
    lastIndex = match.index + m.length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>)
  }

  return <>{parts}</>
}
