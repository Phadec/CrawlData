const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// CSV writer setup for file 'tivi_data_cellphones.csv'
const csvWriter = createCsvWriter({
    path: 'tivi_data_cellphones.csv',
    header: [
        { id: 'name', title: 'Name' },
        { id: 'price', title: 'Price' },
        { id: 'oldPrice', title: 'Old Price' },
        { id: 'discountPercent', title: 'Discount Percent' },
        { id: 'link', title: 'Product Link' }
    ]
});

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
                // Check if the "Xem thêm" button is still visible
                const button = await page.$('.cps-block-content_btn-showmore a.button.btn-show-more.button__show-more-product');

                if (button) {
                    await button.click();

                    // Reduce wait time for faster execution
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Reduced wait time to 5 seconds

                    // Check again if the button still exists
                    const buttonStillExists = await page.$('.cps-block-content_btn-showmore a.button.btn-show-more.button__show-more-product');
                    if (!buttonStillExists) {
                        isButtonVisible = false;
                    }
                } else {
                    isButtonVisible = false;
                }

            } catch (error) {
                isButtonVisible = false;
            }
        }

    } catch (error) {
        console.error(`Failed to load page ${url}:`, error);
        await page.close();
        await browser.close();
        return [];
    }

    // Extract product data from the page after all products are loaded
    const tiviData = await page.evaluate(() => {
        const data = [];
        const products = document.querySelectorAll('.product-info-container'); // Ensure the correct selector

        products.forEach((product) => {
            const name = product.querySelector('.product__name h3') ? product.querySelector('.product__name h3').textContent.trim() : 'No name available';
            const price = product.querySelector('.product__price--show') ? product.querySelector('.product__price--show').textContent.trim() : 'No price available';
            const oldPrice = product.querySelector('.product__price--through') ? product.querySelector('.product__price--through').textContent.trim() : 'No old price';
            const discountPercent = product.querySelector('.product__price--percent-detail') ? product.querySelector('.product__price--percent-detail').textContent.trim() : 'No discount';
            const link = product.querySelector('.product__link') ? product.querySelector('.product__link').href : 'No link available'; // Product link

            // Add the extracted data to the array
            data.push({ name, price, oldPrice, discountPercent, link });
        });

        return data;
    });

    await page.close();
    await browser.close();

    return tiviData;
}

async function crawlTiviData() {
    console.log('Fetching data...');
    // Fetch the tivi data from the page
    const tiviData = await fetchTiviData();

    // Check if any data was fetched and write it to CSV
    if (tiviData.length > 0) {
        await csvWriter.writeRecords(tiviData);
    }
}

// Start the crawling process
crawlTiviData();
