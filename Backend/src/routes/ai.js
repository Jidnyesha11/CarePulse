import express from "express";

import {
  triage,
  generate,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/triage", triage);
router.post("/generate", generate);

export default router;