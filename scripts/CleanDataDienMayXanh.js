const xlsx = require('xlsx');
const fs = require('fs');

// File paths
const inputFilePath = './data/tivi_data_dienmayxanh.xlsx'; // Input Excel file path
const outputFilePath = './data/cleaned_tivi_data_dienmayxanh.xlsx'; // Output cleaned Excel file path

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

// Function to clean and validate image URLs
function cleanImageUrl(url) {
    if (typeof url === 'string') {
        const trimmedUrl = url.trim();
        // Check if the URL starts with http or https
        if (/^https?:\/\//i.test(trimmedUrl)) {
            return trimmedUrl;
        }
    }
    return ''; // Return empty string if invalid
}

// Clean the data
data = data.map((item) => {
    return {
        dataId: cleanString(item['Data ID']), // Clean Data ID
        name: cleanString(item['Name']),
        price: cleanPrice(item['Price']),
        oldPrice: cleanPrice(item['Old Price']),
        discountPercent: cleanDiscount(item['Discount Percent']),
        imageUrl: cleanImageUrl(item['Image URL']), // Clean and validate image URL
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
        standMaterial: cleanString(item['Stand Material']), // Clean Stand Material
        bezelMaterial: cleanString(item['Bezel Material']), // Clean Bezel Material
        manufacturer: cleanString(item['Manufacturer']),
        manufacturedIn: cleanString(item['Manufactured In']),
        releaseYear: cleanNumber(item['Release Year']),
        productLink: cleanString(item['Product Link']),
    };
});

// Create a new workbook and add the cleaned data
const newWorkbook = xlsx.utils.book_new();
const newWorksheet = xlsx.utils.json_to_sheet(data);
xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Cleaned Data');

// Write the cleaned data to a new Excel file
xlsx.writeFile(newWorkbook, outputFilePath);

console.log(`Cleaned data has been saved to ${outputFilePath}`);
