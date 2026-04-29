const playWelcomeVoice = () => {
  const msg = new SpeechSynthesisUtterance(
    "Hello! Welcome to CORA, your Cognitive Operations and Response Assistant. How can I help you today?"
  );
  msg.rate = 0.95;    // speed — 1 is normal, lower is slower
  msg.pitch = 1.1;    // slightly higher pitch sounds more friendly
  msg.volume = 1;     // 0 to 1
  
  // Pick a female voice if available
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(v => 
    v.name.includes("Female") || 
    v.name.includes("Zira") ||    // Windows
    v.name.includes("Samantha") || // Mac
    v.name.includes("Google UK English Female")
  );
  if (femaleVoice) msg.voice = femaleVoice;

  window.speechSynthesis.cancel(); // stop any existing speech
  window.speechSynthesis.speak(msg);
};

// FIND this useEffect:
useEffect(()=>{
  if(open&&!minimized){
    setTimeout(()=>inputRef.current?.focus(),120);
    setUnread(0);
  }
},[open,minimized,mode]);

// REPLACE with:
useEffect(()=>{
  if(open&&!minimized){
    setTimeout(()=>inputRef.current?.focus(),120);
    setUnread(0);
    
    // Play welcome voice only on first open
    if(open) {
      // Small delay so it doesn't cut off
      setTimeout(() => playWelcomeVoice(), 500);
    }
  }
},[open,minimized,mode]);


onClose: () => { 
  window.speechSynthesis.cancel(); 
  setOpen(false); 
}

const playWelcomeVoice = () => {
  const speak = () => {
    const msg = new SpeechSynthesisUtterance(
      "Hello! Welcome to CORA, your Cognitive Operations and Response Assistant. How can I help you today?"
    );
    msg.rate = 0.95;
    msg.pitch = 1.1;
    msg.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      v.name.includes("Female") ||
      v.name.includes("Zira") ||
      v.name.includes("Samantha") ||
      v.name.includes("Google UK English Female")
    );
    if (femaleVoice) msg.voice = femaleVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  };

  // Voices may not be loaded yet on first call
  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      speak();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
};

