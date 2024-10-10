const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

// Function to fetch product data from the main page
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
            const technicalDetails = {
                'Công nghệ hình ảnh': '',
                'Bộ xử lý': '',
                'Tần số quét thực': '',
                'Tổng công suất loa': '',
                'Kết nối Internet': '',
                'Kết nối không dây': '',
                'USB': '',
                'Cổng nhận hình ảnh, âm thanh': '',
                'Cổng xuất âm thanh': '',
                'Kích thước có chân, đặt bàn': '',
                'Khối lượng có chân': '',
                'Kích thước không chân, treo tường': '',
                'Khối lượng không chân': '',
                'Chất liệu chân đế': '',
                'Chất liệu viền tivi':'',
                'Hãng': '',
                'Nơi sản xuất': '',
                'Năm ra mắt': ''
            };

            const items = document.querySelectorAll('.text-specifi li');

            items.forEach((item) => {
                const keyElement = item.querySelector('aside strong');
                const valueElement = item.querySelector('aside span') || item.querySelector('aside a');

                const key = keyElement ? keyElement.textContent.trim().replace(':', '') : null;
                let value = valueElement ? valueElement.textContent.trim() : null;

                // Nếu key là 'Hãng' và value có chứa 'Xem thông tin hãng', loại bỏ phần này
                if (key === 'Hãng' && value) {
                    value = value.replace(/\.?\s*Xem thông tin hãng\s*$/, '').trim();
                }

                if (key && value && technicalDetails.hasOwnProperty(key)) {
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

// Save data to Excel
async function saveToExcel(tiviData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('TV Data');

    // Set column headers
    worksheet.columns = [
        { header: 'Name', key: 'name', width: 50 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Old Price', key: 'oldPrice', width: 15 },
        { header: 'Discount Percent', key: 'discountPercent', width: 20 },
        { header: 'Product Link', key: 'link', width: 50 },
        { header: 'Image Technology', key: 'Công nghệ hình ảnh', width: 30 },
        { header: 'Processor', key: 'Bộ xử lý', width: 20 },
        { header: 'Refresh Rate', key: 'Tần số quét thực', width: 15 },
        { header: 'Speaker Power', key: 'Tổng công suất loa', width: 20 },
        { header: 'Internet Connection', key: 'Kết nối Internet', width: 20 },
        { header: 'Wireless Connectivity', key: 'Kết nối không dây', width: 20 },
        { header: 'USB Ports', key: 'USB', width: 20 },
        { header: 'Video/Audio Input Ports', key: 'Cổng nhận hình ảnh, âm thanh', width: 30 },
        { header: 'Audio Output Ports', key: 'Cổng xuất âm thanh', width: 30 },
        { header: 'Dimensions with Stand', key: 'Kích thước có chân, đặt bàn', width: 30 },
        { header: 'Weight with Stand', key: 'Khối lượng có chân', width: 20 },
        { header: 'Dimensions without Stand', key: 'Kích thước không chân, treo tường', width: 30 },
        { header: 'Weight without Stand', key: 'Khối lượng không chân', width: 20 },
        { header: 'Manufacturer', key: 'Hãng', width: 20 },
        { header: 'Stand Material', key: 'Chất liệu chân đế', width: 20 },
        { header: 'Frame Material', key: 'Chất liệu viền tivi', width: 20 },
        { header: 'Manufactured In', key: 'Nơi sản xuất', width: 20 },
        { header: 'Release Year', key: 'Năm ra mắt', width: 20 }
    ];

    console.log('Adding products to the Excel sheet...');
    tiviData.forEach((item, index) => {
        console.log(`Adding product ${index + 1} to the Excel sheet: ${item.name}`);
        worksheet.addRow({
            name: item.name,
            price: item.price,
            oldPrice: item.oldPrice,
            discountPercent: item.discountPercent,
            link: item.link,
            'Công nghệ hình ảnh': item['Công nghệ hình ảnh'] || '',
            'Bộ xử lý': item['Bộ xử lý'] || '',
            'Tần số quét thực': item['Tần số quét thực'] || '',
            'Tổng công suất loa': item['Tổng công suất loa'] || '',
            'Kết nối Internet': item['Kết nối Internet'] || '',
            'Kết nối không dây': item['Kết nối không dây'] || '',
            'USB': item['USB'] || '',
            'Cổng nhận hình ảnh, âm thanh': item['Cổng nhận hình ảnh, âm thanh'] || '',
            'Cổng xuất âm thanh': item['Cổng xuất âm thanh'] || '',
            'Kích thước có chân, đặt bàn': item['Kích thước có chân, đặt bàn'] || '',
            'Khối lượng có chân': item['Khối lượng có chân'] || '',
            'Kích thước không chân, treo tường': item['Kích thước không chân, treo tường'] || '',
            'Khối lượng không chân': item['Khối lượng không chân'] || '',
            'Hãng': item['Hãng'] || '',
            'Chất liệu chân đế': item['Chất liệu chân đế'] || '',
            'Chất liệu viền tivi': item['Chất liệu viền tivi'] || '',
            'Nơi sản xuất': item['Nơi sản xuất'] || '',
            'Năm ra mắt': item['Năm ra mắt'] || ''
        });
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
