const express = require("express");
const session = require("express-session");
const Redis = require("ioredis");
const RedisStore = require("connect-redis")(session);
const { createClient } = require("redis");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// Client app configuration
const CLIENT_ID = "app2"; // Change per client
const CLIENT_SECRET = "app2_secret"; // Change per client
const CLIENT_PORT = 3002; // Change per client
const SSO_SERVER = "http://localhost:3000";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const SESSION_SECRET = "client_session_secret";

// Redis Client Setup
// const redisClient = createClient({ url: REDIS_URL });
// redisClient.connect().catch(console.error);

const redisClient = new Redis(REDIS_URL);

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis successfully");
});

const app = express();

app.use((req, res, next) => {
  console.log("Request cookies:", req.headers.cookie);
  next();
});

// Session setup
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      // secure: false, // `true` only if you're using HTTPS
      // httpOnly: true,
      sameSite: "lax", // Important: Lax or None, NOT Strict
      // maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.set("view engine", "ejs");

// Middleware to check authentication
// const ensureAuthenticated = async (req, res, next) => {
//     console.log("here is req.session", req.session);
//   if (req.session.user && req.session.tokens) {
//     console.log("User already logged in. Redirecting to home...");
//     return next();
//   }

//   // Check if there's an active SSO session
//   try {
//     console.log("checking for active session");
//     const response = await axios.get(`${SSO_SERVER}/session/status`, {
//       params: { client_id: CLIENT_ID },
//       withCredentials: true,
//     });

//     if (response.data.isLoggedIn) {
//       // Auto-login via SSO
//       console.log("Already logged in");
//       const state = Math.random().toString(36).substring(7);
//       req.session.authState = state;

//       return res.redirect(
//         `${SSO_SERVER}/login?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
//           `http://localhost:${CLIENT_PORT}/auth/callback`
//         )}&state=${state}`
//       );
//     }

//     // No session, redirect to login
//     console.log("redirecting to /login");
//     res.redirect("/login");
//   } catch (error) {
//     console.error("SSO status check error:", error);
//     res.redirect("/login");
//   }
// };

const getTokenFromRedis = async (key) => {
  console.log("get token from redis function");
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
};

const ensureAuthenticated = async (req, res, next) => {
  console.log("here is req.session", req.session);
  if (req.session.user && req.session.tokens) {
    // console.log("User already logged in. Redirecting to home...");
    // // return next();
    // const globalSession = await getTokenFromRedis(
    //   `global_session_${req.session.user.sub}`
    // );
    // console.log("yeh global session", globalSession);
    const globalSessionKey = `global_session_${req.session.user.sub}`;
    let globalSession = await getTokenFromRedis(globalSessionKey);

    if (globalSession) {
      //   globalSession = JSON.parse(globalSession);

      // Update loggedInApps
      const currentAppId = CLIENT_ID; // or hardcode like "app2"
      globalSession.loggedInApps = {
        ...(globalSession.loggedInApps || {}),
        [currentAppId]: true,
      };

      // Save back to Redis
      await redisClient.set(globalSessionKey, JSON.stringify(globalSession));
      console.log("Updated globalSession:", globalSession);
    }
    try {
      // Try to call userinfo to validate token
      await axios.get(`${SSO_SERVER}/userinfo`, {
        headers: { Authorization: `Bearer ${req.session.tokens.accessToken}` },
      });

      return next();
    } catch (err) {
      console.warn("Access token may be expired. Attempting refresh...");
      // const refreshed = await axios.post(`${SSO_SERVER}/refresh`, {
      //   client_id: CLIENT_ID,
      //   refresh_token: req.session.tokens.refreshToken,
      //   client_secret: CLIENT_SECRET
      // })
      // if (refreshed) return next(); // Retry after refresh

      try {
        // Call refresh endpoint
        const refreshed = await axios.post(`${SSO_SERVER}/refresh`, {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: req.session.tokens.refreshToken,
        });

        // Update session tokens
        req.session.tokens = {
          accessToken: refreshed.data.access_token,
          refreshToken: refreshed.data.refresh_token,
        };

        return next(); // Retry after refresh
      } catch (refreshError) {
        console.error(
          "Token refresh failed:",
          refreshError.response?.data || refreshError.message
        );
        // Optionally destroy session and redirect to login
        req.session.destroy(() => {
          res.redirect("/login");
        });
      }
    }
  }
  // Check if there's an active SSO session
  try {
    console.log("checking for active session");
    const response = await axios.get(`${SSO_SERVER}/session/status`, {
      params: { client_id: CLIENT_ID },
      withCredentials: true,
    });

    if (response.data.isLoggedIn) {
      // Auto-login via SSO
      console.log("Already logged in");
      const state = Math.random().toString(36).substring(7);
      req.session.authState = state;

      return res.redirect(
        `${SSO_SERVER}/login?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
          `http://localhost:${CLIENT_PORT}/auth/callback`
        )}&state=${state}`
      );
    }

    // No session, redirect to login
    console.log("redirecting to /login");
    res.redirect("/login");
  } catch (error) {
    console.error("SSO status check error:", error);
    res.redirect("/login");
  }
};

// Home page
app.get("/", ensureAuthenticated, (req, res) => {
  res.render("home", { user: req.session.user });
});

// Login
app.get("/login", (req, res) => {
  console.log("yaha se server login pr jayenge yeh client h");
  const state = Math.random().toString(36).substring(7);
  req.session.authState = state;
  console.log("auth state bhi set hogya h");
  console.log(state);
  console.log(req.session.authState);
  console.log(req.session);
  req.session.save(() => {
    console.log("authState saved in session");
    res.redirect(
      `${SSO_SERVER}/login?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        `http://localhost:${CLIENT_PORT}/auth/callback`
      )}&state=${state}`
    );
  });
});

// Auth callback
app.get("/auth/callback", async (req, res) => {
  const { code, state } = req.query;
  console.log("auth callback pr aagye h client me");
  console.log(code, state);

  // Validate state
  console.log(req.session);
  // if (state !== req.session.authState) {
  //   return res
  //     .status(400)
  //     .render("error", { message: "Invalid state parameter" });
  // }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(`${SSO_SERVER}/token`, {
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: `http://localhost:${CLIENT_PORT}/auth/callback`,
    });

    const { access_token, refresh_token } = tokenResponse.data;

    console.log(access_token, refresh_token);
    // Verify token and get user info
    const userResponse = await axios.get(`${SSO_SERVER}/userinfo`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Store in session
    req.session.tokens = {
      accessToken: access_token,
      refreshToken: refresh_token,
    };

    req.session.user = userResponse.data;
    console.log("all done successfully");
    res.redirect("/");
  } catch (error) {
    console.error(
      "Token exchange error:",
      error.response?.data || error.message
    );
    res.status(400).render("error", { message: "Authentication failed" });
  }
});

// Logout
app.get("/logout", async (req, res) => {
  try {
    // Notify SSO server about logout
    if (req.session.user) {
      console.log("notifying logout");
      console.log(req.session.user);
      const response = await axios.post(`${SSO_SERVER}/notify-logout`, {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        user_id: req.session.user.sub,
      });
      if (response.data.sessionCleared && response.data.redirectTo) {
        // Global session cleared, redirect to /logout
        req.session.destroy();
        res.send("logged out of all devices");
      } else {
        // Just render logged out locally
        res.render("signedout", { appName: "Client 1", redirectUrl: "/" });
      }
    }
  } catch (error) {
    console.error("Logout notification error:", error);
  }
});
// });

app.listen(CLIENT_PORT, () => {
  console.log(`Client application running on port ${CLIENT_PORT}`);
});
