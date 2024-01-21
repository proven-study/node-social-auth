const express = require("express");
const passport = require("passport");
const cookieSession = require("cookie-session");
const { PORT } = require("./config");
require("./passport-setup");

const app = express();

app.set("view engine", "ejs");

//Setting up cookies
app.use(
  cookieSession({
    name: "tuto-session",
    keys: ["key1", "key2"],
  })
);

app.use(function (request, response, next) {
  if (request.session && !request.session.regenerate) {
    request.session.regenerate = (cb) => {
      cb();
    };
  }
  if (request.session && !request.session.save) {
    request.session.save = (cb) => {
      cb();
    };
  }
  next();
});

//Logged In Middleware
const isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
};

//Passport Initialized
app.use(passport.initialize());

//Setting Up Session
app.use(passport.session());

app.get("/", (req, res) => {
  if (req.user) {
    return res.redirect("/good");
  }

  res.render("pages/index");
});

app.get("/failed", (req, res) => res.send("You Failed to log in!"));

app.get("/good", (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }

  const {
    provider,
    _json: { email, name, picture },
  } = req.user;

  const data = {
    name,
    pic: picture,
    email,
    profile: provider,
  };

  console.log("good----->", data);

  res.render("pages/profile.ejs", data);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/failed" }),
  (req, res) => {
    const { provider, _json } = req.user;
    const {
      email,
      email_verified,
      name,
      given_name,
      family_name,
      picture,
      domain,
      locale,
    } = _json;

    console.log("callback----->", {
      provider,
      email,
      email_verified,
      name,
      given_name,
      family_name,
      picture,
      domain,
      locale,
    });

    // Successful authentication, redirect to good page.
    return res.redirect("/good");
  }
);

app.get("/profile", (req, res) => {
  console.log("profile----->", req.user);

  if (!req.user) {
    return res.redirect("/");
  } else if (req.user.provider === "google") {
    res.redirect("/good");
  }

  res.render("pages/profile", {
    profile: "facebook",
    name: req.user.displayName,
    pic: req.user.photos[0].value,
    email: req.user.emails[0].value, // get the user out of session and pass to template
  });
});

// app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

// app.get('/auth/linkedin',
//     passport.authenticate('linkedin', {
//         scope : ['r_emailaddress', 'r_liteprofile']
//     }
// ));

// app.get('/auth/twitter',
//     passport.authenticate('twitter', {
//         scope : 'email'
//     }
// ));

// app.get('/facebook/callback',
// 	passport.authenticate('facebook', {
// 		successRedirect : '/profile',
//         failureRedirect : '/'
//     }
// ));

// app.get('/linkedin/callback',
//     passport.authenticate('linkedin', {
//         successRedirect: '/profile',
//         failureRedirect: '/'
//     }
// ));

// app.get('/twitter/callback',
//     passport.authenticate('linkedin', {
//         successRedirect: '/profile',
//         failureRedirect: '/'
//     }
// ));

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

app.listen(PORT, () => {
  console.log(`Server is up ${PORT}`);
});
