// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Sample route: PDF to JPG (requires imagemagick installed)
app.post('/convert/pdf-to-jpg', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = `output/${req.file.filename}-%d.jpg`;

    exec(`convert -density 150 ${inputPath} ${outputPath}`, (err) => {
        if (err) return res.status(500).send('Conversion failed.');
        res.download(outputPath.replace('%d', '0')); // only first page
    });
});

// Merge PDFs
app.post('/merge', upload.array('files'), async (req, res) => {
    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
        const pdfBytes = fs.readFileSync(file.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();
    const outPath = `output/merged_${Date.now()}.pdf`;
    fs.writeFileSync(outPath, mergedBytes);
    res.download(outPath);
});

// Add more routes (split, jpg-to-pdf, etc.) as needed...

app.listen(PORT, () => {
    console.log(`MYPDF server running on http://localhost:${PORT}`);
});
