const xlsx = require('xlsx');
const fs = require('fs');

// File paths
const inputFilePath = './data/tivi_data_dienmayxanh.xlsx'; // Đường dẫn mới cho file Excel sau khi đã di chuyển vào thư mục 'data'
const outputFilePath = './data/cleaned_tivi_data_dienmayxanh.xlsx'; // Đường dẫn mới cho file đã clean

// Read the Excel file
const workbook = xlsx.readFile(inputFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert the worksheet to JSON
let data = xlsx.utils.sheet_to_json(worksheet);

// Function to clean price values
function cleanPrice(priceStr) {
    if (typeof priceStr === 'string') {
        // Remove all non-numeric characters
        const cleaned = priceStr.replace(/[^\d]/g, '');
        return cleaned ? parseInt(cleaned, 10) : null;
    }
    return null;
}

// Function to clean discount percentage values
function cleanDiscount(discountStr) {
    if (typeof discountStr === 'string') {
        // Remove the '%' character and convert to an integer
        const match = discountStr.match(/\d+/);
        return match ? -parseInt(match[0], 10) : null;
    }
    return null;
}

// General function to trim and clean string values
function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

// Function to clean numeric fields like release year
function cleanNumber(value) {
    return value ? parseInt(value, 10) : null;
}

// Clean the data
data = data.map((item) => {
    return {
        name: cleanString(item['Name']),
        price: cleanPrice(item['Price']),
        oldPrice: cleanPrice(item['Old Price']),
        discountPercent: cleanDiscount(item['Discount Percent']),
        productLink: cleanString(item['Product Link']),
        screenSize: cleanString(item['Screen Size']),
        resolution: cleanString(item['Resolution']),
        screenType: cleanString(item['Screen Type']),
        operatingSystem: cleanString(item['Operating System']),
        imageTechnology: cleanString(item['Image Technology']),
        processor: cleanString(item['Processor']),
        refreshRate: cleanString(item['Refresh Rate']),
        speakerPower: cleanString(item['Speaker Power']),
        internetConnection: cleanString(item['Internet Connection']),
        wirelessConnectivity: cleanString(item['Wireless Connectivity']),
        usbPorts: cleanString(item['USB Ports']),
        videoAudioInputPorts: cleanString(item['Video/Audio Input Ports']),
        audioOutputPorts: cleanString(item['Audio Output Ports']),
        manufacturer: cleanString(item['Manufacturer']),
        manufacturedIn: cleanString(item['Manufactured In']),
        releaseYear: cleanNumber(item['Release Year'])
    };
});

// Create a new workbook and add the cleaned data
const newWorkbook = xlsx.utils.book_new();
const newWorksheet = xlsx.utils.json_to_sheet(data);
xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Cleaned Data');

// Write the cleaned data to a new Excel file
xlsx.writeFile(newWorkbook, outputFilePath);

console.log(`Cleaned data has been saved to ${outputFilePath}`);
