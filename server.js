const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🔐 Exotel credentials (use ENV in production)
const EXOTEL_SID = process.env.EXOTEL_SID;
const EXOTEL_TOKEN = process.env.EXOTEL_TOKEN;
const EXOTEL_CALLER_ID = "022XXXXXXXX"; // your Exotel virtual number

// 🧠 In-memory store (use DB/Redis in prod)
const callStore = {};

/**
 * 1️⃣ INCOMING CALL (Dynamic URL)
 */
app.post("/incoming-call", async (req, res) => {
  const from = (req.body.From || "").replace("+", "");
  const callSid = req.body.CallSid;

  console.log("📞 Incoming call from:", from);

  let agents = [];

  if (from.startsWith("91")) {
    agents = ["917070632861", "917043200743"];
  } else if (from.startsWith("1")) {
    agents = ["919304128815", "917043200743"];
  } else {
    agents = ["917070632861", "917207097300"];
  }

  callStore[callSid] = {
    agents,
    index: 0
  };

  // Start calling first agent
  await dialAgent(callSid);

  // IMPORTANT: NO XML RESPONSE
  res.status(200).send("OK");
});

/**
 * 2️⃣ CALL STATUS CALLBACK
 */
app.post("/call-status", async (req, res) => {
  const callSid = req.body.CallSid;
  const status = req.body.Status;

  console.log("📡 Call status:", status);

  if (!callStore[callSid]) {
    return res.send("OK");
  }

  if (status === "answered") {
    console.log("✅ Call answered. Stopping sequence.");
    delete callStore[callSid];
  }

  if (status === "no-answer" || status === "busy" || status === "failed") {
    callStore[callSid].index++;
    await dialAgent(callSid);
  }

  res.send("OK");
});

/**
 * 3️⃣ DIAL AGENT (ONE AT A TIME)
 */
async function dialAgent(callSid) {
  const data = callStore[callSid];
  if (!data || data.index >= data.agents.length) {
    console.log("❌ No agents left");
    delete callStore[callSid];
    return;
  }

  const agent = data.agents[data.index];
  console.log("📲 Dialing agent:", agent);

  const url = `https://${EXOTEL_SID}:${EXOTEL_TOKEN}@api.exotel.com/v1/Accounts/${EXOTEL_SID}/Calls/connect.json`;

  await axios.post(url, null, {
    params: {
      From: EXOTEL_CALLER_ID,
      To: agent,
      CallerId: EXOTEL_CALLER_ID,
      StatusCallback: "https://exotel-qk7x.onrender.com/call-status"
    }
  });
}

/**
 * 🚀 SERVER START
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});