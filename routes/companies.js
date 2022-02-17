"use strict";

const express = require("express");

const db = require("../db");

const router = new express.Router();

const { NotFoundError } = require("../expressError");

router.get("/", async function (req, res){

    const results = await db.query(
        `SELECT code, name
        FROM companies`
    )
    const companies = results.rows;
    return res.json({ companies });
})

router.get("/:code", async function (req, res){
    const code = req.params.code

    const results = await db.query(
        `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [code]
    );

    if (!results.rows[0]) {
        throw new NotFoundError("Company Not Found");
    }

    const company = results.rows[0];
    return res.json({ company });
})

router.post("/", async function (req, res){
    const code = req.body.code;
    const name = req.body.name;
    const desc = req.body.description;

    try{const results = await db.query(
        `INSERT INTO companies 
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
        [code, name, desc]
    );} catch(error) {
        console.log(error);
        return res.json({ error: `${code} already exists.`})
    }
    

    if (!results.rows[0]) {
        throw new NotFoundError("Company Not Found");
    }

    const company = results.rows[0];
    return res.json({ company });
})

module.exports = router;