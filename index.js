import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "replace_this_with_a_random_secure_string";
const TOKEN_EXP = "30d";

app.use(cors());
app.use(express.json());

const adapter = new JSONFile("db.json");
const defaultData = { codes: [], usedCodes: [] };
const db = new Low(adapter, defaultData);
await db.read();


/*
 db.json entry structure:
 { "code": "ABC123", "used": false, "deviceId": null, "lastSeen": null }
*/

app.post("/activate", async (req, res) => {
  const { code, deviceId } = req.body;
  if (!code || !deviceId) return res.status(400).json({ error: "Missing code or deviceId" });
  await db.read();
  const record = db.data.codes.find(c => c.code === code);
  if (!record) return res.status(404).json({ error: "Code not found" });
  if (!record.used) {
    // assign to this device
    record.used = true;
    record.deviceId = deviceId;
    record.lastSeen = new Date().toISOString();
    await db.write();
    const token = jwt.sign({ deviceId, code }, JWT_SECRET, { expiresIn: TOKEN_EXP });
    return res.json({ token });
  } else {
    // already used -- allow if same device
    if (record.deviceId === deviceId) {
      record.lastSeen = new Date().toISOString();
      await db.write();
      const token = jwt.sign({ deviceId, code }, JWT_SECRET, { expiresIn: TOKEN_EXP });
      return res.json({ token });
    } else {
      return res.status(403).json({ error: "Code already used on another device" });
    }
  }
});

app.post("/verify", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Missing token" });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    // payload must contain deviceId and code
    const { deviceId, code } = payload;
    await db.read();
    const record = db.data.codes.find(c => c.code === code);
    if (!record) return res.status(404).json({ error: "Code record not found" });
    if (record.deviceId !== deviceId) return res.status(403).json({ error: "Device mismatch" });
    record.lastSeen = new Date().toISOString();
    await db.write();
    // issue refreshed token
    const newToken = jwt.sign({ deviceId, code }, JWT_SECRET, { expiresIn: TOKEN_EXP });
    return res.json({ token: newToken });
  }catch(e){
    return res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(PORT, ()=> console.log(`Activation server listening on ${PORT}`));
