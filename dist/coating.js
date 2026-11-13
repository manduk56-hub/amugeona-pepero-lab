// Keep the photograph's surface relief while shading a separate chocolate layer.
const coatingSurfaces=new Map(),coatingFinishes=new Map();
const coatingProfiles={
 stick:{axis:[-.67,.74],wave:.014,relief:.9},postick:{axis:[-.45,.89],wave:.026,relief:1.1},
 cabbage:{axis:[-.64,.77],wave:.05,relief:1.45},enoki:{axis:[-.32,.95],wave:.035,relief:1.5},
 cilantro:{axis:[.25,.97],wave:.055,relief:1.4},sujebi:{axis:[.12,.99],wave:.065,relief:1.1},
 ramen:{axis:[-.04,1],wave:.038,relief:1.55},cucumber:{axis:[-.72,.69],wave:.02,relief:.85},
 shrimp:{axis:[.62,-.78],wave:.045,relief:1.4},ricecake:{axis:[-.65,.76],wave:.03,relief:.8},
 pretzel:{axis:[-.16,.99],wave:.025,relief:1.1},bacon:{axis:[-.62,.78],wave:.05,relief:1.25},
 strawberry:{axis:[-.1,-.99],wave:.03,relief:1.15},banana:{axis:[-.24,.97],wave:.03,relief:.85},
 apple:{axis:[.12,-.99],wave:.025,relief:.8},grape:{axis:[.25,-.97],wave:.045,relief:1.3},
 pineapple:{axis:[.5,.86],wave:.035,relief:1.2},orange:{axis:[-.2,.98],wave:.035,relief:1.15},
 broccoli:{axis:[.05,1],wave:.065,relief:1.6},carrot:{axis:[.6,-.8],wave:.025,relief:1.05},
 corn:{axis:[.88,.47],wave:.04,relief:1.4},potato:{axis:[-.3,.95],wave:.035,relief:.9},
 sweetpotato:{axis:[-.25,.97],wave:.05,relief:1.3},kingoyster:{axis:[-.12,.99],wave:.04,relief:1.15},
 sausage:{axis:[-.72,.69],wave:.025,relief:1},cheese:{axis:[.18,.98],wave:.025,relief:.85},
 kimchi:{axis:[-.12,.99],wave:.065,relief:1.5},gimbap:{axis:[.2,.98],wave:.045,relief:1.3},
 dumpling:{axis:[-.25,.97],wave:.045,relief:1.3},fishcake:{axis:[-.5,.86],wave:.035,relief:1.15}
};
function surfaceBlur(input,size,radius){
 const temp=new Float32Array(input.length),output=new Float32Array(input.length),span=radius*2+1;
 for(let y=0;y<size;y++){let sum=0;for(let k=-radius;k<=radius;k++)sum+=input[y*size+Math.max(0,Math.min(size-1,k))];for(let x=0;x<size;x++){temp[y*size+x]=sum/span;sum+=input[y*size+Math.min(size-1,x+radius+1)]-input[y*size+Math.max(0,x-radius)]}}
 for(let x=0;x<size;x++){let sum=0;for(let k=-radius;k<=radius;k++)sum+=temp[Math.max(0,Math.min(size-1,k))*size+x];for(let y=0;y<size;y++){output[y*size+x]=sum/span;sum+=temp[Math.min(size-1,y+radius+1)*size+x]-temp[Math.max(0,y-radius)*size+x]}}
 return output;
}
function getCoatingSurface(food){
 if(coatingSurfaces.has(food.id))return coatingSurfaces.get(food.id);
 const n=440,base=document.createElement('canvas');base.width=base.height=n;
 const c=base.getContext('2d',{willReadFrequently:true}),sprite=foodPhoto(food);
 if(sprite&&sprite.image.complete&&sprite.image.naturalWidth){const cw=sprite.image.naturalWidth/sprite.cols,ch=sprite.image.naturalHeight/sprite.rows;c.drawImage(sprite.image,sprite.index%sprite.cols*cw,Math.floor(sprite.index/sprite.cols)*ch,cw,ch,0,0,n,n)}
 else c.drawImage(legacyFoodImage(food,0,[]),110,0,220,440);
 const photo=c.getImageData(0,0,n,n),pixels=photo.data,count=n*n;
 const alpha=new Float32Array(count),weighted=new Float32Array(count),luminance=new Float32Array(count);
 let mean=0,weight=0;
 for(let k=0;k<count;k++){const p=k*4,a=pixels[p+3]/255,l=(pixels[p]*.24+pixels[p+1]*.59+pixels[p+2]*.17)/255;alpha[k]=a;weighted[k]=l*a;luminance[k]=l;mean+=l*a;weight+=a}mean/=Math.max(weight,1);
 const blurredAlpha=surfaceBlur(alpha,n,3),smoothed=surfaceBlur(weighted,n,3);
 for(let k=0;k<count;k++)smoothed[k]/=Math.max(.001,blurredAlpha[k]);
 const profile=coatingProfiles[food.id]||{axis:[0,1],wave:.03,relief:1},[ax,ay]=profile.axis;
 let min=Infinity,max=-Infinity;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(alpha[y*n+x]>.5){const p=x*ax+y*ay;min=Math.min(min,p);max=Math.max(max,p)}
 const shade=new Float32Array(count),shine=new Float32Array(count),field=new Float32Array(count);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const k=y*n+x;if(alpha[k]<.005)continue;
  const left=y*n+Math.max(0,x-2),right=y*n+Math.min(n-1,x+2),up=Math.max(0,y-2)*n+x,down=Math.min(n-1,y+2)*n+x;
  let nx=-(smoothed[right]-smoothed[left])*profile.relief*3.8,ny=-(smoothed[down]-smoothed[up])*profile.relief*3.8,nz=.72;
  // Edge normals add thickness around caps, leaf outlines and the pretzel's holes.
  nx-=(alpha[right]-alpha[left])*.7;ny-=(alpha[down]-alpha[up])*.7;
  const length=Math.hypot(nx,ny,nz);nx/=length;ny/=length;nz/=length;
  const diffuse=Math.max(0,nx*-.35+ny*-.45+nz*.82),spec=Math.max(0,nx*-.22+ny*-.30+nz*.928);
  const structure=(smoothed[k]-mean)*profile.relief;
  shade[k]=Math.max(.37,Math.min(1.24,.48+diffuse*.48+structure*.50+(luminance[k]-smoothed[k])*.24));
  shine[k]=Math.pow(spec,28)*.23;
  const across=x*ay-y*ax;
  const ripple=Math.sin(across*.047)*profile.wave+Math.sin(across*.137+1.7)*profile.wave*.32;
  const drip=Math.pow(Math.max(0,Math.sin(across*.032+2.1)),10)*.065;
  field[k]=(x*ax+y*ay-min)/Math.max(1,max-min)+ripple-drip+(smoothed[k]-mean)*.026;
 }
 const surface={base,photo,alpha,shade,shine,field,size:n};
 if(!sprite||(sprite.image.complete&&sprite.image.naturalWidth)){if(coatingSurfaces.size>=10)coatingSurfaces.delete(coatingSurfaces.keys().next().value);coatingSurfaces.set(food.id,surface)}
 return surface;
}
function chocolateCoverage(field,amount){const front=-.09+Math.min(1,amount)*.86,t=Math.max(0,Math.min(1,(front-field)/.016+.5));return t*t*(3-2*t)}
function coatingAt(food,x,y,amount=1){if(x<0||y<0||x>=440||y>=440)return false;const s=getCoatingSurface(food),k=Math.floor(y)*440+Math.floor(x);return s.alpha[k]>.22&&chocolateCoverage(s.field[k],amount)>.65}
function chocolateFinish(food,amount){
 const key=food.id+':'+state.choc;
 if(amount===1&&coatingFinishes.has(key))return coatingFinishes.get(key);
 const s=getCoatingSurface(food),n=s.size,output=document.createElement('canvas'),mask=document.createElement('canvas');output.width=output.height=mask.width=mask.height=n;
 const c=output.getContext('2d'),m=mask.getContext('2d'),image=c.createImageData(n,n),matte=m.createImageData(n,n),dst=image.data,src=s.photo.data;
 const hex=chocolate().color,rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const front=-.09+Math.min(1,amount)*.86;
 for(let k=0;k<n*n;k++){
  const p=k*4,a=src[p+3];dst[p+3]=a;if(!a)continue;
  const coverage=chocolateCoverage(s.field[k],amount)*(s.alpha[k]>.12?1:s.alpha[k]/.12);
  const edge=Math.exp(-Math.pow((s.field[k]-front)/.014,2));
  const shading=s.shade[k]-edge*.075,highlight=s.shine[k]+edge*.045;
  for(let ch=0;ch<3;ch++){const coated=Math.min(255,rgb[ch]*shading+Math.max(28,255-rgb[ch]*.25)*highlight);dst[p+ch]=src[p+ch]*(1-coverage)+coated*coverage}
  matte.data[p+3]=Math.round(a*coverage);
 }
 c.putImageData(image,0,0);m.putImageData(matte,0,0);
 const result={canvas:output,mask};
 if(amount===1&&(!foodPhoto(food)||foodPhoto(food).image.naturalWidth)){if(coatingFinishes.size>=18)coatingFinishes.delete(coatingFinishes.keys().next().value);coatingFinishes.set(key,result)}
 return result;
}
function renderCoatedFood(food,amount=0,decorations=[]){
 const surface=getCoatingSurface(food);if(amount<=0)return surface.base;
 const finish=chocolateFinish(food,amount);if(!decorations.length)return finish.canvas;
 const out=document.createElement('canvas');out.width=out.height=440;const c=out.getContext('2d');c.drawImage(finish.canvas,0,0);
 const top=document.createElement('canvas');top.width=top.height=440;const t=top.getContext('2d');
 decorations.forEach(d=>{const random=rng(d.seed);for(let j=0;j<14;j++){
  const x=d.x*2+(random()-.5)*125,y=d.y+(random()-.5)*85;
  t.save();t.translate(x,y);t.rotate(random()*6.3);t.shadowColor='#281b2355';t.shadowBlur=1.5;t.shadowOffsetX=1;t.shadowOffsetY=2;
  const color={almond:'#e4c48e',hearts:'#f6b7bc',sesame:'#f5ebce',chili:'#a83c22',seaweed:'#344e32'}[d.type];
  if(d.type==='hearts'){t.fillStyle=color;t.beginPath();t.moveTo(0,5);t.bezierCurveTo(-13,-4,-8,-12,0,-6);t.bezierCurveTo(8,-12,13,-4,0,5);t.fill()}
  else if(d.type==='rainbow')round(t,-2,-6,4,12,2,['#f5c95b','#f5e4c7','#db7a86','#91ad87'][j%4]);
  else ellipse(t,0,0,d.type==='almond'?4:2,d.type==='almond'?8:4,color);
  t.restore();
 }});
 t.globalCompositeOperation='destination-in';t.drawImage(finish.mask,0,0);c.drawImage(top,0,0);return out;
}
