// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

// السماح بالوصول من أي أصل (يمكنك تخصيص ذلك حسب الحاجة)
app.use(cors());

// نقطة نهاية لجلب ومعالجة البيانات
app.get('/fetch-tree/:id', async (req, res) => {
    const treeId = req.params.id;
    const url = `https://www.yfull.com/tree/${treeId}/`;

    try {
        // جلب صفحة HTML من YFull
        const response = await axios.get(url);
        const html = response.data;

        // تحميل HTML باستخدام cheerio
        const $ = cheerio.load(html);

        // مصفوفة لتخزين البيانات المستخرجة
        const data = [];

        // اختيار جميع عناصر <span> التي لها الصنف yf-age
        $('span.yf-age').each((index, element) => {
            const ageText = $(element).text().trim();

            // العثور على أقرب عنصر <li>
            const li = $(element).closest('li');

            // العثور على جميع عناصر <b> داخل هذا <li>
            const bElements = li.find('b');

            // استخراج النصوص من عناصر <b>
            const bData = [];
            bElements.each((i, bElem) => {
                bData.push($(bElem).text().trim());
            });

            // إضافة البيانات إلى المصفوفة
            data.push({
                age: ageText,
                bData: bData
            });
        });

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب البيانات.' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
