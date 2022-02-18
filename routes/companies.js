"use strict";

const express = require("express");

const db = require("../db");

const router = new express.Router();

const { NotFoundError } = require("../expressError");

/** Gets all copmanies at root route. 
 * Returns JSON  {companies: [{code, name}, ...]}
 * */

router.get("/", async function (req, res) {

    const results = await db.query(
        `SELECT code, name
        FROM companies`
    )
    const companies = results.rows;
    return res.json({ companies });
})

/** Get specific company by company code
 * Returns JSON {company: {code, name, description, invoices: [id, ...]}}
 * or 404 Error
 */

router.get("/:code", async function (req, res) {
    const code = req.params.code

    const results = await db.query(
        `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [code]
    );

    if (!results.rows[0]) {
        throw new NotFoundError("Company Not Found");
    }

    const invoiceResults = await db.query(
        `SELECT id, comp_code, amt, paid, add_date, paid_date
        FROM invoices AS i
        JOIN companies AS c
        ON i.comp_code = c.code
        WHERE i.comp_code = $1`, [code]
    )

    const invoice = invoiceResults.rows;
    const company = results.rows[0];
    company.invoices = invoice.map(i => i.id);
    return res.json({ company });
})

/** Adds new company to database
 * Receives JSON {name: xyz, description: xyz}
 * Returns JSON {company: {code, name, description}}
 * or 404 Error
 */

router.post("/", async function (req, res) {
    const code = req.body.code;
    const name = req.body.name;
    const desc = req.body.description;
    let results;

    try {
        results = await db.query(
            `INSERT INTO companies 
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, desc]
        );
    } catch (error) {
        return res.json({ error: `${code} already exists.` });
    }

    if (!results.rows[0]) {
        throw new NotFoundError("Company Not Found");
    }

    const company = results.rows[0];
    return res.json({ company });
})

/** Replaces (PUT) company info by company code
 * Receives JSON {name: xyz, description: xyz} and query parameter
 * Returns JSON {company: {code, name, description}}
 * or 404 Error
 */

router.put("/:code", async function (req, res) {
    const name = req.body.name;
    const desc = req.body.description;
    const code = req.params.code;

    const results = await db.query(
        `UPDATE companies
        SET name=$1, description=$2
        WHERE code=$3
        RETURNING code, name, description`,
        [name, desc, code]
    )

    const company = results.rows[0]

    if (!company) {
        throw new NotFoundError("Company Not Found");
    }

    return res.json({ company });

});

/** Deletes company by company code
 * Recieves company code in query parameter
 * Returns JSON {status: "deleted"}
 * or 404 Error
 */

router.delete("/:code", async function (req, res) {
    const code = req.params.code;

    const results = await db.query(
        `DELETE FROM companies
        WHERE code=$1
        RETURNING name`,
        [code]
    )

    if (!results.rows[0]) {
        throw new NotFoundError("Company Not Found - DELETE");
    }

    return res.json({ status: "deleted" })
})

module.exports = router;