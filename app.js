// Mis finanzas — lógica de la app
// Valores iniciales: vacíos para cuentas nuevas; la cuenta de rafa arranca con los suyos
const DEF={total:0,monthly:0,day:30,start:'2026-11-30',pay:[]};
const RDEF={total:50000,monthly:5000,day:30,start:'2026-11-30',pay:Array.from({length:10},()=>({a:0,d:'',n:''}))};
const BDEF={cIni:0,cDate:'2026-11-02',dIni:0,dDate:'2026-11-02',vIni:0,vDate:'2026-11-02',vAmt:0,gs:'2026-10-30',dayA:15,amtA:0,dayB:30,amtB:0,sm:0,exp:[],sav:[],goal:0,debts:[],stm:[]};
const RBDEF=Object.assign({},BDEF,{vAmt:1000,amtA:5700,amtB:8700,sm:2200});
const isRafa=()=>!!ses&&ses.user==='rafa';
const loanTitle=()=>isRafa()?'Préstamo familiar':'Préstamo';
const cl=o=>JSON.parse(JSON.stringify(o));
let S=cl(DEF),B=cl(BDEF),tab='loan',err='',cfm='';
const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const M=n=>(+n||0).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
const r2=n=>Math.round(n*100)/100;
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const nPay=()=>{const t=+S.total||0,m=+S.monthly||0;return m>0&&t>0?Math.max(1,Math.min(120,Math.ceil(t/m-1e-9))):0};
const sched=n=>{const N=nPay();return n<N?+S.monthly:n===N?Math.max(0,r2(S.total-(N-1)*S.monthly)):0};
function fixPay(){const N=nPay();if(!Array.isArray(S.pay))S.pay=[];const lp=S.pay.reduce((r,x,k)=>((+x.a>0||x.n)?k+1:r),0),len=Math.max(N,lp);S.pay=S.pay.slice(0,len);while(S.pay.length<len)S.pay.push({a:0,d:'',n:''});return S}
// Limpieza de datos: todo lo que viene de la nube o de un archivo de respaldo se normaliza antes de usarse
const num=(v,d)=>{const n=parseFloat(v);return isFinite(n)?n:d};
const int=(v,lo,hi,d)=>{const n=Math.round(num(v,d));return Math.max(lo,Math.min(hi,n))};
const sid=v=>String(v==null?'':v).replace(/[^a-z0-9_-]/gi,'').slice(0,40)||Math.random().toString(36).slice(2,10);
const sdt=(v,d)=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):(d===undefined?'':d);
const str=(v,max)=>String(v==null?'':v).slice(0,max||300);
const arr=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[];
const cpay=p=>({a:num(p.a,0),d:sdt(p.d),n:str(p.n)});
const normS=o=>{o=o&&typeof o==='object'?o:{};S={t:num(o.t,0),total:num(o.total,DEF.total),monthly:num(o.monthly,DEF.monthly),day:int(o.day,1,31,30),start:sdt(o.start,DEF.start),pay:arr(o.pay).slice(0,150).map(cpay)};return fixPay()};
const normB=o=>{o=o&&typeof o==='object'?o:{};const b=Object.assign(cl(BDEF),{t:num(o.t,0)});
 ['cIni','dIni','vIni','vAmt','amtA','amtB','sm','goal'].forEach(k=>{b[k]=num(o[k],BDEF[k])});
 b.dayA=int(o.dayA,1,31,BDEF.dayA);b.dayB=int(o.dayB,1,31,BDEF.dayB);
 ['lq1','lq2'].forEach(k=>{if(o[k]!=null&&o[k]!=='')b[k]=num(o[k],null)});
 ['cDate','dDate','vDate','gs'].forEach(k=>{b[k]=sdt(o[k],BDEF[k])});
 const met=m=>/^[cdev]$/.test(m)?m:'c';
 b.exp=arr(o.exp).map(x=>({n:str(x.n),a:num(x.a,0),d:sdt(x.d),m:met(x.m),c:str(x.c,40)||'Otro'}));
 b.inc=arr(o.inc).map(x=>({m:/^[de]$/.test(x.m)?x.m:'e',a:num(x.a,0),d:sdt(x.d),n:str(x.n)}));
 b.sav=arr(o.sav).map(x=>({n:str(x.n),a:num(x.a,0),d:sdt(x.d)}));
 b.debts=arr(o.debts).map(D=>{const months=int(D.months,1,120,1);return{id:sid(D.id),n:str(D.n,80)||'Compra',price:num(D.price,0),total:num(D.total,0),months,mo:num(D.mo,0),start:sdt(D.start,today()),pay:arr(D.pay).slice(0,months).map(cpay).concat(Array.from({length:Math.max(0,months-arr(D.pay).length)},()=>({a:0,d:'',n:''})))}});
 b.methods=Array.isArray(o.methods)?[...new Set(o.methods.filter(x=>/^[vecd]$/.test(x)))]:null;if(b.methods&&!b.methods.length)b.methods=null;
 b.onb=o.onb==='pend'?'pend':'';
 b.ui=o.ui&&typeof o.ui==='object'?{mode:str(o.ui.mode,5),pal:str(o.ui.pal,12),acc:str(o.ui.acc,7)||null,acc2:str(o.ui.acc2,7)||null}:null;
 b.stm=arr(o.stm).map(x=>({id:sid(x.id),c:str(x.c,40),m:/^\d{4}-\d{2}$/.test(String(x.m||''))?x.m:'',sal:num(x.sal,0),min:num(x.min,0),l:sdt(x.l),n:str(x.n),pd:sdt(x.pd)}));
 return b};
const mkD=(y,m0,d)=>{const x=new Date(y,m0,1),dm=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(Math.min(d,dm))};
const due=n=>{const [y,m]=S.start.split('-').map(Number);return mkD(y,m-1+n-1,S.day||30)};
const fmtD=s=>s?esc(String(s).split('-').reverse().join('/')):'';
window.addEventListener('error',e=>{err='Error: '+e.message;const m=document.getElementById('msg');if(m)m.textContent=err});
const persist=(k,o)=>{try{localStorage.setItem(k,JSON.stringify(o))}catch(e){}};
try{const l=localStorage.getItem('fin');if(l)normS(JSON.parse(l));const b=localStorage.getItem('finb');if(b)B=normB(JSON.parse(b))}catch(e){}
function saveL(){err='';fixPay();S.t=Date.now();const o=loanObj();persist('fin',o);render();if(ses)apiPut('loan',o)}
function saveB(){err='';B.t=Date.now();persist('finb',B);render();if(ses&&can())apiPut('budget',B)}
const stt=(a,s,du)=>{a=+a||0;if(a>=s-0.005)return'Pagado';if(a>0)return'Parcial';return today()>du?'Atrasado':'Pendiente'};
function status(i){return stt(S.pay[i].a,sched(i+1),due(i+1))}
const addM=(s,n)=>{const [y,m,d]=s.split('-').map(Number);return mkD(y,m-1+n,d)};
const mens=D=>D.mo>0?D.mo:r2(D.total/D.months),ds=(D,k)=>k<D.months?mens(D):Math.max(0,r2(D.total-(D.months-1)*mens(D)));
const dpaid=D=>D.pay.reduce((t,p)=>t+(+p.a||0),0),ddone=D=>dpaid(D)>=D.total-0.005;
function curPeriod(dt){const t=dt||today(),[y,m]=t.split('-').map(Number),L=[];
 for(const o of [-1,0,1]){L.push({s:mkD(y,m-1+o,16),k:'A'});L.push({s:mkD(y,m-1+o,B.dayB),k:'B'})}
 L.sort((a,b)=>a.s<b.s?-1:a.s>b.s?1:0);let i=0;while(i+1<L.length&&L[i+1].s<=t)i++;return{cur:L[i],next:L[i+1]}}
const loanDone=()=>S.pay.every((p,i)=>status(i)==='Pagado');
function stmHtml(){
 const t=today(),L=B.stm.slice().sort((a,b)=>(a.l||'9').localeCompare(b.l||'9')),pend=B.stm.filter(x=>!x.pd).reduce((s,x)=>s+(+x.sal||0),0);
 let h=`<div class="card" style="margin-top:12px"><h3 style="margin:0 0 4px">Estados de cuenta</h3><p class="note" style="margin:0 0 8px">Por pagar: <b>${M(pend)}</b></p>`;
 if(!L.length)h+=`<p class="note">Aún no hay estados de cuenta. Agrega el de cada tarjeta cuando te llegue.</p>`;
 L.forEach(x=>{const st=x.pd?'Pagado':(x.l&&x.l<t?'Atrasado':'Pendiente'),lb=st==='Pendiente'?'Por pagar':st==='Atrasado'?'Vencido':'Pagado';
  h+=`<div class="ex" style="align-items:center"><span><b>${esc(x.c)}</b>, ${esc((x.m||'').split('-').reverse().join('/'))}<br><span class="note">Saldo ${M(x.sal)}, mínimo ${M(x.min)}${x.l?', vence el '+fmtD(x.l):''}${x.n?'. '+esc(x.n):''}</span></span>
  <span><span class="st ${st}">${lb}</span> ${x.pd?`<button class="btn" data-act="stundo" data-x="${x.id}">Deshacer</button>`:`<button class="btn f" data-act="stpay" data-x="${x.id}">Marcar pagado</button>`} <button class="btn" data-act="stdel" data-x="${x.id}">Quitar</button></span></div>`});
 h+=`<div class="row pg" style="margin-top:12px"><input id="xc" placeholder="Tarjeta, por ejemplo NU o BBVA…"><label>Mes del estado<input id="xm" type="month" value="${esc(t.slice(0,7))}"></label><label>Saldo a pagar<input id="xs" type="number" step="0.01"></label><label>Pago mínimo<input id="xi" type="number" step="0.01"></label><label>Fecha límite<input id="xl" type="date"></label><input id="xn" placeholder="Nota (opcional)…"><button class="btn f" data-act="stadd">Agregar estado</button></div></div>`;
 return h}
const nx30=()=>{const d=new Date();let c=mkD(d.getFullYear(),d.getMonth(),30);if(c<=today())c=mkD(d.getFullYear(),d.getMonth()+1,30);return c};
function debtCard(D){let h='';
  const pd=dpaid(D),rs=r2(D.total-pd),pc=Math.min(100,pd/D.total*100),n=D.pay.filter((p,k)=>stt(p.a,ds(D,k+1),addM(D.start,k))==='Pagado').length;
  h+=`<div class="card dc" style="margin-top:12px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(D.n)}</h3><span class="note" style="margin:0">Compraste en ${M(D.price)}, pagarás ${M(D.total)} en ${D.months} pagos</span>${shareBtn('debt:'+D.id,D.n)}</div>
  <div class="row"><label>Mensualidad (puedes cambiarla)<input type="number" step="0.01" data-df="mo" data-d="${D.id}" value="${esc(mens(D))}"></label></div>
  <div class="grid" style="margin-top:8px"><div class="card"><small>Pagado</small><b>${M(pd)}</b></div><div class="card"><small>Saldo restante</small><b>${M(rs)}</b></div><div class="card"><small>Pagos completos</small><b>${n} de ${D.months}</b></div></div>
  <div class="bar"><i style="width:${pc}%"></i></div>
  <div class="wrap"><table><tr><th>#</th><th>Fecha</th><th>Programado</th><th>Pagado</th><th>Fecha real</th><th>Estatus</th><th></th></tr>`;
  D.pay.forEach((p,k)=>{const s=stt(p.a,ds(D,k+1),addM(D.start,k));h+=`<tr><td>${k+1}</td><td>${fmtD(addM(D.start,k))}</td><td>${M(ds(D,k+1))}</td>
  <td><input type="number" step="0.01" data-df="a" data-d="${D.id}" data-i="${k}" value="${esc(p.a||'')}"></td>
  <td><input type="date" data-df="d" data-d="${D.id}" data-i="${k}" value="${esc(p.d)}"></td>
  <td class="st ${s}">${s}</td>
  <td>${(+p.a)>0?`<button class="btn" data-act="dundo" data-d="${D.id}" data-i="${k}">Deshacer</button>`:`<button class="btn f" data-act="dmark" data-d="${D.id}" data-i="${k}">Marcar pagado</button>`}</td></tr>
  <tr><td></td><td colspan="6"><input class="w" placeholder="Nota o referencia…" data-df="n" data-d="${D.id}" data-i="${k}" value="${esc(p.n||'')}"></td></tr>`});
  h+=`</table></div><div class="row" style="margin-top:10px">${cfm===D.id?`<span class="note" style="margin:0">¿Eliminar esta compra y sus pagos?</span><button class="btn f" data-act="ddely" data-d="${D.id}">Sí, eliminar</button><button class="btn" data-act="ddeln">Cancelar</button>`:`<button class="btn" data-act="ddel" data-d="${D.id}">Eliminar compra</button>`}</div></div>`;
 return h}
function debtForm(){return `<div class="card" style="margin-top:12px"><h3 style="margin:0 0 8px">Nueva deuda</h3><div class="row"><input id="dn" placeholder="Nombre (ej. Celular)"><div class="fl"><span>Monto de la compra</span>${ap('dp','',{st:500,ph:'0'})}</div><label>Total a pagar<input id="dt" type="number" step="0.01" placeholder="igual al monto"></label><label>Meses<input id="dmo" type="number" min="1" max="60" step="1"></label><label>Mensualidad (opcional)<input id="dmn" type="number" step="0.01" placeholder="se calcula sola"></label><label>Primer pago<input id="dd" type="date" value="${esc(nx30())}"></label></div><div class="row"><button class="btn f" data-act="dadd">Crear deuda</button><button class="btn" data-act="dcancel">Cancelar</button></div></div>`}
function foldHtml(id,title,sum,inner,def){return `<details class="fold" data-fid="${esc(id)}" ${(openF[id]===undefined?def:openF[id])?'open':''}><summary><span class="ft">${title}</span><span class="fs">${sum}</span></summary><div class="fb">${inner}</div></details>`}
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const shortD=s=>{const p=String(s).split('-');return p.length===3?(+p[2])+' '+MES[(+p[1]-1)%12]:''};
const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
let justPaid=-1;
function loanHero(){if(!(+S.total>0))return `<div class="hero"><p class="hk">${loanTitle()}</p><p class="done-msg" style="color:var(--ink)">Aún no registras un préstamo.</p><p class="note">Escribe abajo cuánto debes y cuánto pagas al mes; aquí aparecerá tu tarjeta de pagos.</p></div>`;
 const it=planItemsLoan(),j=new Set(justPaid>=0?[justPaid]:[]);justPaid=-1;return planHero(it,+S.total||0,j,loanTitle(),true,shareBtn('loan',loanTitle()))}
function loanBody(){
 const paid=S.pay.reduce((t,p)=>t+(+p.a||0),0),rest=r2(S.total-paid),pct=S.total?Math.min(100,paid/S.total*100):0;
 const nOk=S.pay.filter((p,i)=>status(i)==='Pagado').length;
 let h='';
  h+=loanHero()+`<div class="card" style="margin-top:12px"><div class="row cfg">
  <label>Monto del préstamo<input type="number" step="0.01" data-s="total" value="${esc(S.total)}"></label>
  <label>Pago mensual<input type="number" step="0.01" data-s="monthly" value="${esc(S.monthly)}"></label>
  <label>Primer pago (mes)<input type="month" data-s="start" value="${esc(S.start.slice(0,7))}"></label>
  <label>Día de pago<input type="number" min="1" max="31" step="1" data-s="day" value="${esc(S.day)}"></label></div></div>
  <div class="card wrap" style="margin-top:12px"><table><tr><th>#</th><th>Fecha</th><th>Programado</th><th>Pagado</th><th>Fecha real</th><th>Estatus</th><th></th></tr>`;
  S.pay.forEach((p,i)=>{const st=status(i);h+=`<tr><td>${i+1}</td><td>${fmtD(due(i+1))}</td><td>${M(sched(i+1))}</td>
  <td><input type="number" step="0.01" data-f="a" data-i="${i}" value="${esc(p.a||'')}"></td>
  <td><input type="date" data-f="d" data-i="${i}" value="${esc(p.d)}"></td>
  <td class="st ${st}">${st}</td>
  <td>${(+p.a)>0?`<button class="btn" data-act="undo" data-i="${i}">Deshacer</button>`:`<button class="btn f" data-act="mark" data-i="${i}">Marcar pagado</button>`}</td></tr>
  <tr><td></td><td colspan="6"><input class="w" placeholder="Nota o referencia de la transferencia…" data-f="n" data-i="${i}" value="${esc(p.n||'')}"></td></tr>`});
  h+=`</table></div>
  <div class="card" style="margin-top:12px"><h3 style="margin:0 0 4px">Resumen para compartir</h3><p class="note" style="margin:0 0 8px">Copia este resumen y mándalo por WhatsApp o correo.</p>
  <textarea id="sumt" readonly rows="9">${esc(sumText())}</textarea>
  <div class="row" style="margin-top:8px"><button class="btn f" data-act="copysum">Copiar resumen</button><a class="btn" href="https://wa.me/?text=${encodeURIComponent(sumText())}" target="_blank" rel="noopener">Enviar por WhatsApp</a></div></div>`;
 return h}
function loansHtml(){
 const paid=S.pay.reduce((t,p)=>t+(+p.a||0),0),rest=r2(S.total-paid),nOk=S.pay.filter((p,i)=>status(i)==='Pagado').length;
 let h=`<div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">Deudas</h3>${can()?'<button class="btn f" data-act="dnew">+ Agregar deuda nueva</button>':''}</div>`;
 if(can()&&showNew)h+=debtForm();
 h+=foldHtml('loan',loanTitle(),!(+S.total>0)?'Sin registrar':rest<=0.005?'Liquidado':'Te faltan '+M(rest)+'<small>'+nOk+' de '+S.pay.length+' pagos</small>',loanBody(),true);
 if(can()){B.debts.forEach(D=>{const rs=r2(D.total-dpaid(D)),n=D.pay.filter((p,k)=>stt(p.a,ds(D,k+1),addM(D.start,k))==='Pagado').length;
  h+=foldHtml(D.id,esc(D.n),ddone(D)?'Liquidada':'Te faltan '+M(rs)+'<small>'+n+' de '+D.months+' pagos</small>',debtCard(D),false)});
  if(!B.debts.length&&!showNew)h+='<p class="note">Aquí aparecerán tus compras a meses y otras deudas. Toca "Agregar deuda nueva" para crear una.</p>'}
 return h}

const METH={c:'Crédito',d:'Débito',e:'Efectivo',v:'Vales'};
const CATS=['Comida','Transporte','Casa','Salud','Ropa','Entretenimiento','Otro'];
function valesInfo(){const t=today(),vd=B.vDate||t,[y0,m0]=vd.split('-').map(Number);let cnt=0,next='';
 for(let k=0;k<240;k++){const d=mkD(y0,m0-1+k,30);if(d>t){next=d;break}if(d>vd)cnt++}
 const spent=B.exp.filter(e=>e.m==='v'&&(e.d||t)>=vd).reduce((s,e)=>s+(+e.a||0),0);
 return{bal:r2((+B.vIni||0)+cnt*(+B.vAmt||0)-spent),next,cnt}}
function accInfo(k){if(k==='v')return valesInfo();const t=today(),dt=B[k==='e'?'cDate':'dDate']||t,ini=+B[k==='e'?'cIni':'dIni']||0;
 const spent=B.exp.filter(e=>e.m===k&&(e.d||t)>=dt).reduce((s,e)=>s+(+e.a||0),0);
 const inc=(B.inc||[]).filter(x=>x.m===k&&(x.d||t)>=dt).reduce((s,x)=>s+(+x.a||0),0);
 return{bal:r2(ini+inc-spent),inc:r2(inc)}}
function expBlock(k){const t=today(),list=B.exp.map((x,i)=>({e:x,i})).filter(o=>o.e.m===k).sort((a,b)=>(b.e.d||'').localeCompare(a.e.d||'')).slice(0,5);
 return `<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px"><b style="font-size:15px">Gastos con ${METH[k].toLowerCase()}</b>
  <div class="pg" style="margin-top:8px">
   <div class="fl"><span>Concepto</span><input id="en${k}" placeholder="Qué compraste…"></div>
   <div class="fl"><span>Monto</span>${ap('ea'+k,'',{st:50,ph:'Monto',chips:[50,100,200]})}</div>
   <div class="fl"><span>Fecha</span><input id="ed${k}" type="date" value="${esc(t)}"></div>
   <div class="fl"><span>Categoría</span><select id="ec${k}" class="sel">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></div>
   <div class="fl"><span>&nbsp;</span><button class="btn f" data-act="xadd" data-k="${k}">Agregar gasto</button></div>
  </div>
  <div style="margin-top:10px">${list.length?list.map(o=>editE===o.i?editRow(o):`<div class="ex"><span>${fmtD(o.e.d)} ${esc(o.e.n)} <small class="tg">${esc(o.e.c||'Otro')}</small></span><span>${M(o.e.a)} <button class="btn" data-act="eedit" data-i="${o.i}">Editar</button> <button class="btn" data-act="del" data-i="${o.i}">Quitar</button></span></div>`).join(''):'<p class="note">Aún no hay gastos con esta forma de pago.</p>'}</div></div>`}
function incBlock(k){const t=today(),list=(B.inc||[]).map((x,i)=>({x,i})).filter(o=>o.x.m===k).sort((a,b)=>(b.x.d||'').localeCompare(a.x.d||'')).slice(0,5);
 return `<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px"><b style="font-size:15px">Recibí una transferencia o depósito</b>
  <div class="pg" style="margin-top:8px">
   <div class="fl"><span>Monto recibido</span>${ap('ia'+k,'',{st:100,ph:'Monto'})}</div>
   <div class="fl"><span>Fecha</span><input id="id${k}" type="date" value="${esc(t)}"></div>
   <div class="fl"><span>De quién (opcional)</span><input id="in${k}" placeholder="Nombre o concepto…"></div>
   <div class="fl"><span>&nbsp;</span><button class="btn f" data-act="iadd" data-k="${k}">Agregar ingreso</button></div>
  </div>
  <div style="margin-top:10px">${list.length?list.map(o=>`<div class="ex"><span>${fmtD(o.x.d)} ${esc(o.x.n||'Ingreso')}</span><span style="color:var(--ok)">+${M(o.x.a)} <button class="btn" data-act="idel" data-i="${o.i}">Quitar</button></span></div>`).join(''):'<p class="note">Aún no hay ingresos registrados.</p>'}</div></div>`}
function saldoCard(k){
 const C={v:{t:'Tarjeta de vales',ini:'vIni',dt:'vDate'},e:{t:'Efectivo',ini:'cIni',dt:'cDate'},d:{t:'Débito',ini:'dIni',dt:'dDate'}}[k];
 const info=accInfo(k),ini=+B[C.ini]||0,total=k==='v'?r2(ini+(info.cnt||0)*(+B.vAmt||0)):r2(ini+(info.inc||0));
 const pct=total>0?Math.max(0,Math.min(100,info.bal/total*100)):0;
 const col=info.bal<0?'var(--bad)':pct<20?'var(--warn)':'var(--ok)';
 const before=B.exp.filter(x=>x.m===k&&(x.d||today())<B[C.dt]).length;
 const note=k==='v'?`Recibes ${M(B.vAmt)} cada día 30. Próximo depósito: ${info.next?fmtD(info.next):'—'}.`:`Se descuenta con los gastos que pagas con ${C.t.toLowerCase()}.`;
 return `<div class="card" style="margin-top:12px"><h3 style="margin:0 0 4px">${C.t}</h3>
  <p style="margin:0"><b class="big" style="font-size:28px;color:${col}">${M(info.bal)}</b> <span class="note">disponibles</span></p>
  <p class="note" style="margin:2px 0 8px">${total>0?`Gastado ${M(r2(total-info.bal))} de ${M(total)}. Te queda el ${Math.round(pct)}%.`:'Escribe tu saldo abajo para ver cuánto te queda.'}</p>
  <div class="bar" style="height:14px"><i style="width:${pct}%;background:${col}"></i></div>
  <p class="note" style="margin:6px 0 4px">${note}</p>${shareBtn('acct:'+k,C.t)}
  ${before>0?`<p class="note" style="margin:0 0 10px;color:var(--warn)">${before} gasto${before>1?'s':''} con fecha anterior al ${fmtD(B[C.dt])} ${before>1?'no se descuentan':'no se descuenta'}. Cambia la fecha del saldo si quieres incluirlo${before>1?'s':''}.</p>`:'<div style="height:8px"></div>'}
  <div class="pg">
   <div class="fl"><span>Saldo al ${fmtD(B[C.dt])}</span>${ap(C.ini,B[C.ini],{st:100,key:C.ini})}</div>
   <div class="fl"><span>Fecha de ese saldo</span><input class="apn ro" type="date" data-b="${C.dt}" value="${esc(B[C.dt])}"></div>
   ${k==='v'?`<div class="fl"><span>Depósito mensual</span>${ap('vAmt',B.vAmt,{st:100,key:'vAmt'})}</div>`:''}
  </div>${k!=='v'?incBlock(k):''}${expBlock(k)}</div>`}
const MC={c:'#7c2e3b',d:'#5e6b35',e:'#b07a2e',v:'#8a5a3b'};
const CC=['#7c2e3b','#5e6b35','#b07a2e','#8a5a3b','#a8505f','#8c9858','#d1a669','#5a4232'];
function pie(items,size){const tot=items.reduce((s,i)=>s+i.v,0);
 if(tot<=0)return `<div class="nopie" style="width:${size}px;height:${size}px"></div>`;
 let a=-Math.PI/2,out='';const cx=50,cy=50,r=48;
 items.filter(i=>i.v>0).forEach(i=>{const f=i.v/tot;
  if(f>0.9999){out+=`<circle cx="50" cy="50" r="48" fill="${i.c}"/>`;return}
  const b=a+f*2*Math.PI,x1=cx+r*Math.cos(a),y1=cy+r*Math.sin(a),x2=cx+r*Math.cos(b),y2=cy+r*Math.sin(b);
  out+=`<path d="M50,50 L${x1.toFixed(2)},${y1.toFixed(2)} A48,48 0 ${f>0.5?1:0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${i.c}" stroke="var(--card)" stroke-width="0.8"/>`;a=b});
 return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Gráfica de pastel">${out}</svg>`}
function legRows(items,tot){return items.filter(i=>i.v>0).map(i=>`<div class="lr"><i class="dot" style="background:${i.c}"></i><span>${esc(i.l)}</span><span class="sp"></span><b>${M(i.v)}</b><small>${tot?Math.round(i.v/tot*100):0}%</small></div>`).join('')||'<p class="note">Sin datos este mes.</p>'}
function statsHtml(){const t=today(),cm=t.slice(0,7),z=()=>({c:0,d:0,e:0,v:0}),K=['c','d','e','v'].filter(k=>useM(k)||B.exp.some(x=>x.m===k&&(x.d||'').slice(0,7)===cm));
 const all=B.exp.map(x=>({a:+x.a||0,m:METH[x.m]?x.m:'c',c:x.c||'Otro',d:x.d||t}));
 const sum=arr=>r2(arr.reduce((s,x)=>s+x.a,0)),mes=all.filter(x=>x.d.slice(0,7)===cm);
 const tot=sum(mes),bm=k=>sum(mes.filter(x=>x.m===k)),avg=mes.length?r2(tot/mes.length):0;
 const byC={};mes.forEach(x=>{byC[x.c]=r2((byC[x.c]||0)+x.a)});
 const cats=Object.entries(byC).sort((a,b)=>b[1]-a[1]);
 const pm={};all.forEach(x=>{const k=x.d.slice(0,7);(pm[k]=pm[k]||z())[x.m]+=x.a});
 const mk=Object.keys(pm).sort().slice(-6);
 const pq={};all.forEach(x=>{const k=curPeriod(x.d).cur.s;(pq[k]=pq[k]||z())[x.m]+=x.a});
 const qk=Object.keys(pq).sort().slice(-6);
 const tt=o=>K.reduce((s,k)=>s+o[k],0);
 const mItems=o=>K.map(k=>({l:METH[k],v:o[k],c:MC[k]}));
 const curM=pm[cm]||z();
 const catItems=cats.map((x,i)=>({l:x[0],v:x[1],c:CC[i%CC.length]}));
 const mini=(ks,o,lbl)=>ks.length?`<div class="pies">${ks.map(k=>`<div class="pie">${pie(mItems(o[k]),110)}<b>${lbl(k)}</b><small>${M(tt(o[k]))}</small></div>`).join('')}</div>`:'<p class="note">Aún no hay gastos.</p>';
 const mLbl=k=>['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][+k.slice(5,7)-1]+' '+k.slice(2,4);
 const qLbl=k=>k.slice(8,10)+'/'+k.slice(5,7);
 const legS=`<div class="leg-s">${K.map(k=>`<span><i class="dot" style="background:${MC[k]}"></i>${METH[k]}</span>`).join('')}</div>`;
 return `<div class="grid">
  <div class="card"><small>Gastado este mes</small><b>${M(tot)}</b></div>
  ${K.map(k=>`<div class="card"><small>${METH[k]}</small><b>${M(bm(k))}</b></div>`).join('')}
  <div class="card"><small>Promedio por gasto</small><b>${M(avg)}</b><small>${mes.length} gastos este mes</small></div></div>
  <div class="card" style="margin-top:12px"><h3 style="margin:0 0 10px">Formas de pago este mes</h3><div class="bigpie">${pie(mItems(curM),190)}<div class="lgd">${legRows(mItems(curM),tt(curM))}</div></div></div>
  <div class="card" style="margin-top:12px"><h3 style="margin:0 0 10px">Categorías este mes</h3><div class="bigpie">${pie(catItems,190)}<div class="lgd">${legRows(catItems,tot)}</div></div></div>
  <div class="card" style="margin-top:12px"><h3 style="margin:0 0 10px">Por mes</h3>${mini(mk,pm,mLbl)}${legS}</div>
  <div class="card" style="margin-top:12px"><h3 style="margin:0 0 10px">Por quincena</h3>${mini(qk,pq,qLbl)}${legS}</div>`}
function editRow(x){const e=x.e;return `<div class="card" style="margin:8px 0;padding:14px"><h3 style="margin:0 0 10px">Editar gasto</h3><div class="pg">
  <div class="fl"><span>Concepto</span><input id="xen" value="${esc(e.n||'')}"></div>
  <div class="fl"><span>Monto</span>${ap('xea',e.a,{st:50})}</div>
  <div class="fl"><span>Fecha</span><input id="xed" type="date" value="${esc(e.d||today())}"></div>
  <div class="fl"><span>Categoría</span><select id="xec" class="sel">${CATS.map(c=>`<option${c===(e.c||'Otro')?' selected':''}>${c}</option>`).join('')}</select></div>
  <div class="fl"><span>Pagado con</span><select id="xem" class="sel">${['c','d','e','v'].filter(k=>useM(k)||(e.m||'c')===k).map(k=>`<option value="${esc(k)}"${(e.m||'c')===k?' selected':''}>${METH[k]}</option>`).join('')}</select></div>
  </div><div class="row" style="margin-top:12px"><button class="btn f" data-act="esave" data-i="${x.i}">Guardar cambios</button><button class="btn" data-act="ecancel">Cancelar</button></div></div>`}
function ap(id,val,o){o=o||{};const st=o.st||100;
 const ch=(o.chips||[]).map(q=>`<button type="button" class="chip" data-aq="${id}" data-v="${q}">${M(q).replace(/\.00$/,'')}</button>`).join('')+(o.clr?`<button type="button" class="chip" data-clr="${o.key}">Automático</button>`:'');
 return `<div class="ap"><div class="apr"><button type="button" class="stp" data-as="${id}" data-d="-1" data-st="${st}" aria-label="Bajar"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><input id="${id}" class="apn" type="number" inputmode="decimal" step="0.01" min="0" placeholder="${o.ph||'0'}" value="${esc(val==null?'':val)}"${o.key?` data-b="${o.key}"`:''}><button type="button" class="stp" data-as="${id}" data-d="1" data-st="${st}" aria-label="Subir"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg></button></div>${ch?`<div class="chips">${ch}</div>`:''}</div>`}
function decorate(){const app=$('#app');
 if(app&&!app.querySelector(':scope>.cbar')){const bar=document.createElement('div');bar.className='cbar';bar.innerHTML='<button type="button" class="chip" data-act="collall">Contraer todo</button><button type="button" class="chip" data-act="expall">Expandir todo</button>';app.prepend(bar)}
 if(app)app.querySelectorAll('.card').forEach(c=>{const hh=c.querySelector(':scope>h3');if(!hh)return;hh.dataset.ck=hh.textContent.trim();c.classList.add('cc');c.classList.toggle('collapsed',CL.has(hh.dataset.ck));hh.tabIndex=0;hh.setAttribute('role','button');hh.setAttribute('aria-expanded',String(!c.classList.contains('collapsed')))});
 if(app)app.querySelectorAll('input:not([autocomplete]):not([type=file])').forEach(i=>i.setAttribute('autocomplete','off'));
 if(app){app.querySelectorAll('.fl').forEach(f=>{const s=f.querySelector(':scope>span'),lb=s&&s.textContent.trim();if(lb)f.querySelectorAll('input,select').forEach(i=>{if(!i.hasAttribute('aria-label'))i.setAttribute('aria-label',lb)})});
  app.querySelectorAll('input[placeholder]:not([aria-label]),textarea:not([aria-label])').forEach(i=>{if(!i.closest('label'))i.setAttribute('aria-label',i.placeholder||'Resumen del préstamo')})}
 document.querySelectorAll('table').forEach(t=>{const hs=[...t.querySelectorAll('th')].map(x=>x.textContent);t.querySelectorAll('tr').forEach(r=>{const c=r.children;if(!c.length||c[0].tagName!=='TD')return;if(c.length>=7){[...c].forEach((x,k)=>{if(hs[k]){x.setAttribute('data-label',hs[k]);const i=x.querySelector('input');if(i&&!i.hasAttribute('aria-label'))i.setAttribute('aria-label',hs[k]+' del pago '+c[0].textContent.trim())}});r.classList.add('dr')}else if(c.length===2)r.classList.add('nr')})})}
function sumText(){const paid=S.pay.reduce((t,p)=>t+(+p.a||0),0),rest=r2(S.total-paid),pc=S.total?(paid/S.total*100).toFixed(1):0;
 let s=loanTitle()+' - resumen al '+fmtD(today())+'\nMonto: '+M(S.total)+'\nPagado: '+M(paid)+'\nSaldo restante: '+M(rest)+' ('+pc+'% liquidado)\n\nPagos:';
 S.pay.forEach((p,i)=>{const st=status(i);s+='\n'+(i+1)+') '+fmtD(due(i+1))+' - '+M(sched(i+1))+' - '+(st==='Pagado'?'Pagado'+(p.d?' el '+fmtD(p.d):''):st==='Parcial'?'Parcial ('+M(p.a)+')':st)});return s}
// ===== Base de datos: Supabase (configurada en config.js) =====
const CFG=window.FINANZAS_CONFIG||{};
const SB={url:String(CFG.supabaseUrl||'').trim().replace(/\/+$/,''),key:String(CFG.supabaseKey||'').trim()};
const API=/^https?:\/\//.test(SB.url)&&SB.key.length>20&&!/PEGA_AQUI/.test(SB.url+SB.key);
const sbOn=()=>API;
const EMD='@mis-finanzas.app';
const toEmail=u=>u.indexOf('@')>=0?u:u+EMD;
const fromEmail=e=>{e=String(e||'');return e.endsWith(EMD)?e.slice(0,-EMD.length):e};
let ses=null,sbOk=false,pulling=false,firstPull=true,lastSync=0,canReg=true,me=null,refreshing=null;
try{ses=JSON.parse(localStorage.getItem('sbs')||'null');if(!ses||!ses.uid||!ses.r)ses=null}catch(e){ses=null}
const saveSes=()=>{try{if(ses)localStorage.setItem('sbs',JSON.stringify(ses));else localStorage.removeItem('sbs')}catch(e){}};
function authErr(status,j){const e=new Error('auth '+status);e.status=status;e.code=(j&&(j.error_code||j.code||j.error))||'';return e}
async function sbAuthReq(path,body,tok,method){const hd={apikey:SB.key,'Content-Type':'application/json'};if(tok)hd.Authorization='Bearer '+tok;
 const r=await fetch(SB.url+'/auth/v1/'+path,{method:method||'POST',headers:hd,body:body?JSON.stringify(body):undefined});
 const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}if(!r.ok)throw authErr(r.status,j);return j}
const mkSes=j=>({a:j.access_token,r:j.refresh_token,x:Date.now()+(j.expires_in||3600)*1000,uid:j.user&&j.user.id,user:fromEmail(j.user&&j.user.email)});
async function apiAuth(kind,user,password){const email=toEmail(user);
 if(kind==='register'){const j=await sbAuthReq('signup',{email,password});if(!j||!j.access_token)throw authErr(400,{error_code:'email_confirm'});return mkSes(j)}
 return mkSes(await sbAuthReq('token?grant_type=password',{email,password}))}
function expire(){ses=null;saveSes();role='';me=null;err='Tu sesión expiró. Vuelve a entrar.';$('#app').innerHTML='';render()}
async function ensureFresh(){if(!ses||Date.now()<ses.x-60000)return;
 if(!refreshing)refreshing=(async()=>{try{const j=await sbAuthReq('token?grant_type=refresh_token',{refresh_token:ses.r});Object.assign(ses,{a:j.access_token,r:j.refresh_token,x:Date.now()+(j.expires_in||3600)*1000});saveSes()}
  catch(e){if(e.status>=400&&e.status<500){expire();const x=new Error('HTTP 401');x.status=401;throw x}throw e}finally{refreshing=null}})();
 return refreshing}
async function api(path,opt){opt=opt||{};await ensureFresh();
 const hd=Object.assign({apikey:SB.key,'Content-Type':'application/json'},opt.headers||{});if(ses)hd.Authorization='Bearer '+ses.a;
 const r=await fetch(SB.url+path,{method:opt.method||'GET',headers:hd,body:opt.body===undefined?undefined:JSON.stringify(opt.body)});
 if(r.status===401&&ses){expire();const e=new Error('HTTP 401');e.status=401;throw e}
 const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
 if(!r.ok){const e=new Error((j&&(j.message||j.msg))||('HTTP '+r.status));e.status=r.status;throw e}return j}
const tgt=()=>ses.role==='guest'&&ses.owner?ses.owner:ses.uid;
async function resolveRole(){try{const rows=await api('/rest/v1/shares?select=owner_id,owner_name&viewer_id=eq.'+encodeURIComponent(ses.uid));
  const s=rows&&rows[0];ses.owner=s?s.owner_id:null;ses.ownerName=s?s.owner_name:null;ses.role=s?'guest':'user';saveSes()}catch(e){if(e.status===401)throw e;if(!ses.role)ses.role='user'}
 me={user:ses.user,role:ses.role,owner:ses.ownerName};return ses.role}
function apiPut(key,obj){if(!ses)return Promise.resolve();return api('/rest/v1/app_state',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:tgt(),key,value:obj,updated_at:new Date().toISOString()}})
 .then(()=>{sbOk=true;lastSync=Date.now();notifyShares(key);setTimeout(()=>pulse($('#sync'),'saved',700));if(err&&err.indexOf('nube')>=0){err='';const m=$('#msg');if(m)m.textContent=''}renderSync()},e=>{if(e.status===401)return;sbOk=false;err='Sin conexión con la nube; tus cambios se guardan en este dispositivo y se subirán al reconectar.';render()})}
const loanObj=()=>({t:S.t,total:S.total,monthly:S.monthly,day:S.day,start:S.start,pay:S.pay});
async function loadMe(){if(!ses)return;const old=role;try{await resolveRole()}catch(e){return}if(!ses)return;role=ses.role;if(role!==old||tab==='acct')render()}
// Repara cuentas creadas con una versión anterior que les puso los valores iniciales de rafa
function fixRafaDefaults(){let did=false;
 const untouchedLoan=+S.total===50000&&+S.monthly===5000&&S.pay.length===10&&S.start==='2026-11-30'&&S.pay.every(p=>!(+p.a)&&!p.d&&!p.n);
 if(untouchedLoan){normS({total:0,monthly:0,day:30,start:nx30(),pay:[]});S.t=Date.now();persist('fin',loanObj());apiPut('loan',loanObj());did=true}
 const untouchedBud=+B.amtA===5700&&+B.amtB===8700&&+B.sm===2200&&!B.exp.length&&!B.sav.length&&!B.debts.length&&!B.stm.length&&!(B.inc||[]).length;
 if(untouchedBud){Object.assign(B,{amtA:0,amtB:0,sm:0,vAmt:0});B.t=Date.now();persist('finb',B);apiPut('budget',B);did=true}
 return did}
async function sbPull(){if(!API||!ses||!role||pulling)return;pulling=true;try{
 const rows=await api('/rest/v1/app_state?select=key,value&user_id=eq.'+encodeURIComponent(tgt()))||[];let ch=false,hasL=false,hasB=false;
 for(const rw of rows){const v=rw.value||{};
  if(rw.key==='loan'){hasL=true;if(!(S.t>0)||(v.t||0)>S.t){normS(v);persist('fin',v);ch=true}else if(S.t>(v.t||0))apiPut('loan',loanObj())}
  else if(rw.key==='budget'&&can()){hasB=true;if(!(B.t>0)||(v.t||0)>B.t){B=normB(v);persist('finb',B);ch=true;if(B.ui){UI=normUI(B.ui);applyUI();try{localStorage.setItem('ui',JSON.stringify(UI))}catch(e){}}}else if(B.t>(v.t||0))apiPut('budget',B)}}
 if(!hasL&&role!=='guest'){if(isRafa()&&!(+S.total>0))normS(RDEF);else if(!(+S.total>0))S.start=nx30();S.t=S.t||Date.now();apiPut('loan',loanObj());ch=true}
 if(can()&&!hasB){if(isRafa()&&!B.amtA&&!B.amtB)B=normB(RBDEF);else if(!isRafa()){const d=today();B.gs=B.cDate=B.vDate=B.dDate=d}B.t=B.t||Date.now();if(ses&&ses.user!=='rafa'&&!B.methods){B.onb='pend';onbSel=new Set();ch=true}apiPut('budget',B)}
 if(!isRafa()&&can()&&fixRafaDefaults())ch=true;
 sbOk=true;lastSync=Date.now();if(err&&err.indexOf('nube')>=0)err='';
 const busy=document.activeElement&&/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)&&$('#app').contains(document.activeElement);
 if(firstPull||(ch&&!busy)){if(firstPull)animTab='first';firstPull=false;render()}else renderSync();
}catch(e){if(e.status!==401){sbOk=false;renderSync()}}finally{pulling=false}}
function renderSync(){const s=$('#sync');if(!s)return;if(!role){s.textContent='';return}
 const h=lastSync?new Date(lastSync).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}):'';
 s.textContent=sbOk?'Guardado en la nube'+(h?' a las '+h.replace(/\.$/,''):'')+'. Lo ves igual en todos tus dispositivos.':'Sin conexión con la nube. Tus cambios se guardan en este dispositivo y se subirán al reconectar.';s.title='Mis finanzas v38'}
function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function exportData(){download('mis-finanzas-'+today()+'.json',JSON.stringify({app:'mis-finanzas',formato:1,exportado:new Date().toISOString(),usuario:me&&me.user,loan:loanObj(),budget:B},null,2))}
function importData(file){const m=$('#imsg');const rd=new FileReader();rd.onload=()=>{try{const j=JSON.parse(rd.result);
  if(!j||typeof j!=='object'||(!j.loan&&!j.budget))throw new Error('formato');
  if(!confirm('Esto reemplazará tus datos actuales por los del archivo. ¿Continuar?'))return;
  if(j.loan&&typeof j.loan==='object'){normS(j.loan);saveL()}
  if(j.budget&&typeof j.budget==='object'&&can()){B=normB(j.budget);saveB()}
  const m2=$('#imsg');if(m2){m2.className='note okm';m2.textContent='Datos restaurados.'}
 }catch(e){if(m){m.className='note badm';m.textContent='El archivo no es un respaldo válido de Mis finanzas.'}}};rd.readAsText(file)}
function accountHtml(){const g=role==='guest';
 return `<div class="card"><h3>Mi cuenta</h3><p class="note">Usuario: <strong>${esc(me?me.user:(ses?ses.user:'…'))}</strong>${g?'. Eres invitado'+(me&&me.owner?' de <strong>'+esc(me.owner)+'</strong>':'')+'. Puedes ver y editar su préstamo.':''}</p></div>
 <div class="card"><h3>Cambiar contraseña</h3><div class="pg">
  <div class="fl"><span>Contraseña actual</span><input id="pc" type="password" autocomplete="current-password"></div>
  <div class="fl"><span>Nueva contraseña</span><input id="pn" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></div>
  <div class="fl"><span>Repite la nueva</span><input id="pn2" type="password" autocomplete="new-password"></div>
  <div class="fl"><span>&nbsp;</span><button class="btn f" data-act="pwchg">Cambiar contraseña</button></div></div>
  <p class="note" id="pmsg" aria-live="polite"></p><p class="note">Al cambiarla se cierra la sesión en tus otros dispositivos.</p></div>
 ${g?'':`<div class="card"><h3>Respaldo de tus datos</h3><p class="note">Descarga un archivo con todo tu préstamo, deudas, gastos y ahorro. Guárdalo en tu celular, Drive o correo.</p>
  <div class="row" style="margin-top:10px"><button class="btn f" data-act="export">Descargar respaldo</button><label class="btn">Restaurar desde archivo<input type="file" id="impf" accept=".json,application/json" hidden></label></div><p class="note" id="imsg" aria-live="polite"></p></div>
 <div class="card danger"><h3>Eliminar cuenta</h3><p class="note">Borra tu cuenta y todos tus datos de la nube. No se puede deshacer; descarga un respaldo antes.</p>
  <div class="pg" style="margin-top:10px"><div class="fl"><span>Escribe tu contraseña</span><input id="dpw" type="password" autocomplete="current-password"></div><div class="fl"><span>&nbsp;</span><button class="btn del" data-act="delacct">Eliminar mi cuenta</button></div></div><p class="note" id="dmsg" aria-live="polite"></p></div>`}`}
async function reauth(pw){const s=mkSes(await sbAuthReq('token?grant_type=password',{email:toEmail(ses.user),password:pw}));Object.assign(ses,{a:s.a,r:s.r,x:s.x});saveSes()}
async function changePw(){const c=$('#pc').value,n=$('#pn').value,n2=$('#pn2').value,m=$('#pmsg');m.className='note badm';
 if(n.length<8){m.textContent='La nueva contraseña debe tener al menos 8 caracteres.';return}
 if(n!==n2){m.textContent='Las contraseñas nuevas no coinciden.';return}
 try{await reauth(c)}catch(e){m.textContent=e.status===429?'Demasiados intentos. Espera un rato.':e.status>=400&&e.status<500?'La contraseña actual no es correcta.':'No se pudo conectar. Revisa tu internet.';return}
 try{await sbAuthReq('user',{password:n},ses.a,'PUT');await sbAuthReq('logout?scope=others',null,ses.a).catch(()=>{});
  m.className='note okm';m.textContent='Contraseña cambiada.';$('#pc').value=$('#pn').value=$('#pn2').value=''}
 catch(e){m.textContent=e.code==='same_password'?'La nueva contraseña debe ser diferente a la actual.':e.code==='weak_password'?'La contraseña es muy débil; usa una más larga.':'No se pudo cambiar. Inténtalo de nuevo.'}}
async function deleteAccount(){const p=$('#dpw').value,m=$('#dmsg');m.className='note badm';
 if(!p){m.textContent='Escribe tu contraseña.';return}
 if(!confirm('¿Seguro? Se borrarán tu cuenta y todos tus datos para siempre.'))return;
 try{await reauth(p)}catch(e){m.textContent=e.status>=400&&e.status<500?'La contraseña no es correcta.':'No se pudo conectar. Revisa tu internet.';return}
 try{await api('/rest/v1/rpc/delete_my_account',{method:'POST',body:{}});ses=null;saveSes();logout();err='Tu cuenta fue eliminada.';render()}
 catch(e){m.textContent='No se pudo eliminar. Inténtalo de nuevo.'}}
let emSel='c';let editE=null;
let CL=new Set();try{CL=new Set(JSON.parse(localStorage.getItem('cl')||'[]'))}catch(e){}
const saveCL=()=>{try{localStorage.setItem('cl',JSON.stringify([...CL]))}catch(e){}};let regMode=false;const loginHtml=()=>`<div class="lg"><img class="logo" src="icon.svg" alt="" width="72" height="72"><h2>Mis finanzas</h2><p class="s">${regMode?'Crea tu cuenta para empezar':'Tus cuentas de la casa, en orden.'}</p>
  <div class="box"><label>Usuario<div class="fld"><input id="lu" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="ej. maria_lopez"></div></label>
  <label>Contraseña<div class="fld pw"><input id="lp" type="password" autocomplete="${regMode?'new-password':'current-password'}" placeholder="${regMode?'Mínimo 8 caracteres':'Tu contraseña'}"><button type="button" class="eye" data-act="eye">Ver</button></div></label>
  ${regMode?'<label>Repite la contraseña<div class="fld pw"><input id="lp2" type="password" autocomplete="new-password"></div></label>':''}
  <p id="lerr" class="lerr" role="alert"></p><button class="btn f go" data-act="${regMode?'register':'login'}">${regMode?'Crear cuenta':'Entrar'}</button>
  <p class="note" style="text-align:center;margin-top:12px">${regMode?'¿Ya tienes cuenta? <button type="button" class="linkb" data-act="regtoggle">Inicia sesión</button>':canReg?'¿No tienes cuenta? <button type="button" class="linkb" data-act="regtoggle">Crear cuenta</button>':'¿No tienes cuenta? Pídesela a quien administra la app.'}</p></div>
  <p class="foot">Solo tú puedes ver tus datos.</p></div>`;
let role='',fails=0,lockT=0,showNew=false;const openF={};
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.fid)openF[d.dataset.fid]=d.open},true);
role=(ses&&ses.role)||'';me=ses?{user:ses.user,role:ses.role,owner:ses.ownerName}:null;
const can=()=>!!role&&role!=='guest';
function wipeLocal(){S=normS(null);B=normB(null);try{localStorage.removeItem('fin');localStorage.removeItem('finb')}catch(e){}}
async function afterAuth(){animTab='first';saveSes();await resolveRole().catch(()=>{});if(!ses)return;role=ses.role;tab='loan';fails=0;firstPull=true;sbOk=false;err='';$('#app').innerHTML='';render();sbPull();loadShares()}
const NOCFG='Falta configurar la base de datos: edita el archivo config.js (ver README).';
async function doLogin(){const u=($('#lu').value||'').trim().toLowerCase(),pw=$('#lp').value||'',m=$('#lerr');
 if(!API){m.textContent=NOCFG;return}
 if(Date.now()<lockT){m.textContent='Demasiados intentos. Espera unos segundos.';return}
 if(!u||!pw){m.textContent='Escribe tu usuario y contraseña.';return}
 try{const s=await apiAuth('login',u,pw);wipeLocal();ses=s;await afterAuth()}
 catch(x){fails++;if(fails>=3){lockT=Date.now()+10000;fails=0}m.textContent=x.status===429?'Demasiados intentos. Espera unos minutos.':x.code==='email_not_confirmed'?'Esta cuenta no está confirmada. Desactiva "Confirm email" en Supabase (ver README).':x.status>=400&&x.status<500?'Usuario o contraseña incorrectos.':'No se pudo conectar. Revisa tu internet.'}}
async function doRegister(){const u=($('#lu').value||'').trim().toLowerCase(),pw=$('#lp').value||'',pw2=($('#lp2')||{}).value||'',m=$('#lerr');
 if(!API){m.textContent=NOCFG;return}
 if(!/^[a-z0-9_]{3,20}$/.test(u)){m.textContent='Usuario: de 3 a 20 letras, números o guion bajo (_).';return}
 if(pw.length<8){m.textContent='La contraseña debe tener al menos 8 caracteres.';return}
 if(pw!==pw2){m.textContent='Las contraseñas no coinciden.';return}
 try{const s=await apiAuth('register',u,pw);wipeLocal();ses=s;await afterAuth()}
 catch(x){m.textContent=x.code==='email_confirm'?'Cuenta creada, pero Supabase pide confirmar el correo. Desactiva "Confirm email" (ver README) y vuelve a intentarlo.':x.code==='signup_disabled'?'El registro de cuentas nuevas está desactivado.':x.code==='user_already_exists'||x.code==='email_exists'?'Ese usuario ya existe. Elige otro.':x.code==='weak_password'?'La contraseña es muy débil; usa una más larga.':x.status===429?'Demasiados intentos. Espera un rato.':x.status>=400&&x.status<500?'Revisa los datos e inténtalo de nuevo.':'No se pudo conectar. Revisa tu internet.'}}
function logout(){const t=ses;SH={};role='';ses=null;me=null;regMode=false;tab='loan';saveSes();wipeLocal();if(t&&API){sbAuthReq('logout?scope=local',null,t.a).catch(()=>{})}$('#app').innerHTML='';render()}
let animTab='first';const RM=matchMedia('(prefers-reduced-motion: reduce)');
function countUp(el){const txt=el.textContent.trim();if(!/^-?\$/.test(txt))return;const end=parseFloat(txt.replace(/[^0-9.-]/g,''));if(!isFinite(end)||end===0)return;
 const t0=performance.now(),d=500;const step=n=>{const p=Math.min(1,(n-t0)/d),e=1-Math.pow(1-p,3);el.textContent=M(end*e);if(p<1&&el.isConnected)requestAnimationFrame(step);else el.textContent=txt};el.textContent=M(0);requestAnimationFrame(step)}
function enterAnim(mode){const app=$('#app');app.classList.remove('first','tab');void app.offsetWidth;app.classList.add(mode);clearTimeout(enterAnim.t);enterAnim.t=setTimeout(()=>app.classList.remove('first','tab'),1100);
 if(mode==='first'&&!RM.matches)app.querySelectorAll('.hv,.grid .card b,.big').forEach(countUp)}
function pulse(el,cls,ms){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),ms)}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.classList&&d.classList.contains('fold')&&d.open)pulse(d,'opening',450)},true);
function greet(){const d=new Date(),h=d.getHours(),g=h<5?'Buenas noches':h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches',u=(ses&&ses.user)||'',n=u?u.charAt(0).toUpperCase()+u.slice(1).replace(/_/g,' '):'';$('#hello').textContent=g+(n?', '+n:'');$('#today').textContent=d.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})}
function render(){
 document.body.classList.toggle('auth',!role);
 if(!role){$('#lo').style.display='none';document.querySelector('.tabs').style.display='none';$('#sync').textContent='';$('#msg').textContent=err;
  if(!$('#lu')){$('#app').innerHTML=loginHtml();try{$('#lu').focus()}catch(e){}}
  return}
 $('#lo').style.display='inline-block';greet();
 if(can()&&B.onb==='pend'){document.querySelector('.tabs').style.display='none';$('#app').innerHTML=onbHtml();$('#sync').textContent='';return}
 const tabOk=k=>can()||k==='loan'||k==='acct';
 if(!tabOk(tab))tab='loan';
 document.querySelector('.tabs').style.display='flex';
 document.querySelectorAll('.tabs button').forEach(b=>{b.style.display=tabOk(b.dataset.tab)?'':'none';b.classList.toggle('on',b.dataset.tab===tab);if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 const paid=S.pay.reduce((t,p)=>t+(+p.a||0),0),rest=r2(S.total-paid),pct=S.total?Math.min(100,paid/S.total*100):0;
 const nOk=S.pay.filter((p,i)=>status(i)==='Pagado').length;
 let h='';
 if(tab==='loan'){
h+=loansHtml();
 }else if(tab==='stats'){h+=statsHtml()}else if(tab==='coach'){h+=coachHtml()}else if(tab==='acct'){const a=accountHtml(),i=a.indexOf('</div>')+6;h+=a.slice(0,i)+appearanceHtml()+(can()?methodsCard():'')+a.slice(i);if(!me)loadMe()}else{
  const t=today(),ym=t.slice(0,7),ld=loanDone(),dsum=r2(B.debts.filter(D=>!ddone(D)).reduce((s,D)=>s+mens(D),0)),lp=r2((ld?0:S.monthly)+dsum),dl=ld?'compras a meses':dsum>0?'el préstamo y compras a meses':'el préstamo';
  const P=curPeriod(),bB=r2(B.amtB-lp),bA=r2(B.amtA-B.sm),bud=k=>k==='A'?(B.lq2!=null?+B.lq2:bA):(B.lq1!=null?+B.lq1:bB),gastosM=r2(bud('A')+bud('B')),pre=t<B.gs,budC=pre?0:bud(P.cur.k),budN=pre?bud(curPeriod(B.gs).cur.k):bud(P.next.k);
  const inP=e=>{const d=e.d||t;return d>=P.cur.s&&d<P.next.s};
  const mex=B.exp.map((e,i)=>({e,i})).filter(x=>inP(x.e)&&(!x.e.m||x.e.m==='c'||x.e.m==='d')),ex=mex.reduce((s,x)=>s+x.e.a,0),left=r2(budC-ex),pg=budC>0?Math.max(0,Math.min(100,left/budC*100)):0;
  const col=pre?'var(--mut)':left<0||pg<20?'var(--bad)':pg<50?'var(--warn)':'var(--ok)';
  const [ey,em,edd]=P.next.s.split('-').map(Number),endS=(x=>x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate()))(new Date(ey,em-1,edd-1));
  const sv=B.sav.reduce((s,e)=>s+e.a,0),svM=B.sav.filter(e=>e.d&&e.d.slice(0,7)===ym).reduce((s,e)=>s+e.a,0),pa=B.sm>0?Math.min(100,svM/B.sm*100):0;
  const incomeM=r2(+B.amtA+ +B.amtB),neg=bA<0||bB<0;
  h+=`<div class="card"><h3 style="margin:0 0 8px">Plan del mes</h3>
  <div class="row pg"><div class="fl"><span>Depósito día ${B.dayA}</span>${ap('amtA',B.amtA,{st:100,key:'amtA'})}</div>
  <div class="fl"><span>Depósito día ${B.dayB}</span>${ap('amtB',B.amtB,{st:100,key:'amtB'})}</div>
  <div class="fl"><span>Ahorro mensual</span>${ap('sm',B.sm,{st:100,key:'sm'})}</div>
  <div class="fl"><span>Límite 1 al 15 ${B.lq1==null?'<small>(automático)</small>':'<small>(manual)</small>'}</span>${ap('lq1',bud('B'),{st:100,key:'lq1',chips:[1500,2000,3000],clr:1})}</div>
  <div class="fl"><span>Límite 16 al fin de mes ${B.lq2==null?'<small>(automático)</small>':'<small>(manual)</small>'}</span>${ap('lq2',bud('A'),{st:100,key:'lq2',chips:[1500,2000,3000],clr:1})}</div>
  <div class="fl"><span>Inicio del control de gastos</span><input class="apn ro" type="date" data-b="gs" value="${esc(B.gs)}"></div>
  <div class="fl"><span>${ld?'Compras a meses':dsum>0?'Préstamo + compras':'Préstamo'}</span><input class="apn ro" value="${esc(lp)}" disabled></div>
  <div class="fl"><span>Gastos del mes</span><input class="apn ro" value="${esc(gastosM)}" disabled></div></div>
  <p class="note" style="margin:0;color:${neg?'var(--bad)':'var(--mut)'}">Ingreso del mes ${M(incomeM)}. Del depósito del día ${B.dayB} se descuenta ${dl} (${M(lp)}) y del día ${B.dayA} el ahorro (${M(B.sm)}). Gastos del 30 al 15: ${M(bud('B'))}. Gastos del 16 al 29: ${M(bud('A'))}. Total del mes: ${M(gastosM)}.${neg?' ¡Ojo: el depósito no alcanza!':''}</p></div>
  ${useM('v')?saldoCard('v'):''}${useM('e')?saldoCard('e'):''}`;
  const qh0=h.length;h+=`<div class="card" style="margin-top:12px"><h3 style="margin:0 0 2px">Gastos de la quincena</h3>
  <p class="note" style="margin:0 0 8px">${pre?'El control de gastos inicia el '+fmtD(B.gs)+'. Mientras tanto el límite es $0.':'Quincena del '+(P.cur.k==='A'?'16 al 29':'30 al 15')+': '+fmtD(P.cur.s)+' al '+fmtD(endS)+'. Sale del depósito del día '+(P.cur.k==='A'?B.dayA+' menos el ahorro':B.dayB+' menos '+dl)+'.'}</p>
  <b class="big" style="font-size:28px;color:${col}">${M(left)}</b> <span class="note">disponibles de ${M(budC)}</span>
  <div class="bar" style="height:20px"><i style="width:${pg}%;background:${col}"></i></div>
  <p class="note" style="margin:0 0 8px">${left<0?'Te pasaste '+M(-left)+' del presupuesto.':'Llevas gastados '+M(ex)+'.'} ${pre?'El '+fmtD(B.gs)+' inicia con ':'El '+fmtD(P.next.s)+' se actualiza con '}${M(budN)}.</p>`;
  if(!mex.length)h+=`<p class="note">Aún no hay gastos en esta quincena.</p>`;
  mex.forEach(x=>{if(editE===x.i){h+=editRow(x);return}h+=`<div class="ex"><span>${fmtD(x.e.d||t)} ${esc(x.e.n)}${' <small class="tg'+(x.e.m==='v'?' v':'')+'">'+METH[x.e.m||'c']+'</small>'}${x.e.c?' <small class="tg">'+esc(x.e.c)+'</small>':''}</span><span>${M(x.e.a)} <button class="btn" data-act="eedit" data-i="${x.i}">Editar</button> <button class="btn" data-act="del" data-i="${x.i}">Quitar</button></span></div>`});
  h+=`<div class="row pg" style="margin-top:12px"><input id="en" placeholder="Concepto…">${ap('ea','',{st:50,ph:'Monto',chips:[50,100,200]})}<select id="ec" class="sel">${CATS.map(c=>`<option>${c}</option>`).join('')}</select>
  ${QM().length>1?`<div class="seg qm" role="group" aria-label="Pagado con">${QM().map((k,j)=>`<button type="button" class="${(qmSel||QM()[0])===k?'on':''}" aria-pressed="${(qmSel||QM()[0])===k}" data-act="qm" data-v="${k}">${METH[k]}</button>`).join('')}</div>`:''}
  <input id="ed" type="date" value="${esc(t)}"><button class="btn f" data-act="add">Agregar gasto</button></div></div>`;
  if(!QM().length)h=h.slice(0,qh0);
  h+=`${useM('c')?stmHtml():''}
  <div class="card" style="margin-top:12px"><h3 style="margin:0 0 4px">Ahorro</h3>
  <b class="big" style="font-size:28px">${M(svM)}</b> <span class="note">ahorrados este mes de ${M(B.sm)}</span>
  <div class="bar" style="height:20px"><i style="width:${pa}%"></i></div>
  <p class="note" style="margin:0 0 8px">Total acumulado: <b>${M(sv)}</b></p>
  <div class="row"><label>Meta total (opcional)<input type="number" step="0.01" data-b="goal" value="${esc(B.goal||'')}"></label></div>`;
  if(B.goal>0){const g=Math.min(100,sv/B.goal*100);h+=`<div class="bar"><i style="width:${g}%"></i></div><p class="note" style="margin:0 0 8px">${g.toFixed(1)}% de la meta. Faltan ${M(Math.max(0,B.goal-sv))}.</p>`}
  if(!B.sav.length)h+=`<p class="note">Aún no hay aportaciones.</p>`;
  B.sav.forEach((e,i)=>{h+=`<div class="ex"><span>${fmtD(e.d)} ${esc(e.n)}</span><span>${M(e.a)} <button class="btn" data-act="sdel" data-i="${i}">Quitar</button></span></div>`});
  h+=`<div class="row pg" style="margin-top:12px"><input id="sn" placeholder="Nota (opcional)…">${ap('sa','',{st:100,ph:'Monto',chips:[100,500,1000]})}<button class="btn f" data-act="sadd">Agregar al ahorro</button></div></div>`;
 }
 if(!animTab)$('#app').classList.remove('first','tab');$('#app').innerHTML=h;decorate();if(animTab){const m=animTab;animTab='';enterAnim(m)}
 const mg=document.getElementById('msg');if(mg)mg.textContent=err;
 renderSync();
}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-tab],[data-act]');if(!t)return;
 if(t.dataset.tab){if(tab!==t.dataset.tab){animTab='tab';window.scrollTo({top:0,behavior:RM.matches?'auto':'smooth'})}tab=t.dataset.tab;render();return}
 const i=+t.dataset.i,a=t.dataset.act;
 if(a==='login'){doLogin();return}
 if(a==='register'){doRegister();return}
 if(a==='regtoggle'){regMode=!regMode;$('#app').innerHTML='';render();return}
 if(a==='dnew'){showNew=!showNew;render();return}
 if(a==='dcancel'){showNew=false;render();return}
 if(a==='eye'){const q=$('#lp');q.type=q.type==='password'?'text':'password';t.textContent=q.type==='password'?'Ver':'Ocultar';return}
 if(a==='logout'){logout();return}
 if(a==='onbm'){const k=t.dataset.v;onbSel.has(k)?onbSel.delete(k):onbSel.add(k);render();return}
 if(a==='onbok'){if(!onbSel.size)return;B.methods=MOPT.map(o=>o.k).filter(x=>onbSel.has(x));B.onb='';animTab='first';tab='bud';saveB();return}
 if(a==='mtog'){toggleMethod(t.dataset.v);return}
 if(a==='qm'){qmSel=t.dataset.v;document.querySelectorAll('.seg.qm button').forEach(b=>{const on=b.dataset.v===qmSel;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});return}
 if(a==='uimode'){setUI({mode:t.dataset.v},true);return}
 if(a==='uipal'){setUI({pal:t.dataset.v,acc:null,acc2:null},true);return}
 if(a==='uireset'){setUI({acc:null,acc2:null},true);return}
 if(a==='share'){openShare(t.dataset.item,t.dataset.label);return}
 if(a==='shcreate'){createShare();return}
 if(a==='shstop'){if(shCur&&confirm('¿Dejar de compartir? El enlace dejará de funcionar.'))stopShare(shCur.item);return}
 if(a==='shcopy'){copyShare(t);return}
 if(a==='shclose'){shareDialog().close();return}
 if(a==='pwchg'){changePw();return}
 if(a==='export'){exportData();return}
 if(a==='delacct'){deleteAccount();return}
 if((a==='del'||a==='sdel'||a==='idel'||a==='stdel')&&!confirm('¿Quitar este registro?'))return;
 if(a==='mark'){justPaid=i;S.pay[i]={a:sched(i+1),d:today(),n:S.pay[i].n};saveL()}
 else if(a==='undo'){S.pay[i]={a:0,d:'',n:S.pay[i].n};saveL()}
 else if(a==='collall'||a==='expall'){document.querySelectorAll('#app .cc').forEach(c=>{const hh=c.querySelector(':scope>h3');if(!hh)return;a==='collall'?CL.add(hh.dataset.ck):CL.delete(hh.dataset.ck);c.classList.toggle('collapsed',a==='collall');hh.setAttribute('aria-expanded',String(a!=='collall'))});saveCL()}
 else if(a==='xadd'){const k=t.dataset.k,n=($('#en'+k).value||'').trim(),m=parseFloat($('#ea'+k).value);if(n&&m>0){B.exp=(B.exp||[]).concat([{n,a:m,d:$('#ed'+k).value||today(),m:k,c:$('#ec'+k).value}]);saveB()}}
 else if(a==='iadd'){const k=t.dataset.k,m=parseFloat($('#ia'+k).value),d=$('#id'+k).value||today(),n=$('#in'+k).value.trim();if(m>0){B.inc=(B.inc||[]).concat([{m:k,a:m,d,n}]);saveB()}}
 else if(a==='idel'){B.inc=(B.inc||[]).filter((_,j)=>j!==i);saveB()}
 else if(a==='eedit'){editE=i;render()}
 else if(a==='ecancel'){editE=null;render()}
 else if(a==='esave'){const n=$('#xen').value.trim(),m=parseFloat($('#xea').value);if(n&&m>0&&B.exp[i]){B.exp[i]=Object.assign({},B.exp[i],{n,a:m,d:$('#xed').value||today(),c:$('#xec').value,m:$('#xem').value});editE=null;saveB()}}
 else if(a==='del'){B.exp.splice(i,1);saveB()}
 else if(a==='sdel'){B.sav.splice(i,1);saveB()}
 else if(a==='add'){const n=$('#en').value.trim(),m=parseFloat($('#ea').value);if(n&&m>0){B.exp.push({n,a:m,d:$('#ed').value||today(),m:QM().includes(qmSel)?qmSel:(QM()[0]||'c'),c:$('#ec').value});saveB()}}
 else if(a==='copysum'){const ta=$('#sumt');ta.focus();ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(x){}
  if(!ok&&navigator.clipboard){navigator.clipboard.writeText(ta.value).then(()=>{t.textContent='¡Copiado!'},()=>{t.textContent='Selecciona el texto y cópialo'});return}
  t.textContent=ok?'¡Copiado!':'Selecciona el texto y cópialo'}
 else if(a==='dadd'){const pr=parseFloat($('#dp').value),tt=parseFloat($('#dt').value)||pr,mn=parseFloat($('#dmn').value),st=$('#dd').value;let mo=parseInt($('#dmo').value);if(mn>0&&tt>0)mo=Math.ceil(tt/mn-1e-9);
  if(pr>0&&mo>=1&&mo<=120&&st){const nid=Date.now().toString(36);openF[nid]=true;showNew=false;B.debts.push({id:nid,n:$('#dn').value.trim()||'Compra',price:pr,total:tt,months:mo,mo:mn>0?mn:r2(tt/mo),start:st,pay:Array.from({length:mo},()=>({a:0,d:'',n:''}))});saveB()}}
 else if(a==='stadd'){const c=$('#xc').value.trim(),sx=$('#xs').value;if(c&&sx!==''){B.stm.push({id:Date.now().toString(36),c,m:$('#xm').value,sal:parseFloat(sx)||0,min:parseFloat($('#xi').value)||0,l:$('#xl').value,n:$('#xn').value.trim(),pd:''});saveB()}}
 else if(a==='stpay'||a==='stundo'||a==='stdel'){const x=B.stm.find(z=>z.id===t.dataset.x);if(x){if(a==='stpay')x.pd=today();else if(a==='stundo')x.pd='';else B.stm=B.stm.filter(z=>z!==x);saveB()}}
 else if(t.dataset.d&&B.debts.some(x=>x.id===t.dataset.d)){const D=B.debts.find(x=>x.id===t.dataset.d);
  if(a==='dmark'){D.pay[i]={a:ds(D,i+1),d:today(),n:D.pay[i].n};saveB()}
  else if(a==='dundo'){D.pay[i]={a:0,d:'',n:D.pay[i].n};saveB()}
  else if(a==='ddel'){cfm=D.id;render()}
  else if(a==='ddely'){if(SH['debt:'+D.id])stopShare('debt:'+D.id);B.debts=B.debts.filter(x=>x!==D);cfm='';saveB()}}
 else if(a==='ddeln'){cfm='';render()}
 else if(a==='sadd'){const n=$('#sn').value.trim(),m=parseFloat($('#sa').value);if(m>0){B.sav.push({n,a:m,d:today()});saveB()}}
});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='uiacc'||t.id==='uiacc2'){UI=normUI(Object.assign({},UI,{[t.id==='uiacc'?'acc':'acc2']:t.value}));applyUI()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target.id==='lp'||e.target.id==='lp2')){regMode?doRegister():doLogin()}
 else if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.cc>h3')){e.preventDefault();e.target.click()}});
document.addEventListener('click',e=>{
 const hh=e.target.closest('.cc>h3');if(hh){const c=hh.parentElement,k=hh.dataset.ck;c.classList.toggle('collapsed');hh.setAttribute('aria-expanded',String(!c.classList.contains('collapsed')));if(!c.classList.contains('collapsed'))pulse(c,'opening',400);c.classList.contains('collapsed')?CL.add(k):CL.delete(k);saveCL();return}
 const sg=e.target.closest('[data-seg]');if(sg){emSel=sg.dataset.seg;document.querySelectorAll('#emg button').forEach(x=>x.classList.toggle('on',x===sg));return}
 const c=e.target.closest('[data-clr]');if(c){B[c.dataset.clr]=null;saveB();return}
 const b=e.target.closest('[data-as],[data-aq]');if(!b)return;
 const el=$('#'+(b.dataset.as||b.dataset.aq));if(!el)return;
 const nv=b.dataset.as?Math.max(0,r2((parseFloat(el.value)||0)+(+b.dataset.d)*(+b.dataset.st))):+b.dataset.v;
 el.value=nv;el.dispatchEvent(new Event('change',{bubbles:true}));
});
document.addEventListener('change',e=>{
 const t=e.target,v=t.type==='number'?(parseFloat(t.value)||0):t.value;
 if(t.id==='uiacc'||t.id==='uiacc2'){setUI({[t.id==='uiacc'?'acc':'acc2']:t.value},true);return}
 if(t.id==='impf'){if(t.files&&t.files[0])importData(t.files[0]);t.value='';return}
 if(t.dataset.s){let w=v;if(t.dataset.s==='start'&&String(w).length===7)w+='-01';if(t.dataset.s==='day')w=Math.max(1,Math.min(31,Math.round(v)||30));S[t.dataset.s]=w;saveL()}
 else if(t.dataset.b){B[t.dataset.b]=(/^lq/.test(t.dataset.b)&&t.value==='')?null:v;saveB()}
 else if(t.dataset.df==='mo'){const D=B.debts.find(x=>x.id===t.dataset.d),mo=parseFloat(t.value);if(D&&mo>0){const lp=D.pay.reduce((r,x,k)=>(+x.a>0?k+1:r),0);D.mo=mo;D.months=Math.max(Math.ceil(D.total/mo-1e-9),lp,1);D.pay=D.pay.slice(0,D.months);while(D.pay.length<D.months)D.pay.push({a:0,d:'',n:''});saveB()}}
 else if(t.dataset.df){const D=B.debts.find(x=>x.id===t.dataset.d),p=D&&D.pay[+t.dataset.i];if(p){p[t.dataset.df]=t.dataset.df==='a'?(parseFloat(t.value)||0):t.value;saveB()}}
 else if(t.dataset.f){const p=S.pay[+t.dataset.i];p[t.dataset.f]=t.dataset.f==='a'?(parseFloat(t.value)||0):t.value;saveL()}
});



// ===================== Métodos de pago =====================
const MOPT=[
 {k:'v',n:'Vales',d:'Tarjeta de vales de despensa con depósito mensual.',s:'Saldo de vales'},
 {k:'e',n:'Efectivo',d:'Billetes y monedas que traes contigo.',s:'Saldo de efectivo'},
 {k:'c',n:'Tarjeta de crédito',d:'Compras con tarjeta que pagas al mes.',s:'Gastos de la quincena y estados de cuenta'},
 {k:'d',n:'Tarjeta de débito',d:'Pagos directo desde tu cuenta de banco.',s:'Gastos de la quincena'}];
const MS=()=>Array.isArray(B.methods)&&B.methods.length?B.methods:['v','e','c','d'];
const useM=k=>MS().includes(k);
const QM=()=>['c','d'].filter(useM);
let onbSel=new Set(),qmSel=null;
function methodsPicker(sel,act){return `<div class="mpick" role="group" aria-label="Métodos de pago">${MOPT.map(o=>{const on=sel.has(o.k);return `<button type="button" class="mopt${on?' on':''}" aria-pressed="${on}" data-act="${act}" data-v="${o.k}"><span class="mchk" aria-hidden="true">${on?CHECK:''}</span><span class="mtx"><b>${o.n}</b><small>${o.d}</small><small class="mse">Verás: ${o.s.toLowerCase()}</small></span></button>`}).join('')}</div>`}
function onbHtml(){const n=onbSel.size;
 return `<div class="onb"><p class="hk">Antes de empezar</p><h2 class="vt">¿Cómo pagas tus gastos?</h2>
  <p class="note">Elige los que usas, al menos uno. La app te mostrará solo las secciones que necesitas. Puedes cambiarlo cuando quieras en Cuenta.</p>
  ${methodsPicker(onbSel,'onbm')}
  <button type="button" class="btn f go" data-act="onbok"${n?'':' disabled aria-disabled="true"'}>${n?`Continuar con ${n} ${n===1?'método':'métodos'}`:'Elige al menos uno'}</button></div>`}
function methodsCard(){return `<div class="card"><h3>Métodos de pago</h3><p class="note">Las secciones de Presupuesto y Estadísticas se ajustan a lo que elijas. Debe quedar al menos uno.</p>${methodsPicker(new Set(MS()),'mtog')}<p class="note" id="mmsg" aria-live="polite"></p></div>`}
function toggleMethod(k){const s=new Set(MS());if(s.has(k)){if(s.size===1){const m=$('#mmsg');if(m){m.className='note badm';m.textContent='Debe quedar al menos un método de pago.'}return}s.delete(k)}else s.add(k);
 B.methods=MOPT.map(o=>o.k).filter(x=>s.has(x));saveB()}

// ===================== Apariencia: modo y colores =====================
const PALS={
 cafe:{n:'Café y olivo',l:['#5e6b35','#7c2e3b'],d:['#a9b56e','#d98f99']},
 vino:{n:'Vino tinto',l:['#7c2e3b','#8a5a16'],d:['#d98f99','#dcae67']},
 bosque:{n:'Bosque',l:['#2f5d50','#8a4b2a'],d:['#7fb8a6','#d9a07a']},
 mar:{n:'Mar de Cortés',l:['#1f5f7a','#9c4a2f'],d:['#7fb6cf','#e39a7f']},
 lavanda:{n:'Lavanda',l:['#5d4a7a','#8a3b5c'],d:['#b7a6d6','#e08fb0']},
 grafito:{n:'Grafito',l:['#3d4a52','#9b2f3f'],d:['#a9b7bf','#e2919b']}};
const SURF={"cafe":{"l":{"bg":"#f3ebdd","paper":"#fbf6ec","card":"#fffaf2","sunk":"#efe5d3","line":"#e2d5c0","line2":"#d3c2a7","ink":"#3a2a1f","mut":"#6b5948"},"d":{"bg":"#1e1813","paper":"#251d17","card":"#2a211a","sunk":"#211a14","line":"#3a2e24","line2":"#4a3b2e","ink":"#f1e6d4","mut":"#b5a28c"}},"vino":{"l":{"bg":"#f4e6e3","paper":"#faf1ef","card":"#fffaf9","sunk":"#eedcd8","line":"#e4cbc6","line2":"#d4b2ac","ink":"#3a2226","mut":"#6d4e53"},"d":{"bg":"#1f1517","paper":"#271b1e","card":"#2d2023","sunk":"#22171a","line":"#3e2b2f","line2":"#50383d","ink":"#f3e4e4","mut":"#bba0a3"}},"bosque":{"l":{"bg":"#e8eee7","paper":"#f3f7f2","card":"#fbfdfa","sunk":"#dde6dc","line":"#cddacd","line2":"#b5c7b6","ink":"#1f2a24","mut":"#4f6157"},"d":{"bg":"#141b18","paper":"#1a231f","card":"#1f2a25","sunk":"#161e1a","line":"#2c3a33","line2":"#3a4b42","ink":"#e3eee8","mut":"#9db3a8"}},"mar":{"l":{"bg":"#e5eef2","paper":"#f1f6f9","card":"#fafdfe","sunk":"#d9e6ec","line":"#c7d9e2","line2":"#adc5d1","ink":"#1b2932","mut":"#4d606c"},"d":{"bg":"#131a1f","paper":"#192229","card":"#1e2830","sunk":"#151d23","line":"#2a3842","line2":"#384955","ink":"#e2edf3","mut":"#9cb2bf"}},"lavanda":{"l":{"bg":"#ede9f3","paper":"#f6f3fa","card":"#fcfbfe","sunk":"#e3dded","line":"#d5cde3","line2":"#beb3d2","ink":"#29222f","mut":"#5d5469"},"d":{"bg":"#18151f","paper":"#1f1b28","card":"#25202f","sunk":"#1a1722","line":"#342d42","line2":"#443b55","ink":"#ece6f5","mut":"#aca2bf"}},"grafito":{"l":{"bg":"#eaecee","paper":"#f4f5f6","card":"#fcfcfd","sunk":"#e0e3e6","line":"#d1d6da","line2":"#b9c0c6","ink":"#22282c","mut":"#545d64"},"d":{"bg":"#16191b","paper":"#1c2023","card":"#22272a","sunk":"#181b1e","line":"#30363a","line2":"#3e464b","ink":"#e8ecee","mut":"#a5afb5"}}};
const UIDEF={mode:'auto',pal:'cafe',acc:null,acc2:null};
const HEX=/^#[0-9a-f]{6}$/i;
const normUI=o=>{o=o&&typeof o==='object'?o:{};return{mode:['auto','light','dark'].includes(o.mode)?o.mode:'auto',pal:PALS[o.pal]?o.pal:'cafe',acc:HEX.test(o.acc||'')?o.acc.toLowerCase():null,acc2:HEX.test(o.acc2||'')?o.acc2.toLowerCase():null}};
let UI=UIDEF;try{UI=normUI(JSON.parse(localStorage.getItem('ui')||'null'))}catch(e){}
const DARKQ=matchMedia('(prefers-color-scheme: dark)');
const isDark=()=>UI.mode==='dark'||(UI.mode==='auto'&&DARKQ.matches);
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const mixHex=(a,b,w)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.substr(i,2),16)*w+parseInt(b.substr(i,2),16)*(1-w)).toString(16).padStart(2,'0')).join('');
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
function themeColors(){const dk=isDark(),p=PALS[UI.pal][dk?'d':'l'];
 const lift=c=>dk&&lum(c)<.25?mixHex(c,'#ffffff',.62):c;
 return{acc:UI.acc?lift(UI.acc):p[0],wine:UI.acc2?lift(UI.acc2):p[1],raw:UI.acc||p[0],dk}}
const accEff=()=>themeColors().acc;
function applyUI(){const r=document.documentElement,s=r.style;
 if(UI.mode==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',UI.mode);
 const c=themeColors();
 s.setProperty('--acc',c.acc);s.setProperty('--wine',c.wine);
 s.setProperty('--acc-ink',c.dk?'#1e1813':(lum(c.raw)>.4?'#1e1813':'#fbf6ec'));
 s.setProperty('--acc-soft',`color-mix(in srgb, ${c.acc} ${c.dk?22:16}%, var(--card))`);
 s.setProperty('--wine-soft',`color-mix(in srgb, ${c.wine} ${c.dk?22:14}%, var(--card))`);
 let sf=Object.assign({},SURF[UI.pal][c.dk?'d':'l']);
 if(UI.acc){const tint=c.dk?mixHex(UI.acc,'#ffffff',.5):UI.acc;['bg','paper','sunk','line','line2'].forEach(k=>{sf[k]=mixHex(sf[k],tint,c.dk?.92:.93)});sf.card=mixHex(sf.card,tint,.975)}
 Object.entries(sf).forEach(([k,v])=>s.setProperty('--'+k,v));
 const bg=sf.bg;document.querySelectorAll('meta[name=theme-color]').forEach(m=>{m.setAttribute('content',bg);m.removeAttribute('media')})}
function saveUI(sync){try{localStorage.setItem('ui',JSON.stringify(UI))}catch(e){}if(sync&&can()){B.ui=UI;saveB()}else render()}
function setUI(p,sync){UI=normUI(Object.assign({},UI,p));applyUI();saveUI(sync)}
DARKQ.addEventListener&&DARKQ.addEventListener('change',()=>{if(UI.mode==='auto')applyUI()});
applyUI();
function appearanceHtml(){const dk=isDark(),c=themeColors(),card=SURF[UI.pal][dk?'d':'l'].card;
 const low=UI.acc&&contrast(accEff(),card)<3;
 const modes=[['auto','Automático'],['light','Claro'],['dark','Oscuro']].map(([k,l])=>`<button type="button" class="${UI.mode===k?'on':''}" aria-pressed="${UI.mode===k}" data-act="uimode" data-v="${k}">${l}</button>`).join('');
 const pals=Object.entries(PALS).map(([k,p])=>{const on=UI.pal===k&&!UI.acc&&!UI.acc2,cs=p[dk?'d':'l'];return `<button type="button" class="pal${on?' on':''}" aria-pressed="${on}" data-act="uipal" data-v="${k}"><span class="pdots"><i style="background:${cs[0]}"></i><i style="background:${cs[1]}"></i></span>${p.n}</button>`}).join('');
 return `<div class="card"><h3>Apariencia</h3>
  <p class="note">Elige cómo se ve la app. Se guarda en tu cuenta y se aplica en todos tus dispositivos.</p>
  <div class="fl" style="margin-top:12px"><span>Modo</span><div class="seg" role="group" aria-label="Modo de color">${modes}</div></div>
  <div class="fl" style="margin-top:14px"><span>Paleta</span><div class="pals">${pals}</div></div>
  <div class="fl" style="margin-top:14px"><span>Colores propios</span>
   <div class="cpick"><label><input type="color" id="uiacc" value="${UI.acc||PALS[UI.pal].l[0]}"> Principal <small>botones, avance, pagos hechos</small></label>
   <label><input type="color" id="uiacc2" value="${UI.acc2||PALS[UI.pal].l[1]}"> Acento <small>pestaña activa, próximo pago, enlaces</small></label></div>
   ${low?`<p class="note badm">Ese color principal se lee poco sobre el fondo. Prueba uno más ${dk?'claro':'oscuro'}.</p>`:''}
   ${UI.acc||UI.acc2?'<button type="button" class="btn" data-act="uireset" style="margin-top:8px">Volver a la paleta</button>':''}</div>
  <div class="uiprev" aria-hidden="true"><span class="btn f">Botón</span><span class="tg v">Pagado</span><span style="color:var(--wine);font-weight:600">Próximo pago</span><span class="bar" style="flex:1;margin:0"><i style="width:62%"></i></span></div></div>`}

// ===================== Coach financiero (sin IA: reglas sobre tus datos) =====================
const dDiff=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
const pctTxt=x=>Math.round(x*100)+'%';
function coachData(){const t=today(),ym=t.slice(0,7),[yy,mm]=ym.split('-').map(Number),pm=mkD(yy,mm-2,1).slice(0,7);
 const ld=loanDone(),openD=B.debts.filter(D=>!ddone(D)),dsum=r2(openD.reduce((s,D)=>s+mens(D),0)),lp=r2((ld?0:+S.monthly||0)+dsum);
 const P=curPeriod(),bB=r2(B.amtB-lp),bA=r2(B.amtA-B.sm),bud=k=>k==='A'?(B.lq2!=null?+B.lq2:bA):(B.lq1!=null?+B.lq1:bB),pre=t<B.gs,budC=pre?0:bud(P.cur.k);
 const inP=e=>{const d=e.d||t;return d>=P.cur.s&&d<P.next.s};
 const ex=r2(B.exp.filter(e=>inP(e)&&(!e.m||e.m==='c'||e.m==='d')).reduce((s,e)=>s+(+e.a||0),0));
 const perLen=Math.max(1,dDiff(P.cur.s,P.next.s)),elapsed=Math.min(perLen,Math.max(1,dDiff(P.cur.s,t)+1)),proj=r2(ex/elapsed*perLen);
 const mes=B.exp.filter(e=>(e.d||t).slice(0,7)===ym),prev=B.exp.filter(e=>(e.d||'').slice(0,7)===pm);
 const byCat=a=>a.reduce((o,e)=>{const c=e.c||'Otro';o[c]=r2((o[c]||0)+(+e.a||0));return o},{});
 const sv=r2(B.sav.reduce((s,e)=>s+(+e.a||0),0)),svM=r2(B.sav.filter(e=>(e.d||'').slice(0,7)===ym).reduce((s,e)=>s+(+e.a||0),0));
 const income=r2(+B.amtA+ +B.amtB),gastosM=r2(bud('A')+bud('B'));
 return{t,ym,ld,openD,dsum,lp,P,pre,budC,ex,perLen,elapsed,proj,mes,prev,cat:byCat(mes),catPrev:byCat(prev),sv,svM,income,gastosM,neg:bA<0||bB<0}}
function coachTips(c){const T=[],add=(lvl,title,text,act)=>T.push({lvl,title,text,act});
 const loanIt=planItemsLoan(),late=loanIt.filter(x=>x.st==='Atrasado'),nx=loanIt.findIndex(x=>x.st!=='Pagado');
 // Préstamo
 if(late.length)add('alerta',`${late.length===1?'Tienes un pago atrasado':`Tienes ${late.length} pagos atrasados`} del préstamo`,`Suman ${M(late.reduce((s,x)=>s+Math.max(0,x.amt-x.a),0))}. Ponte al corriente antes del siguiente vencimiento para no acumular.`,'loan');
 else if(nx>=0){const x=loanIt[nx],dd=dDiff(c.t,x.due),falta=Math.max(0,r2(x.amt-x.a));
  if(dd>=0&&dd<=7)add('aviso',`Tu próximo pago vence ${dd===0?'hoy':dd===1?'mañana':`en ${dd} días`}`,`Pago ${nx+1} de ${M(falta)} el ${fmtD(x.due)}. Si ya lo hiciste, márcalo como pagado.`,'loan')}
 if(!c.ld&&nx>=0){const left=loanIt.length-loanIt.filter(x=>x.st==='Pagado').length,last=loanIt[loanIt.length-1].due;
  add('bien','Así va tu préstamo',`Llevas ${loanIt.filter(x=>x.st==='Pagado').length} de ${loanIt.length} pagos. Si sigues al día, terminas el ${fmtD(last)}: te faltan ${left} ${left===1?'pago':'pagos'}.`,'loan')}
 else if(c.ld&&+S.total>0)add('bien','Préstamo liquidado','Ya no debes nada del préstamo. Ese dinero ahora puede ir directo a tu ahorro.','bud');
 // Deudas a meses
 c.openD.forEach(D=>{const it=planItemsDebt(D),l=it.filter(x=>x.st==='Atrasado');if(l.length)add('alerta',`${esc(D.n)}: ${l.length===1?'un pago atrasado':`${l.length} pagos atrasados`}`,`Revisa esa compra a meses; los atrasos en tarjetas suelen generar intereses y comisiones.`,'loan')});
 // Carga de deudas vs ingreso
 if(c.income>0&&c.lp>0){const r=c.lp/c.income;
  if(r>.4)add('alerta','Tus deudas se llevan mucho de tu ingreso',`Pagas ${M(c.lp)} al mes en deudas, el ${pctTxt(r)} de lo que recibes. Lo sano es menos del 30%. Evita nuevas compras a meses hasta liquidar alguna.`,'loan');
  else if(r>.3)add('aviso','Cuidado con nuevas deudas',`Tus pagos de deudas son el ${pctTxt(r)} de tu ingreso (${M(c.lp)} de ${M(c.income)}). Antes de otra compra a meses, termina una.`,'loan');
  else add('bien','Tus deudas están bajo control',`Pagas el ${pctTxt(r)} de tu ingreso en deudas, por debajo del 30% recomendado.`,null)}
 if(c.neg)add('alerta','Tu plan del mes no cuadra','Uno de tus depósitos no alcanza para lo que le asignaste (préstamo, compras o ahorro). Ajusta montos en Presupuesto.','bud');
 // Quincena
 if(!c.pre&&c.budC>0){const left=r2(c.budC-c.ex);
  if(left<0)add('alerta','Ya te pasaste del límite de la quincena',`Llevas ${M(c.ex)} de ${M(c.budC)}: ${M(-left)} de más. Lo que queda de la quincena, intenta solo gastos indispensables.`,'bud');
  else if(c.elapsed>=3&&c.proj>c.budC*1.05)add('aviso','A este ritmo te vas a pasar',`Llevas ${M(c.ex)} en ${c.elapsed} días. Si sigues igual, gastarás unos ${M(c.proj)} y tu límite es ${M(c.budC)}. Te quedan ${M(left)} para ${c.perLen-c.elapsed+1} días: unos ${M(left/Math.max(1,c.perLen-c.elapsed+1))} diarios.`,'bud');
  else if(c.elapsed>=3)add('bien','Vas bien con la quincena',`Te quedan ${M(left)} de ${M(c.budC)}. Puedes gastar unos ${M(left/Math.max(1,c.perLen-c.elapsed+1))} al día sin pasarte.`,'bud')}
 // Categorías
 const top=Object.entries(c.cat).sort((a,b)=>b[1]-a[1])[0];
 if(top&&c.mes.length>=3){const prev=c.catPrev[top[0]]||0,tot=Object.values(c.cat).reduce((s,x)=>s+x,0);
  if(prev>0&&top[1]>prev*1.25)add('aviso',`${esc(top[0])} subió este mes`,`Llevas ${M(top[1])} en ${esc(top[0]).toLowerCase()}, ${pctTxt(top[1]/prev-1)} más que el mes pasado (${M(prev)}).`,'stats');
  else add('idea',`Tu gasto más grande es ${esc(top[0]).toLowerCase()}`,`Es el ${pctTxt(top[1]/tot)} de lo que llevas gastado este mes (${M(top[1])}). Si buscas dónde recortar, empieza ahí.`,'stats')}
 // Ahorro
 if(B.sm>0){const day=+c.t.slice(8,10),r=c.svM/B.sm;
  if(r>=1)add('bien','Cumpliste tu ahorro del mes',`Ahorraste ${M(c.svM)} de ${M(B.sm)}. Lo que ahorres de más acelera tu meta.`,'bud');
  else if(day>=16&&r<.5)add('aviso','Tu ahorro del mes va atrasado',`Llevas ${M(c.svM)} de ${M(B.sm)}. Apártalo en cuanto llegue tu depósito del día ${B.dayA}, antes de gastar.`,'bud')}
 else add('idea','Ponte una meta de ahorro mensual','Aunque sea poco: apartarlo en cuanto te pagan funciona mejor que ahorrar lo que sobre. Puedes definirla en Presupuesto, Plan del mes.','bud');
 if(B.goal>0&&c.sv<B.goal){const avg=Math.max(B.sm,c.svM);if(avg>0){const m=Math.ceil((B.goal-c.sv)/avg);add('idea','Tu meta de ahorro',`Te faltan ${M(B.goal-c.sv)} para tu meta de ${M(B.goal)}. Ahorrando ${M(avg)} al mes, la alcanzas en unos ${m} ${m===1?'mes':'meses'}.`,'bud')}}
 // Fondo de emergencia
 if(c.gastosM>0){const mo=c.sv/c.gastosM;
  if(mo<1)add('idea','Arma tu colchón para emergencias',`Tus ahorros (${M(c.sv)}) cubren ${mo<.1?'menos de una semana':`unos ${Math.max(1,Math.round(mo*30))} días`} de gastos. La meta recomendada es 3 meses: ${M(c.gastosM*3)}.`,'bud');
  else if(mo<3)add('idea','Tu colchón va creciendo',`Tus ahorros cubren ${mo.toFixed(1)} meses de gastos. La meta es 3 meses (${M(c.gastosM*3)}).`,'bud')}
 // Cuentas con saldo
 ['v','e'].filter(useM).forEach(k=>{const n={v:'vales',e:'efectivo',d:'débito'}[k],ini=+B[{v:'vIni',e:'cIni',d:'dIni'}[k]]||0;if(!ini&&!B.exp.some(e=>e.m===k))return;const i=accInfo(k);
  if(i.bal<0)add('alerta',`Tu saldo de ${n} está en negativo`,`Registraste ${M(-i.bal)} más de lo que tenías. Revisa si falta un depósito o si algún gasto quedó duplicado.`,'bud')});
 // Estados de cuenta
 B.stm.filter(x=>!x.pd&&x.l).forEach(x=>{const dd=dDiff(c.t,x.l);
  if(dd<0)add('alerta',`${esc(x.c)}: estado de cuenta vencido`,`Venció el ${fmtD(x.l)} con saldo de ${M(x.sal)}. Pagar tarde genera intereses y afecta tu historial.`,'bud');
  else if(dd<=5)add('aviso',`${esc(x.c)} vence ${dd===0?'hoy':dd===1?'mañana':`en ${dd} días`}`,`Paga el total (${M(x.sal)}) y no solo el mínimo (${M(x.min)}): pagar el mínimo hace que la deuda crezca con intereses.`,'bud')});
 if(!B.exp.length)add('idea','Registra tus gastos unos días','Con una o dos semanas de gastos registrados podré decirte en qué se va tu dinero y si vas a llegar a la quincena.','bud');
 const ord={alerta:0,aviso:1,idea:2,bien:3};return T.sort((a,b)=>ord[a.lvl]-ord[b.lvl])}
function coachScore(c,T){const P=[];
 const late=planItemsLoan().filter(x=>x.st==='Atrasado').length+c.openD.reduce((s,D)=>s+planItemsDebt(D).filter(x=>x.st==='Atrasado').length,0)+B.stm.filter(x=>!x.pd&&x.l&&x.l<c.t).length;
 P.push({n:'Pagos al día',v:Math.max(0,100-late*30)});
 if(!c.pre&&c.budC>0){const r=c.ex>c.budC?2:c.proj/c.budC;P.push({n:'Gasto de la quincena',v:r<=1?100:r>=1.6?15:Math.round(100-(r-1)/.6*85)})}
 if(c.income>0){const r=c.lp/c.income;P.push({n:'Peso de las deudas',v:r<=.3?100:r>=.6?20:Math.round(100-(r-.3)/.3*80)})}
 P.push({n:'Ahorro',v:B.sm>0?Math.min(100,Math.round(30+c.svM/B.sm*70)):35});
 const v=Math.round(P.reduce((s,x)=>s+x.v,0)/P.length);
 return{v,P,label:v>=80?'Vas muy bien':v>=60?'Vas bien, con detalles':v>=40?'Hay que ajustar':'Necesita atención'}}
function coachHtml(){const c=coachData(),T=coachTips(c),sc=coachScore(c,T);
 const ico={alerta:'!',aviso:'◷',idea:'✦',bien:'✓'},lbl={alerta:'Atiende esto',aviso:'Ojo',idea:'Idea',bien:'Bien'},go={loan:'Ver préstamo',bud:'Ir a presupuesto',stats:'Ver estadísticas'};
 const col=sc.v>=80?'var(--ok)':sc.v>=60?'var(--acc)':sc.v>=40?'var(--warn)':'var(--bad)';
 return `<div class="card coach-score"><div class="cs-top"><div class="cs-ring" style="--p:${sc.v};--c:${col}" role="img" aria-label="Salud financiera ${sc.v} de 100"><b class="big">${sc.v}</b><small>de 100</small></div>
  <div><p class="hk">Tu salud financiera</p><p class="cs-label" style="color:${col}">${sc.label}</p><p class="note">Calculado con tus pagos, tu gasto de la quincena, tus deudas y tu ahorro. Se actualiza solo.</p></div></div>
  <ul class="cs-p">${sc.P.map(p=>`<li><span>${p.n}</span><span class="bar"><i style="width:${p.v}%;background:${p.v>=80?'var(--ok)':p.v>=50?'var(--warn)':'var(--bad)'}"></i></span><b>${p.v}</b></li>`).join('')}</ul></div>
  <h3 class="coach-h">Lo que te recomiendo</h3>
  ${T.map(x=>`<div class="tip t-${x.lvl}"><span class="tip-i" aria-hidden="true">${ico[x.lvl]}</span><div class="tip-b"><p class="tip-k">${lbl[x.lvl]}</p><p class="tip-t">${x.title}</p><p class="tip-x">${x.text}</p>${x.act?`<button type="button" class="linkb" data-tab="${x.act}">${go[x.act]}</button>`:''}</div></div>`).join('')}
  <p class="note" style="text-align:center;margin-top:16px">El coach revisa tus datos en este dispositivo; no se envían a ningún servicio externo.</p>`}

// ===================== Compartir en vivo =====================
// Dueño: crea un enlace de solo lectura por cosa compartida (préstamo, deuda o cuenta).
// Quien lo abre (index.html#v=TOKEN) ve el estado visual y se actualiza solo.
const VIEW=(location.hash.match(/^#v=([A-Za-z0-9]{24,64})$/)||[])[1]||'';
const ACCT={v:'Tarjeta de vales',e:'Efectivo',d:'Débito'};
let SH={};
const newToken=()=>{const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',a=new Uint8Array(32);crypto.getRandomValues(a);return [...a].map(x=>c[x%62]).join('')};
const shareUrl=t=>location.origin+location.pathname+'#v='+t;
const shareBtn=(item,label)=>can()&&API?`<button type="button" class="btn share${SH[item]?' on':''}" data-act="share" data-item="${esc(item)}" data-label="${esc(label)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M4.5 12a7.5 7.5 0 0 1 15 0M2 12a10 10 0 0 1 20 0"/></svg>${SH[item]?'Compartido en vivo':'Compartir en vivo'}</button>`:'';
async function loadShares(){if(!ses||!can())return;try{const rows=await api('/rest/v1/shared_views?select=token,item,label');SH={};(rows||[]).forEach(r=>{SH[r.item]={token:r.token,label:r.label}});render()}catch(e){}}
function shareItems(key){return Object.keys(SH).filter(k=>key==='loan'?k==='loan':k!=='loan')}
let notifyT={};
function notifyShares(key){if(!ses)return;clearTimeout(notifyT[key]);notifyT[key]=setTimeout(()=>{const msgs=shareItems(key).map(k=>({topic:'share-'+SH[k].token,event:'cambio',payload:{at:Date.now()}}));if(!msgs.length)return;
 fetch(SB.url+'/realtime/v1/api/broadcast',{method:'POST',headers:{apikey:SB.key,Authorization:'Bearer '+ses.a,'Content-Type':'application/json'},body:JSON.stringify({messages:msgs})}).catch(()=>{})},300)}
function shareDialog(){let d=$('#shdlg');if(!d){d=document.createElement('dialog');d.id='shdlg';d.setAttribute('aria-labelledby','shtitle');document.body.appendChild(d);d.addEventListener('click',e=>{if(e.target===d)d.close()})}return d}
let shCur=null;
function renderShare(msg){const d=shareDialog(),it=shCur,s=SH[it.item];
 d.innerHTML=`<div class="shbox"><h2 id="shtitle">Compartir en vivo</h2><p class="shsub">${esc(it.label)}</p>
 ${s?`<p class="note">Quien abra este enlace verá el estado de <b>${esc(it.label)}</b> y los cambios en el momento en que los hagas. No puede modificar nada ni ver tus notas.</p>
  <div class="shlink"><input id="shurl" readonly value="${esc(shareUrl(s.token))}" aria-label="Enlace para compartir"><button type="button" class="btn f" data-act="shcopy">Copiar</button></div>
  <div class="row shrow"><a class="btn" href="https://wa.me/?text=${encodeURIComponent('Aquí puedes ver en vivo '+it.label+': '+shareUrl(s.token))}" target="_blank" rel="noopener">Enviar por WhatsApp</a><a class="btn" href="${esc(shareUrl(s.token))}" target="_blank" rel="noopener">Ver como lo verán</a></div>
  <p class="note">¿Ya no quieres compartirlo? Al dejar de compartir, el enlace deja de funcionar para todos.</p>
  <div class="row shrow"><button type="button" class="btn del" data-act="shstop">Dejar de compartir</button><button type="button" class="btn" data-act="shclose">Listo</button></div>`
 :`<p class="note">Crea un enlace privado para que otra persona vea <b>${esc(it.label)}</b> desde su celular, sin cuenta y sin poder modificar nada. Verá los cambios en el momento en que los hagas.</p>
  <div class="row shrow"><button type="button" class="btn f" data-act="shcreate">Crear enlace</button><button type="button" class="btn" data-act="shclose">Cancelar</button></div>`}
 <p class="note" id="shmsg" aria-live="polite">${msg||''}</p></div>`}
function openShare(item,label){shCur={item,label};renderShare();const d=shareDialog();if(!d.open)d.showModal();const f=d.querySelector('.btn.f');if(f)f.focus()}
async function createShare(){const it=shCur;try{const token=newToken();await api('/rest/v1/shared_views',{method:'POST',headers:{Prefer:'return=minimal'},body:{token,item:it.item,label:it.label}});SH[it.item]={token,label:it.label};renderShare();render()}
 catch(e){if(e.status===409){await loadShares();renderShare()}else renderShare('No se pudo crear el enlace. Revisa tu conexión y que hayas ejecutado supabase.sql actualizado.')}}
async function stopShare(item){try{await api('/rest/v1/shared_views?item=eq.'+encodeURIComponent(item),{method:'DELETE'});delete SH[item];if(shCur&&shCur.item===item)renderShare();render()}catch(e){if(shCur)renderShare('No se pudo dejar de compartir. Inténtalo de nuevo.')}}
function copyShare(btn){const i=$('#shurl');i.select();const ok=()=>{btn.textContent='¡Copiado!';setTimeout(()=>{btn.textContent='Copiar'},1600)};
 if(navigator.clipboard)navigator.clipboard.writeText(i.value).then(ok,()=>{try{document.execCommand('copy');ok()}catch(x){}});else{try{document.execCommand('copy');ok()}catch(x){}}}

// ----- Realtime (Supabase Broadcast por WebSocket) con respaldo de consultas -----
const RT={ws:null,ref:0,topic:'',cb:null,hb:null,ok:false,
 url(){return SB.url.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(SB.key)+'&vsn=1.0.0'},
 send(topic,event,payload){if(this.ws&&this.ws.readyState===1){const ref=String(++this.ref);this.ws.send(JSON.stringify({topic,event,payload,ref,join_ref:this.joinRef||ref}));return ref}},
 listen(topic,cb){this.topic='realtime:'+topic;this.cb=cb;this.connect()},
 connect(){if(!('WebSocket' in window))return;try{this.ws=new WebSocket(this.url())}catch(e){return}
  this.ws.onopen=()=>{this.joinRef=null;this.joinRef=this.send(this.topic,'phx_join',{config:{broadcast:{self:false,ack:false},presence:{key:''},postgres_changes:[],private:false}});
   clearInterval(this.hb);this.hb=setInterval(()=>this.send('phoenix','heartbeat',{}),25000)};
  this.ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}
   if(m.topic===this.topic&&m.event==='phx_reply'&&m.ref===this.joinRef){this.ok=m.payload&&m.payload.status==='ok';liveState()}
   else if(m.topic===this.topic&&m.event==='broadcast'&&this.cb)this.cb(m.payload)};
  this.ws.onclose=()=>{this.ok=false;liveState();clearInterval(this.hb);setTimeout(()=>this.connect(),4000)}}};

// ----- Vista de quien recibe el enlace -----
let V={data:null,json:'',at:0,missing:false,busy:false,first:true,lastOk:0};
async function fetchView(){if(V.busy)return;V.busy=true;try{
  const r=await fetch(SB.url+'/rest/v1/rpc/ver_compartido',{method:'POST',headers:{apikey:SB.key,'Content-Type':'application/json'},body:JSON.stringify({t:VIEW})});
  if(!r.ok)throw new Error('HTTP '+r.status);const tx=(await r.text()).trim();const j=tx&&tx!=='null'?JSON.parse(tx):null;V.lastOk=Date.now();
  if(!j){V.missing=true;V.data=null;renderView();return}
  const s=JSON.stringify(j);if(s!==V.json){const prev=V.data;V.json=s;V.data=j;V.missing=false;renderView(prev)}else liveState()}
 catch(e){liveState(true)}finally{V.busy=false}}
function planItemsLoan(){return S.pay.map((p,i)=>({due:due(i+1),amt:sched(i+1),a:+p.a||0,st:status(i)}))}
function planItemsDebt(D){return D.pay.map((p,k)=>({due:addM(D.start,k),amt:ds(D,k+1),a:+p.a||0,st:stt(p.a,ds(D,k+1),addM(D.start,k))}))}
function planHero(items,total,just,doneTitle,you,extra){const paid=items.reduce((t,x)=>t+x.a,0),rest=Math.max(0,r2(total-paid)),N=items.length;
 const nOk=items.filter(x=>x.st==='Pagado').length,nx=items.findIndex(x=>x.st!=='Pagado');
 const lbl={Pagado:'pagado',Atrasado:'atrasado',Parcial:'pago parcial',Pendiente:'pendiente'};
 const stamps=items.map((x,i)=>`<li class="stamp s-${x.st}${i===nx&&x.st==='Pendiente'?' next':''}${just.has(i)?' just':''}" style="--i:${i}"><span class="sc" aria-hidden="true">${x.st==='Pagado'?CHECK:i+1}</span><span aria-hidden="true">${shortD(x.due)}</span><span class="sr">Pago ${i+1}, ${fmtD(x.due)}, ${lbl[x.st]}</span></li>`).join('');
 const top=rest<=0.005?`<div><p class="hk">${esc(doneTitle)}</p><p class="done-msg">Liquidado. Ya no se debe nada.</p></div>`:`<div><p class="hk">${you?'Te falta pagar':'Falta pagar'}</p><p class="hv big">${M(rest)}</p></div>`;
 return `<div class="hero"><div class="hero-top">${top}<ul class="hm"><li>${you?'Has pagado':'Pagado'} <b>${M(paid)}</b> de ${M(total)}</li><li><b>${nOk}</b> de ${N} pagos hechos</li>${nx>=0?`<li>Siguiente: <b>${fmtD(items[nx].due)}</b>, ${M(Math.max(0,r2(items[nx].amt-items[nx].a)))}</li>`:''}</ul></div>
  <ol class="stamps" aria-label="Tarjeta de pagos">${stamps}</ol>${extra?`<div class="hero-act">${extra}</div>`:''}</div>`}
function planTable(items){return `<div class="card wrap"><h3>Detalle de pagos</h3><table class="ro"><tr><th>#</th><th>Fecha</th><th>Programado</th><th>Pagado</th><th>Estatus</th></tr>${items.map((x,i)=>`<tr><td>${i+1}</td><td>${fmtD(x.due)}</td><td>${M(x.amt)}</td><td>${x.a>0?M(x.a):'—'}</td><td class="st ${x.st}">${x.st}</td></tr>`).join('')}</table></div>`}
function acctView(k){B=normB(V.data.data);const info=accInfo(k),C={v:'vIni',e:'cIni',d:'dIni'}[k],ini=+B[C]||0,total=k==='v'?r2(ini+(info.cnt||0)*(+B.vAmt||0)):r2(ini+(info.inc||0));
 const pct=total>0?Math.max(0,Math.min(100,info.bal/total*100)):0,col=info.bal<0?'var(--bad)':pct<20?'var(--warn)':'var(--ok)';
 const mv=B.exp.map(x=>({d:x.d,n:x.n,c:x.c,a:-x.a})).concat((B.inc||[]).map(x=>({d:x.d,n:x.n||'Depósito',a:+x.a}))).sort((a,b)=>(b.d||'').localeCompare(a.d||'')).slice(0,25);
 return `<div class="card"><p class="hk">Disponible</p><p class="hv big" style="color:${col}">${M(info.bal)}</p>
  ${total>0?`<div class="bar" style="height:12px"><i style="width:${pct}%;background:${col}"></i></div><p class="note">Gastado ${M(r2(total-info.bal))} de ${M(total)}.</p>`:''}
  ${k==='v'&&info.next?`<p class="note">Próximo depósito: ${fmtD(info.next)}, ${M(B.vAmt)}.</p>`:''}</div>
  <div class="card"><h3>Movimientos recientes</h3>${mv.length?mv.map(x=>`<div class="ex"><span>${fmtD(x.d)} ${esc(x.n||'')}${x.c?` <small class="tg">${esc(x.c)}</small>`:''}</span><span style="color:${x.a<0?'var(--ink)':'var(--ok)'}">${x.a<0?'−':'+'}${M(Math.abs(x.a))}</span></div>`).join(''):'<p class="note">Todavía no hay movimientos.</p>'}</div>`}
function liveState(err){const el=$('#live');if(!el)return;const h=V.lastOk?new Date(V.lastOk).toLocaleTimeString('es-MX',{hour:'numeric',minute:'2-digit'}):'';
 el.className='live'+(err?' off':RT.ok?' on':'');el.querySelector('span').textContent=err?'Sin conexión, reintentando':(RT.ok?'En vivo':'Actualización automática')+(h?'. Revisado a las '+h:'')}
function renderView(prev){const app=$('#app');
 if(V.missing){app.innerHTML=`<div class="vwrap"><div class="card empty"><h2 class="vt">Este enlace ya no está activo</h2><p class="note">Pídele a quien te lo compartió que te mande uno nuevo.</p></div></div>`;return}
 if(!V.data){app.innerHTML=`<div class="vwrap"><p class="note">Cargando…</p></div>`;return}
 const j=V.data,item=j.item,label=j.label||'Estado de cuenta';let body='',just=new Set();
 const diffJust=(items,old)=>{if(old)items.forEach((x,i)=>{if(x.st==='Pagado'&&old[i]&&old[i].st!=='Pagado')just.add(i)})};
 if(item==='loan'){normS(j.data);const it=planItemsLoan();diffJust(it,V.items);V.items=it;body=planHero(it,+S.total||0,just,label)+planTable(it)}
 else if(item.startsWith('debt:')){const D=normB({debts:[j.data]}).debts[0];const it=planItemsDebt(D);diffJust(it,V.items);V.items=it;body=planHero(it,D.total,just,label)+planTable(it)}
 else body=acctView(item.slice(5));
 app.innerHTML=`<div class="vwrap"><header class="vhead"><p class="hk">${esc(j.owner||'Alguien')} te compartió</p><h1 class="vt">${esc(label)}</h1><p id="live" class="live" role="status"><i aria-hidden="true"></i><span></span></p></header>${body}
  <p class="note vfoot">Solo lectura. Esta página se actualiza sola cuando hay cambios.</p></div>`;
 liveState();
 if(V.first){V.first=false;enterAnim('first')}else if(prev){const l=$('#live');pulse(l,'flash',900)}}
function startViewer(){document.body.classList.add('viewer');document.title='Mis finanzas: estado compartido';
 if(!API){$('#app').innerHTML='<div class="vwrap"><p class="note">La app no está configurada.</p></div>';return}
 renderView();fetchView();RT.listen('share-'+VIEW,()=>fetchView());
 setInterval(()=>{if(!document.hidden)fetchView()},5000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)fetchView()});window.addEventListener('online',fetchView)}

window.addEventListener('hashchange',()=>{if(/^#v=/.test(location.hash)||VIEW)location.reload()});
if(VIEW){startViewer()}else{
if(API){
 fetch(SB.url+'/auth/v1/settings',{headers:{apikey:SB.key}}).then(r=>r.json()).then(j=>{canReg=!j.disable_signup;if(!role){$('#app').innerHTML='';render()}}).catch(()=>{});
 setInterval(sbPull,10000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sbPull()});
 window.addEventListener('online',sbPull);
 if(ses&&role){sbPull();loadMe();loadShares()}
}else{err=NOCFG}
render();
}
