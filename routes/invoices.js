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

/** Gets invoice by ID
* Returns JSON {invoice: {id, amt, paid, add_date, paid_date, 
* company: {code, name, description}} 
* given invoice ID in query parameter
*/

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

/** Creates new invoice with company code and amount
* Returns JSON {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
* given JSON body of: {comp_code, amt}
*/

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

    // Update to Invoice instead of Company
    if (!result.rows[0]) {
        throw new NotFoundError("Company Not Found");
    }

    const invoice = result.rows[0];
    return res.json({ invoice });
})

/** Updates existing invoice amount with invoice ID
* Returns JSON {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
* given JSON body of {amt} and ID from query parameter 
*/

router.put("/:id", async function (req, res) {
    const invoiceID = req.params.id;
    const amount = req.body.amt;
    let result;

    try {result = await db.query(
        `UPDATE invoices
        SET amt = $1
        WHERE id = $2
        RETURNING
        id, comp_code, amt, paid, add_date, paid_date`,
        [amount, invoiceID])
    } catch {
        return res.json({ error: "Invalid something" });
    };

    if (!result.rows[0]) {
        throw new NotFoundError("Invoice Not Found");
    }

    const invoice = result.rows[0];
    return res.json({ invoice });
})

/** Deletes invoice with invoice ID
* Returns JSON {status: "deleted"} upon deletion of
* invoice from database given ID from query parameter
*/

router.delete("/:id", async function (req, res) {
    const invoiceID = req.params.id;

    const results = await db.query(
        `DELETE FROM invoices
        WHERE id = $1
        RETURNING comp_code`,
        [invoiceID]
    )

    if (!results.rows[0]) {
        throw new NotFoundError(`Invoice: ${invoiceID} not found`); 
    }

    return res.json({status: "deleted"});
})

module.exports = router;