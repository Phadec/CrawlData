const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

async function fetchTiviData() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    const url = `https://www.dienmayxanh.com/tivi`;
    try {
        console.log('Navigating to the main page...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

        let isButtonVisible = true;
        let clickCount = 0;

        while (isButtonVisible) {
            try {
                isButtonVisible = await page.evaluate(() => {
                    const button = document.querySelector('.view-more .see-more-btn');
                    return button && button.offsetParent !== null;
                });

                if (isButtonVisible) {
                    console.log(`Loading more products (click count: ${++clickCount})...`);
                    await page.click('.view-more .see-more-btn');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                    console.log('No more products to load. Proceeding with data extraction...');
                }
            } catch (error) {
                console.error('Error clicking the "Load More" button:', error);
                break;
            }
        }

        console.log('Extracting product data...');
        const tiviData = await page.evaluate(() => {
            const data = [];
            const products = document.querySelectorAll('.listproduct .item');

            products.forEach((product) => {
                const name = product.querySelector('h3') ? product.querySelector('h3').textContent.trim().replace(/\s\s+/g, ' ') : '';
                const price = product.querySelector('.price') ? product.querySelector('.price').textContent.trim() : '';
                const oldPrice = product.querySelector('.price-old') ? product.querySelector('.price-old').textContent.trim() : '';
                const discountPercent = product.querySelector('.percent') ? product.querySelector('.percent').textContent.trim() : '';
                const link = product.querySelector('a') ? product.querySelector('a').href : '';

                data.push({ name, price, oldPrice, discountPercent, link });
            });

            return data;
        });

        console.log(`Found ${tiviData.length} products. Fetching detailed information for each product...`);

        // Loop through each product and fetch detailed information
        for (let i = 0; i < tiviData.length; i++) {
            const product = tiviData[i];
            console.log(`Processing product ${i + 1}/${tiviData.length}: ${product.name}`);
            if (product.link) {
                const details = await fetchProductDetails(browser, product.link);
                tiviData[i] = { ...product, ...details };
            }
        }

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

// Function to fetch additional details from a product's page
async function fetchProductDetails(browser, productLink) {
    const page = await browser.newPage();
    try {
        console.log(`Navigating to product page: ${productLink}`);
        await page.goto(productLink, { waitUntil: 'networkidle2', timeout: 120000 });

        // Extract additional technical details
        const details = await page.evaluate(() => {
            const technicalDetails = {};
            const items = document.querySelectorAll('.text-specifi li');

            items.forEach((item) => {
                const keyElement = item.querySelector('aside strong');
                const valueElement = item.querySelector('aside span') || item.querySelector('aside a');

                const key = keyElement ? keyElement.textContent.trim().replace(':', '') : null;
                const value = valueElement ? valueElement.textContent.trim() : null;

                if (key && value) {
                    technicalDetails[key] = value;
                }
            });

            return technicalDetails;
        });

        await page.close();
        return details;
    } catch (error) {
        console.error(`Failed to load product page ${productLink}:`, error);
        await page.close();
        return {};
    }
}

async function saveToExcel(tiviData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('TV Data');

    // Set column headers
    worksheet.columns = [
        { header: 'Name', key: 'name', width: 50 },
        { header: 'Price', key: 'price', width: 50 },
        { header: 'Old Price', key: 'oldPrice', width: 50 },
        { header: 'Discount Percent', key: 'discountPercent', width: 50 },
        { header: 'Product Link', key: 'link', width: 50 },
        { header: 'TV Type', key: 'Loại Tivi', width: 50 },
        { header: 'Screen Size', key: 'Kích cỡ màn hình', width: 50 },
        { header: 'Resolution', key: 'Độ phân giải', width: 50 },
        { header: 'Screen Type', key: 'Loại màn hình', width: 50 },
        { header: 'Operating System', key: 'Hệ điều hành', width: 50 },
        { header: 'Stand Material', key: 'Chất liệu chân đế', width: 50 },
        { header: 'Frame Material', key: 'Chất liệu viền tivi', width: 50 },
        { header: 'Manufactured In', key: 'Nơi sản xuất', width: 50 },
        { header: 'Release Year', key: 'Năm ra mắt', width: 50 }
    ];

    console.log('Adding products to the Excel sheet...');
    tiviData.forEach((item, index) => {
        console.log(`Adding product ${index + 1} to the Excel sheet: ${item.name}`);
        worksheet.addRow(item);
    });

    const fileName = 'tivi_data_dienmayxanh.xlsx';
    await workbook.xlsx.writeFile(fileName);
    console.log(`The Excel file was written successfully as ${fileName}`);
}

async function crawlTiviData() {
    console.log('Fetching data...');

    const tiviData = await fetchTiviData();

    if (tiviData.length > 0) {
        console.log(`Fetched ${tiviData.length} products. Saving to Excel...`);
        await saveToExcel(tiviData);
    } else {
        console.log('No data found.');
    }
}

crawlTiviData();
