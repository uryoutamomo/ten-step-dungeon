import{readFile,writeFile,mkdtemp,rm}from'node:fs/promises';import{execFileSync}from'node:child_process';import{tmpdir}from'node:os';import path from'node:path';import{pathToFileURL}from'node:url';
const source=await readFile('app/game.ts','utf8');
const mutants=[
 ['non-adjacent teleport','||!adjacent(state.pos,action.id)',''],
 ['slime does not erase footprints','g.trail=[];g.slimes++;','g.slimes++;'],
 ['marked path consumes light','const marked=g.trail.includes(id);','const marked=false;'],
 ['home wins without treasure',"if(id===ENTRANCE&&g.treasure&&g.sword)","if(id===ENTRANCE)"],
 ['sword always succeeds','if(d+g.courage>=g.config.swordTarget)','if(true)'],
 ['guard cancels all boss damage','counter=Math.max(0,counter-1)','counter=0']
];
const dir=await mkdtemp(path.join(tmpdir(),'dungeon-mutations-'));let misses=0;
try{for(const [name,from,to]of mutants){const matches=source.split(from).length-1;if(matches!==1)throw new Error(`MUTATION_MATCH ${name}: expected 1, got ${matches}`);const file=path.join(dir,'game.ts');await writeFile(file,source.replace(from,to));let rejected=false;try{execFileSync(process.execPath,['--experimental-strip-types','--test','tests/game.test.mjs'],{env:{...process.env,GAME_MODULE:pathToFileURL(file).href},stdio:'pipe',timeout:30000})}catch(e){if(e.status!==1)throw e;rejected=true}console.log(`${rejected?'CAUGHT':'MISSED'}: ${name}`);if(!rejected)misses++}}finally{await rm(dir,{recursive:true,force:true})}
if(misses)process.exitCode=1;
