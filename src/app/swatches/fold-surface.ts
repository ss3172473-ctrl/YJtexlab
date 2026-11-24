// Inextensible moving page curl. Geometry works in equal fabric units, while
// registration maps the approved full rear image to the same material lattice.
type Point = {x:number; y:number};
type Affine = [number,number,number,number,number,number];
type Band = {m:Affine; uv:Point[]; paintUV:Point[]; reverse:boolean; det:number; phi:number; ds:number; screen:Point[]};
type Station = {d:number; x:number; z:number; angle:number};
type Registration = {sx:number;bx:number;sy:number;by:number};
const S_BACK:Registration = {sx:1.083,bx:-.088,sy:1.140,by:.008};
const T_BACK:Record<string,Registration> = {
  // The approved 480 × 648 tuft crops have ~23.5 px repeat. Fit the
  // normalized repeat + phase to each existing front, not to the demo back.
  T92:{sx:1.175,bx:-.191,sy:1.16049,by:.032},
  T93:{sx:1.152,bx:-.182,sy:1.13778,by:.032},
  T94:{sx:1.149,bx:-.187,sy:1.13481,by:.032},
  T95:{sx:1.175,bx:-.192,sy:1.16049,by:.032},
};
export const validFoldSku = (sku:string) => /^(?:S7[0-5]|T9[2-5])$/.test(sku);
const registration = (sku:string) => T_BACK[sku] || S_BACK;
const clamp=(v:number,l=0,h=1)=>Math.min(h,Math.max(l,v));
export const foldEase=(v:number)=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10);};
export function rearUV(sku:string,u:number,v:number){
  const a=registration(sku);return {u:u*a.sx+a.bx,v:v*a.sy+a.by};
}
export function textureRect(sku:string,w:number,h:number){
  const a=registration(sku);
  return {x:-a.bx*w/a.sx,y:-a.by*h/a.sy,w:w/a.sx,h:h/a.sy};
}
export function cornerMesh(w:number,h:number,p:number){
  p=clamp(p);
  const topX=.13*w,rightY=.74*h, dx=w-topX,dy=rightY;
  const leg=Math.hypot(dx,dy),nx=dy/leg,ny=-dx/leg,base=nx*topX,span=nx*dx;
  const tiltX=-.04,tiltY=.042;
  // Start at the free tip, smoothly grow the curled segment, and settle with
  // curvature still distributed across the shoulder. No fixed hinge travels.
  const advance=.74*p+.26*foldEase(p);
  const center=span*(1.085-.835*advance);
  const bend=span*(.35+.12*advance+.045*Math.sin(Math.PI*p));
  const start=Math.max(0,center-bend/2);
  const end=Math.min(span,center+bend/2);
  const tipAngle=(Math.PI-.070)*foldEase(p/.42);
  const tailStart=Math.max(start,Math.min(span,center-.14*bend));
  const tailSpan=Math.max(span-tailStart,1e-6);
  const phi=(d:number)=>tipAngle*(.78*foldEase((d-(center-bend/2))/bend)+.22*foldEase((d-tailStart)/tailSpan));
  const facing=(a:number)=>Math.cos(a)+(nx*tiltX+ny*tiltY)*Math.sin(a);
  const pointsAt=(d:number):[Point,Point]=>{const f=clamp(d/span);return[{x:topX+dx*f,y:0},{x:w,y:dy*(1-f)}];};
  const projection=(m:Affine,v:Point)=>({x:m[0]*v.x+m[2]*v.y+m[4],y:m[1]*v.x+m[3]*v.y+m[5]});
  const bands:Band[]=[],edgeA:Point[]=[],edgeB:Point[]=[],edgeZ:number[]=[],lifts:Station[]=[];
  if(start>=span||p===0){const [A,B]=pointsAt(span);return {bands,edgeA,edgeB,edgeZ,lifts,tip:A,w,h,physicalLength:span,start,center,bend,tipAngle,vacated:[A,A,B]};}
  const boundaries=[start];
  if(end>start){
    const count=Math.ceil((end-start)/(span/42));
    for(let i=1;i<=count;i++)boundaries.push(start+(end-start)*i/count);
  }
  if(end<span){
    const tailCount=Math.ceil((span-end)/(span/30));
    for(let i=1;i<=tailCount;i++)boundaries.push(end+(span-end)*i/tailCount);
  }
  // Split precisely at the optical crest. It is not a painted diagonal crease:
  // it is the point where a continuous surface changes which side is visible.
  if(facing(phi(start))>0&&facing(phi(span))<0){
    let a=start,b=span;
    for(let i=0;i<22;i++){const mid=(a+b)/2;if(facing(phi(mid))>0)a=mid;else b=mid;}
    const c=(a+b)/2;
    if(boundaries.every(x=>Math.abs(x-c)>1e-6))boundaries.push(c);
    boundaries.sort((a,b)=>a-b);
  }
  let along=start,lift=0;
  lifts.push({d:start,x:along,z:lift,angle:phi(start)});
  for(let i=0;i<boundaries.length-1;i++){
    const a=boundaries[i],b=boundaries[i+1],ds=b-a;
    if(ds<1e-6)continue;
    // Reconstruct an inextensible physical surface: a unit step of material
    // follows a tangent with unit length in 3D, before camera projection.
    const theta=phi((a+b)/2), c=Math.cos(theta), s=Math.sin(theta);
    const wx=nx*(c-1)+tiltX*s,wy=ny*(c-1)+tiltY*s;
    const ox=nx*(along-a)+tiltX*lift,oy=ny*(along-a)+tiltY*lift;
    const m:Affine=[1+wx*nx,wy*nx,wx*ny,1+wy*ny,ox-wx*(base+a),oy-wy*(base+a)];
    const [A,B]=pointsAt(a),[C,D]=pointsAt(b), [P,Q]=pointsAt(Math.min(span,b+.24));
    const uv=[A,B,D,C],paintUV=[A,B,Q,P];
    const det=m[0]*m[3]-m[1]*m[2];
    bands.push({m,uv,paintUV,reverse:det<0,det,phi:theta,ds,screen:uv.map(v=>projection(m,v))});
    edgeA.push(projection(m,A));edgeB.push(projection(m,B));edgeZ.push(lift);
    along+=ds*c;lift+=ds*s;
    lifts.push({d:b,x:along,z:lift,angle:theta});
  }
  const tip={x:w+nx*(along-span)+tiltX*lift,y:ny*(along-span)+tiltY*lift};
  edgeA.push(tip);edgeB.push(tip);edgeZ.push(lift);
  // Inset the matte only, not the geometry. The nearly flat first band then
  // covers the compositing seam on high/low-DPI canvases without a faint border.
  const [top,right]=pointsAt(Math.min(span,start+1.5));
  return {bands,edgeA,edgeB,edgeZ,tip,lifts,w,h,start,center,bend,tipAngle,physicalLength:span,
    vacated:[top,{x:w,y:0},right]};
}
function polygon(ctx:CanvasRenderingContext2D,pts:Point[]){
  if(!pts.length)return;
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
  ctx.closePath();
}
export function drawFold(canvas:HTMLCanvasElement,sku:string,p:number,front:CanvasImageSource,rear:CanvasImageSource,w:number,h:number,paper:string){
  const ctx=canvas.getContext('2d');
  if(!ctx||!w||!h)return;
  const scaleX=canvas.width/w,scaleY=canvas.height/h;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  const G=cornerMesh(w,h,p);
  if(!G.bands.length)return;
  ctx.setTransform(scaleX,0,0,scaleY,0,0);
  const [top,,right]=G.vacated;
  polygon(ctx,[top,{x:top.x,y:-1},{x:w+1,y:-1},{x:w+1,y:right.y},right]);
  ctx.fillStyle=paper;ctx.fill();
  // Only cloth physically raised above the base casts its own shadow.
  // Excluding the contact line avoids a painted diagonal on white swatches.
  const raised=G.edgeZ.findIndex(z=>z>w*.022);
  if(raised>=0&&raised<G.edgeZ.length-2){
    const shadow=(v:Point,i:number)=>{
      const z=G.edgeZ[i+raised];
      return {x:v.x+z*.11,y:v.y+z*.13+w*.003};
    };
    ctx.save();
    polygon(ctx,[...G.edgeA.slice(raised).map(shadow),...G.edgeB.slice(raised).map(shadow).reverse()]);
    ctx.shadowColor='rgba(42,29,25,.14)';ctx.shadowBlur=Math.max(1,w*.022*scaleX*p);
    ctx.fillStyle='rgba(36,28,23,.06)';ctx.fill();ctx.restore();
  }
  const r=textureRect(sku,w,h);
  // Paint low fabric first then nearer/higher fabric. The top face and reverse
  // are opaque, never independently faded or shown through another face.
  for(const {m,paintUV,det,phi,reverse} of G.bands){
    if(Math.abs(det)<.0004)continue;
    ctx.save();ctx.transform(...m);polygon(ctx,paintUV);ctx.clip();
    if(reverse)ctx.drawImage(rear,r.x,r.y,r.w,r.h);
    else ctx.drawImage(front,0,0,w,h);
    const shade=Math.sin(phi)*.17;
    if(shade>0){ctx.fillStyle='rgba(30,25,23,'+shade+')';ctx.fillRect(0,0,w,h);}
    ctx.restore();
  }
}
