const fs=require("fs");
const {Client}=require("pg");
const env=require("fs").readFileSync("server/.env","utf8").split("\n").filter(Boolean).reduce((a,l)=>{const i=l.indexOf("=");a[l.slice(0,i)]=l.slice(i+1);return a},{});
(async()=>{
  const mapped=JSON.parse(fs.readFileSync("/tmp/mapped.json","utf8"));
  const arr=Array.isArray(mapped)?mapped:(mapped.opportunities||[]);
  const raw=arr.find(o=>o.id==="opp-imp-0114");
  if(!raw){console.log("NOT FOUND in mapped.json");return;}
  const src=raw._src||{};
  const owner=src[5]||"";
  const date=src[2]||"";
  const remark=src[15]||"";
  const status=src[12]||"";
  const seed={
    id:"act-seed-opp-imp-0114",
    type:"Record Created",
    title:"Record created from source data",
    timestamp:date?new Date(date+"T00:00:00").toISOString():new Date().toISOString(),
    author:owner,
    summary:(remark|| (status?"Initial status: "+status:"")).trim(),
    _seed:true
  };
  const pg=new Client({host:env.PGHOST||"127.0.0.1",port:+(env.PGPORT||5432),user:env.PGUSER,password:env.PGPASSWORD,database:env.PGDATABASE});
  await pg.connect();
  const cur=(await pg.query("SELECT doc FROM opportunities WHERE id=$1",["opp-imp-0114"])).rows[0];
  if(!cur){console.log("opp not in db");return;}
  const doc=cur.doc;
  doc.activities=[seed];
  await pg.query("UPDATE opportunities SET doc=$2, updated_at=now() WHERE id=$1",["opp-imp-0114",JSON.stringify(doc)]);
  console.log("restored seed:",JSON.stringify(seed,null,2));
  await pg.end();
})().catch(e=>{console.error(e);process.exit(1)});
