const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || "http://localhost:3115"; 

const ADMIN_EMAILS = process.env.ADMIN_EMAILS;


router.post("/user/login", async (req, res) => {
  const { token } = req.body;

  try {
    const authRes = await fetch(`${AUTH_SERVER_URL}/auth/google`, {
      method: "POST",
      credentials:"include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!authRes.ok) {
      const errorText = await authRes.text();
      return res.status(authRes.status).json({ error: errorText });
    }

    const data = await authRes.json(); // { token, user }
    res.json(data); // 🔁 Send back exactly what auth server responded
  } catch (err) {
    console.error("Login forwarding failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user/check-auth", async (req, res) => {
  try {
    const authRes = await fetch(`${AUTH_SERVER_URL}/check-auth`, {
      method: "GET",
      headers: {
        cookie: req.headers.cookie || "",
      },
    });

    const data = await authRes.json();
    res.status(authRes.status).json(data); // pass back the same response
  } catch (err) {
    console.error("❌ check-auth proxy failed:", err);
    res.status(500).json({ logged_in: false });
  }
});


router.post("/admin/login", async (req, res) => {
  const { token } = req.body;

  try {
    const authRes = await fetch(`${AUTH_SERVER_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const setCookie = authRes.headers.raw && authRes.headers.raw()["set-cookie"];
    if(setCookie) res.setHeader("Set-Cookie",setCookie);

    if (!authRes.ok) {
      const errorText = await authRes.text();
      console.error("❌ Auth server login failed:", errorText);
      return res.status(authRes.status).json({ error: "Auth failed" });
    }

    const data = await authRes.json(); // contains { user, token }
    const { email } = data.user;

    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: "Not authorized as admin" });
    }

    return res.json(data); // Same structure as user login
  } catch (err) {
    console.error("❌ Admin login failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/admin/check-auth", async (req, res) => {
  try {
    const authRes = await fetch(`${AUTH_SERVER_URL}/check-auth`, {
      method: "GET",
      headers: {
        cookie: req.headers.cookie || "",
      },
    });
    const allowedAdmins = ADMIN_EMAILS;
    const data = await authRes.json();
    console.log("response at admin/check-auth",data,authRes.ok,!allowedAdmins.includes(data.email));


    // Example list of allowed admin emails
    
    console.log("allowed admins",allowedAdmins,data.email)
    // If user is not logged in or not an allowed admin
    if (!authRes.ok ||!data.logged_in|| !allowedAdmins.includes(data.user.email)) {
      return res.status(403).json({ logged_in: false, reason: "Not an admin" });
    }

    // If all good, pass back original response
    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ check-auth proxy failed:", err);
    res.status(500).json({ logged_in: false });
  }
});

// Logout relay: forward to auth server and pass back Set-Cookie to clear
router.post("/user/logout", async (req, res) => {
  try {
    const authRes = await fetch(`${AUTH_SERVER_URL}/logout`, {
      method: "POST",
      headers: {
        cookie: req.headers.cookie || "",
      },
    });

    // forward Set-Cookie headers if present
    const setCookie = authRes.headers.raw && authRes.headers.raw()["set-cookie"]; 
    if (setCookie) {
      res.setHeader("Set-Cookie", setCookie);
    }

    const text = await authRes.text();
    return res
      .status(authRes.status)
      .type(authRes.headers.get && authRes.headers.get("content-type") || "application/json")
      .send(text);
  } catch (err) {
    console.error("❌ logout relay failed:", err);
    res.status(500).json({ ok: false });
  }
});



module.exports = router;
