const TEAMS = [
  {id:"crabs",name:"Snow Crabs",file:"assets/Crabs.PNG"},
  {id:"lemurs",name:"Lemurs",file:"assets/Lemurs.PNG"},
  {id:"breakers",name:"Beach Breakers",file:"assets/BeachBreakers.PNG"},
  {id:"turtles",name:"Snapping Turtles",file:"assets/Turtles.PNG"},
  {id:"predators",name:"Predators",file:"assets/Predators.PNG"},
  {id:"kodiaks",name:"Kodiaks",file:"assets/Kodiaks.PNG"},
  {id:"cyclones",name:"Cyclones",file:"assets/Cyclones.PNG"},
  {id:"smog",name:"Smog Hogs",file:"assets/SmogHogs.PNG"},
  {id:"sa",name:"San Antonio",file:"assets/SanAntonio.png"},
  {id:"inferno",name:"Tulsa Inferno",file:"assets/TulsaInferno.PNG"},
  {id:"qkiwis",name:"Qkiwis",file:"assets/Qkiwis.png"},
  {id:"spuds",name:"Dublin Spuds",file:"assets/DublinSpuds.PNG"},
];

let order = JSON.parse(localStorage.getItem("lottery")) || [];
let muted = false;

const grid = document.getElementById("teamGrid");
const list = document.getElementById("orderList");
const sound = document.getElementById("pickSound");
const badge = document.getElementById("completeBadge");

function save(){ localStorage.setItem("lottery",JSON.stringify(order)); }

function render(){
  grid.innerHTML="";
  list.innerHTML="";
  badge.hidden = order.length !== 12;

  TEAMS.forEach(t=>{
    const card=document.createElement("div");
    card.className="card"+(order.includes(t.id)?" locked":"");
    card.innerHTML=`<img class="logo" src="${t.file}"><div class="name">${t.name}</div>`;
    if(!order.includes(t.id)){
      card.onclick=()=>pick(t.id);
    }
    grid.appendChild(card);
  });

  for(let i=0;i<12;i++){
    const li=document.createElement("li");
    li.className="pick";
    if(order[i]){
      const t=TEAMS.find(x=>x.id===order[i]);
      li.innerHTML=`<div class="pick-num">Pick #${i+1}</div><img class="pick-logo" src="${t.file}"><div class="pick-name">${t.name}</div>`;
    }else{
      li.innerHTML=`<div class="pick-num">Pick #${i+1}</div><div class="pick-name" style="opacity:.5">— empty</div>`;
    }
    list.appendChild(li);
  }
  save();
}

function pick(id){
  if(order.length>=12) return;
  order.push(id);
  if(!muted){ sound.currentTime=0; sound.play(); }
  render();
}

document.getElementById("undoBtn").onclick=()=>{ order.pop(); render(); };
document.getElementById("resetBtn").onclick=()=>{ order=[]; render(); };
document.getElementById("randomBtn").onclick=()=>{
  const remaining=TEAMS.map(t=>t.id).filter(id=>!order.includes(id));
  remaining.sort(()=>Math.random()-0.5);
  order=order.concat(remaining).slice(0,12);
  render();
};
document.getElementById("copyBtn").onclick=()=>{
  const text=order.map((id,i)=>`Pick #${i+1}: ${TEAMS.find(t=>t.id===id).name}`).join("\n");
  navigator.clipboard.writeText(text);
};
document.getElementById("muteBtn").onclick=e=>{
  muted=!muted;
  e.target.textContent=muted?"🔇 Sound: Off":"🔊 Sound: On";
};

render();
