import express from "express";
import * as rest from "../services/supabaseRest.js";
import * as auth from "../services/supabaseAuth.js";
import * as storage from "../services/supabaseStorage.js";
import * as realtime from "../services/supabaseRealtime.js";
import * as functions from "../services/supabaseFunctions.js";

const router = express.Router();

// REST API example route
router.get("/rest/:table", async (req, res) => {
  const data = await rest.getTable(req.params.table);
  res.json(data);
});

// AUTH API
router.post("/auth/signup", async (req, res) => {
  const data = await auth.signUp(req.body.email, req.body.password);
  res.json(data);
});

// STORAGE API
router.get("/storage/buckets", async (req, res) => {
  const data = await storage.listBuckets();
  res.json(data);
});

// REALTIME API (metadata only)
router.get("/realtime/info", async (req, res) => {
  const data = await realtime.getInfo();
  res.json(data);
});

// EDGE FUNCTIONS
router.post("/functions/:fn", async (req, res) => {
  const data = await functions.invoke(req.params.fn, req.body);
  res.json(data);
});

export default router;
