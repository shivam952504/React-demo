// FIND this in your Header component:
{[
  {m:"popup",   icon:<I.Popup/>,      title:"Floating popup"},
  {m:"sidebar", icon:<I.Sidebar/>,    title:"Sidebar panel"},
  {m:"fullscreen",icon:<I.Fullscreen/>,title:"Full screen"},
].map(...)

// ADD this just BEFORE that array/map:
<button 
  title="Clear chat" 
  onClick={onClear}
  style={{
    background:"rgba(255,255,255,0.12)",
    border:"none",
    color:"#fff",
    width:28, height:28,
    borderRadius:8,
    cursor:"pointer",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    transition:"background 0.15s"
  }}
>
  <I.Clear/>
</button>

Clear:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.45"/></svg>,


  const clearChat = () => {
  currentSessionId = null;  // reset session so backend starts fresh
  setMessages([{
    id: uid(),
    role: "assistant",
    text: "Hi! I'm CORA. How can I help you today? 👋",
    timestamp: new Date(),
    liked: null,
  }]);
  setReplyTo(null);
  setInput("");
};


