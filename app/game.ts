export type RoomType = 'entrance' | 'empty' | 'slime' | 'monster' | 'chest' | 'spring' | 'sword' | 'boss';
export type Phase = 'ready' | 'explore' | 'battle' | 'sword' | 'won' | 'lost';
export type Config = { maxHp:number; lampMax:number; slimeCount:number; monsterCount:number; swordTarget:number };
export const DEFAULT_CONFIG:Config = {maxHp:6,lampMax:10,slimeCount:3,monsterCount:4,swordTarget:8};
export const ENTRANCE=31;
export const SWORD_ROOM=8;
export const BOSS_ROOM=12;
export const LABELS:Record<RoomType,string>={entrance:'入口',empty:'石の通路',slime:'スライム',monster:'モンスター',chest:'宝箱',spring:'泉',sword:'伝説の剣',boss:'ラスボス'};
export type Room = {id:number;type:RoomType;seen:boolean;cleared:boolean;hp:number;variant:number};
export type Log = {text:string;turn:number};
export type Scene = {title:string;body:string;kind:RoomType|'win'|'lose';eyebrow:string};
export type Game = {version:1;seed:number;rng:number;config:Config;rooms:Room[];pos:number;previous:number;phase:Phase;hp:number;lamp:number;gold:number;courage:number;sword:boolean;treasure:boolean;spells:number;potions:number;steps:number;turn:number;trail:number[];discovered:number;slimes:number;log:Log[];scene:Scene;die:number|null;lastRoll:string};
export type Action = {type:'start'}|{type:'move';id:number}|{type:'attack'|'guard'|'magic'|'flee'|'pull'|'leave'|'potion'|'continue'};
export const ROOM_IDS=Array.from({length:35},(_,id)=>id).filter(id=>{const x=id%7,y=Math.floor(id/7);return y===0?x>=1&&x<=5:y===3?x>=1&&x<=5:y===4?x>=2&&x<=4:true});
export function adjacent(a:number,b:number){return Math.abs(a%7-b%7)+Math.abs(Math.floor(a/7)-Math.floor(b/7))===1}
export function sanitizeConfig(c:Partial<Config>):Config {const clamp=(v:unknown,lo:number,hi:number,d:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(hi,Math.max(lo,Math.round(v))):d;return {maxHp:clamp(c.maxHp,3,10,6),lampMax:clamp(c.lampMax,6,16,10),slimeCount:clamp(c.slimeCount,1,6,3),monsterCount:clamp(c.monsterCount,2,6,4),swordTarget:clamp(c.swordTarget,5,10,8)}}
function random(g:{rng:number}){g.rng=(Math.imul(g.rng,1664525)+1013904223)>>>0;return g.rng/4294967296}
function log(g:Game,text:string){g.log=[{text,turn:g.turn},...g.log].slice(0,60)}
function scene(g:Game,kind:Scene['kind'],title:string,body:string,eyebrow='A LITTLE ADVENTURE'){g.scene={kind,title,body,eyebrow}}
export function createGame(seed=20260914,config:Partial<Config>=DEFAULT_CONFIG):Game{
 const c=sanitizeConfig(config),g:Game={version:1,seed:seed>>>0,rng:seed>>>0,config:c,rooms:[],pos:ENTRANCE,previous:ENTRANCE,phase:'ready',hp:c.maxHp,lamp:c.lampMax,gold:0,courage:0,sword:false,treasure:false,spells:2,potions:2,steps:0,turn:0,trail:[ENTRANCE],discovered:1,slimes:0,log:[{text:'長靴のひもを、ぎゅっと結んだ。',turn:0}],scene:{kind:'entrance',title:'ただいま、のために。',body:'古い扉の向こうには、小さな迷宮。伝説の剣と、とびきりの宝物。ぜんぶ持って、帰ってこよう。',eyebrow:'THE FIRST STEP'},die:null,lastRoll:''};
 const fixed:Record<number,RoomType>={[ENTRANCE]:'entrance',[SWORD_ROOM]:'sword',[BOSS_ROOM]:'boss',24:'empty',30:'chest',32:'empty',9:'spring'};
 const pool:RoomType[]=[...Array(c.slimeCount).fill('slime'),...Array(c.monsterCount).fill('monster'),'chest','chest','spring'];
 const remaining=ROOM_IDS.filter(id=>!fixed[id]);while(pool.length<remaining.length)pool.push('empty');
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random(g)*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 let at=0;g.rooms=ROOM_IDS.map(id=>({id,type:fixed[id]??pool[at++],seen:id===ENTRANCE,cleared:id===ENTRANCE,hp:id===BOSS_ROOM?7:3,variant:Math.floor(random(g)*3)}));return g;
}
function endIfDead(g:Game){if(g.hp>0)return false;g.hp=0;g.phase='lost';scene(g,'lose','今日は、ここまで。','気づけば、迷宮の外。宝物はおあずけだけど、冒険の記憶は持ち帰れた。次の一歩は、きっとうまくいく。','ANOTHER DAY, ANOTHER QUEST');log(g,'冒険はおしまい。また、新しい一歩を。');return true}
function spend(g:Game,n=1){g.lamp-=n;while(g.lamp<=0){g.hp-=1;g.lamp+=g.config.lampMax;log(g,`灯りが消えて、ひと休み。たいりょく −1、灯りは回復。`)}return endIfDead(g)}
function roll(g:Game,description:string){const value=1+Math.floor(random(g)*6);g.die=value;g.lastRoll=description;return value}
function exploreScene(g:Game,r:Room){
 if(r.type==='entrance'){scene(g,'entrance',g.treasure?'おかえり、冒険者。':'ここが、帰る場所。',g.treasure?'宝物も、伝説の剣も、冒険の思い出も。ぜんぶ抱えて、ただいま。':'扉から外の光がこぼれている。まだ見ぬ宝物を探しに、もう少しだけ。','HOME SWEET HOME');return}
 scene(g,r.type,r.cleared&&r.type==='monster'?'静かになった部屋。':r.type==='spring'?'ひと息、つこう。':'一歩ぶんの、小さな勇気。',g.treasure?'宝は手に入れた。足跡をたどって、下の入口へ帰ろう。':'点線のカードが、次に進める部屋。北西に伝説の剣、北東にラスボスがいるらしい。');
}
function enter(g:Game,id:number,retreat=false){
 const r=g.rooms.find(r=>r.id===id)!;g.previous=g.pos;g.pos=id;g.steps++;g.turn++;g.die=null;
 const marked=g.trail.includes(id);if((retreat||!marked)&&spend(g))return;
 if(!g.trail.includes(id))g.trail.push(id);
 const isNew=!r.seen;r.seen=true;if(isNew){g.discovered++;if((g.discovered-1)%3===0){g.courage++;log(g,'知らない道を3部屋踏破。勇気 +1。')}}
 if(r.type==='slime'){
  g.trail=[];g.slimes++;scene(g,'slime','あ。踏んじゃった。','ぷにっ。長靴についたスライムが、足跡をぜんぶ消してしまった！ 道は覚えている。でも帰りも灯りを使うことに。','SQUISH!');log(g,'スライムを踏んだ！ すべての足跡が消えた。');g.phase='explore';return;
 }
 if(!r.cleared&&(r.type==='monster'||r.type==='boss')){
  g.phase='battle';scene(g,r.type,r.type==='boss'?'お宝の、留守番。':['森のこうもり、登場。','魔法坊主、あらわる。','ポンコツ兵の通せんぼ。'][r.variant],r.type==='boss'?(g.sword?'迷宮の主が、宝箱を抱えている。伝説の剣を握りしめて。勝ったら、最後は家に帰ろう。':'ふつうの剣では歯が立たない。北西の部屋で、伝説の剣を手に入れよう。'):'行く手をふさぐ、ちょっと変わった住人。斬るか、守るか、魔法を使うか。どうする？','AN UNEXPECTED ENCOUNTER');log(g,`${LABELS[r.type]}に出会った。`);return;
 }
 if(r.type==='sword'&&!g.sword){g.phase='sword';scene(g,'sword','抜けたら、伝説。','岩に刺さった一本の剣。「サイコロ ＋ 勇気」で目標に届けば、あなたのもの。失敗しても、勇気はひとつ増える。','THE LEGENDARY SWORD');log(g,'伝説の剣を見つけた。手をかけてみよう。');return}
 g.phase='explore';
 if(!r.cleared&&r.type==='chest'){r.cleared=true;const reward=10+Math.floor(random(g)*4)*5;g.gold+=reward;g.courage++;scene(g,'chest','小さな、たからもの。',`ぱかっ。${reward}Gと、少しの自信を手に入れた。勇気 +1。大きな宝は、まだ迷宮の奥に。`,'FINDERS KEEPERS');log(g,`宝箱から${reward}G。勇気 +1。`);return}
 if(!r.cleared&&r.type==='spring'){r.cleared=true;const healed=Math.min(2,g.config.maxHp-g.hp);g.hp+=healed;g.lamp=g.config.lampMax;scene(g,'spring','冷たい水で、ひと息。',`たいりょくが${healed}回復し、灯りも満タンに。泉は一度きり。ここまで来た自分を、少しほめてあげよう。`,'TAKE A LITTLE BREAK');log(g,`泉でたいりょく +${healed}、灯りが全回復。`);return}
 r.cleared=true;exploreScene(g,r);if(id===ENTRANCE&&g.treasure&&g.sword){g.phase='won';scene(g,'win','ただいま、冒険者。',`伝説の剣と、${g.gold}Gの宝物。${g.steps}歩の小さな大冒険を、無事に持ち帰った。長靴を脱いで、今日はゆっくりしよう。`,'A GOOD DAY TO COME HOME');log(g,'宝物を抱えて、無事に帰還！')}
}
function beat(g:Game,r:Room){r.cleared=true;g.phase='explore';g.courage++;if(r.type==='boss'){g.treasure=true;g.gold+=100;scene(g,'chest','お宝は、あなたのもの。','ラスボスは降参。王家の宝と100Gを手に入れた！ でも、帰るまでが冒険。足跡をたどって、入口へ。','THE WAY HOME');log(g,'ラスボスを倒した！ 王家の宝と100Gを獲得。')}else{g.gold+=10;scene(g,'monster','道を、あけてくれた。','モンスターは逃げていった。10Gと、勇気 +1。少したくましくなった気がする。','A LITTLE MORE BRAVE');log(g,'モンスターを倒した。10G、勇気 +1。')}}
export function transition(state:Game,action:Action):Game{
 if(action.type==='start'){if(state.phase!=='ready')return state;const g=structuredClone(state);g.phase='explore';scene(g,'entrance','さあ、最初の一歩。','点線のカードを選ぶか、矢印キーで移動。足跡のある部屋へは、灯りを使わずに戻れる。','YOUR ADVENTURE BEGINS');log(g,'扉を開けた。冒険のはじまり。');return g}
 if(['ready','won','lost'].includes(state.phase))return state;
 if(action.type==='move'){if(state.phase!=='explore'||!state.rooms.some(r=>r.id===action.id)||!adjacent(state.pos,action.id))return state;const g=structuredClone(state);enter(g,action.id);return g}
 if(action.type==='continue'){if(state.phase!=='explore')return state;const g=structuredClone(state);exploreScene(g,g.rooms.find(r=>r.id===g.pos)!);return g}
 if(action.type==='potion'){if(state.potions===0||state.hp===state.config.maxHp)return state;const g=structuredClone(state);const healed=Math.min(3,g.config.maxHp-g.hp);g.hp+=healed;g.potions--;g.turn++;log(g,`薬草を使った。たいりょく +${healed}。`);return g}
 if(action.type==='leave'){if(state.phase!=='sword')return state;const g=structuredClone(state);g.phase='explore';scene(g,'sword','剣は、待っている。','勇気がもう少し増えたら、また戻ってこよう。この部屋へ入り直すと、もう一度挑戦できる。');return g}
 if(action.type==='pull'){
  if(state.phase!=='sword')return state;const g=structuredClone(state);g.turn++;const d=roll(g,'剣を引き抜く');if(spend(g))return g;
  if(d+g.courage>=g.config.swordTarget){g.sword=true;g.rooms.find(r=>r.id===g.pos)!.cleared=true;g.phase='explore';scene(g,'sword','すぽん。選ばれた！','力を込めると、剣がするりと抜けた。伝説の剣を手に入れた！ 攻撃力 +2。北東のラスボスに、会いにいこう。','YOU ARE THE CHOSEN ONE');log(g,`出目${d} ＋ 勇気${g.courage}。伝説の剣を引き抜いた！`)}else{g.courage++;scene(g,'sword','あと、もう少し。',`出目${d} ＋ 勇気${g.courage-1}。剣は少しだけ動いた。勇気 +1。次はきっと、もう少しうまくいく。`,'ONE MORE TRY');log(g,'剣はまだ抜けない。でも、勇気 +1。')}return g;
 }
 if(state.phase!=='battle')return state;
 const g=structuredClone(state),r=g.rooms.find(r=>r.id===g.pos)!;
 if(action.type==='flee'){
  if(!adjacent(g.pos,g.previous)||!g.rooms.some(r=>r.id===g.previous))return state;
  enter(g,g.previous,true);
  if(g.phase==='explore'&&g.scene.kind!=='slime')scene(g,'empty','退くのも、作戦。','ひとつ前の部屋へ戻った。受けたダメージは敵にも残る。準備ができたら、もう一度。','LIVE TO FIGHT ANOTHER DAY');
  if(g.phase!=='lost')log(g,'ひとつ前の部屋に退いた。');return g;
 }
 if(r.type==='boss'&&!g.sword)return state;
 if(action.type==='magic'&&g.spells===0)return state;
 if(!['attack','guard','magic'].includes(action.type))return state;
 g.turn++;if(spend(g))return g;let damage=0,counter=r.type==='boss'?2:1;const defense=r.type==='boss'?6:4;
 if(action.type==='attack'){const d=roll(g,'斬りかかる');damage=d+(g.sword?3:1)>=defense?(g.sword?3:2):0;log(g,`出目${d} ＋ 攻撃${g.sword?3:1}。${damage?`${damage}ダメージ！`:'空振り。'}`)}
 if(action.type==='guard'){g.die=null;damage=1;counter=Math.max(0,counter-1);log(g,'盾で守って、確実に1ダメージ。')}
 if(action.type==='magic'){g.die=null;damage=3;counter=0;g.spells--;log(g,'魔法で3ダメージ！ 反撃も封じた。')}
 r.hp=Math.max(0,r.hp-damage);if(r.hp===0){beat(g,r);return g}g.hp-=counter;if(counter)log(g,`敵の反撃。たいりょく −${counter}。`);if(!endIfDead(g)){g.scene.body=`${action.type==='guard'?'盾が攻撃を受け止めた。':action.type==='magic'?'光がはじけて、敵がひるんだ。':damage?'手ごたえあり！':'ひらり、かわされた。'} 敵の残りたいりょくは${r.hp}。${counter?`反撃でたいりょく −${counter}。`:'反撃のダメージはなし。'}`};return g;
}
// Only this game's isolated local save key is ever read or written.
export const SAVE_KEY='ten-step-dungeon:adventure:v1';
export function restoreGame(raw:string|null):Game|null{
 if(!raw)return null;try{const g=JSON.parse(raw) as Game;if(g.version!==1||!Array.isArray(g.rooms)||!Array.isArray(g.trail)||!Array.isArray(g.log)||!g.config||!g.scene)return null;
 const ints=['seed','rng','pos','previous','hp','lamp','gold','courage','spells','potions','steps','turn','discovered','slimes'] as const;
 if(ints.some(k=>!Number.isInteger(g[k])||g[k]<0)||!ROOM_IDS.includes(g.pos)||!ROOM_IDS.includes(g.previous)||g.rooms.length!==ROOM_IDS.length)return null;
 if(JSON.stringify(sanitizeConfig(g.config))!==JSON.stringify(g.config)||g.hp>g.config.maxHp||g.lamp<1||g.lamp>g.config.lampMax||g.spells>2||g.potions>2||g.discovered>27)return null;
 if(!['ready','explore','battle','sword','won','lost'].includes(g.phase)||typeof g.sword!=='boolean'||typeof g.treasure!=='boolean')return null;
 if(new Set(g.rooms.map(r=>r.id)).size!==27||g.rooms.some(r=>!ROOM_IDS.includes(r.id)||!Object.hasOwn(LABELS,r.type)||typeof r.seen!=='boolean'||typeof r.cleared!=='boolean'||!Number.isInteger(r.hp)||r.hp<0||r.hp>7||!Number.isInteger(r.variant)||r.variant<0||r.variant>2))return null;
 if(g.trail.some(id=>!ROOM_IDS.includes(id))||g.log.length>60||g.log.some(l=>typeof l.text!=='string'||!Number.isInteger(l.turn)))return null;
 if(typeof g.scene.title!=='string'||typeof g.scene.body!=='string'||typeof g.scene.eyebrow!=='string'||!([...Object.keys(LABELS),'win','lose'].includes(g.scene.kind)))return null;
 if(g.die!==null&&(!Number.isInteger(g.die)||g.die<1||g.die>6))return null;
 const current=g.rooms.find(r=>r.id===g.pos)!;
 if(g.phase==='battle'&&(!['boss','monster'].includes(current.type)||current.cleared||current.hp<=0))return null;
 if(g.phase==='sword'&&(current.type!=='sword'||g.sword))return null;
 if(g.phase==='won'&&(!g.sword||!g.treasure||g.pos!==ENTRANCE||g.hp<=0))return null;
 if((g.phase==='lost')!==(g.hp===0))return null;return g;
 }catch{return null}
}
