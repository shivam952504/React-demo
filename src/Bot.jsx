import ReactMarkdown from 'react-markdown'

// REMOVE this:
<span style={{fontSize, lineHeight:1.65, whiteSpace:"pre-wrap", wordBreak:"break-word"}}>
  {msg.text}
</span>

// REPLACE with:
<ReactMarkdown
  components={{
    p: ({children}) => (
      <p style={{margin:"4px 0", fontSize, lineHeight:1.65, wordBreak:"break-word"}}>{children}</p>
    ),
    strong: ({children}) => (
      <strong style={{fontWeight:700, color: isUser ? "#fff" : "#a5b4fc"}}>{children}</strong>
    ),
    em: ({children}) => (
      <em style={{fontStyle:"italic", opacity:0.85}}>{children}</em>
    ),
    ul: ({children}) => (
      <ul style={{paddingLeft:18, margin:"6px 0"}}>{children}</ul>
    ),
    ol: ({children}) => (
      <ol style={{paddingLeft:18, margin:"6px 0"}}>{children}</ol>
    ),
    li: ({children}) => (
      <li style={{fontSize, lineHeight:1.65, marginBottom:2}}>{children}</li>
    ),
    table: ({children}) => (
      <div style={{overflowX:"auto", margin:"8px 0"}}>
        <table style={{borderCollapse:"collapse", width:"100%", fontSize:12}}>{children}</table>
      </div>
    ),
    th: ({children}) => (
      <th style={{padding:"6px 10px", background:"rgba(99,102,241,0.3)", color:"#e2e8f0", textAlign:"left", borderBottom:"1px solid rgba(99,102,241,0.3)", fontSize:11, fontWeight:600}}>{children}</th>
    ),
    td: ({children}) => (
      <td style={{padding:"6px 10px", borderBottom:"1px solid rgba(99,102,241,0.1)", color:"#cbd5e1", fontSize:12}}>{children}</td>
    ),
    code: ({children}) => (
      <code style={{background:"rgba(0,0,0,0.3)", padding:"2px 6px", borderRadius:4, fontSize:12, fontFamily:"monospace", color:"#7dd3fc"}}>{children}</code>
    ),
    blockquote: ({children}) => (
      <blockquote style={{borderLeft:"3px solid #6366f1", paddingLeft:10, margin:"6px 0", opacity:0.8}}>{children}</blockquote>
    ),
  }}
>
  {msg.text}
</ReactMarkdown>
