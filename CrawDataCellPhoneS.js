const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

// Function to fetch product data from the main page
async function fetchTiviData() {
    const browser = await puppeteer.launch({
        headless: true, // Set to 'false' to debug in a visible browser
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Intercept requests to block unnecessary resources like images, stylesheets, etc.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    const url = 'https://cellphones.com.vn/tivi.html'; // The URL you want to scrape
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

        // Continuously click the "Xem thêm" button until it disappears
        let isButtonVisible = true;
        while (isButtonVisible) {
            try {
                const button = await page.$('.cps-block-content_btn-showmore a.button.btn-show-more.button__show-more-product');
                if (button) {
                    await button.click();
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
                } else {
                    isButtonVisible = false;
                }
            } catch (error) {
                isButtonVisible = false;
            }
        }

        // Extract product data from the main page
        const tiviData = await page.evaluate(() => {
            const data = [];
            const products = document.querySelectorAll('.product-info-container');

            products.forEach((product) => {
                const name = product.querySelector('.product__name h3') ? product.querySelector('.product__name h3').textContent.trim() : 'No name available';
                const price = product.querySelector('.product__price--show') ? product.querySelector('.product__price--show').textContent.trim() : 'No price available';
                const oldPrice = product.querySelector('.product__price--through') ? product.querySelector('.product__price--through').textContent.trim() : 'No old price';
                const discountPercent = product.querySelector('.product__price--percent-detail') ? product.querySelector('.product__price--percent-detail').textContent.trim() : 'No discount';
                const link = product.querySelector('.product__link') ? product.querySelector('.product__link').href : 'No link available';

                data.push({ name, price, oldPrice, discountPercent, link });
            });

            return data;
        });

        await page.close();
        await browser.close();

        return tiviData;
    } catch (error) {
        console.error(`Failed to load page ${url}:`, error);
        await page.close();
        await browser.close();
        return [];
    }
}

// Function to save fetched data to Excel
async function saveTiviData() {
    const tiviData = await fetchTiviData();
    if (tiviData.length > 0) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tivi Data');

        // Set column headers
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Price', key: 'price', width: 15 },
            { header: 'Old Price', key: 'oldPrice', width: 15 },
            { header: 'Discount Percent', key: 'discountPercent', width: 15 },
            { header: 'Product Link', key: 'link', width: 50 }
        ];

        // Add data to worksheet
        tiviData.forEach(item => {
            worksheet.addRow(item);
        });

        // Write to Excel file
        await workbook.xlsx.writeFile('tivi_data_cellphones.xlsx');
        console.log('Data has been written to tivi_data_cellphones.xlsx');
    } else {
        console.log('No data found to write.');
    }
}

// Start the main product fetching process
saveTiviData();
