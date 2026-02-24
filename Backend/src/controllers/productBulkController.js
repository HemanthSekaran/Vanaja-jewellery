/**
 * Product Bulk Upload Controller
 *
 * Admin endpoints:
 *   GET  /api/products/bulk/template  – Download an Excel (.xlsx) template.
 *                                       The "jewel_type" column has a live dropdown
 *                                       populated from the wastage table.
 *   POST /api/products/bulk/upload    – Upload the filled-in Excel sheet to bulk-insert
 *                                       products into the database.
 *
 * Excel column layout (Products sheet):
 *   name | jewel_type | metal | metal_purity | weight | description |
 *   availability | top_selling | featured | image
 *
 * jewel_type  – choose from the dropdown; resolved automatically to waste_id on upload.
 *
 * image       – filename(s) that have already been placed in uploads/products/ manually.
 *               For multiple images separate with a comma:
 *               e.g.  ring_front.jpg, ring_back.jpg, ring_side.jpg
 */

const XLSX    = require('xlsx');          // used for READING uploaded files
const ExcelJS = require('exceljs');       // used for WRITING the template (supports dropdowns)
const { query }      = require('../config/database');
const { sendSuccess }= require('../utils/helpers');
const { AppError }   = require('../middleware/errorHandler');
const logger         = require('../utils/logger');

/* ─────────────────── Template builder (ExcelJS) ─────────────────────── */

const buildTemplateBuffer = async () => {
    // Fetch live jewel types from DB
    const wastageRows = await query('SELECT waste_id, jewel_type, wastage FROM wastage ORDER BY jewel_type');
    const jewel_types  = wastageRows.map(r => r.jewel_type);

    const wb = new ExcelJS.Workbook();
    wb.creator  = 'Vanaja Jewellery Admin';
    wb.created  = new Date();

    /* ══════════ Sheet 1: Products ══════════ */
    const ws = wb.addWorksheet('Products', { views: [{ freezeRow: 1 }] });

    // Define columns (sets header + width)
    ws.columns = [
        { header: 'name',         key: 'name',         width: 32 },
        { header: 'jewel_type',   key: 'jewel_type',   width: 22 },
        { header: 'metal',        key: 'metal',        width: 18 },
        { header: 'metal_purity', key: 'metal_purity', width: 18 },
        { header: 'weight',       key: 'weight',       width: 12 },
        { header: 'description',  key: 'description',  width: 46 },
        { header: 'availability', key: 'availability', width: 14 },
        { header: 'top_selling',  key: 'top_selling',  width: 14 },
        { header: 'featured',     key: 'featured',     width: 14 },
        { header: 'image',        key: 'image',        width: 52 },
    ];

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB8860B' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height    = 20;

    // Sample / example row
    ws.addRow({
        name:         'Gold Chain',
        jewel_type:   jewel_types[0] || 'Chains',
        metal:        'gold',
        metal_purity: '22k',
        weight:       10.5,
        description:  'Handcrafted 22k gold chain',
        availability: 'YES',
        top_selling:  'FALSE',
        featured:     'FALSE',
        image:        'gold_chain_front.jpg, gold_chain_side.jpg',  // comma-separated demo
    });

    /* ── Data validations ── */
    const LAST_ROW = 10000;  // validate up to row 10000

    // jewel_type dropdown (B column) – populate from DB
    if (jewel_types.length > 0) {
        const formulae = ['"' + jewel_types.join(',') + '"'];
        ws.dataValidations.add(`B2:B${LAST_ROW}`, {
            type:             'list',
            allowBlank:       true,
            formulae,
            showErrorMessage: true,
            errorStyle:       'error',
            errorTitle:       'Invalid Jewel Type',
            error:            `Please select from the dropdown. Valid values: ${jewel_types.join(', ')}`,
        });
    }

    // availability dropdown (G column)
    ws.dataValidations.add(`G2:G${LAST_ROW}`, {
        type:             'list',
        allowBlank:       true,
        formulae:         ['"YES,NO"'],
        showErrorMessage: true,
        errorStyle:       'error',
        errorTitle:       'Invalid Value',
        error:            'Please select YES or NO',
    });

    // top_selling dropdown (H column)
    ws.dataValidations.add(`H2:H${LAST_ROW}`, {
        type:             'list',
        allowBlank:       true,
        formulae:         ['"TRUE,FALSE"'],
        showErrorMessage: true,
        errorStyle:       'error',
        errorTitle:       'Invalid Value',
        error:            'Please select TRUE or FALSE',
    });

    // featured dropdown (I column)
    ws.dataValidations.add(`I2:I${LAST_ROW}`, {
        type:             'list',
        allowBlank:       true,
        formulae:         ['"TRUE,FALSE"'],
        showErrorMessage: true,
        errorStyle:       'error',
        errorTitle:       'Invalid Value',
        error:            'Please select TRUE or FALSE',
    });

    /* ══════════ Sheet 2: Wastage Reference ══════════ */
    const wsRef = wb.addWorksheet('Wastage Reference');
    wsRef.columns = [
        { header: 'waste_id',  key: 'waste_id',  width: 12 },
        { header: 'jewel_type',key: 'jewel_type', width: 22 },
        { header: 'wastage_%', key: 'wastage',    width: 14 },
    ];
    const refHeader = wsRef.getRow(1);
    refHeader.font = { bold: true };
    refHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4F8' } };

    wastageRows.forEach(r => {
        wsRef.addRow({ waste_id: r.waste_id, jewel_type: r.jewel_type, wastage: r.wastage || '' });
    });

    // Protect reference sheet from editing (read-only hint)
    wsRef.state = 'visible';

    /* ══════════ Sheet 3: Instructions ══════════ */
    const wsInstr = wb.addWorksheet('Instructions');
    wsInstr.columns = [
        { header: 'Column',    key: 'col',  width: 18 },
        { header: 'Required',  key: 'req',  width: 10 },
        { header: 'Description', key: 'desc', width: 65 },
    ];
    const instrHeader = wsInstr.getRow(1);
    instrHeader.font = { bold: true };
    instrHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4F8' } };

    const instrRows = [
        { col: 'name',         req: 'Yes', desc: 'Product name (2–255 characters).' },
        { col: 'jewel_type',   req: 'Yes', desc: 'Select from the dropdown in the Products sheet. Auto-maps to waste_id.' },
        { col: 'metal',        req: 'No',  desc: 'Metal type. e.g. gold, silver, platinum.' },
        { col: 'metal_purity', req: 'No',  desc: 'Purity of metal. e.g. 22k, 18k, 925.' },
        { col: 'weight',       req: 'Yes', desc: 'Product weight in grams (positive number, e.g. 5.75).' },
        { col: 'description',  req: 'No',  desc: 'Product description (max 2000 characters).' },
        { col: 'availability', req: 'No',  desc: 'YES or NO  (default: YES).' },
        { col: 'top_selling',  req: 'No',  desc: 'TRUE or FALSE  (default: FALSE).' },
        { col: 'featured',     req: 'No',  desc: 'TRUE or FALSE  (default: FALSE).' },
        { col: 'image',        req: 'No',  desc: 'Comma-separated image filenames already placed in uploads/products/ folder.' },
        { col: '',             req: '',    desc: '' },
        { col: 'IMAGES NOTE',  req: '',    desc: 'Multiple images: ring_front.jpg, ring_back.jpg, ring_side.jpg' },
        { col: 'IMPORTANT',    req: '',    desc: 'Do NOT rename, reorder, or delete column headers in the Products sheet.' },
    ];
    instrRows.forEach(r => wsInstr.addRow(r));

    return wb.xlsx.writeBuffer();
};

/* ─────────────────── Cell value helpers ─────────────────────────────── */

const cellStr  = (v) => (v !== undefined && v !== null) ? String(v).trim() : '';
const cellBool = (v) => {
    if (v === undefined || v === null) return false;
    const s = String(v).trim().toUpperCase();
    return s === 'TRUE' || s === '1' || s === 'YES';
};
const cellNum  = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
};

/* ═══════════════════════════════════════════════════════════════════════
   Controller: GET /api/products/bulk/template
   ═════════════════════════════════════════════════════════════════════ */
const downloadTemplate = async (req, res, next) => {
    try {
        const buffer = await buildTemplateBuffer();
        res.setHeader('Content-Disposition', 'attachment; filename="product_upload_template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        logger.error('Download template error:', error);
        next(error);
    }
};

/* ═══════════════════════════════════════════════════════════════════════
   Controller: POST /api/products/bulk/upload
   ═════════════════════════════════════════════════════════════════════ */
const uploadProductsFromExcel = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload an Excel file (.xlsx or .xls)', 400));
        }

        // Parse workbook (SheetJS is lighter for reading)
        let wb;
        try {
            wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        } catch {
            return next(new AppError('Unable to parse the uploaded file. Please use the provided template.', 400));
        }

        const ws   = wb.Sheets[wb.SheetNames[0]];   // first sheet = Products
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows || rows.length === 0) {
            return next(new AppError('The uploaded Excel file has no data rows.', 400));
        }

        // Check required headers
        const firstRow       = rows[0];
        const requiredHeaders = ['name', 'jewel_type', 'weight'];
        const missingHeaders  = requiredHeaders.filter(h => !(h in firstRow));
        if (missingHeaders.length > 0) {
            return next(new AppError(
                `Missing required column(s): ${missingHeaders.join(', ')}. Please use the provided template.`,
                400
            ));
        }

        // Pre-fetch jewel_type → waste_id map (one DB call for all rows)
        const wastageRows   = await query('SELECT waste_id, jewel_type FROM wastage');
        const jewel_typeMap = {};
        wastageRows.forEach(r => {
            jewel_typeMap[r.jewel_type.trim().toLowerCase()] = r.waste_id;
        });

        /* ── Process rows ── */
        const results = { inserted: [], errors: [] };

        for (let i = 0; i < rows.length; i++) {
            const row    = rows[i];
            const rowNum = i + 2;   // +2: row 1 = header, array is 0-indexed

            try {
                /* name */
                const name = cellStr(row.name);
                if (!name || name.length < 2 || name.length > 255) {
                    results.errors.push({ row: rowNum, error: '"name" is required and must be 2–255 characters.' });
                    continue;
                }

                /* jewel_type → waste_id */
                const jewel_type_raw = cellStr(row.jewel_type);
                if (!jewel_type_raw) {
                    results.errors.push({ row: rowNum, error: '"jewel_type" is required.' });
                    continue;
                }
                const waste_id = jewel_typeMap[jewel_type_raw.toLowerCase()];
                if (!waste_id) {
                    results.errors.push({
                        row:   rowNum,
                        error: `"jewel_type" value "${jewel_type_raw}" not found. Valid values: ${Object.keys(jewel_typeMap).join(', ')}.`,
                    });
                    continue;
                }

                /* weight */
                const weight = cellNum(row.weight);
                if (weight === null || weight <= 0) {
                    results.errors.push({ row: rowNum, error: '"weight" must be a positive number.' });
                    continue;
                }

                /* optional fields */
                const metal        = cellStr(row.metal)        || null;
                const metal_purity = cellStr(row.metal_purity) || null;
                const description  = cellStr(row.description)  || null;

                const availRaw     = cellStr(row.availability).toUpperCase();
                const availability = ['YES', 'NO'].includes(availRaw) ? availRaw : 'YES';

                const top_selling = cellBool(row.top_selling) ? 1 : 0;
                const featured    = cellBool(row.featured)    ? 1 : 0;

                /* image – comma-separated filenames → JSON array */
                const imageRaw = cellStr(row.image);
                let imageJson  = null;
                if (imageRaw) {
                    const imageArr = imageRaw
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                    imageJson = imageArr.length ? JSON.stringify(imageArr) : null;
                }

                /* Insert */
                const result = await query(
                    `INSERT INTO products
                        (name, waste_id, metal, metal_purity, weight, description,
                         availability, top_selling, featured, image)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [name, waste_id, metal, metal_purity, weight, description,
                     availability, top_selling, featured, imageJson]
                );

                results.inserted.push({ row: rowNum, id: result.insertId, name, jewel_type: jewel_type_raw });

            } catch (rowErr) {
                logger.error(`Bulk upload row ${rowNum} error:`, rowErr);
                results.errors.push({ row: rowNum, error: rowErr.message || 'Unexpected error.' });
            }
        }

        logger.info(
            `Bulk product upload by admin ${req.user.email}: ` +
            `${results.inserted.length} inserted, ${results.errors.length} errors`
        );

        return sendSuccess(
            res,
            {
                summary: {
                    total:    rows.length,
                    inserted: results.inserted.length,
                    failed:   results.errors.length,
                },
                inserted: results.inserted,
                errors:   results.errors,
            },
            `Bulk upload complete: ${results.inserted.length} product(s) inserted, ${results.errors.length} failed.`,
            results.errors.length === 0 ? 201 : 207
        );

    } catch (error) {
        logger.error('Bulk upload error:', error);
        next(error);
    }
};

module.exports = {
    downloadTemplate,
    uploadProductsFromExcel,
};
