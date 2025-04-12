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
        return cleaned ? parseInt(cleaned, 10) : 0; // Return 0 instead of null
    }
    return typeof priceStr === 'number' ? priceStr : 0; // Return the number or 0
}

// Function to clean discount percentage values
function cleanDiscount(discountStr) {
    if (typeof discountStr === 'string') {
        // Extract numeric value from discount percentage (e.g., 'Giảm 20%' -> -20)
        const match = discountStr.match(/\d+/);
        return match ? -parseInt(match[0], 10) : 0; // Return 0 instead of null
    }
    return typeof discountStr === 'number' ? discountStr : 0; // Return the number or 0
}

// General function to trim and clean string values
function cleanString(value) {
    if (value === null || value === undefined) return '';
    return typeof value === 'string' ? value.trim() : String(value);
}

// Enhanced function to clean string values for SSIS compatibility
function cleanForSsis(value) {
    if (value === null || value === undefined) return '';
    
    // Safely convert to string
    let cleaned = String(value);
    
    // Remove only problematic characters that might cause SSIS issues
    cleaned = cleaned.replace(/[\r\n\t]/g, ' '); // Replace newlines/tabs with spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ');   // Replace multiple spaces with single space
    // No longer removing non-ASCII characters to preserve Vietnamese text
    cleaned = cleaned.trim();
    
    // Truncate if too long to avoid "long data" errors
    if (cleaned.length > 200) {
        cleaned = cleaned.substring(0, 200);
    }
    
    return cleaned;
}

// Function to clean numeric fields like release year
function cleanNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    
    // Try to convert to number
    const parsed = parseInt(String(value).replace(/[^\d]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed; // Return 0 if not a number
}

// Function to clean and validate image URLs
function cleanImageUrl(url) {
    if (typeof url === 'string') {
        const trimmedUrl = url.trim();
        // Check if the URL starts with http or https
        if (/^https?:\/\//i.test(trimmedUrl)) {
            // Truncate if needed
            return trimmedUrl.length > 250 ? trimmedUrl.substring(0, 250) : trimmedUrl;
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
        screenSize: cleanForSsis(item['Screen Size']),
        resolution: cleanForSsis(item['Resolution']),
        screenType: cleanForSsis(item['Screen Type']),
        operatingSystem: cleanForSsis(item['Operating System']),
        processor: cleanForSsis(item['Processor']),
        refreshRate: cleanForSsis(item['Refresh Rate']),
        speakerPower: cleanForSsis(item['Speaker Power']),
        internetConnection: cleanForSsis(item['Internet Connection']),
        wirelessConnectivity: cleanForSsis(item['Wireless Connectivity']),
        usbPorts: cleanForSsis(item['USB Ports']),
        videoAudioInputPorts: cleanForSsis(item['Video/Audio Input Ports']),
        audioOutputPorts: cleanForSsis(item['Audio Output Ports']),
        standMaterial: cleanForSsis(item['Stand Material']),
        bezelMaterial: cleanForSsis(item['Bezel Material']),
        manufacturer: cleanForSsis(item['Manufacturer']),
        manufacturedIn: cleanForSsis(item['Manufactured In']),
        releaseYear: cleanNumber(item['Release Year']),
        productLink: cleanString(item['Product Link']),
    };
});

// Create a completely new workbook to avoid any metadata issues
const newWorkbook = xlsx.utils.book_new();

// Create a new worksheet with the data
const newWorksheet = xlsx.utils.json_to_sheet(data);

// Explicitly set column types for SSIS compatibility
const column_names = Object.keys(data[0]);
const cell_range = {s: {c:0, r:0}, e: {c:column_names.length - 1, r:data.length}};

for(let C = cell_range.s.c; C <= cell_range.e.c; ++C) {
    for(let R = cell_range.s.r + 1; R <= cell_range.e.r; ++R) {
        const cell_address = {c:C, r:R};
        const cell_ref = xlsx.utils.encode_cell(cell_address);
        
        if(newWorksheet[cell_ref]) {
            // Set appropriate column types based on column name
            const columnName = column_names[C];
            
            if(columnName === 'price' || columnName === 'oldPrice' || 
               columnName === 'discountPercent' || columnName === 'releaseYear') {
                // Keep these as numbers for SSIS
                newWorksheet[cell_ref].t = 'n';
            } else {
                // For all text columns:
                // 1. Ensure they have an actual string value, not null or undefined
                if (newWorksheet[cell_ref].v === null || newWorksheet[cell_ref].v === undefined) {
                    newWorksheet[cell_ref].v = '';
                }
                
                // 2. Mark as string type
                newWorksheet[cell_ref].t = 's';
            }
        }
    }
}

// Add the worksheet to the workbook and save
xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Cleaned Data');
xlsx.writeFile(newWorkbook, outputFilePath);

console.log(`Cleaned data has been saved to ${outputFilePath}`);
console.log('Data has been specially formatted for SSIS compatibility');
console.log('- Text columns are formatted as strings');
console.log('- Numeric columns (price, oldPrice, discountPercent, releaseYear) are kept as numbers');
console.log('- All NULL values have been replaced with appropriate defaults');
console.log('- The imageTechnology column has been removed to avoid SSIS issues');
