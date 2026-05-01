import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// BRAND TOKENS
// ─────────────────────────────────────────────
const C = {
  black:   "#080808",
  surface: "#101010",
  card:    "#161616",
  cardB:   "#1C1C1C",
  border:  "#242424",
  green:   "#1A7035",
  greenL:  "#22A04A",
  greenD:  "#112A1C",
  greenGl: "rgba(34,160,74,0.13)",
  gold:    "#C4A23A",
  goldL:   "#E5C75A",
  goldGl:  "rgba(196,162,58,0.12)",
  red:     "#D94F4F",
  redGl:   "rgba(217,79,79,0.12)",
  blue:    "#4A7ED9",
  white:   "#F0F0F0",
  grey:    "#666",
  greyL:   "#999",
  greyXL:  "#C0C0C0",
};

// ─────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────
const GLOBAL = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:${C.black}}
body{font-family:'DM Sans',sans-serif;color:${C.white};-webkit-font-smoothing:antialiased}
input,button,textarea{font-family:'DM Sans',sans-serif}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}

@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideLeft{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,80%,100%{opacity:0;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
@keyframes goldPulse{0%,100%{box-shadow:0 0 0 0 ${C.gold}44}50%{box-shadow:0 0 0 8px ${C.gold}00}}
@keyframes greenPulse{0%,100%{box-shadow:0 0 0 0 ${C.greenL}44}50%{box-shadow:0 0 0 8px ${C.greenL}00}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes barIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes ripple{0%{transform:scale(0);opacity:.6}100%{transform:scale(2.4);opacity:0}}
@keyframes notifDrop{from{opacity:0;transform:translateY(-16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes pop{0%{transform:scale(0) rotate(-10deg)}70%{transform:scale(1.15) rotate(2deg)}100%{transform:scale(1) rotate(0)}}
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes waveBar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
@keyframes dotFlow{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return; cssInjected = true;
  const s = document.createElement("style");
  s.textContent = GLOBAL; document.head.appendChild(s);
}

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const INIT_USER = {
  name: "Khalid", balance: 14820.50, invested: 3200,
  investGrowth: 6.8, savingsTarget: 5000, savingsCurrent: 3750,
  iban: "SA44 2000 0001 2345 6789 1234", monthlyIncome: 8000,
};

const MOCK_TRANSACTIONS = [
  { id:1, label:"Starbucks Coffee",    icon:"☕", amount:17.50,  cat:"food"      },
  { id:2, label:"SAPTCO Fuel",         icon:"⛽", amount:83.75,  cat:"transport" },
  { id:3, label:"Carrefour Grocery",   icon:"🛒", amount:234.30, cat:"shopping"  },
  { id:4, label:"Netflix",             icon:"🎬", amount:44.99,  cat:"bills"     },
  { id:5, label:"Lunch – Al Baik",     icon:"🍗", amount:28.60,  cat:"food"      },
  { id:6, label:"Uber Ride",           icon:"🚗", amount:19.25,  cat:"transport" },
  { id:7, label:"Noon Shopping",       icon:"📦", amount:67.40,  cat:"shopping"  },
  { id:8, label:"Pharmacy",            icon:"💊", amount:55.10,  cat:"health"    },
];

const roundUp = (amt) => {
  const ceil = Math.ceil(amt);
  return { rounded: ceil, saving: +(ceil - amt).toFixed(2) };
};

const ALLOCATION = [
  { label:"Gold ETF",   pct:40, color:C.gold  },
  { label:"Tech Index", pct:35, color:C.greenL },
  { label:"Sukuk",      pct:15, color:C.blue  },
  { label:"Cash",       pct:10, color:C.grey  },
];

const MONTHS = ["Nov","Dec","Jan","Feb","Mar","Apr"];
const INVEST_HIST = [2800,2950,3050,3100,3160,3200];

const ANALYTICS = {
  cats: [
    { label:"Food & Dining",  pct:34, amount:1240, icon:"🍽️", delta:+12 },
    { label:"Transport",      pct:22, amount:803,  icon:"🚗", delta:-5  },
    { label:"Shopping",       pct:20, amount:730,  icon:"🛍️", delta:+28 },
    { label:"Bills & Subs",   pct:14, amount:511,  icon:"💡", delta:0   },
    { label:"Health",         pct:10, amount:365,  icon:"💊", delta:-8  },
  ],
  monthly: [2100,2450,2200,2800,3100,3649],
};

const MEMBERS = [
  { name:"Khalid", av:"K", paid:true,  amount:500, date:"Apr 1" },
  { name:"Sara",   av:"S", paid:true,  amount:500, date:"Apr 3" },
  { name:"Noor",   av:"N", paid:false, amount:500, date:"Pending" },
  { name:"Omar",   av:"O", paid:true,  amount:500, date:"Apr 5" },
  { name:"Layla",  av:"L", paid:false, amount:500, date:"Pending" },
];

const PROACTIVE = [
  { icon:"📊", title:"Spending Alert", body:"Your shopping is 28% above your monthly average. Want to review?", q:"Analyze my shopping spending and give tips to reduce it." },
  { icon:"📈", title:"Investment Insight", body:"Round-up collected SAR 12.40 today — your portfolio just grew!", q:"How is my micro-investment performing and what should I do next?" },
  { icon:"💡", title:"AOUN noticed", body:"You have SAR 2,070 left after bills. Want a savings plan?", q:"Create a simple savings plan for my remaining SAR 2,070 this month." },
];

// ─────────────────────────────────────────────
// AI ENGINE
// ─────────────────────────────────────────────
const TRIGGERS = [
  { words:["buy","purchase","iphone","headphone","airpod","laptop","watch","tv","ipad","phone","shoe"],
    build:(q)=>`User wants to purchase: "${q}". Their savings goal is 75% complete (SAR 3,750 of SAR 5,000). Warn them specifically: calculate how many days of round-up savings this purchase costs, and suggest an alternative (e.g. wait X weeks). Be warm but protective.` },
  { words:["round","roundup","round-up","spare"],
    build:(q)=>`User asks about round-up investing: "${q}". Explain how their daily round-ups (avg SAR 2.80/day) compound over time. Give the 6-month and 12-month projection. Be encouraging and specific.` },
  { words:["save","saving","savings","مدخرات","ادخار"],
    build:(q)=>`User asks about saving: "${q}". They earn ~SAR 8,000/month, spend SAR 3,649/month. Give 2 specific, numbered savings tips using their actual numbers. Keep it under 4 sentences.` },
  { words:["invest","investment","portfolio","استثمار"],
    build:(q)=>`User asks about investing: "${q}". They have SAR 3,200 invested at 6.8% YTD. Allocation: Gold ETF 40%, Tech Index 35%, Sukuk 15%, Cash 10%. Give one concrete optimization suggestion.` },
  { words:["spend","spending","analytics","category","مصاريف"],
    build:(q)=>`User asks about spending: "${q}". Top categories: Food 34% (SAR 1,240, +12%), Transport 22%, Shopping 20% (+28%). Give one specific insight about their biggest risk and how to fix it.` },
  { words:["sent","send","transfer","حول","أرسلت"],
    build:(q)=>`User just completed a transfer: "${q}". Check if their balance is still healthy (SAR 14,820 originally). Give a brief positive reinforcement and one tip about maintaining liquidity.` },
  { words:["paid","pay","bill","فاتورة"],
    build:(q)=>`User just paid a bill: "${q}". Comment on their bill management and whether automating payments would help their savings. Keep it practical and brief.` },
];

function buildPrompt(input) {
  const low = input.toLowerCase();
  for (const t of TRIGGERS) if (t.words.some(w => low.includes(w))) return t.build(input);
  return input;
}

async function callAI(userInput, history) {
  const system = `You are AOUN (عون) — a sharp, warm financial AI inside a Saudi fintech app.
User: Khalid | Balance: SAR 14,820 | Invested: SAR 3,200 (6.8% YTD) | Savings: 75% of SAR 5,000 | Income: ~SAR 8,000/mo | Spending leaders: Food 34%, Shopping 20%↑

Rules (STRICT):
• 2–4 sentences MAX. Never use bullet points or numbered lists.
• Vary your opener: sometimes "AOUN suggests:", sometimes "عون يقترح:", sometimes jump straight in.
• Always reference at least one real SAR figure from their profile.
• Arabic question → Arabic reply. English → English.
• End with exactly one emoji (not a string of them).
• Be human, warm, and decisive — like a trusted friend who is also a CFP.`;

  const msgs = [
    ...history.slice(-6).map(m => ({ role: m.role, content: m.text })),
    { role: "user", content: buildPrompt(userInput) },
  ];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages: msgs }),
  });
  const d = await r.json();
  return d.content?.map(b => b.text||"").join("") || "Could not reach AOUN right now. Try again.";
}

// ─────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────
const Av = ({ ch, size=36, color=C.greenL }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0,
    background:`linear-gradient(135deg,${color}33,${color}11)`,
    border:`1.5px solid ${color}55`, display:"flex", alignItems:"center",
    justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:700,
    fontSize:size*.38, color }}>
    {ch}
  </div>
);

const Card = ({ children, style={}, glow, gold, red:isRed, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border:`1px solid ${C.border}`, borderRadius:20,
    padding:"18px 20px",
    ...(glow?{boxShadow:`0 0 0 1px ${C.greenL}1A,0 6px 32px ${C.greenGl}`}:{}),
    ...(gold?{boxShadow:`0 0 0 1px ${C.gold}1A,0 6px 28px ${C.goldGl}`}:{}),
    ...(isRed?{boxShadow:`0 0 0 1px ${C.red}22,0 6px 20px ${C.redGl}`}:{}),
    ...(onClick?{cursor:"pointer"}:{}), ...style }}>
    {children}
  </div>
);

const Lbl = ({ children }) => (
  <div style={{ fontSize:10, color:C.grey, letterSpacing:1.4, textTransform:"uppercase", marginBottom:5 }}>{children}</div>
);

const Val = ({ children, color=C.white, size=18 }) => (
  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:size, color, lineHeight:1.2 }}>{children}</div>
);

const Tag = ({ children, color=C.greenL }) => (
  <span style={{ background:`${color}1A`, color, fontSize:10, fontWeight:600,
    letterSpacing:.8, padding:"2px 8px", borderRadius:999, textTransform:"uppercase" }}>
    {children}
  </span>
);

const Hr = ({ m=14 }) => <div style={{ height:1, background:C.border, margin:`${m}px 0` }} />;

const Inp = ({ label, value, onChange, placeholder, type="text", prefix, readOnly }) => (
  <div style={{ marginBottom:13 }}>
    {label && <Lbl>{label}</Lbl>}
    <div style={{ position:"relative" }}>
      {prefix && <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.greyL, fontSize:14, fontWeight:600, pointerEvents:"none" }}>{prefix}</span>}
      <input value={value} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder} type={type} readOnly={readOnly}
        style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:13,
          padding:prefix?"13px 15px 13px 34px":"13px 15px", color:readOnly?C.greyL:C.white,
          fontSize:14, outline:"none", transition:"border-color .18s" }}
        onFocus={e=>{if(!readOnly)e.target.style.borderColor=C.greenL}}
        onBlur={e=>e.target.style.borderColor=C.border} />
    </div>
  </div>
);

const Btn = ({ children, onClick, disabled, variant="green", style={} }) => {
  const bg = disabled ? C.border
    : variant==="gold"  ? `linear-gradient(135deg,${C.gold},${C.goldL})`
    : variant==="red"   ? `linear-gradient(135deg,${C.red},#E87070)`
    : variant==="ghost" ? "transparent"
    : `linear-gradient(135deg,${C.green},${C.greenL})`;
  const col = disabled ? C.grey : variant==="ghost" ? C.greyL : C.black;
  return (
    <button onClick={disabled?undefined:onClick} style={{
      width:"100%", padding:"14px", borderRadius:14,
      background:bg, color:col, border: variant==="ghost"?`1px solid ${C.border}`:"none",
      fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, letterSpacing:.3,
      cursor:disabled?"not-allowed":"pointer", transition:"opacity .15s", ...style }}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".88"}}
      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
      {children}
    </button>
  );
};

const BackBtn = ({ onNav }) => (
  <button onClick={onNav} style={{ background:C.cardB, border:`1px solid ${C.border}`,
    color:C.greyL, borderRadius:10, padding:"6px 14px", cursor:"pointer",
    fontSize:12, fontWeight:500, display:"flex", alignItems:"center", gap:5 }}>
    ← Back
  </button>
);

const Tick = () => (
  <div style={{ width:68, height:68, borderRadius:"50%", margin:"0 auto 16px",
    background:`linear-gradient(135deg,${C.green},${C.greenL})`,
    display:"flex", alignItems:"center", justifyContent:"center", fontSize:28,
    animation:"pop .5s cubic-bezier(.34,1.56,.64,1) both" }}>✓</div>
);

const Spinner = ({ size=18 }) => (
  <div style={{ width:size, height:size, border:`2px solid ${C.white}44`,
    borderTopColor:C.white, borderRadius:"50%", animation:"spin .8s linear infinite" }} />
);

// ─────────────────────────────────────────────
// SPARKLINE
// ─────────────────────────────────────────────
const Spark = ({ data, color=C.greenL, w=110, h=34 }) => {
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*(h-6)-3}`).join(" ");
  return (
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity=".5"/>
          <stop offset="100%" stopColor={color}/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={`url(#spk)`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={w} cy={h-((data[data.length-1]-min)/range)*(h-6)-3} r={4} fill={color}/>
    </svg>
  );
};

// ─────────────────────────────────────────────
// DONUT
// ─────────────────────────────────────────────
const Donut = ({ data, cx=60, cy=60, r=46, sw=14 }) => {
  const circ = 2*Math.PI*r; let off=0;
  return (
    <svg width={cx*2} height={cy*2}>
      {data.map((s,i)=>{
        const dash=(s.pct/100)*circ, gap=circ-dash;
        const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
          strokeWidth={sw} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-off}/>;
        off+=dash; return el;
      })}
      <text x={cx} y={cy-4} textAnchor="middle" fill={C.white} fontSize={10} fontFamily="Syne" fontWeight={700}>SAR</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill={C.goldL} fontSize={10} fontFamily="DM Sans">3,200</text>
    </svg>
  );
};

// ─────────────────────────────────────────────
// TYPING DOTS
// ─────────────────────────────────────────────
const Dots = () => (
  <div style={{display:"flex",gap:5,padding:"12px 15px",alignItems:"center"}}>
    {[0,1,2].map(i=>(
      <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.gold,
        animation:`blink 1.2s infinite`, animationDelay:`${i*.2}s` }}/>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// PROACTIVE ALERT
// ─────────────────────────────────────────────
function ProAlert({ alert, onDismiss, onAsk, onNav }) {
  return (
    <div style={{ position:"fixed", top:50, left:"50%", transform:"translateX(-50%)",
      width:"calc(100% - 28px)", maxWidth:390, zIndex:600,
      background:`linear-gradient(135deg,#181200,#0C1510)`,
      border:`1px solid ${C.gold}55`, borderRadius:18, padding:"14px 16px",
      animation:"notifDrop .38s cubic-bezier(.22,1,.36,1) both",
      boxShadow:`0 12px 48px #00000088,0 0 0 1px ${C.gold}11` }}>
      <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
        <span style={{fontSize:22,flexShrink:0,marginTop:1}}>{alert.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:C.goldL}}>{alert.title}</div>
          <div style={{fontSize:12.5,color:C.greyXL,marginTop:3,lineHeight:1.55}}>{alert.body}</div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={()=>{onAsk(alert.q);onDismiss();onNav("ai")}} style={{
              background:`${C.gold}22`,border:`1px solid ${C.gold}44`,color:C.goldL,
              borderRadius:8,padding:"5px 13px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              Ask AOUN →
            </button>
            <button onClick={onDismiss} style={{background:C.border,border:"none",color:C.grey,
              borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROUND-UP TRANSACTION FEED
// ─────────────────────────────────────────────
function RoundUpFeed({ txns, animate }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {txns.map((t,i)=>{
        const {rounded,saving} = roundUp(t.amount);
        return (
          <div key={t.id} style={{
            display:"flex",alignItems:"center",gap:12,
            background:C.cardB, border:`1px solid ${C.border}`,
            borderRadius:14,padding:"12px 15px",
            animation:animate?`fadeUp .4s ${i*.07}s ease both`:"none",
            opacity:animate?0:1, animationFillMode:"forwards" }}>
            <span style={{fontSize:22,flexShrink:0}}>{t.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</div>
              <div style={{fontSize:11,color:C.grey,marginTop:2}}>SAR {t.amount.toFixed(2)} → SAR {rounded}.00</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:500,color:C.greenL}}>+{saving.toFixed(2)}</div>
              <div style={{fontSize:10,color:C.grey,marginTop:1}}>saved</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ onNav, user, onSimPurchase, proAlert, onDismissAlert, onAIPreload }) {
  const [balVis, setBalVis] = useState(true);
  const pct = (user.savingsCurrent / user.savingsTarget) * 100;
  const dailyRoundUp = MOCK_TRANSACTIONS.reduce((s,t)=>s+roundUp(t.amount).saving,0).toFixed(2);

  const actions = [
    {icon:"💸",label:"Send",    screen:"send"},
    {icon:"📥",label:"Receive", screen:"receive"},
    {icon:"💳",label:"Pay Bill",screen:"pay"},
    {icon:"📊",label:"Analytics",screen:"analytics"},
  ];

  return (
    <div style={{paddingBottom:100}}>
      {proAlert && <ProAlert alert={proAlert} onDismiss={onDismissAlert} onAsk={onAIPreload} onNav={onNav}/>}

      {/* Header */}
      <div style={{padding:"22px 18px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <Lbl>Good Morning</Lbl>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginTop:2}}>{user.name} 👋</div>
        </div>
        <Av ch="K" size={42}/>
      </div>

      <div style={{padding:"0 14px",display:"flex",flexDirection:"column",gap:12}}>

        {/* Balance card */}
        <Card glow style={{background:`linear-gradient(135deg,#0C1C10,#0F0F0F)`,animation:"fadeUp .5s ease both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <Lbl>Total Balance</Lbl>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:29,fontWeight:800,letterSpacing:-1,
                animation:"countUp .3s ease both"}}>
                {balVis ? `SAR ${user.balance.toLocaleString("en",{minimumFractionDigits:2})}` : "SAR ••••••"}
              </div>
              <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center"}}>
                <Tag>↑ 4.2% this month</Tag>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.greenL,
                  animation:"greenPulse 2s infinite"}}/>
              </div>
            </div>
            <button onClick={()=>setBalVis(v=>!v)} style={{background:C.border,border:"none",
              color:C.greyL,borderRadius:9,padding:"6px 11px",cursor:"pointer",fontSize:15}}>
              {balVis?"🙈":"👁"}
            </button>
          </div>
          <Hr/>
          <div style={{display:"flex",gap:18,alignItems:"center"}}>
            <div>
              <Lbl>Invested</Lbl>
              <Val color={C.goldL} size={15}>SAR {user.invested.toLocaleString()}</Val>
            </div>
            <div>
              <Lbl>Today's Round-Up</Lbl>
              <Val color={C.greenL} size={15}>+SAR {dailyRoundUp}</Val>
            </div>
            <div style={{marginLeft:"auto"}}><Spark data={INVEST_HIST}/></div>
          </div>
        </Card>

        {/* Quick actions */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,
          animation:"fadeUp .5s .1s ease both",opacity:0,animationFillMode:"forwards"}}>
          {actions.map(a=>(
            <Card key={a.label} onClick={()=>onNav(a.screen)} style={{
              display:"flex",alignItems:"center",gap:11,padding:"13px 15px",
              transition:"border-color .15s,transform .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.greenL;e.currentTarget.style.transform="scale(1.02)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="scale(1)"}}>
              <span style={{fontSize:20}}>{a.icon}</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13}}>{a.label}</span>
            </Card>
          ))}
        </div>

        {/* Round-Up teaser */}
        <Card onClick={()=>onNav("invest")} style={{
          background:`linear-gradient(135deg,#121A0C,#0F0F0F)`,
          border:`1px solid ${C.greenL}33`,
          animation:"fadeUp .5s .15s ease both",opacity:0,animationFillMode:"forwards"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:18}}>🪙</span>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14}}>Round-Up Engine</span>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.greenL,animation:"greenPulse 1.8s infinite"}}/>
              </div>
              <div style={{fontSize:12,color:C.greyL,lineHeight:1.5}}>
                {MOCK_TRANSACTIONS.length} transactions today
              </div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,color:C.greenL,fontSize:20,marginTop:6}}>
                +SAR {dailyRoundUp} <span style={{fontSize:12,color:C.grey,fontWeight:400}}>saved</span>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:28,marginBottom:4}}>→</div>
              <Tag color={C.greenL}>View All</Tag>
            </div>
          </div>
        </Card>

        {/* Simulate purchase */}
        <button onClick={onSimPurchase} style={{
          background:`linear-gradient(135deg,#1A0808,#100808)`,
          border:`1px solid ${C.red}44`,borderRadius:18,padding:"14px 18px",
          display:"flex",gap:12,alignItems:"center",cursor:"pointer",width:"100%",
          animation:"fadeUp .5s .2s ease both",opacity:0,animationFillMode:"forwards"}}>
          <div style={{width:38,height:38,borderRadius:12,background:`${C.red}22`,
            border:`1px solid ${C.red}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛍️</div>
          <div style={{textAlign:"left",flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.red,fontSize:13}}>Simulate Purchase</div>
            <div style={{fontSize:11.5,color:C.greyL,marginTop:2}}>"I want to buy headphones for SAR 800" → See AI react live</div>
          </div>
          <span style={{color:C.red,fontSize:16}}>→</span>
        </button>

        {/* Savings */}
        <Card style={{animation:"fadeUp .5s .25s ease both",opacity:0,animationFillMode:"forwards"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14}}>Savings Circle</div>
              <div style={{fontSize:12,color:C.grey,marginTop:2}}>5 members · Ends Jul 2025</div>
            </div>
            <button onClick={()=>onNav("savings")} style={{background:C.greenGl,border:`1px solid ${C.green}44`,
              color:C.greenL,borderRadius:9,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              View →
            </button>
          </div>
          <div style={{background:C.border,borderRadius:999,height:7,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,borderRadius:999,
              background:`linear-gradient(90deg,${C.green},${C.greenL})`,transition:"width 1s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:7,fontSize:12,color:C.greyL}}>
            <span>SAR {user.savingsCurrent.toLocaleString()}</span>
            <span>{pct.toFixed(0)}% of SAR {user.savingsTarget.toLocaleString()}</span>
          </div>
        </Card>

        {/* AI insight tap */}
        <div onClick={()=>onNav("ai")} style={{
          background:`linear-gradient(135deg,#1A1400,#0E1408)`,
          border:`1px solid ${C.gold}44`,borderRadius:18,padding:"15px 17px",cursor:"pointer",
          display:"flex",gap:12,alignItems:"center",
          animation:`goldPulse 3s infinite, fadeUp .5s .3s ease both`,
          opacity:0,animationFillMode:"forwards"}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:`${C.gold}22`,
            border:`1.5px solid ${C.gold}77`,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:19}}>✨</div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.goldL,fontSize:13}}>AOUN AI says…</div>
            <div style={{fontSize:12.5,color:C.greyXL,marginTop:3,lineHeight:1.5}}>
              Savings rate 22% — above average. Ask me anything! 💚
            </div>
          </div>
          <div style={{marginLeft:"auto",color:C.gold,fontSize:18}}>→</div>
        </div>

      </div>

      {/* Float AI button */}
      <button onClick={()=>onNav("ai")} style={{
        position:"fixed",bottom:80,right:18,width:54,height:54,borderRadius:"50%",
        background:`linear-gradient(135deg,${C.gold},${C.goldL})`,border:"none",
        cursor:"pointer",fontSize:21,display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 4px 20px ${C.gold}55`,animation:"goldPulse 2.5s infinite",zIndex:400}}>
        ✨
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: AI CHAT
// ─────────────────────────────────────────────
const QUICK = [
  "Can I afford SAR 2,000 purchase?",
  "How to save more this month?",
  "كيف أنمي مدخراتي؟",
  "Review my spending",
];

function AIScreen({ preload, clearPreload }) {
  const [msgs, setMsgs] = useState([
    { role:"assistant", text:"مرحباً Khalid! I'm AOUN — your smart financial companion. Ask me anything, in Arabic or English. 💚" }
  ]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef();
  const didPreload = useRef(false);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"})},[msgs,busy]);

  useEffect(()=>{
    if(preload && !didPreload.current){
      didPreload.current=true;
      setTimeout(()=>{send(preload);clearPreload()},500);
    }
  },[preload]);

  async function send(txt) {
    const q=(txt||inp).trim(); if(!q||busy) return;
    setInp("");
    const hist=[...msgs];
    setMsgs(p=>[...p,{role:"user",text:q}]);
    setBusy(true);
    await new Promise(r=>setTimeout(r,700+Math.random()*600));
    try {
      const reply = await callAI(q,hist);
      setMsgs(p=>[...p,{role:"assistant",text:reply}]);
    } catch {
      setMsgs(p=>[...p,{role:"assistant",text:"Connection issue — please try again."}]);
    }
    setBusy(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100dvh - 46px)",background:C.black}}>
      {/* Header */}
      <div style={{padding:"14px 18px 12px",background:C.surface,borderBottom:`1px solid ${C.border}`,
        display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:`${C.gold}22`,
          border:`1.5px solid ${C.gold}77`,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:19,animation:"goldPulse 3s infinite"}}>✨</div>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15}}>
            AOUN <span style={{color:C.goldL}}>AI</span>
          </div>
          <div style={{fontSize:10,color:C.greenL,letterSpacing:1.2,display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:C.greenL,animation:"greenPulse 1.5s infinite"}}/>
            ONLINE · Powered by Claude
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 13px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",
            animation:"fadeUp .28s ease both"}}>
            {m.role==="assistant"&&(
              <div style={{width:27,height:27,borderRadius:"50%",background:`${C.gold}22`,
                border:`1px solid ${C.gold}44`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:13,marginRight:8,flexShrink:0,alignSelf:"flex-end"}}>✨</div>
            )}
            <div style={{maxWidth:"78%",padding:"11px 14px",
              borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
              background:m.role==="user"?`linear-gradient(135deg,${C.greenD},${C.green})`:C.card,
              border:m.role==="assistant"?`1px solid ${C.border}`:"none",
              fontSize:13.5,lineHeight:1.65,color:C.white}}>
              {m.text}
            </div>
          </div>
        ))}
        {busy&&(
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <div style={{width:27,height:27,borderRadius:"50%",background:`${C.gold}22`,
              border:`1px solid ${C.gold}44`,display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:13}}>✨</div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"18px 18px 18px 4px"}}>
              <Dots/>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Quick replies */}
      <div style={{padding:"6px 13px 4px",display:"flex",gap:7,overflowX:"auto",flexShrink:0}}>
        {QUICK.map(q=>(
          <button key={q} onClick={()=>send(q)} style={{
            background:C.card,border:`1px solid ${C.border}`,color:C.greyL,
            borderRadius:999,padding:"6px 13px",fontSize:11.5,whiteSpace:"nowrap",
            cursor:"pointer",flexShrink:0}}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{padding:"10px 13px 20px",display:"flex",gap:9,alignItems:"center",
        background:C.surface,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Ask AOUN anything…"
          style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:13,
            padding:"12px 14px",color:C.white,fontSize:13.5,outline:"none"}}/>
        <button onClick={()=>send()} disabled={busy} style={{
          width:43,height:43,borderRadius:"50%",
          background:busy?C.border:`linear-gradient(135deg,${C.gold},${C.goldL})`,
          border:"none",cursor:busy?"default":"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>
          {busy?<Spinner size={16}/>:"↑"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: INVEST (ROUND-UP ENGINE)
// ─────────────────────────────────────────────
function InvestScreen({ user, setUser, onAIPreload, onNav }) {
  const [simulating, setSimulating] = useState(false);
  const [growth, setGrowth] = useState(user.investGrowth);
  const [invested, setInvested] = useState(user.invested);
  const [newTxnFlash, setNewTxnFlash] = useState(false);
  const [liveRoundUp, setLiveRoundUp] = useState(
    MOCK_TRANSACTIONS.reduce((s,t)=>s+roundUp(t.amount).saving,0)
  );

  const dailyRoundUp = MOCK_TRANSACTIONS.reduce((s,t)=>s+roundUp(t.amount).saving,0).toFixed(2);
  const monthlyEst = (parseFloat(dailyRoundUp)*30).toFixed(2);
  const txnCount = MOCK_TRANSACTIONS.length;

  function simulate() {
    setSimulating(true);
    let i=0;
    const iv=setInterval(()=>{
      setGrowth(g=>+(g+0.08).toFixed(2));
      setInvested(v=>+(v+1.8).toFixed(2));
      setLiveRoundUp(r=>+(r+0.24).toFixed(2));
      i++;
      if(i>=14){
        clearInterval(iv);setSimulating(false);
        setUser(u=>({...u,investGrowth:+(u.investGrowth+1.1).toFixed(1),invested:+(u.invested+25.2).toFixed(2)}));
        onAIPreload("My round-up simulation just ran. How is my micro-investment growing and what's the next step?");
        onNav("ai");
      }
    },140);
  }

  return (
    <div style={{paddingBottom:100}}>
      <div style={{padding:"22px 18px 14px"}}>
        <Lbl>Smart</Lbl>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginTop:1}}>Round-Up Engine</div>
      </div>

      <div style={{padding:"0 14px",display:"flex",flexDirection:"column",gap:12}}>

        {/* Hero invest card */}
        <Card gold style={{background:`linear-gradient(135deg,#1A1200,#0C140C)`,animation:"fadeUp .4s ease both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <Lbl>Total Invested</Lbl>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:27,fontWeight:800,color:C.goldL,
                marginTop:4,transition:"all .2s",animation:simulating?"countUp .2s ease both":"none"}}>
                SAR {invested.toLocaleString("en",{minimumFractionDigits:2})}
              </div>
              <div style={{marginTop:9,display:"flex",gap:8}}>
                <Tag color={C.gold}>↑ {growth}% YTD</Tag>
                {simulating&&<Tag color={C.greenL}>GROWING…</Tag>}
              </div>
            </div>
            <Donut data={ALLOCATION}/>
          </div>
          <Hr/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center"}}>
            {[
              ["TODAY'S ROUND-UP",`+SAR ${liveRoundUp.toFixed(2)}`,C.greenL],
              ["TRANSACTIONS",`${txnCount} today`,C.white],
              ["MONTHLY EST.",`SAR ${monthlyEst}`,C.goldL],
            ].map(([l,v,c])=>(
              <div key={l} style={{background:C.surface,borderRadius:12,padding:"10px 8px"}}>
                <Lbl>{l}</Lbl>
                <Val color={c} size={13}>{v}</Val>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,background:`${C.greenL}11`,border:`1px solid ${C.greenL}22`,
            borderRadius:12,padding:"10px 13px",fontSize:12.5,color:C.greyXL,lineHeight:1.5}}>
            💡 Your small spending saved you <strong style={{color:C.greenL}}>SAR {dailyRoundUp}</strong> today across {txnCount} transactions.
          </div>
        </Card>

        {/* Growth chart */}
        <Card style={{animation:"fadeUp .4s .08s ease both",opacity:0,animationFillMode:"forwards"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14}}>Portfolio Growth</div>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.greenL}}>+{growth}% YTD</span>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
            {INVEST_HIST.map((v,i)=>{
              const max=Math.max(...INVEST_HIST);
              const ht=(v/max)*72;
              const isLast=i===INVEST_HIST.length-1;
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:"100%",height:simulating&&isLast?Math.min(ht+8,78):ht,borderRadius:6,
                    background:isLast?`linear-gradient(180deg,${C.goldL},${C.gold})`:`linear-gradient(180deg,${C.greenL}66,${C.green}22)`,
                    transition:"height .3s ease"}}/>
                  <div style={{fontSize:9,color:isLast?C.goldL:C.grey}}>{MONTHS[i]}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Allocation */}
        <Card style={{animation:"fadeUp .4s .12s ease both",opacity:0,animationFillMode:"forwards"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,marginBottom:14}}>Asset Allocation</div>
          {ALLOCATION.map((a,i)=>(
            <div key={a.label} style={{marginBottom:11}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:5}}>
                <span style={{color:C.greyL}}>{a.label}</span>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:600}}>{a.pct}%</span>
              </div>
              <div style={{background:C.border,borderRadius:999,height:5,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${a.pct}%`,borderRadius:999,background:a.color,
                  animation:`barIn .8s ${i*.1}s ease both`,transformOrigin:"left"}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* Transaction feed */}
        <div style={{animation:"fadeUp .4s .16s ease both",opacity:0,animationFillMode:"forwards"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,marginBottom:10,
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            Today's Transactions
            <Tag color={C.greenL}>{txnCount} round-ups</Tag>
          </div>
          <RoundUpFeed txns={MOCK_TRANSACTIONS} animate/>
        </div>

        {/* Simulate button */}
        <Btn variant="gold" onClick={simulate} disabled={simulating} style={{
          animation:"fadeUp .4s .2s ease both",opacity:0,animationFillMode:"forwards"}}>
          {simulating ? "⏳ Simulating growth…" : "⚡ Run Round-Up Simulation → AI Insight"}
        </Btn>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: SAVINGS
// ─────────────────────────────────────────────
function SavingsScreen() {
  const [mems, setMems] = useState(MEMBERS);
  const paid = mems.filter(m=>m.paid).length;

  return (
    <div style={{paddingBottom:100}}>
      <div style={{padding:"22px 18px 14px"}}>
        <Lbl>Digital</Lbl>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginTop:1}}>Savings Circle</div>
      </div>
      <div style={{padding:"0 14px",display:"flex",flexDirection:"column",gap:11}}>
        <Card glow style={{animation:"fadeUp .4s ease both"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
            {[["Pool","SAR 2,500",C.greenL],["Paid",`${paid}/${mems.length}`,C.white],["Cycle","Apr",C.white]].map(([l,v,c])=>(
              <div key={l} style={{background:C.surface,borderRadius:12,padding:"10px 6px"}}>
                <Lbl>{l}</Lbl><Val color={c} size={15}>{v}</Val>
              </div>
            ))}
          </div>
          <Hr/>
          <Lbl>Collection Progress</Lbl>
          <div style={{background:C.border,borderRadius:999,height:7,overflow:"hidden",marginTop:4}}>
            <div style={{height:"100%",width:`${(paid/mems.length)*100}%`,borderRadius:999,
              background:`linear-gradient(90deg,${C.green},${C.greenL})`,transition:"width .6s ease"}}/>
          </div>
          <div style={{textAlign:"right",fontSize:11,color:C.greyL,marginTop:5}}>{((paid/mems.length)*100).toFixed(0)}% collected</div>
        </Card>

        {mems.map((m,i)=>(
          <Card key={m.name} style={{display:"flex",alignItems:"center",gap:12,
            animation:`fadeUp .4s ${i*.06}s ease both`,opacity:0,animationFillMode:"forwards"}}>
            <Av ch={m.av} color={m.paid?C.greenL:C.grey}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14}}>{m.name}</div>
              <div style={{fontSize:11.5,color:C.grey,marginTop:2}}>{m.paid?`Paid · ${m.date}`:"Payment pending"}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <Val color={m.paid?C.greenL:C.grey} size={14}>SAR {m.amount}</Val>
              <button onClick={()=>setMems(p=>p.map((x,j)=>j===i?{...x,paid:!x.paid}:x))} style={{
                marginTop:5,background:m.paid?C.greenD:C.cardB,
                border:`1px solid ${m.paid?C.green:C.border}`,color:m.paid?C.greenL:C.greyL,
                borderRadius:8,padding:"3px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>
                {m.paid?"✓ Paid":"Mark Paid"}
              </button>
            </div>
          </Card>
        ))}

        <div style={{background:C.greenGl,border:`1px solid ${C.green}44`,borderRadius:14,
          padding:"13px 15px",display:"flex",gap:11,alignItems:"center",
          animation:"fadeUp .4s .35s ease both",opacity:0,animationFillMode:"forwards"}}>
          <span style={{fontSize:20}}>🔄</span>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13}}>Auto-Deduction Scheduled</div>
            <div style={{fontSize:11.5,color:C.greyL,marginTop:2}}>SAR 500 auto-deducted from pending members on Apr 30.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: SEND
// ─────────────────────────────────────────────
function SendScreen({ onNav, onAIPreload, user, setUser }) {
  const [to,setTo]=useState(""); const [amt,setAmt]=useState("");
  const [done,setDone]=useState(false); const [busy,setBusy]=useState(false);

  async function handle() {
    if(!to||!amt||isNaN(amt)||+amt<=0) return;
    setBusy(true); await new Promise(r=>setTimeout(r,1100));
    setUser(u=>({...u,balance:+(u.balance-+amt).toFixed(2)}));
    setDone(true); setBusy(false);
    onAIPreload(`I just sent SAR ${amt} to ${to}. Is my balance still healthy? Give me a quick financial assessment.`);
  }

  if(done) return (
    <div style={{padding:"44px 20px",textAlign:"center",animation:"fadeUp .4s ease both"}}>
      <Tick/>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,marginBottom:8}}>Money Sent!</div>
      <div style={{color:C.greyL,fontSize:14,marginBottom:4}}>SAR {amt} → {to}</div>
      <div style={{color:C.grey,fontSize:12,marginBottom:28}}>Transaction completed</div>
      <div style={{background:`${C.gold}11`,border:`1px solid ${C.gold}33`,borderRadius:16,
        padding:"14px 16px",marginBottom:20,textAlign:"left",display:"flex",gap:11,alignItems:"center"}}>
        <span style={{fontSize:20}}>✨</span>
        <div style={{fontSize:13,color:C.greyXL,lineHeight:1.5}}>AOUN is ready to share a financial insight on this transfer.</div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn variant="gold" onClick={()=>onNav("ai")} style={{flex:1}}>See AI Insight ✨</Btn>
        <Btn variant="ghost" onClick={()=>onNav("home")} style={{flex:1}}>Home</Btn>
      </div>
    </div>
  );

  return (
    <div style={{padding:"0 14px 100px",animation:"slideLeft .3s ease both"}}>
      <div style={{padding:"22px 0 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><Lbl>Transfer</Lbl><div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginTop:1}}>Send Money</div></div>
        <BackBtn onNav={()=>onNav("home")}/>
      </div>
      <Card style={{marginBottom:12}}>
        <Lbl>Available</Lbl>
        <Val color={C.greenL} size={22}>SAR {user.balance.toLocaleString("en",{minimumFractionDigits:2})}</Val>
      </Card>
      <Card>
        <Inp label="Recipient" value={to} onChange={setTo} placeholder="Name or IBAN"/>
        <Inp label="Amount (SAR)" value={amt} onChange={setAmt} placeholder="0.00" type="number" prefix="﷼"/>
        {to&&amt&&(
          <div style={{background:C.surface,borderRadius:12,padding:"13px 14px",marginBottom:14,fontSize:13}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:C.grey}}>To</span><span style={{fontWeight:600}}>{to}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{color:C.grey}}>Amount</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.greenL}}>SAR {Number(amt).toLocaleString()}</span>
            </div>
          </div>
        )}
        <Btn onClick={handle} disabled={!to||!amt||busy}>{busy?<Spinner/>:"Send Money 💸"}</Btn>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: RECEIVE
// ─────────────────────────────────────────────
function ReceiveScreen({ onNav, user }) {
  const [qr,setQr]=useState(false); const [copied,setCopied]=useState(false);
  function copy(){ navigator.clipboard?.writeText(user.iban).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2200); }

  const QR = () => (
    <div style={{textAlign:"center",marginTop:16,animation:"pop .45s cubic-bezier(.34,1.56,.64,1) both"}}>
      <svg width={174} height={174} style={{borderRadius:14,background:C.white,padding:12}}>
        {Array.from({length:9}).map((_,r)=>Array.from({length:9}).map((_,c)=>{
          const corner=(r<2&&c<2)||(r<2&&c>6)||(r>6&&c<2);
          const fill=corner?"#1A7035":((r*7+c*3+r*c)%4===0)?"#111111":null;
          if(!fill) return null;
          return <rect key={`${r}-${c}`} x={14+c*17} y={14+r*17} width={corner?22:13} height={corner?22:13} rx={corner?5:3} fill={fill}/>;
        }))}
        <text x={87} y={166} textAnchor="middle" fontSize={7.5} fill="#888" fontFamily="DM Sans">عون · AOUN</text>
      </svg>
      <div style={{fontSize:11.5,color:C.grey,marginTop:10}}>Scan to pay Khalid</div>
    </div>
  );

  return (
    <div style={{padding:"0 14px 100px",animation:"slideLeft .3s ease both"}}>
      <div style={{padding:"22px 0 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><Lbl>Payment</Lbl><div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginTop:1}}>Receive Money</div></div>
        <BackBtn onNav={()=>onNav("home")}/>
      </div>
      <Card glow style={{marginBottom:12,textAlign:"center",padding:"24px 20px"}}>
        <Av ch="K" size={60}/> 
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,marginTop:13}}>{user.name}</div>
        <div style={{color:C.grey,fontSize:12,marginTop:3}}>Personal Account</div>
      </Card>
      <Card style={{marginBottom:12}}>
        <Lbl>IBAN</Lbl>
        <div style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:13.5,
          letterSpacing:1.8,marginBottom:14,color:C.greyXL}}>{user.iban}</div>
        <Btn variant={copied?"ghost":"green"} onClick={copy}>{copied?"✓ Copied!":"Copy IBAN"}</Btn>
      </Card>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14}}>QR Code</div>
            <div style={{fontSize:12,color:C.grey,marginTop:2}}>Tap to generate</div></div>
          <button onClick={()=>setQr(v=>!v)} style={{background:qr?C.greenGl:C.cardB,
            border:`1px solid ${qr?C.greenL:C.border}`,color:qr?C.greenL:C.greyL,
            borderRadius:9,padding:"7px 15px",cursor:"pointer",fontWeight:600,fontSize:12}}>
            {qr?"Hide":"Generate"}
          </button>
        </div>
        {qr&&<QR/>}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: PAY BILL
// ─────────────────────────────────────────────
function PayScreen({ onNav, onAIPreload, user, setUser }) {
  const [biller,setBiller]=useState(""); const [amt,setAmt]=useState("");
  const [done,setDone]=useState(false); const [busy,setBusy]=useState(false);
  const BILLERS = ["SADAD · Electricity","STC Pay · Mobile","SWVL · Transport","Zain · Mobile","Water Authority","Saudi Post"];

  async function handle() {
    if(!biller||!amt||isNaN(amt)) return;
    setBusy(true); await new Promise(r=>setTimeout(r,1100));
    setUser(u=>({...u,balance:+(u.balance-+amt).toFixed(2)}));
    setDone(true); setBusy(false);
    onAIPreload(`I just paid SAR ${amt} for ${biller}. Is this recurring bill manageable within my budget? Any optimization tips?`);
  }

  if(done) return (
    <div style={{padding:"44px 20px",textAlign:"center",animation:"fadeUp .4s ease both"}}>
      <Tick/>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,marginBottom:8}}>Bill Paid!</div>
      <div style={{color:C.greyL,fontSize:14,marginBottom:4}}>{biller}</div>
      <Val color={C.greenL} size={24}>SAR {amt}</Val>
      <div style={{height:20}}/>
      <div style={{background:`${C.gold}11`,border:`1px solid ${C.gold}33`,borderRadius:16,
        padding:"14px 16px",marginBottom:20,textAlign:"left",display:"flex",gap:11,alignItems:"center"}}>
        <span style={{fontSize:20}}>✨</span>
        <div style={{fontSize:13,color:C.greyXL,lineHeight:1.5}}>AOUN has a bill management insight for you.</div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn variant="gold" onClick={()=>onNav("ai")} style={{flex:1}}>Ask AOUN ✨</Btn>
        <Btn variant="ghost" onClick={()=>onNav("home")} style={{flex:1}}>Home</Btn>
      </div>
    </div>
  );

  return (
    <div style={{padding:"0 14px 100px",animation:"slideLeft .3s ease both"}}>
      <div style={{padding:"22px 0 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><Lbl>Payments</Lbl><div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginTop:1}}>Pay Bill</div></div>
        <BackBtn onNav={()=>onNav("home")}/>
      </div>
      <Card style={{marginBottom:12}}>
        <Lbl>Select Biller</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:6}}>
          {BILLERS.map(b=>(
            <button key={b} onClick={()=>setBiller(b)} style={{
              background:biller===b?C.greenGl:C.surface,
              border:`1px solid ${biller===b?C.greenL:C.border}`,color:biller===b?C.greenL:C.greyXL,
              borderRadius:11,padding:"11px 14px",cursor:"pointer",textAlign:"left",
              fontSize:13.5,fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
              {b}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <Inp label="Amount (SAR)" value={amt} onChange={setAmt} placeholder="0.00" type="number" prefix="﷼"/>
        <Btn onClick={handle} disabled={!biller||!amt||busy}>{busy?<Spinner/>:"Pay Now 💳"}</Btn>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN: ANALYTICS
// ─────────────────────────────────────────────
function AnalyticsScreen({ onNav, onAIPreload }) {
  const total = ANALYTICS.cats.reduce((s,c)=>s+c.amount,0);
  const max = Math.max(...ANALYTICS.monthly);

  return (
    <div style={{paddingBottom:100,animation:"slideLeft .3s ease both"}}>
      <div style={{padding:"22px 18px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><Lbl>Insights</Lbl><div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginTop:1}}>Analytics</div></div>
        <BackBtn onNav={()=>onNav("home")}/>
      </div>

      <div style={{padding:"0 14px",display:"flex",flexDirection:"column",gap:12}}>

        {/* Monthly chart */}
        <Card style={{animation:"fadeUp .4s ease both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
            <div>
              <Lbl>Monthly Spending</Lbl>
              <Val size={24}>SAR {total.toLocaleString()}</Val>
            </div>
            <Tag color={C.red}>↑ 18% vs last</Tag>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:7,height:80}}>
            {ANALYTICS.monthly.map((v,i)=>{
              const ht=(v/max)*72, isLast=i===ANALYTICS.monthly.length-1;
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:"100%",height:ht,borderRadius:6,
                    background:isLast?`linear-gradient(180deg,${C.red}CC,${C.red}55)`:`linear-gradient(180deg,${C.greenL}66,${C.green}22)`,
                    transition:"height .4s ease"}}/>
                  <div style={{fontSize:9,color:isLast?C.red:C.grey}}>{MONTHS[i]}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* AI insight */}
        <div onClick={()=>{onAIPreload("Analyze my spending patterns and give me 2 specific actions to reduce my expenses this month.");onNav("ai");}}
          style={{background:`linear-gradient(135deg,#1A1400,#0E1408)`,
            border:`1px solid ${C.gold}44`,borderRadius:16,padding:"14px 16px",
            cursor:"pointer",display:"flex",gap:12,alignItems:"center",
            animation:"fadeUp .4s .08s ease both",opacity:0,animationFillMode:"forwards"}}>
          <span style={{fontSize:22}}>✨</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.goldL,fontSize:13}}>AOUN suggests:</div>
            <div style={{fontSize:12.5,color:C.greyXL,marginTop:3,lineHeight:1.5}}>
              You spend 30% more on food than your income bracket average. Reducing by SAR 200/mo = SAR 2,400 more per year.
            </div>
          </div>
          <span style={{color:C.gold,fontSize:16,flexShrink:0}}>→</span>
        </div>

        {/* Categories */}
        <Card style={{animation:"fadeUp .4s .12s ease both",opacity:0,animationFillMode:"forwards"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,marginBottom:14}}>Spending Breakdown</div>
          {ANALYTICS.cats.map((cat,i)=>(
            <div key={cat.label} style={{marginBottom:i<ANALYTICS.cats.length-1?13:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:17}}>{cat.icon}</span>
                  <span style={{fontSize:13,color:C.greyXL}}>{cat.label}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  <span style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:13}}>SAR {cat.amount}</span>
                  <span style={{fontSize:11,fontWeight:600,
                    color:cat.delta>10?C.red:cat.delta<0?C.greenL:C.grey}}>
                    {cat.delta>0?`↑${cat.delta}%`:cat.delta<0?`↓${Math.abs(cat.delta)}%`:"—"}
                  </span>
                </div>
              </div>
              <div style={{background:C.border,borderRadius:999,height:5,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${cat.pct}%`,borderRadius:999,
                  background:cat.delta>15?C.red:C.greenL,
                  animation:`barIn .8s ${i*.07}s ease both`,transformOrigin:"left"}}/>
              </div>
            </div>
          ))}
        </Card>

        <Btn variant="ghost" onClick={()=>{onAIPreload("Give me a personalized spending reduction plan based on my top 3 categories.");onNav("ai");}}>
          Get AI Spending Plan ✨
        </Btn>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BOTTOM TAB BAR
// ─────────────────────────────────────────────
const TABS = [
  {id:"home",   icon:"🏠", label:"Home"},
  {id:"ai",     icon:"✨", label:"AOUN AI", gold:true},
  {id:"savings",icon:"💰", label:"Savings"},
  {id:"invest", icon:"🪙", label:"Invest"},
];

function TabBar({ active, onNav }) {
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:420,background:`${C.surface}F8`,backdropFilter:"blur(20px)",
      borderTop:`1px solid ${C.border}`,display:"flex",zIndex:300,
      paddingBottom:"env(safe-area-inset-bottom,0)"}}>
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>onNav(t.id)} style={{
          flex:1,background:"none",border:"none",cursor:"pointer",
          padding:"10px 0 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
          color:active===t.id?(t.gold?C.goldL:C.greenL):C.grey,transition:"color .18s"}}>
          <span style={{fontSize:19}}>{t.icon}</span>
          <span style={{fontSize:9.5,fontWeight:600,letterSpacing:.6}}>{t.label}</span>
          {active===t.id&&(
            <div style={{width:16,height:2,borderRadius:999,
              background:t.gold?C.goldL:C.greenL,marginTop:1}}/>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
const SECONDARY = ["send","receive","pay","analytics"];

export default function App() {
  injectCSS();
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(INIT_USER);
  const [aiPreload, setAIPreload] = useState(null);
  const [proAlert, setProAlert] = useState(null);
  const alertIdx = useRef(0);
  const alertShown = useRef(false);

  // Live balance tick
  useEffect(()=>{
    const iv=setInterval(()=>{
      setUser(u=>({...u,balance:+(u.balance+0.11).toFixed(2)}));
    },5000);
    return()=>clearInterval(iv);
  },[]);

  // Proactive alert on dashboard
  useEffect(()=>{
    if(screen!=="home"||alertShown.current) return;
    const t=setTimeout(()=>{
      setProAlert(PROACTIVE[alertIdx.current%PROACTIVE.length]);
      alertIdx.current++;
      alertShown.current=true;
    },3200);
    return()=>clearTimeout(t);
  },[screen]);

  useEffect(()=>{
    if(screen==="home") alertShown.current=false;
  },[screen]);

  function nav(s){ setScreen(s); }
  function simPurchase(){
    setAIPreload("I'm thinking of buying Sony headphones for SAR 800. Is it a smart move right now given my savings goal?");
    nav("ai");
  }

  const isSecondary = SECONDARY.includes(screen);
  const isAI = screen === "ai";

  const screenMap = {
    home:      <Dashboard onNav={nav} user={user} onSimPurchase={simPurchase} proAlert={proAlert} onDismissAlert={()=>setProAlert(null)} onAIPreload={setAIPreload}/>,
    ai:        <AIScreen preload={aiPreload} clearPreload={()=>setAIPreload(null)}/>,
    savings:   <SavingsScreen/>,
    invest:    <InvestScreen user={user} setUser={setUser} onAIPreload={setAIPreload} onNav={nav}/>,
    send:      <SendScreen onNav={nav} onAIPreload={setAIPreload} user={user} setUser={setUser}/>,
    receive:   <ReceiveScreen onNav={nav} user={user}/>,
    pay:       <PayScreen onNav={nav} onAIPreload={setAIPreload} user={user} setUser={setUser}/>,
    analytics: <AnalyticsScreen onNav={nav} onAIPreload={setAIPreload}/>,
  };

  return (
    <div style={{maxWidth:420,margin:"0 auto",height:"100dvh",background:C.black,
      display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>

      {/* Top bar */}
      <div style={{flexShrink:0,background:`${C.black}F2`,backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${C.border}`,padding:"9px 17px",
        display:"flex",alignItems:"center",gap:10,zIndex:200}}>
        <div style={{width:27,height:27,borderRadius:"50%",
          background:`linear-gradient(135deg,${C.green},${C.greenL})`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"serif",fontSize:13,color:C.white,fontWeight:700,
          animation:"greenPulse 4s infinite",flexShrink:0}}>ع</div>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,letterSpacing:.4}}>
          A<span style={{color:C.greenL}}>O</span>UN
        </span>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {isSecondary&&(
            <button onClick={()=>nav("home")} style={{background:C.cardB,border:`1px solid ${C.border}`,
              color:C.greyL,borderRadius:9,padding:"4px 12px",fontSize:11.5,cursor:"pointer"}}>
              ← Home
            </button>
          )}
          <Tag color={C.gold}>BETA</Tag>
        </div>
      </div>

      {/* Screen content */}
      <div style={{flex:1,overflowY:isAI?"hidden":"auto",
        paddingBottom:!isSecondary&&!isAI?64:0}}>
        {screenMap[screen]||screenMap["home"]}
      </div>

      {/* Tab bar — hidden on secondary screens */}
      {!isSecondary&&<TabBar active={screen} onNav={nav}/>}
    </div>
  );
}
