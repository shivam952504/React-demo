{open && mode === "popup" && (
  <ResizableWindow
    defaultPos={{ x: window.innerWidth - 420, y: window.innerHeight - 650 }}
    defaultSize={{ w: 390, h: 600 }}
    minSize={{ w: 300, h: 400 }}
    accent={accent}
  >
    <Header {...headerProps}/>
    <Picker top={64} right={8}/>
    {!minimized && <ChatPanel {...chatProps}/>}
  </ResizableWindow>
)}


const ResizableWindow = ({ children, defaultPos, defaultSize, minSize, accent }) => {
  const [pos, setPos] = useState(defaultPos);
  const [size, setSize] = useState(defaultSize);
  const posRef = useRef(pos);
  const sizeRef = useRef(size);

  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  const startResize = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = sizeRef.current.w;
    const startH = sizeRef.current.h;
    const startLeft = posRef.current.x;
    const startTop = posRef.current.y;

    const onMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newW = startW, newH = startH;
      let newX = startLeft, newY = startTop;

      if (direction.includes("e")) newW = Math.max(minSize.w, startW + dx);
      if (direction.includes("s")) newH = Math.max(minSize.h, startH + dy);
      if (direction.includes("w")) {
        newW = Math.max(minSize.w, startW - dx);
        newX = startLeft + (startW - newW);
      }
      if (direction.includes("n")) {
        newH = Math.max(minSize.h, startH - dy);
        newY = startTop + (startH - newH);
      }

      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startDrag = (e) => {
    e.preventDefault();
    const startX = e.clientX - posRef.current.x;
    const startY = e.clientY - posRef.current.y;
    const onMove = (e) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - sizeRef.current.w, e.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - sizeRef.current.h, e.clientY - startY)),
      });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Edge & corner handle styles
  const edge = (dir, style) => (
    <div
      onMouseDown={(e) => startResize(e, dir)}
      style={{
        position: "absolute",
        zIndex: 10,
        ...style,
      }}
    />
  );

  return (
    <div style={{
      position: "fixed",
      left: pos.x,
      top: pos.y,
      width: size.w,
      height: size.h,
      background: "#0c1628",
      border: `1px solid ${accent}33`,
      borderRadius: 22,
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
      overflow: "hidden",
      zIndex: 1000,
      userSelect: "none",
    }}>

      {/* ── Resize Edges ── */}
      {edge("n",  { top:0, left:8, right:8, height:5, cursor:"n-resize" })}
      {edge("s",  { bottom:0, left:8, right:8, height:5, cursor:"s-resize" })}
      {edge("w",  { left:0, top:8, bottom:8, width:5, cursor:"w-resize" })}
      {edge("e",  { right:0, top:8, bottom:8, width:5, cursor:"e-resize" })}

      {/* ── Resize Corners ── */}
      {edge("nw", { top:0, left:0, width:12, height:12, cursor:"nw-resize" })}
      {edge("ne", { top:0, right:0, width:12, height:12, cursor:"ne-resize" })}
      {edge("sw", { bottom:0, left:0, width:12, height:12, cursor:"sw-resize" })}
      {edge("se", { bottom:0, right:0, width:12, height:12, cursor:"se-resize" })}

      {/* ── Draggable Header ── */}
      <div onMouseDown={startDrag} style={{ cursor:"grab", flexShrink:0 }}>
        {children[0]}  {/* Header */}
      </div>

      {/* ── Rest of content ── */}
      {children.slice(1)}

    </div>
  );
};
