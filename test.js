// Run: node test.js  — checks the game logic extracted from index.html
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const code=html.split('//LOGIC-START')[1].split('//LOGIC-END')[0];
const L=new Function(code+';return {botChoose,newGame,play,swap,legal,claimSeqs,nextTurn,teamOf,lockedSet,viewFor}')();

for(const n of [2,3,4]){const G=L.newGame(n);assert.equal(G.hands.length,n);assert.equal(G.hands[0].length,n===2?7:6);assert.equal(G.seq.length,n===3?3:2)}
assert.deepEqual([0,1,2,3].map(s=>L.teamOf(4,s)),[0,1,0,1]);

// 4 players: seat 2 (team 0) completes a row with a teammate's chips -> sequence, team 0 total 1
const G=L.newGame(4);
[0,1,2,3].forEach(c=>G.board[10+c].owner=0);
const idx=14;G.board[idx].owner=null;G.board[idx].card={r:'5',s:'♠'};
G.turn=2;G.hands[2][0]={r:'5',s:'♠'};
assert.ok(L.play(G,2,0,idx));assert.equal(G.seq[0],1);assert.equal(G.winner,null);
assert.ok(L.lockedSet(G.used).has(12));

// one-eyed jack cannot remove a locked chip; can remove a free opponent chip
G.turn=1;G.hands[1][0]={r:'J',s:'♠'};
assert.ok(!L.play(G,1,0,12));
G.board[50].owner=0;assert.ok(L.play(G,1,0,50));assert.equal(G.board[50].owner,null);

// wrong seat / hidden hands
G.turn=0;assert.ok(!L.play(G,3,0,60));
assert.equal(L.viewFor(G,1,[],[]).hand,G.hands[1]);assert.ok(!('hands' in L.viewFor(G,1,[],[])));

// turn skipping a departed player
G.turn=0;L.nextTurn(G,[false,true,false,false]);assert.equal(G.turn,2);

// bot-vs-bot full games must only make legal moves
for(const n of [2,3,4]){
 const g=L.newGame(n);let turns=0,passes=0;
 while(g.winner===null&&turns++<2000){
  const m=L.botChoose(g,g.turn);
  if(!m){passes++;L.nextTurn(g,[]);continue}
  const ok=m.swap!==undefined?L.swap(g,g.turn,m.swap):L.play(g,g.turn,m.ci,m.idx);
  assert.ok(ok,'bot made illegal move');
  if(g.winner===null)L.nextTurn(g,[]);
 }
 console.log(n+' bots: winner team',g.winner,'after',turns,'turns,',passes,'passes');
}
console.log('ok');
