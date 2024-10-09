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

    const url = `https://www.dienmayxanh.com/tivi#c=1942&o=13&pi=11`;
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    } catch (error) {
        console.error(`Failed to load page ${url}:`, error);
        await page.close();
        await browser.close();
        return [];
    }

    // Lấy các thông tin cơ bản và link sản phẩm từ danh sách sản phẩm
    const tiviData = await page.evaluate(() => {
        const data = [];
        const products = document.querySelectorAll('.listproduct .item');

        products.forEach((product) => {
            const name = product.querySelector('h3') ? product.querySelector('h3').textContent.trim().replace(/\s\s+/g, ' ') : '';
            const price = product.querySelector('.price') ? product.querySelector('.price').textContent.trim() : '';
            const oldPrice = product.querySelector('.price-old') ? product.querySelector('.price-old').textContent.trim() : '';
            const discountPercent = product.querySelector('.percent') ? product.querySelector('.percent').textContent.trim() : '';
            const link = product.querySelector('a') ? product.querySelector('a').href : ''; // Lấy link sản phẩm

            data.push({ name, price, oldPrice, discountPercent, link });
        });

        return data;
    });

    await page.close();
    await browser.close();
    return tiviData;
}

async function saveToExcel(tiviData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tivi Data');

    // Đặt tiêu đề cột
    worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Old Price', key: 'oldPrice', width: 15 },
        { header: 'Discount Percent', key: 'discountPercent', width: 15 },
        { header: 'Product Link', key: 'link', width: 50 }
    ];

    // Thêm dữ liệu vào worksheet
    tiviData.forEach(item => {
        worksheet.addRow(item);
    });

    // Ghi file Excel
    await workbook.xlsx.writeFile('tivi_data_dienmayxanh.xlsx');
    console.log('The Excel file was written successfully');
}

async function crawlTiviData() {
    console.log('Fetching data...');

    const tiviData = await fetchTiviData();

    if (tiviData.length > 0) {
        await saveToExcel(tiviData);
    } else {
        console.log('No data found.');
    }
}

crawlTiviData();
