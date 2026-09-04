// Keep completed-game history consistent when the final scoring action is undone.
function undoWithHistoryFix(){
  const g=state.game;
  if(!g||!g.undo.length)return;
  const wasComplete=g.complete;
  const x=JSON.parse(g.undo.pop());
  if(wasComplete) state.history=state.history.filter(h=>h.id!==g.id);
  Object.assign(g,x);
  save();
  render();
}
$('undoBtn').onclick=undoWithHistoryFix;

// Lightweight regression checks for KCD scoring logic.
console.assert(calcScore([1])===100,'single 1');
console.assert(calcScore([5])===50,'single 5');
console.assert(calcScore([1,1,1])===1000,'triple 1');
console.assert(calcScore([4,4,4,4])===800,'four 4s');
console.assert(calcScore([1,2,3,4,5])===500,'small straight');
console.assert(calcScore([2,3,4,5,6])===750,'large straight');
console.assert(calcScore([1,2,3,4,5,6])===1500,'full straight');
console.assert(calcScore([1,2,3,4,5,5])===550,'straight + single 5');