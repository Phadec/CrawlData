const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

// Function to fetch product data from the main page
async function fetchTiviData() {
    const browser = await puppeteer.launch({
        headless: false, // Chuyển về false để dễ dàng debug
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
        let tiviData = await page.evaluate(() => {
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

        // Limit the product list to a maximum of 10 products
        tiviData = tiviData.slice(0, 10);

        console.log(`Fetching additional details for ${tiviData.length} products...`);

        // Fetch additional product details for the limited number of products
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

        // Scroll down to load all content
        await autoScroll(page);
        console.log('Finished scrolling down to load all product details.');

        // Extract technical details from the product page
        const details = await page.evaluate(() => {
            const technicalDetails = {
                'Image Technology': '',
                'Processor': '',
                'Refresh Rate': '',
                'Speaker Power': '',
                'Internet Connection': '',
                'Wireless Connectivity': '',
                'USB Ports': '',
                'Video/Audio Input Ports': '',
                'Audio Output Ports': '',
                'Dimensions with Stand': '',
                'Dimensions without Stand': '',
                'Weight with Stand': '',
                'Weight without Stand': '',
                'Base Material': '',
                'Bezel Material': '',
                'Manufacturer': '',
                'Manufactured In': '',
                'Release Year': '',
            };

            const items = document.querySelectorAll('.technical-content-modal-item');

            items.forEach((item) => {
                const keyElement = item.querySelector('p');
                const valueElement = item.querySelector('div');
                const key = keyElement ? keyElement.textContent.trim() : null;
                let value = valueElement ? valueElement.innerHTML.trim().replace(/<br\s*\/?>/gi, ', ') : null;

                if (key && value) {
                    switch (key) {
                        case 'Công nghệ hình ảnh':
                            technicalDetails['Image Technology'] = value;
                            break;
                        case 'Chip xử lí':
                            technicalDetails['Processor'] = value;
                            break;
                        case 'Tần số quét':
                            technicalDetails['Refresh Rate'] = value;
                            break;
                        case 'Tổng công suất loa':
                            technicalDetails['Speaker Power'] = value;
                            break;
                        case 'Kết nối Internet':
                            technicalDetails['Internet Connection'] = value;
                            break;
                        case 'Kết nối không dây':
                            technicalDetails['Wireless Connectivity'] = value;
                            break;
                        case 'Cổng USB':
                            technicalDetails['USB Ports'] = value;
                            break;
                        case 'Cổng nhận hình ảnh, âm thanh':
                            technicalDetails['Video/Audio Input Ports'] = value;
                            break;
                        case 'Cổng xuất âm thanh':
                            technicalDetails['Audio Output Ports'] = value;
                            break;
                        case 'Kích thước có chân':
                            technicalDetails['Dimensions with Stand'] = value;
                            break;
                        case 'Kích thước không chân':
                            technicalDetails['Dimensions without Stand'] = value;
                            break;
                        case 'Khối lượng có chân':
                            technicalDetails['Weight with Stand'] = value;
                            break;
                        case 'Khối lượng không chân':
                            technicalDetails['Weight without Stand'] = value;
                            break;
                        case 'Thương hiệu':
                            technicalDetails['Manufacturer'] = value;
                            break;
                        case 'Chất liệu chân đế':
                            technicalDetails['Base Material'] = value;
                            break;
                        case 'Chất liệu viền tivi':
                            technicalDetails['Bezel Material'] = value;
                            break;
                        case 'Sản xuất tại':
                            technicalDetails['Manufactured In'] = value;
                            break;
                        case 'Năm ra mắt':
                            technicalDetails['Release Year'] = value;
                            break;
                    }
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

// Function to auto-scroll down the page
async function autoScroll(page) {
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
            { header: 'Price', key: 'price', width: 15 },
            { header: 'Old Price', key: 'oldPrice', width: 15 },
            { header: 'Discount Percent', key: 'discountPercent', width: 20 },
            { header: 'Product Link', key: 'link', width: 50 },
            { header: 'Image Technology', key: 'Image Technology', width: 30 },
            { header: 'Processor', key: 'Processor', width: 20 },
            { header: 'Refresh Rate', key: 'Refresh Rate', width: 15 },
            { header: 'Speaker Power', key: 'Speaker Power', width: 20 },
            { header: 'Internet Connection', key: 'Internet Connection', width: 20 },
            { header: 'Wireless Connectivity', key: 'Wireless Connectivity', width: 20 },
            { header: 'USB Ports', key: 'USB Ports', width: 20 },
            { header: 'Video/Audio Input Ports', key: 'Video/Audio Input Ports', width: 30 },
            { header: 'Audio Output Ports', key: 'Audio Output Ports', width: 30 },
            { header: 'Dimensions with Stand', key: 'Dimensions with Stand', width: 30 },
            { header: 'Dimensions without Stand', key: 'Dimensions without Stand', width: 30 },
            { header: 'Weight with Stand', key: 'Weight with Stand', width: 20 },
            { header: 'Weight without Stand', key: 'Weight without Stand', width: 20 },
            { header: 'Base Material', key: 'Base Material', width: 30 },
            { header: 'Bezel Material', key: 'Bezel Material', width: 30 },
            { header: 'Manufacturer', key: 'Manufacturer', width: 20 },
            { header: 'Manufactured In', key: 'Manufactured In', width: 20 },
            { header: 'Release Year', key: 'Release Year', width: 20 },
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
