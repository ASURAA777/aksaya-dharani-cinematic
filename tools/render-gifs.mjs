import {spawn,execSync} from 'node:child_process';
import {mkdirSync,rmSync} from 'node:fs';
const OUT=process.argv[2], FR=60;
const ch=spawn('chromium',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9340','--allow-file-access-from-files','about:blank'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,4000));
const tabs=await (await fetch('http://127.0.0.1:9340/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend={};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m.result);delete pend[m.id]}};
const send=(method,params={})=>new Promise(r=>{pend[++id]=r;ws.send(JSON.stringify({id,method,params}))});
await send('Emulation.setDeviceMetricsOverride',{width:960,height:600,deviceScaleFactor:1,mobile:false});
await send('Page.enable');await send('Page.navigate',{url:'file://'+process.argv[3]});await new Promise(r=>setTimeout(r,1000));
import {writeFileSync} from 'node:fs';
for(const [key,name] of [['A','signal-mesh'],['B','packet-flow'],['C','sequence-flow']]){
  const dir=`${OUT}/f_${name}`;rmSync(dir,{recursive:true,force:true});mkdirSync(dir,{recursive:true});
  for(let i=0;i<FR;i++){
    await send('Runtime.evaluate',{expression:`scenes.${key}(${i/FR})`});
    const r=await send('Page.captureScreenshot',{format:'png'});
    writeFileSync(`${dir}/${String(i).padStart(3,'0')}.png`,Buffer.from(r.data,'base64'));
  }
  execSync(`ffmpeg -y -loglevel error -framerate 20 -i ${dir}/%03d.png -vf "scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" -loop 0 ${OUT}/${name}.gif`);
  rmSync(dir,{recursive:true,force:true});
  console.log(name,'done');
}
ch.kill();process.exit(0);
