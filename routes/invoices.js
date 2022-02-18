"use strict";

const express = require("express");

const db = require("../db");

const router = new express.Router();

const { NotFoundError } = require("../expressError");

/** Gets all invoices at root route. 
 * Returns JSON  {invoices: [{id, comp_code}, ...]}
 * */

router.get("/", async function (req, res) {

    const results = await db.query(
        `SELECT id, comp_code
        FROM invoices`
    )
    const invoices = results.rows;
    return res.json({ invoices });
})

router.get("/:id", async function (req, res) {
    const id = req.params.id

    const invoiceResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date
        FROM invoices
        WHERE id = $1`, [id]
    );

    if (!invoiceResults.rows[0]) {
        throw new NotFoundError("Invoice Not Found");
    }

    const companyResults = await db.query(
        `SELECT code, name, description
        FROM companies as c
        JOIN invoices as i
        ON i.comp_code = c.code
        WHERE i.id = $1`,
        [id]
    )

    const invoice = invoiceResults.rows[0];
    invoice.company = companyResults.rows[0];
    return res.json({ invoice });
})

router.post("/", async function (req, res) {
    const comp_code = req.body.comp_code;
    const amount = req.body.amt;
    let result;

    try {
        result = await db.query(
        `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING 
        id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amount]
        )
    } catch {
        return res.json({ error: "Invalid something" });
    }

    if (!result.rows[0]) {
        throw new NotFoundError("Company Not Found");
    }

    const invoice = result.rows[0];
    return res.json({ invoice });
})

module.exports = router;