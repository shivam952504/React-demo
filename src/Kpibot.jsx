<style>{`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-6px);opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn { 0%{transform:scale(0.85);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideFromRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  ::-webkit-scrollbar { width:4px }
  ::-webkit-scrollbar-track { background:transparent }
  ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:2px }
  button { cursor:pointer; }

  /* ── Fix markdown rendering inside CORA ── */
  #cora-widget table {
    border-collapse: collapse !important;
    width: 100% !important;
    margin: 8px 0 !important;
    font-size: 12px !important;
    display: table !important;
  }
  #cora-widget th {
    padding: 6px 10px !important;
    background: rgba(99,102,241,0.3) !important;
    color: #e2e8f0 !important;
    text-align: left !important;
    border-bottom: 1px solid rgba(99,102,241,0.3) !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    display: table-cell !important;
  }
  #cora-widget td {
    padding: 6px 10px !important;
    border-bottom: 1px solid rgba(99,102,241,0.1) !important;
    color: #cbd5e1 !important;
    font-size: 12px !important;
    display: table-cell !important;
  }
  #cora-widget tr {
    display: table-row !important;
  }
  #cora-widget thead, #cora-widget tbody {
    display: table-header-group !important;
  }
  #cora-widget tbody {
    display: table-row-group !important;
  }
  #cora-widget ul {
    padding-left: 18px !important;
    margin: 6px 0 !important;
    list-style: disc !important;
  }
  #cora-widget ol {
    padding-left: 18px !important;
    margin: 6px 0 !important;
    list-style: decimal !important;
  }
  #cora-widget li {
    display: list-item !important;
    margin-bottom: 4px !important;
    color: #e2e8f0 !important;
  }
  #cora-widget strong {
    font-weight: 700 !important;
    color: #a5b4fc !important;
  }
  #cora-widget p {
    margin: 4px 0 !important;
    line-height: 1.65 !important;
  }
  #cora-widget svg {
    display: inline-block !important;
    visibility: visible !important;
  }
`}</style>
