const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

// Function to fetch product data from the main page
async function fetchTiviData() {
    const browser = await puppeteer.launch({
        headless: true,
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
        console.log('Navigating to the main page...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

        console.log('Clicking "Load More" button until all products are loaded...');
        let isButtonVisible = true;

        while (isButtonVisible) {
            try {
                const button = await page.$('.cps-block-content_btn-showmore a.button.btn-show-more.button__show-more-product');
                if (button) {
                    console.log('Loading more products...');
                    await button.click();
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds for new products to load
                } else {
                    console.log('No more products to load. Moving on to data extraction...');
                    isButtonVisible = false;
                }
            } catch (error) {
                console.error('Error clicking the "Load More" button:', error);
                isButtonVisible = false;
            }
        }

        console.log('Extracting product data...');
        const tiviData = await page.evaluate(() => {
            const data = [];
            const products = document.querySelectorAll('.product-info-container');

            products.forEach((product, index) => {
                const name = product.querySelector('.product__name h3') ? product.querySelector('.product__name h3').textContent.trim() : 'No name available';
                const price = product.querySelector('.product__price--show') ? product.querySelector('.product__price--show').textContent.trim() : 'No price available';
                const oldPrice = product.querySelector('.product__price--through') ? product.querySelector('.product__price--through').textContent.trim() : 'No old price';
                const discountPercent = product.querySelector('.product__price--percent-detail') ? product.querySelector('.product__price--percent-detail').textContent.trim() : 'No discount';
                const link = product.querySelector('.product__link') ? product.querySelector('.product__link').href : 'No link available';

                console.log(`Extracted product ${index + 1}: ${name}`);
                data.push({ name, price, oldPrice, discountPercent, link });
            });

            return data;
        });

        console.log(`Extracted ${tiviData.length} products successfully.`);

        // Fetch additional product details for all products
        for (let i = 0; i < tiviData.length; i++) {
            console.log(`Fetching details for product ${i + 1}/${tiviData.length}: ${tiviData[i].name}`);
            const details = await fetchProductDetails(browser, tiviData[i].link);
            tiviData[i] = { ...tiviData[i], ...details };
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
    if (!productLink) return {};

    const page = await browser.newPage();
    try {
        console.log(`Navigating to product page: ${productLink}`);
        await page.goto(productLink, { waitUntil: 'networkidle2', timeout: 120000 });

        // Function to scroll down and wait for new content to load
        const autoScroll = async () => {
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 100; // Distance to scroll each step
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
        };

        // Scroll down to load all content
        await autoScroll();
        console.log('Finished scrolling down to load all product details.');

        // Wait for the main technical details section to be available before extracting data
        await page.waitForSelector('.technical-content', { timeout: 60000 }); // Wait up to 60 seconds for the selector

        // Extract technical details from the product page
        const details = await page.evaluate(() => {
            const technicalDetails = {};
            const items = document.querySelectorAll('.technical-content-item');

            items.forEach((item) => {
                const key = item.querySelector('p') ? item.querySelector('p').textContent.trim() : null;
                const valueElement = item.querySelector('div');
                let value = valueElement ? valueElement.innerHTML.trim() : null;

                // Replace <br> tags with commas for better readability
                if (value) {
                    value = value.replace(/<br\s*\/?>/gi, ', ');
                }

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

// Function to save fetched data to Excel
async function saveTiviData() {
    console.log('Starting the product data fetching process...');
    const tiviData = await fetchTiviData();
    if (tiviData.length > 0) {
        console.log('Preparing to write data to Excel...');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('TV Data');

        // Set column headers
        worksheet.columns = [
            { header: 'Name', key: 'name', width: 50 },
            { header: 'Price', key: 'price', width: 50 },
            { header: 'Old Price', key: 'oldPrice', width: 50 },
            { header: 'Discount Percent', key: 'discountPercent', width: 50 },
            { header: 'Product Link', key: 'link', width: 50 },
            { header: 'Screen Size', key: 'Kích cỡ màn hình', width: 50 },
            { header: 'Image Technology', key: 'Công nghệ hình ảnh', width: 50 },
            { header: 'Resolution', key: 'Độ phân giải', width: 50 },
            { header: 'Screen Type', key: 'Loại màn hình', width: 50 },
            { header: 'Refresh Rate', key: 'Tần số quét', width: 50 },
            { header: 'Sound Technology', key: 'Công nghệ âm thanh', width: 50 },
            { header: 'Operating System', key: 'Hệ điều hành', width: 50 },
            { header: 'Features', key: 'Tiện ích nổi bật', width: 50 },
            { header: 'Brand', key: 'Thương hiệu', width: 50 },
            { header: 'Manufactured In', key: 'Sản xuất tại', width: 50 },
            { header: 'Release Year', key: 'Năm ra mắt', width: 50 },
        ];

        // Add data to worksheet
        tiviData.forEach((item, index) => {
            console.log(`Adding product ${index + 1} to the Excel sheet: ${item.name}`);
            worksheet.addRow(item);
        });

        // Write to Excel file
        const fileName = 'tivi_data_cellphones.xlsx';
        await workbook.xlsx.writeFile(fileName);
        console.log(`Data has been written to ${fileName}`);
    } else {
        console.log('No data found to write.');
    }
}

// Start the main product fetching process
saveTiviData();
