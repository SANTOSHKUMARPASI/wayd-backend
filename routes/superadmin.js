const SuperAdmin = require("../models/superadmin");
const express = require("express");
const user = require("../models/user");

const router = express.Router();

router.post("/superadmin/register", (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    if (username === "" || password === "" || email === "" || phone === "") {
      return res
        .status(400)
        .json({ message: "Username, password, email and phone is required" });
    }

    var regexEmail = /\S+@\S+\.\S+/;
    if (email) {
      if (!regexEmail.test(email)) {
        return res.status(400).json({
          error: "email is invalid",
        });
      }
    }

    // user registration check if username already exists
    console.log(username);
    console.log(req.body);

    SuperAdmin.findOne({ email: email }).then((user) => {
      if (user) {
        res.status(401).json({ message: "User already exists" });
        // console.log(user);
      } else {
        const superadmin = new SuperAdmin({
          username: username,
          email: email,
          password: password,
          phone: phone,
        });
        superadmin.save((err, user) => {
          if (err) {
            return res
              .status(400)
              .json({ message: "Not Able to Save in Database" });
          }
        });
        res.status(200).json(superadmin);
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
});

// login superadmin

router.post("/superadmin/login", async (req, res) => {
  const { email, password } = req.body;
  SuperAdmin.findOne({ email: email }).exec((err, user) => {
    const { username, phone, email } = user;
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    var regexEmail = /\S+@\S+\.\S+/;
    if (email) {
      if (!regexEmail.test(email)) {
        return res.status(400).json({
          error: "email is invalid",
        });
      }
    }
    if (!user) {
      return res.status(404).send({
        message: "User Not found.",
      });
    }

    res.status(200).send(user);
  });
});

module.exports = router;
