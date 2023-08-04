const express = require("express");
const router = express.Router();
const User = require("../models/User");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid = require("uid2");

// ROUTE SIGNUP //
router.post("/user/signup", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      res
        .status(400)
        .json({ message: "Email already exist ! Use your account 😊 " });
    } else if (!req.body.username) {
      res.status(400).json({ message: "you forgot your username 😵 " });
    } else {
      // console.log("log req.body ==> ", req.body);
      const salt = uid(16);
      const token = uid(16);
      const saltedPassword = req.body.password + salt;
      const hash = SHA256(saltedPassword).toString(encBase64);
      // console.log("hash ==>", hash); // ==> p2CnT5qjcAhzL/Wp32jSyWmqN4yzpstmjXT6bDvGLKk=
      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
          // avatar: Object, // nous verrons plus tard comment uploader une image
        },
        newsletter: req.body.newsletter,
        token: token,
        hash: hash,
        salt: salt,
      });
      // console.log(newUser);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        token: newUser.token,
        account: newUser.account,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ROUTE LOGIN //

router.post("/user/login", async (req, res) => {
  try {
    console.log("log req.body ==> ", req.body);
    //  { account: { username: 'JohnDoe' },
    const foundUser = await User.findOne({ email: req.body.email });
    console.log("foundUser ==> ", foundUser);
    //   _id: new ObjectId("64c901b3ab2680d5b01ddc3c"),
    //   email: 'johndoe@lereacteur.io',
    //   newsletter: true,
    //   token: '7aEKXM4xcMZfoQfH',
    //   hash: '8OE6zXaOMhopHeo1dM/iazhiiloQs9mPPjnklh4oJts=',
    //   salt: '3EUns-EPq-chFAJc',
    //   __v: 0 }
    //
    //COMPARAISON DU MOT DE PASSE :
    //Ajout du salt au password reçu
    const comparePassword = req.body.password + foundUser.salt;
    const hash = SHA256(comparePassword).toString(encBase64);
    // si le password entrer est égale alors retourner id, token et username
    if (hash === foundUser.hash) {
      res.status(201).json({
        _id: foundUser.id,
        token: foundUser.token,
        account: foundUser.account,
      });
    } else {
      res.status(400).json(" Une erreur est survenue");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
