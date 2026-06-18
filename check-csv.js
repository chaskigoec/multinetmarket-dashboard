
const fs   = require('fs');
const path = require('path');
const procesar = 'C:\\\\Users\\\\PaoloJácome\\\\OneDrive - ChaskiGo\\\\Documentos - OPERACIONES CHASKI\\\\PROYECTOS\\\\2026\\\\MULTINETMARKET\\\\ETAPA\\\\Procesar';
const csvFiles = fs.readdirSync(procesar).filter(f => f.endsWith('.csv')).sort((a,b) =>
  fs.statSync(path.join(procesar,b)).mtime - fs.statSync(path.join(procesar,a)).mtime
);
const csvPath = path.join(procesar, csvFiles[0]);
const lines   = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
const rows = lines.slice(1).map(line => {
  const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
  return Object.fromEntries(headers.map((h,i) => [h, vals[i] ?? '']));
}).filter(r => Object.values(r).some(v => v));
const porContacto = {};
rows.forEach(r => { const k = r.contacto; if (!porContacto[k]) porContacto[k]=[]; porContacto[k].push(r); });
const duplicados = Object.entries(porContacto).filter(([,v]) => v.length > 1);
console.log('Total filas CSV:', rows.length);
console.log('Contactos únicos:', Object.keys(porContacto).length);
console.log('Con múltiples respuestas:', duplicados.length);
if (duplicados.length) {
  duplicados.forEach(([contacto, resps]) => {
    console.log('Contacto:', contacto);
    resps.forEach((r,i) => console.log('  ['+(i+1)+'] respuesta='+r.respuesta+' created='+r.created));
  });
}
const tipos = [...new Set(rows.map(r => r.respuesta))];
console.log('Tipos de respuesta:', tipos);

