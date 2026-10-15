/** Retain the implemented gallery when regenerating the surrounding Figma page. */
export function withProjectGallery(code){
 code=code.replace(/<div className="[^"]+" data-node-id="919:895" data-name="Project Preview \/ Primary">\s*<img[^>]+\/>\s*<\/div>/,'<ProjectGallery />');
 code=code.replace(/\s*<div className="[^"]+" data-node-id="919:896" data-name="Project Preview \/ Secondary" \/>/,'');
 code=code.replace(/\s*<div className="[^"]+" data-node-id="919:903">\s*<p[^>]*>[^<]*<\/p>\s*<\/div>/,'');
 if(!code.includes('className="project-stage"')){
  const marker='data-node-id="919:889" data-name="Section / Selected Projects">';
  const start=code.indexOf(marker)+marker.length;
  const next=code.indexOf('data-node-id="924:2261"',start);
  const nextOpening=code.lastIndexOf('      <div ',next);
  const end=code.lastIndexOf('      </div>',nextOpening);
  if(start<marker.length||end<start)throw Error('Project section boundaries missing');
  const content=code.slice(start,end).replace('<ProjectGallery />','').replace(/^[\t ]+$/gm,'');
  code=code.slice(0,start)+'\n        <div className="project-stage">'+content+'        </div>\n        <ProjectGallery />\n'+code.slice(end);
 }
 return code;
}
