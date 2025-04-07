const express = require("express");
const Redis = require("ioredis");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const { createClient } = require("redis");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const SESSION_SECRET = process.env.SESSION_SECRET || "your_session_secret";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const SESSION_TTL = 86400; // 24 hours in seconds

// Redis Client Setup
// const redisClient = createClient({ url: REDIS_URL, legacyMode: true });
// // redisClient.connect()
// //   .then(() => console.log("✅ Redis connected successfully"))
// //   .catch((err) => console.error("❌ Redis connection failed:", err));
// redisClient.connect().catch(console.error);

// let redisClient = createClient();
// redisClient.connect().catch(console.error);

const redisClient = new Redis();
// Setup RedisStore
// const redisStore = new RedisStore({
//   client: redisClient,
// });
// console.log("redis connected successfully");

// Sample user database (replace with actual DB in production)
const users = {
  "user@example.com": {
    id: "1",
    email: "user@example.com",
    password: "password123",
    name: "Sample User",
    roles: ["user"],
  },
  "admin@example.com": {
    id: "2",
    email: "admin@example.com",
    password: "admin123",
    name: "Admin User",
    roles: ["user", "admin"],
  },
};

// Registered client applications
const clientApps = {
  app1: {
    id: "app1",
    name: "Application 1",
    secret: "app1_secret",
    redirectUrl: "http://localhost:3001/auth/callback",
    allowedOrigin: "http://localhost:3001",
  },
  app2: {
    id: "app2",
    name: "Application 2",
    secret: "app2_secret",
    redirectUrl: "http://localhost:3002/auth/callback",
    allowedOrigin: "http://localhost:3002",
  },
  app3: {
    id: "app3",
    name: "Application 3",
    secret: "app3_secret",
    redirectUrl: "http://localhost:3003/auth/callback",
    allowedOrigin: "http://localhost:3003",
  },
};

// Token cache in Redis
const storeTokenInRedis = async (key, value, expiryInSeconds) => {
  // await redisClient.set(key, JSON.stringify(value), {
  //   EX: expiryInSeconds,
  // });
  console.log("store token in redis function");
  console.log(`Storing key: ${key} with TTL: ${expiryInSeconds}`);
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", expiryInSeconds);
    console.log(`Stored key ${key} with TTL ${expiryInSeconds}`);
  } catch (err) {
    console.error("Redis store error:", err);
    throw err;
  }
};

const getTokenFromRedis = async (key) => {
  console.log("get token from redis function");
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
};

// Express app setup
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: Object.values(clientApps).map((app) => app.allowedOrigin),
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "development",
      httpOnly: true,
      maxAge: SESSION_TTL * 1000,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up view engine for login pages
app.set("view engine", "ejs");

// Passport Local Strategy
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    const user = users[email];
    if (!user) {
      return done(null, false, { message: "User not found" });
    }
    if (user.password !== password)
      return done(null, false, { message: "Incorrect password" });
    return done(null, user);
  })
);

// JWT Strategy for API authentication
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        // Verify token in Redis to check if it's still valid (not logged out)
        const storedToken = await getTokenFromRedis(
          `jwt_${payload.sub}_${payload.jti}`
        );
        if (!storedToken)
          return done(null, false, { message: "Token not found" });

        const user = users[payload.email];
        if (!user) return done(null, false, { message: "User not found" });

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  const user = Object.values(users).find((u) => u.id === id);
  done(null, user || false);
});

// SSO Login Page
app.get("/login", (req, res) => {
  console.log("server ke get wale route pr aaye h");
  const { client_id, redirect_uri, state } = req.query;
  console.log(client_id, redirect_uri, state);

  // Check if client is registered
  if (client_id && !clientApps[client_id]) {
    return res
      .status(400)
      .render("error", { message: "Invalid client application" });
  }

  // If user already logged in, redirect to callback with code
  // console.log("printing req object", req);
  if (req.isAuthenticated()) {
    if (client_id && redirect_uri) {
      const authCode = uuidv4();
      // Store auth code in Redis for short period
      storeTokenInRedis(
        `auth_code_${authCode}`,
        {
          userId: req.user.id,
          clientId: client_id,
          redirectUri: redirect_uri,
        },
        600
      ); // 10 minutes

      return res.redirect(
        `${redirect_uri}?code=${authCode}&state=${state || ""}`
      );
    }
    // If no redirect, show profile page
    return res.redirect("/profile");
  }

  // Show login page
  res.render("login", {
    title: "SSO Login",
    clientId: client_id,
    redirectUri: redirect_uri,
    state: state,
  });
});

// Handle login form submission
app.post("/login", (req, res, next) => {
  console.log("login form submit ho gya h");
  const { client_id, redirect_uri, state } = req.query;

  passport.authenticate("local", async (err, user, info) => {
    console.log("local ke andar ");
    if (err) {
      return next(err);
    }
    if (!user) {
      const loginInfo = {
        Datetime: new Date().toISOString().replace("T", " ").slice(0, 19),
        User: req.body.username || req.body.email || "unknown", // Use submitted credentials
        ID: null, // No user ID available
        Process: "Login",
        FKL_Process: 0, // Failed login
      };

      try {
        await redisClient.lpush("logins", JSON.stringify(loginInfo));
        console.log("Logged failed loginInfo to Redis:", loginInfo);
      } catch (redisErr) {
        console.error("Redis error:", redisErr);
      }

      return res.render("login", {
        error: info.message,
        title: "SSO Login",
        clientId: client_id,
        redirectUri: redirect_uri,
        state: state,
      });
    }

    req.login(user, async (loginErr) => {
      console.log("login ke andar");
      if (loginErr) {
        return next(loginErr);
      }

      // Create global session record in Redis
      const globalSessionId = uuidv4();
      console.log(
        `${globalSessionId} is globalSessionId logged nhi h user isliye generate karke store `
      );
      await storeTokenInRedis(
        `global_session_${user.id}`,
        {
          id: globalSessionId,
          loggedInApps: {},
        },
        SESSION_TTL
      );
      console.log("store token in redis me dikkat h ka=ya");
      const loginInfo = {
        Datetime: new Date().toISOString().replace("T", " ").slice(0, 19),
        User: user.email,
        ID: user.id,
        Process: "Login",
        FKL_Process: 1,
      };

      await redisClient.lpush("logins", JSON.stringify(loginInfo));
      console.log("Logged loginInfo to Redis:", loginInfo);

      if (client_id && redirect_uri) {
        // Create auth code for redirect
        const authCode = uuidv4();
        console.log(
          `${authCode} is authCode logged nhi h user isliye generate karke store `
        );
        await storeTokenInRedis(
          `auth_code_${authCode}`,
          {
            userId: user.id,
            clientId: client_id,
            redirectUri: redirect_uri,
            globalSessionId,
          },
          600
        ); // 10 minutes

        console.log(
          "log in ho chuka h auth code, global session token store kar liya h ab client pr jarhe h"
        );

        return res.redirect(
          `${redirect_uri}?code=${authCode}&state=${state || ""}`
        );
      }

      res.redirect("/profile");
    });
  })(req, res, next);
});

app.get("/admin/logins", async (req, res) => {
  try {
    const rawLogs = await redisClient.lrange("logins", 0, -1); // latest 100
    const logs = rawLogs.map(JSON.parse);
    console.log("these are logs", logs);
    res.json(logs);
  } catch (error) {
    console.error("Redis fetch error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Exchange auth code for token
app.post("/token", async (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  // Validate client credentials
  const clientApp = clientApps[client_id];
  if (!clientApp || clientApp.secret !== client_secret) {
    return res.status(401).json({ error: "Invalid client credentials" });
  }

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "Unsupported grant type" });
  }

  // Get auth code from Redis
  const authCodeData = await getTokenFromRedis(`auth_code_${code}`);
  console.log(`getting auth code from redis ${authCodeData}`);
  if (!authCodeData) {
    return res.status(400).json({ error: "Invalid authorization code" });
  }

  // Validate redirect URI
  if (authCodeData.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: "Redirect URI mismatch" });
  }

  // Delete used auth code
  await redisClient.del(`auth_code_${code}`);

  // Get user
  const user = Object.values(users).find((u) => u.id === authCodeData.userId);
  console.log(`getting user from redis ${user}`);
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Record app login in global session
  const globalSession = await getTokenFromRedis(`global_session_${user.id}`);
  if (globalSession) {
    globalSession.loggedInApps[client_id] = true;
    console.log("this is global session", globalSession);
    await storeTokenInRedis(
      `global_session_${user.id}`,
      globalSession,
      SESSION_TTL
    );
  }

  // Generate JWT
  const tokenId = uuidv4();
  //jwt.sign has 3 options payload, secret and options
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      jti: tokenId,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Store token in Redis for validation/revocation
  await storeTokenInRedis(
    `jwt_${user.id}_${tokenId}`,
    {
      tokenId,
      clientId: client_id,
      issuedAt: Date.now(),
    },
    3600
  ); // 1 hour

  // Generate refresh token
  const refreshToken = uuidv4();
  await storeTokenInRedis(
    `refresh_${refreshToken}`,
    {
      userId: user.id,
      clientId: client_id,
      tokenId,
    },
    // 30 * 24 * 60 * 60
    24 * 60 * 60
  ); // 30 days

  res.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: "profile",
    id_token: token, // In a real implementation, a proper id_token would be generated
  });
});

// Refresh Token
app.post("/refresh", async (req, res) => {
  const { refresh_token, client_id, client_secret } = req.body;

  // Validate client credentials
  const clientApp = clientApps[client_id];
  if (!clientApp || clientApp.secret !== client_secret) {
    return res.status(401).json({ error: "Invalid client credentials" });
  }

  // Get refresh token from Redis
  const refreshData = await getTokenFromRedis(`refresh_${refresh_token}`);
  if (!refreshData) {
    return res.status(400).json({ error: "Invalid refresh token" });
  }

  // Validate client ID
  if (refreshData.clientId !== client_id) {
    return res.status(400).json({ error: "Client ID mismatch" });
  }

  // Get user
  const user = Object.values(users).find((u) => u.id === refreshData.userId);
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Invalidate old token
  await redisClient.del(`jwt_${user.id}_${refreshData.tokenId}`);

  // Generate new token
  const newTokenId = uuidv4();
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      jti: newTokenId,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Store new token in Redis
  await storeTokenInRedis(
    `jwt_${user.id}_${newTokenId}`,
    {
      tokenId: newTokenId,
      clientId: client_id,
      issuedAt: Date.now(),
    },
    3600
  ); // 1 hour

  // Update refresh token
  await storeTokenInRedis(
    `refresh_${refresh_token}`,
    {
      ...refreshData,
      tokenId: newTokenId,
    },
    30 * 24 * 60 * 60
  ); // 30 days

  res.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refresh_token,
  });
});

app.get("/dashboard", async (req, res) => {
  const clients = Object.entries(clientApps);

  // Get all global sessions
  const globalSessionKeys = await redisClient.keys("global_session_*");

  // Aggregate login status per client
  const loggedInMap = {};

  for (const key of globalSessionKeys) {
    const session = await redisClient.get(key);
    if (!session) continue;

    try {
      const parsed = JSON.parse(session);
      const apps = parsed.loggedInApps || {};

      for (const [clientId, status] of Object.entries(apps)) {
        if (status) {
          loggedInMap[clientId] = true;
        }
      }
    } catch (err) {
      console.error("Failed to parse session:", err);
    }
  }

  // Build final client status list
  const clientStatusList = clients.map(([clientId, clientData]) => {
    return {
      id: clientId,
      name: clientData.name,
      redirectUri: clientData.allowedOrigin,
      isLoggedIn: loggedInMap[clientId] || false,
    };
  });

  res.render("dashboard", { clients: clientStatusList });
});

// Verify token and return user info
app.get(
  "/userinfo",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      sub: req.user.id,
      email: req.user.email,
      name: req.user.name,
      roles: req.user.roles,
    });
  }
);

// Check session status (used by applications to verify SSO status)
app.get("/session/status", async (req, res) => {
  console.log("for checking session status");
  const { client_id } = req.query;

  if (!req.isAuthenticated()) {
    console.log("not authenticated");
    return res.json({ isLoggedIn: false });
  }

  const globalSession = await getTokenFromRedis(
    `global_session_${req.user.id}`
  );
  if (!globalSession) {
    return res.json({ isLoggedIn: false });
  }
  console.log("/session/status me global session mil gya ");
  // If client_id provided, check if that specific app is logged in
  if (client_id) {
    return res.json({
      isLoggedIn: !!globalSession.loggedInApps[client_id],
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
      },
    });
  }

  // Return general login status
  res.json({
    isLoggedIn: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    },
    loggedInApps: Object.keys(globalSession.loggedInApps || {}),
  });
});

// SSO Logout
app.get("/logout", async (req, res) => {
  console.log("full logout wala route hit kar gya");
  if (req.isAuthenticated()) {
    const userId = req.user.id;

    // Get global session
    const globalSession = await getTokenFromRedis(`global_session_${userId}`);
    if (globalSession) {
      // Loop through logged in apps to invalidate their sessions
      const loggedInApps = Object.keys(globalSession.loggedInApps || {});

      // Here you would typically notify client apps about logout
      // This is a simplified implementation

      // Delete global session
      await redisClient.del(`global_session_${userId}`);
    }

    // Logout from local session
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
      res.redirect("/login");
    });
  } else {
    res.redirect("/login");
  }
});

// User profile page (when logged in directly to SSO)
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  res.render("profile", { user: req.user });
});

// Client app logout notification endpoint
app.post("/notify-logout", async (req, res) => {
  const { client_id, client_secret, user_id } = req.body;

  console.log("sirf particular app hi logout hoga");

  // Validate client
  const clientApp = clientApps[client_id];
  if (!clientApp || clientApp.secret !== client_secret) {
    return res.status(401).json({ error: "Invalid client credentials" });
  }

  // Get global session
  // const globalSession = await getTokenFromRedis(`global_session_${user_id}`);
  // if (globalSession && globalSession.loggedInApps[client_id]) {
  //   // Update logged in apps
  //   delete globalSession.loggedInApps[client_id];
  //   await storeTokenInRedis(
  //     `global_session_${user_id}`,
  //     globalSession,
  //     SESSION_TTL
  //   );
  // }

  // const globalSessio = await getTokenFromRedis(`global_session_${user_id}`);
  // console.log("global session after logout",globalSessio);

  // res.json({ success: true });

  const globalSessionKey = `global_session_${user_id}`;
  const globalSession = await getTokenFromRedis(globalSessionKey);

  let sessionCleared = false;

  if (globalSession && globalSession.loggedInApps[client_id]) {
    delete globalSession.loggedInApps[client_id];

    // If no logged in apps remain, delete the global session
    if (Object.keys(globalSession.loggedInApps).length === 0) {
      await redisClient.del(globalSessionKey);
      sessionCleared = true;
    } else {
      await storeTokenInRedis(globalSessionKey, globalSession, SESSION_TTL);
    }
  }

  const after = await getTokenFromRedis(globalSessionKey);
  console.log("Global session after logout:", after);

  return res.json({
    success: true,
    sessionCleared, // Signal the client app that global session is gone
    redirectTo: sessionCleared ? "/logout" : null,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SSO Provider running on port ${PORT}`);
});
