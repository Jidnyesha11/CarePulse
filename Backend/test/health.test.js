import test from "node:test";
import assert from "node:assert/strict";
import {createApp} from "../src/app.js";
test("health endpoint",async()=>{const s=createApp().listen(0),p=s.address().port,r=await fetch(`http://127.0.0.1:${p}/api/v1/health`),b=await r.json();assert.equal(r.status,200);assert.equal(b.data.status,"healthy");s.close()});
test("404 envelope",async()=>{const s=createApp().listen(0),p=s.address().port,r=await fetch(`http://127.0.0.1:${p}/api/v1/missing`),b=await r.json();assert.equal(r.status,404);assert.equal(b.success,false);s.close()});
