const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const User = require("../models/User");
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middelwares/isAuthenticated");
const { Query } = require("mongoose");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offers/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      ///UPLOAD DE L'IMAGE ///
      // ------------------//
      // console.log(req.files.pictures);
      const pictureToUpload = req.files.pictures;
      // On envoie à Cloudinary un buffer converti en base64
      // ----------
      // LIGNE EN DESSOUS PERMET DE SAUVEGARDER DANS CLOUDINARY
      const result = await cloudinary.uploader.upload(
        convertToBase64(pictureToUpload)
      );
      // ----------
      // console.log("result => ", result);
      // secure_url: "https://res.cloudinary.com/dkhieqkin/image/upload/v1690983963/jfz2gftll7ueiydue2jk.jpg";

      // CREATION DE L'OFFRE
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      //   console.log(" log req.body => ", req.body);
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [{ condition, city, brand, size, color }],
        product_image: {
          secure_url: result.secure_url,
        },
        owner: req.user,
      });
      // console.log("newOffer ==> ", newOffer);
      await newOffer.save();

      const responseObject = {
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_description,
        product_details: newOffer.product_details,
        product_image: newOffer.product_image,
        owner: req.user,
      };
      // console.log(responseObject);
      return res.status(201).json(responseObject);
    } catch (error) {
      res.status(400).json(error.message);
    }
  }
);
//-------------
// ROUTE AVEC FILTRES

// Afficher la première page d'offres/ 4 articles sur la première page
router.get("/offers", async (req, res) => {
  try {
    // Création d'un objet dans lequel on va sotcker nos différents filtres
    let filters = {};

    // Si on reçoit un query title
    if (req.query.title) {
      // On rajoute une clef product_name contenant une RegExp créée à partir du query title
      filters.product_name = new RegExp(req.query.title, "i");
    }
    // Si on reçoit un query priceMin
    if (req.query.priceMin) {
      // On rajoute une clef à filter contenant { $gte: req.query.priceMin }
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    }
    // Si on reçoit un query priceMax
    if (req.query.priceMax) {
      // Si on a aussi reçu un query priceMin
      if (filters.product_price) {
        // On rajoute une clef $lte contenant le query en question
        filters.product_price.$lte = req.query.priceMax;
      } else {
        // Sinon on fait comme avec le query priceMax
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }
    // // Création d'un objet sort qui servira à gérer le tri
    let sort = {};
    // Si on reçoit un query sort === "price-desc"
    if (req.query.sort === "price-desc") {
      // On réassigne cette valeur à sort
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      // Si la valeur du query est "price-asc" on réassigne cette autre valeur
      sort = { product_price: 1 };
    }
    // // Création de la variable page qui vaut, pour l'instant, undefined
    let page;
    // Si le query page n'est pas un nombre >= à 1
    if (Number(req.query.page) < 1) {
      // page sera par défaut à 1
      page = 1;
    } else {
      // Sinon page sera égal au query reçu
      page = Number(req.query.page);
    }
    // La variable limit sera égale au query limit reçu
    let limit = Number(req.query.limit);
    // // On va chercher les offres correspondant aux query de filtre reçus grâce à filters, sort et limit. On populate la clef owner en n'affichant que sa clef account
    const offers = await Offer.find(filters)
      .sort(sort)
      .skip((page - 1) * limit) // ignorer les x résultats
      .limit(limit); // renvoyer y résultats

    // // cette ligne va nous retourner le nombre d'annonces trouvées en fonction des filtres
    const count = await Offer.countDocuments(filters).populate();

    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    console.log("----> ", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
