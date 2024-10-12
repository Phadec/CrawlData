const xlsx = require('xlsx');
const fs = require('fs');

// File paths
const inputFilePath = './data/tivi_data_cellphones.xlsx'; // Input file path
const outputFilePath = './data/cleaned_tivi_data_cellphones.xlsx'; // Output file path for cleaned data

// Read the Excel file
const workbook = xlsx.readFile(inputFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert the worksheet to JSON
let data = xlsx.utils.sheet_to_json(worksheet);

// Function to clean price values
function cleanPrice(priceStr) {
    if (typeof priceStr === 'string') {
        // Remove all non-numeric characters (e.g., '11.990.000đ' -> '11990000')
        const cleaned = priceStr.replace(/[^\d]/g, '');
        return cleaned ? parseInt(cleaned, 10) : null;
    }
    return null;
}

// Function to clean discount percentage values
function cleanDiscount(discountStr) {
    if (typeof discountStr === 'string') {
        // Extract numeric value from discount percentage (e.g., 'Giảm 20%' -> -20)
        const match = discountStr.match(/\d+/);
        return match ? -parseInt(match[0], 10) : null;
    }
    return null;
}

// General function to trim and clean string values
function cleanString(value) {
    return typeof value === 'string' ? value.trim() : 'Unknown';
}

// Function to clean numeric fields like release year
function cleanNumber(value) {
    return value ? parseInt(value, 10) : null;
}

// Clean the data
data = data.map((item) => {
    return {
        dataId: cleanString(item['Data ID']), // Clean 'Data ID'
        name: cleanString(item.Name),
        price: cleanPrice(item.Price),
        oldPrice: cleanPrice(item['Old Price']),
        discountPercent: cleanDiscount(item['Discount Percent']),
        productLink: cleanString(item['Product Link']),
        screenSize: cleanString(item['Screen Size']),
        resolution: cleanString(item.Resolution),
        screenType: cleanString(item['Screen Type']),
        tvType: cleanString(item['TV Type']),
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
        standMaterial: cleanString(item['Stand Material']),
        bezelMaterial: cleanString(item['Bezel Material']),
        manufacturer: cleanString(item.Manufacturer),
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
