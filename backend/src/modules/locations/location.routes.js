const express = require("express");

const {
  getMeta,
  resolveCityHandler,
  searchCitiesHandler,
} = require("./location.controller");

function createLocationsRouter() {
  const router = express.Router();

  router.get("/meta", getMeta);
  router.get("/cities", searchCitiesHandler);
  router.get("/cities/resolve", resolveCityHandler);

  return router;
}

module.exports = { createLocationsRouter };
